/**
 * Utilidad para manejar imágenes de productos con Supabase Storage
 */

/**
 * Genera un nombre de archivo para un producto basado en su ID
 * @param {File} file - Archivo de imagen subido
 * @param {Object} product - Objeto del producto con ID
 * @returns {string} - Nombre de archivo (ej: "producto1.png")
 */
export function generateNewFileName(file, product) {
  if (!file) return null;
  
  // Obtener la extensión del archivo original
  const extension = file.name.split('.').pop().toLowerCase();
  
  if (product && product.Id) {
    // Usar el patrón: producto{id}.extension
    return `producto${product.Id}.${extension}`;
  }
  
  // Si no hay ID, usar timestamp + nombre original
  const timestamp = Date.now();
  const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
  return `${timestamp}_${nameWithoutExt}.${extension}`;
}

/**
 * Sube una imagen a Supabase Storage y devuelve la URL pública
 * Solución profesional y escalable para Vercel
 * @param {File} newFile - Nuevo archivo a subir
 * @param {string} targetFileName - Nombre del archivo a reemplazar
 * @returns {Promise<Object>} - Resultado de la operación
 */
export async function replaceProductImage(newFile, targetFileName) {
  try {
    console.log(`Subiendo imagen a Supabase Storage: ${targetFileName}`);
    console.log(`Nuevo archivo: ${newFile.name}`);
    console.log(`Tamaño: ${(newFile.size / 1024).toFixed(2)} KB`);
    
    // Importar el cliente de Supabase
    const { supabase } = await import('../lib/supabase');
    
    // Subir el archivo a Supabase Storage
    const { error } = await supabase.storage
      .from('product-images')
      .upload(targetFileName, newFile, {
        cacheControl: '3600',
        upsert: true, // Sobrescribir si ya existe
        contentType: newFile.type
      });
    
    if (error) {
      throw new Error(`Error subiendo a Supabase Storage: ${error.message}`);
    }
    
    // Obtener la URL pública del archivo
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(targetFileName);
    
    console.log('Imagen subida exitosamente a Supabase Storage:', publicUrl);
    
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
    console.error('Error subiendo imagen a Supabase Storage:', error);
    
    return {
      success: false,
      error: error.message,
      message: 'Error al subir la imagen: ' + error.message
    };
  }
}




/**
 * Procesa completamente el reemplazo de imagen para un producto usando Supabase Storage
 * @param {File} imageFile - Archivo de imagen subido
 * @param {Object} product - Datos del producto actual
 * @returns {Promise<Object>} - Resultado del procesamiento
 */
export async function processProductImageReplacement(imageFile, product) {
  try {
    // 1. Generar el nombre del archivo basado en el ID del producto
    const targetFileName = generateNewFileName(imageFile, product);
    
    if (!targetFileName) {
      throw new Error('No se pudo generar el nombre del archivo');
    }
    
    // 2. Subir la imagen a Supabase Storage
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
    console.error('Error procesando reemplazo de imagen:', error);
    return {
      success: false,
      error: error.message,
      message: 'Error al procesar el reemplazo de imagen'
    };
  }
}

