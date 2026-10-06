import { sql } from "drizzle-orm";
import {
  pgTable,
  bigint,
  text,
  boolean,
  integer,
  uuid,
  numeric,
  jsonb,
  timestamp,
  smallint,
  index,
} from "drizzle-orm/pg-core";

// Espejo 1:1 de db/schema.sql (raíz del repo). Los nombres de propiedad TS
// coinciden exactamente con los nombres de columna reales (incluidas las
// mayúsculas de "Id"/"Oferta"/"Categoria"/"Stock"/"Imagen") para que el JSON
// de respuesta de las Route Handlers sea idéntico al que devolvía PostgREST
// de Supabase, sin tocar los componentes del frontend en la Fase 5.

// ---------------------------------------------------------------------------
//  Quién manda en cada columna de `productos`
//
//  El SISTEMA del negocio (deposito-ia) es el dueño del catálogo y del stock:
//  manda nombre, precio del bulto y de la unidad, rubro (Categoria),
//  sub-rubro, stock, si tiene unidad suelta y si se publica. Esas columnas no se
//  editan desde la página: el panel de admin solo toca lo que es de la tienda
//  (Imagen, mas_vendido, oferta_express y Oferta).
//
//  "Id" es el código del bulto en el sistema (59), no un Date.now(). La opción
//  "Unidad" de ese producto es el suelto (59.1).
// ---------------------------------------------------------------------------
export const productos = pgTable("productos", {
  Id: bigint("Id", { mode: "number" }).primaryKey(),
  nombre: text("nombre"),
  precio: bigint("precio", { mode: "number" }),
  categoria: text("categoria"),
  Oferta: text("Oferta"),
  Categoria: text("Categoria"),
  Stock: boolean("Stock").default(true),
  Imagen: text("Imagen"),
  quantity: integer("quantity").default(1),
  oferta_express: boolean("oferta_express").default(false),
  mas_vendido: boolean("mas_vendido").default(false),
  // Se saca en el "push 2" (ver db/README-sistema.md): el código ya no lo usa,
  // pero hasta publicarlo la columna tiene que seguir existiendo.
  solo_bulto: boolean("solo_bulto").notNull().default(false),

  // --- Lo manda el sistema (deposito-ia); no se edita desde la página ---
  /** Bultos que hay (o unidades, si el artículo no tiene suelto). kg con decimales. */
  stock_actual: numeric("stock_actual", { mode: "number" }),
  /** Unidades que se pueden vender: sueltas + bultos × factor. NULL si no tiene suelto. */
  stock_unidades: numeric("stock_unidades", { mode: "number" }),
  /** Precio de la unidad suelta (el del sistema, ya no se calcula con ×1,2). */
  precio_unidad: bigint("precio_unidad", { mode: "number" }),
  tiene_unidad: boolean("tiene_unidad").notNull().default(false),
  subcategoria: text("subcategoria"),
  /** false = oculto (se dio de baja, se excluyó su rubro). Nunca se borra: conserva foto y tildes. */
  publicado: boolean("publicado").notNull().default(true),
  sistema_actualizado_en: timestamp("sistema_actualizado_en", { withTimezone: true, mode: "string" }),
}, (t) => [
  // Existe en la base real (lo creó alguien a mano): sin declararlo, el push lo borraría
  index("all_products").on(t.nombre, t.precio, t.Imagen, t.Stock),
]);

