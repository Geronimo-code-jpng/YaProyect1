interface ProductWithId {
  Id?: number | string;
  nombre?: string;
}

interface ReplaceResult {
  success: boolean;
  oldFileName?: string;
  newFileName?: string;
  fileSize?: number;
  fileType?: string;
  imageUrl?: string;
  message?: string;
  error?: string;
}

interface ProcessResult {
  success: boolean;
  fileName?: string;
  imageUrl?: string;
  message?: string;
  error?: string;
}

export function generateNewFileName(file: File | null, product: ProductWithId | null): string | null {
  if (!file) return null;

  const extension = file.name.split('.').pop()?.toLowerCase() || 'png';

  if (product && product.Id) {
    return `producto${product.Id}.${extension}`;
  }

  const timestamp = Date.now();
  const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
  return `${timestamp}_${nameWithoutExt}.${extension}`;
}

export async function replaceProductImage(newFile: File, targetFileName: string): Promise<ReplaceResult> {
  try {
    const { supabase } = await import('../lib/supabase');

    const { error } = await supabase.storage
      .from('product-images')
      .upload(targetFileName, newFile, {
        cacheControl: '3600',
        upsert: true,
        contentType: newFile.type
      });

    if (error) {
      throw new Error(`Error subiendo a Supabase Storage: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(targetFileName);

    return {
      success: true,
      oldFileName: targetFileName,
      newFileName: targetFileName,
      fileSize: newFile.size,
      fileType: newFile.type,
      imageUrl: publicUrl,
      message: `Imagen "${targetFileName}" subida exitosamente a Supabase Storage`
    };

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return {
      success: false,
      error: msg,
      message: 'Error al subir la imagen: ' + msg
    };
  }
}

export async function processProductImageReplacement(imageFile: File, product: ProductWithId): Promise<ProcessResult> {
  try {
    const targetFileName = generateNewFileName(imageFile, product);

    if (!targetFileName) {
      throw new Error('No se pudo generar el nombre del archivo');
    }

    const replaceResult = await replaceProductImage(imageFile, targetFileName);

    if (!replaceResult.success) {
      throw new Error(replaceResult.error || 'Error al subir la imagen a Supabase Storage');
    }

    return {
      success: true,
      fileName: targetFileName,
      imageUrl: replaceResult.imageUrl,
      message: `Imagen del producto "${product.nombre}" subida exitosamente a Supabase Storage`
    };

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return {
      success: false,
      error: msg,
      message: 'Error al procesar el reemplazo de imagen'
    };
  }
}
