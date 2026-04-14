import { supabase } from '../lib/supabase';
import { Product } from '../types';

/**
 * Función temporal para ver todos los productos de la base de datos
 * @returns {Promise<Product[]>} Lista de productos
 */
export async function verTodosLosProductos(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('Id', { ascending: true });

    if (error) {
      console.error('Error al cargar productos:', error);
      throw error;
    }

    console.log('=== TODOS LOS PRODUCTOS ===');
    console.log(`Total de productos: ${data?.length || 0}`);
    
    data?.forEach((product: Product, index: number) => {
      console.log(`\n--- Producto ${index + 1} ---`);
      console.log(`ID: ${product.Id}`);
      console.log(`Nombre: ${product.nombre}`);
      console.log(`Categoría: ${product.Categoria}`);
      console.log(`Precio: $${product.precio}`);
      console.log(`Stock: ${product.Stock}`);
      console.log(`Tiene imagen: ${!!(product.Imagen || product.imagen)}`);
      if (product.Imagen || product.imagen) {
        const img = product.Imagen || product.imagen;
        console.log(`Longitud de imagen: ${img?.length || 0} caracteres`);
        console.log(`Tipo imagen: ${img?.startsWith('data:') ? 'Base64' : 'URL'}`);
      }
    });

    return data || [];
  } catch (error) {
    console.error('Error en verTodosLosProductos:', error);
    return [];
  }
}

/**
 * Función temporal para eliminar un producto por su ID
 * @param {number} productId - ID del producto a eliminar
 * @returns {Promise<boolean>} True si se eliminó correctamente
 */
export async function eliminarProductoPorId(productId: number): Promise<boolean> {
  try {
    console.log(`Eliminando producto con ID: ${productId}`);
    
    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('Id', productId);

    if (error) {
      console.error('Error al eliminar producto:', error);
      throw error;
    }

    console.log(`Producto ${productId} eliminado exitosamente`);
    return true;
  } catch (error) {
    console.error('Error en eliminarProductoPorId:', error);
    return false;
  }
}

/**
 * Función temporal para eliminar todos los productos (¡CUIDADO!)
 * @returns {Promise<boolean>} True si se eliminaron todos
 */
export async function eliminarTodosLosProductos(): Promise<boolean> {
  const confirmacion = confirm('¿Estás seguro de que quieres eliminar TODOS los productos? Esta acción no se puede deshacer.');
  if (!confirmacion) {
    console.log('Operación cancelada');
    return false;
  }

  try {
    console.log('Eliminando todos los productos...');
    
    const { error } = await supabase
      .from('productos')
      .delete()
      .neq('Id', -1); // Eliminar todos los registros

    if (error) {
      console.error('Error al eliminar todos los productos:', error);
      throw error;
    }

    console.log('Todos los productos han sido eliminados');
    return true;
  } catch (error) {
    console.error('Error en eliminarTodosLosProductos:', error);
    return false;
  }
}

/**
 * Función para exportar los datos de productos a JSON (para backup)
 * @returns {Promise<string | null>} JSON con los datos de productos
 */
export async function exportarProductos(): Promise<string | null> {
  try {
    const productos = await verTodosLosProductos();
    
    // Crear versión sin imágenes base64 para reducir tamaño
    const productosSinImagenes = productos.map((product: Product) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { Imagen, imagen, ...rest } = product;
      return rest;
    });
    
    const jsonData = JSON.stringify(productosSinImagenes, null, 2);
    console.log('=== EXPORTACIÓN DE PRODUCTOS ===');
    console.log(jsonData);
    
    return jsonData;
  } catch (error) {
    console.error('Error al exportar productos:', error);
    return null;
  }
}

// Función para ejecutar en la consola del navegador
if (typeof window !== 'undefined') {
  window.productManager = {
    verTodos: verTodosLosProductos,
    eliminarPorId: eliminarProductoPorId,
    eliminarTodos: eliminarTodosLosProductos,
    exportar: exportarProductos
  };
  
  console.log('🔧 ProductManager disponible en window.productManager');
  console.log('Usa: window.productManager.verTodos() para ver todos los productos');
  console.log('Usa: window.productManager.eliminarPorId(ID) para eliminar un producto');
  console.log('Usa: window.productManager.eliminarTodos() para eliminar todos (¡CUIDADO!)');
  console.log('Usa: window.productManager.exportar() para exportar datos');
}
