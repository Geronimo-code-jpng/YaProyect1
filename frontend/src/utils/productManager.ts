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

    
    data?.forEach((product: Product, index: number) => {
      if (product.Imagen || product.imagen) {
        const img = product.Imagen || product.imagen;
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
    
    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('Id', productId);

    if (error) {
      console.error('Error al eliminar producto:', error);
      throw error;
    }

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
    return false;
  }

  try {
    
    const { error } = await supabase
      .from('productos')
      .delete()
      .neq('Id', -1); // Eliminar todos los registros

    if (error) {
      console.error('Error al eliminar todos los productos:', error);
      throw error;
    }

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
  
}