// Los ids viejos (13 cifras) de los productos que pasaron al código del sistema:
// sirve para entender carritos y pedidos viejos. id_sistema NULL = se ocultó.
export const productos_ids_anteriores = pgTable("productos_ids_anteriores", {
  id_anterior: bigint("id_anterior", { mode: "number" }).primaryKey(),
  id_sistema: bigint("id_sistema", { mode: "number" }),
  nombre: text("nombre"),
  cambiado_en: timestamp("cambiado_en", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const categorias = pgTable("categorias", {
  id: uuid("id").defaultRandom().primaryKey(),
  categoria: text("categoria").notNull(),
});

export const configuracion = pgTable("configuracion", {
  id: integer("id").default(1).primaryKey(),
  precio_envio: integer("precio_envio").notNull().default(7200),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  banco: text("banco").default(""),
  titular: text("titular").default(""),
  alias: text("alias").default(""),
  cbu: text("cbu").default(""),
});

export const perfiles = pgTable("perfiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  nombre: text("nombre").notNull(),
  telefono: text("telefono"),
  tipo_cliente: text("tipo_cliente"),
  direccion: text("direccion"),
  rol: text("rol").default("cliente"),
  email: text("email"),
  password: text("password"),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

export const pedidos = pgTable("pedidos", {
  id: bigint("id", { mode: "number" }).generatedByDefaultAsIdentity().primaryKey(),
  nombre_cliente: text("nombre_cliente").notNull(),
  telefono: text("telefono"),
  metodo: text("metodo"),
  direccion: text("direccion"),
  horario: text("horario"),
  notas: text("notas"),
  total: numeric("total"),
  carrito: jsonb("carrito"),
  user_id: uuid("user_id").defaultRandom(),
  estado: text("estado").default("pendiente"),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  expira_en: timestamp("expira_en", { withTimezone: true, mode: "string" }),
  fuente: text("fuente").default("manual"),
  descuento_aplicado: smallint("descuento_aplicado"),
  fecha_modificacion: timestamp("fecha_modificacion", { mode: "string" }),
  modificado_por: text("modificado_por"),
  metodo_pago: text("metodo_pago"),
  fecha_pago: timestamp("fecha_pago", { withTimezone: true, mode: "string" }),
  pagado_manualmente: boolean("pagado_manualmente"),

  // --- Lo que el sistema del negocio hizo con cada pedido ---
  // Los pedidos de la tienda los maneja el sistema (se aceptan, se rechazan, se
  // cobran allá). La página solo los muestra con estas columnas.
  sistema_recibido_en: timestamp("sistema_recibido_en", { withTimezone: true, mode: "string" }),
  /** recibido | aceptado | modificado | cobrado | rechazado | anulado */
  sistema_estado: text("sistema_estado"),
  sistema_numero: text("sistema_numero"),
  sistema_motivo: text("sistema_motivo"),
}, (t) => [
  // Existen en la base real; sin declararlos, el push los borraría
  index("idx_pedidos_expira_en").on(t.expira_en),
  index("idx_pedidos_fuente").on(t.fuente),
  // Los que el sistema todavía no vio: es lo que lee cada minuto
  index("idx_pedidos_sin_recibir").on(t.id).where(sql`sistema_recibido_en IS NULL`),
]);

// Actividad de carrito para analítica del admin (carritos abandonados,
// conversión). Se escribe con upsert por `session_id` desde CartContext cada
// vez que cambia el carrito en el navegador. No reemplaza al carrito real
// (sigue viviendo en localStorage); es solo un espejo para métricas.
export const carrito_actividad = pgTable("carrito_actividad", {
  id: bigint("id", { mode: "number" }).generatedByDefaultAsIdentity().primaryKey(),
  // El nombre real de la restricción en la base: sin darlo, drizzle la llamaría
  // "..._unique" y la volvería a crear.
  session_id: text("session_id").notNull().unique("carrito_actividad_session_id_key"),
  user_id: uuid("user_id"),
  nombre: text("nombre"),
  telefono: text("telefono"),
  email: text("email"),
  items: jsonb("items").default([]),
  item_count: integer("item_count").notNull().default(0),
  total: numeric("total").default("0"),
  convertido: boolean("convertido").notNull().default(false),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
}, (t) => [
  index("idx_carrito_actividad_updated_at").on(t.updated_at),
  index("idx_carrito_actividad_user_id").on(t.user_id),
]);

export const email_recovery = pgTable("email_recovery", {
  id: bigint("id", { mode: "number" }).generatedByDefaultAsIdentity().primaryKey(),
  profile_id: text("profile_id").notNull(),
  token: text("token"),
  expires_at: timestamp("expires_at", { withTimezone: true, mode: "string" }),
  attempts: integer("attempts").notNull().default(0),
}, (t) => [
  index("idx_email_recovery_profile_id").on(t.profile_id),
  index("idx_email_recovery_token").on(t.token),
]);
