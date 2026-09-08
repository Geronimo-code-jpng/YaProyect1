import { uploadProductoImage } from "../lib/catalogApi";

interface ProductWithId {
  Id?: number | string;
  nombre?: string;
}

interface ProcessResult {
  success: boolean;
  fileName?: string;
  imageUrl?: string;
  message?: string;
  error?: string;
}

// El servidor igual redimensiona y comprime a WebP, pero rechazamos acá los
// archivos obviamente inservibles para no subir 40 MB a la función.
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MB

export async function processProductImageReplacement(imageFile: File, product: ProductWithId): Promise<ProcessResult> {
  try {
    if (!product.Id) {
      throw new Error('No se pudo determinar el ID del producto');
    }

    if (!imageFile.type.startsWith('image/')) {
      throw new Error('El archivo seleccionado no es una imagen');
    }

    if (imageFile.size > MAX_UPLOAD_BYTES) {
      throw new Error('La imagen es demasiado grande (máx. 15 MB). Probá con una foto más liviana.');
    }

    const result = await uploadProductoImage(product.Id, imageFile);

    if (!result.success || !result.imageUrl) {
      throw new Error(result.error || 'Error al subir la imagen');
    }

    return {
      success: true,
      imageUrl: result.imageUrl,
      message: `Imagen del producto "${product.nombre}" subida exitosamente`,
    };

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return {
      success: false,
      error: msg,
      message: 'Error al procesar el reemplazo de imagen',
    };
  }
}
