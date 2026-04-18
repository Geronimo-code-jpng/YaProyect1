import { Product } from '../types';

// Mapeo de productos a nombres de imagen estáticos
const PRODUCT_IMAGE_MAP: Record<string, string> = {
  'ACEITE': 'aceite.png',
  'ALIMENTO': 'alimento.png',
  'AZUCAR': 'azucar.png',
  'BEBIDAS': 'bebidas.png',
  'CERVEZAS': 'cervezas.png',
  'LACTEOS': 'lacteos.png',
  'HARINA': 'harina.png',
  'VINOS': 'vinos.png',
  'YERBA': 'yerba.png',
  'APERITIVOS': 'aperitivos.png',
};

/**
 * Obtiene la URL de la imagen estática para un producto basado en su categoría
 * @param {Product} product - Producto con categoría
 * @returns {string | null} URL de la imagen estática o null si no existe
 */
export function getStaticProductImage(product: Product): string | null {
  if (!product.Categoria) {
    return null;
  }
  const imageName = PRODUCT_IMAGE_MAP[product.Categoria.toUpperCase()];
  if (!imageName) return null;
  
  return `/products/${imageName}`;
}

/**
 * Procesa y guarda una imagen de producto, reemplazando la existente si es necesario
 * @param {File} imageFile - Archivo de imagen a procesar
 * @param {Product} product - Producto al que pertenece la imagen
 * @returns {Promise<string>} URL de la imagen procesada
 */
export async function processProductImage(imageFile: File, product: Product): Promise<string> {
  if (!imageFile || !product?.Categoria) {
    throw new Error('Se requiere archivo de imagen y categoría del producto');
  }

  // Obtener el nombre de imagen estático para esta categoría
  const staticImageName = PRODUCT_IMAGE_MAP[product.Categoria.toUpperCase()];
  if (!staticImageName) {
    throw new Error(`No hay imagen estática configurada para la categoría: ${product.Categoria}`);
  }

  // Convertir la imagen a base64
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        const base64String = reader.result as string;
        resolve(base64String);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => { 
      if (!imageFile) {
        reject(new Error('No se proporcionó ningún archivo'));
        return;
      };
      reject(new Error('Error al leer el archivo de imagen')); 
    };
    reader.readAsDataURL(imageFile);
  });
}

/**
 * Verifica si un producto tiene una imagen estática disponible
 * @param {Product} product - Producto a verificar
 * @returns {boolean} True si tiene imagen estática disponible
 */
export function hasStaticImage(product: Product): boolean {
  return !!getStaticProductImage(product);
}

/**
 * Obtiene la URL de imagen para un producto (prioridad: imagen guardada > imagen estática > placeholder)
 * @param {Product} product - Producto
 * @returns {string} URL de la imagen a mostrar
 */
export function getProductImageUrl(product: Product): string {
  // Primero intentar con la imagen guardada en la base de datos
  if (product.Imagen || product.imagen) {
    return (product.Imagen || product.imagen) as string;
  }
  
  // Luego intentar con la imagen estática
  const staticImageUrl = getStaticProductImage(product);
  if (staticImageUrl) {
    return staticImageUrl;
  }
  
  // Finalmente, placeholder
  return 'https://via.placeholder.com/200/f3f4f6/a1a1aa?text=Prod';
}
