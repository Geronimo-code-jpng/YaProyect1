// Tipos compartidos para toda la aplicación

export interface Product {
  Id: number;
  nombre: string;
  Categoria: string;
  precio: number;
  Stock: boolean;
  Imagen?: string;
  imagen?: string;
  Oferta?: string;
}

export interface User {
  id: string;
  email: string;
  nombre?: string;
  rol?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  nombre?: string;
  rol?: string;
  cantidad_pedidos?: number;
}

export interface Order {
  id: string;
  userId: string;
  items: Product[];
  total: number;
  estado: string;
  metodoEntrega: string;
  direccion?: string;
  telefono?: string;
  notas?: string;
  fuente: string;
  creado_en?: string;
  actualizado_en?: string;
}

export interface CartItem extends Product {
  cantidad: number;
}

export interface UserSession {
  id: string;
  email: string;
  nombre?: string;
  rol?: string;
  isLoggedIn: boolean;
  loginTime: string;
}

// Extensiones para Window
declare global {
  interface Window {
    productManager?: {
      verTodos: () => Promise<Product[]>;
      eliminarPorId: (id: number) => Promise<boolean>;
      eliminarTodos: () => Promise<boolean>;
      exportar: () => Promise<string | null>;
    };
  }
}
