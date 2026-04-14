import { verTodosLosProductos, eliminarProductoPorId, eliminarTodosLosProductos, exportarProductos } from './productManager';
import '../types'; // Importar para que se cargue la interfaz global 

// Inicializar el productManager en el objeto window para acceso desde la consola
export function initProductManager(): void {
  if (typeof window !== 'undefined') {
    window.productManager = {
      verTodos: verTodosLosProductos,
      eliminarPorId: eliminarProductoPorId,
      eliminarTodos: eliminarTodosLosProductos,
      exportar: exportarProductos
    };
    
    console.log('🔧 ProductManager inicializado');
    console.log('Comandos disponibles:');
    console.log('  window.productManager.verTodos() - Ver todos los productos');
    console.log('  window.productManager.eliminarPorId(ID) - Eliminar producto por ID');
    console.log('  window.productManager.eliminarTodos() - Eliminar todos los productos (¡CUIDADO!)');
    console.log('  window.productManager.exportar() - Exportar productos como JSON');
  }
}

// Auto-inicializar cuando se importa
initProductManager();
