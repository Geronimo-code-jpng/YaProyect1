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
  /** Unidades que trae cada bulto (lo manda el sistema; 1 si no tiene unidad suelta). */
  quantity?: number;
  oferta_express?: boolean;
  // --- Lo manda el sistema del negocio (deposito-ia) ---
  /** Precio de la unidad suelta. */
  precio_unidad?: number | null;
  /** El artículo tiene unidad suelta: sin esto no hay opción "Unidad". */
  tiene_unidad?: boolean;
  /** Bultos que hay. */
  stock_actual?: number | null;
  /** Unidades que se pueden vender (sueltas + bultos × unidades por bulto). */
  stock_unidades?: number | null;
  /** Sub-rubro, dentro de la categoría (el rubro). */
  subcategoria?: string | null;
  /** false = oculto (el sistema lo dio de baja o su rubro no va a la tienda). */
  publicado?: boolean;
  /** Flag manual: destaca el producto en el carrusel "Más Vendidos" del inicio. */
  mas_vendido?: boolean;
  /** Unidades reales vendidas en pedidos pagados (lo calcula /api/admin/productos). */
  unidades_vendidas?: number;
  /** Ingresos reales generados en pedidos pagados (lo calcula /api/admin/productos). */
  ingresos_generados?: number;
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
  // --- Lo que el sistema del negocio hizo con el pedido ---
  /** recibido | aceptado | modificado | cobrado | rechazado | anulado */
  sistema_estado?: string | null;
  /** N° del pedido en el sistema (6 cifras). */
  sistema_numero?: string | null;
  /** Por qué se rechazó, si se rechazó. */
  sistema_motivo?: string | null;
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
    dataLayer?: unknown[];
    fbq?: (...args: unknown[]) => void;
  }
}
