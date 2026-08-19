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
} from "drizzle-orm/pg-core";

// Espejo 1:1 de db/schema.sql (raíz del repo). Los nombres de propiedad TS
// coinciden exactamente con los nombres de columna reales (incluidas las
// mayúsculas de "Id"/"Oferta"/"Categoria"/"Stock"/"Imagen") para que el JSON
// de respuesta de las Route Handlers sea idéntico al que devolvía PostgREST
// de Supabase, sin tocar los componentes del frontend en la Fase 5.

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
  solo_bulto: boolean("solo_bulto").notNull().default(false),
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
});

export const pedidos = pgTable("pedidos", {
  id: bigint("id", { mode: "number" }).generatedByDefaultAsIdentity().primaryKey(),
  nombre_cliente: text("nombre_cliente").notNull(),
  telefono: text("telefono"),
  metodo: text("metodo"),
  direccion: text("direccion"),
  horario: text("horario"),
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
});

export const email_recovery = pgTable("email_recovery", {
  id: bigint("id", { mode: "number" }).generatedByDefaultAsIdentity().primaryKey(),
  profile_id: text("profile_id").notNull(),
  token: text("token"),
  expires_at: timestamp("expires_at", { withTimezone: true, mode: "string" }),
  attempts: integer("attempts").notNull().default(0),
});
