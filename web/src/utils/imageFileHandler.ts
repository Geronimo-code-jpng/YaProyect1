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

export async function processProductImageReplacement(imageFile: File, product: ProductWithId): Promise<ProcessResult> {
  try {
    if (!product.Id) {
      throw new Error('No se pudo determinar el ID del producto');
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
