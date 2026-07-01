export interface Product {
  Id: number;
  nombre: string;
  Categoria: string;
  precio: number;
  Stock: boolean;
  Imagen?: string;
  imagen?: string;
  Oferta?: string;
  descripcion?: string;
  quantity?: number;
  solo_bulto?: boolean;
  oferta_express?: boolean;
  mas_vendido?: boolean;
  tipo?: string;
  precio_unitario?: number;
  quantity_per_bundle?: number;
  descuento?: number;
  ofert?: string;
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
  telefono?: string;
  direccion?: string;
  tipo_cliente?: string;
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
  numeroPedidoUsuario?: string;
  metodo_pago?: string;
  expira_en?: string;
  carrito?: Product[];
  historial?: string[];
  horario?: string;
  nombre_cliente?: string;
  metodo?: string;
  descuento_aplicado?: number;
  created_at?: string;
  user_id?: string;
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

declare global {
  interface Window {
    productManager?: {
      verTodos: () => Promise<Product[]>;
      eliminarPorId: (id: number) => Promise<boolean>;
      eliminarTodos: () => Promise<boolean>;
      exportar: () => Promise<string | null>;
    };
    dataLayer?: unknown[];
    fbq?: (...args: unknown[]) => void;
  }
}
