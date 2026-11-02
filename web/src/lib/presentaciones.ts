// Bulto y unidad de un producto, según lo que manda el sistema del negocio.
//
// Antes la página inventaba el precio de la unidad (precio del bulto ÷ unidades
// × 1,2, redondeado a $10) y un tilde "solo bulto". Ahora el sistema dice cuál
// es el precio de cada presentación y cuánto hay de cada una:
//
//   Bulto   precio            stock_actual      (bultos que hay)
//   Unidad  precio_unidad     stock_unidades    (sueltas + bultos × unidades por bulto)
//
// "Unidad" solo existe si el artículo tiene un suelto (tiene_unidad). Cada
// presentación se deshabilita sola cuando no hay de ella, aunque de la otra sí:
// puede no quedar un bulto cerrado pero sí unidades sueltas.
//
// Un producto "viejo" (todavía sin los datos del sistema, stock_actual NULL)
// se comporta como antes: vale el tilde "Stock".
import type { Product } from "../types";

export type Tipo = "Bulto" | "Unidad";

type Datos = Pick<Product, "precio" | "Stock"> &
  Partial<Pick<Product, "quantity" | "precio_unidad" | "tiene_unidad" | "stock_actual" | "stock_unidades"
    | "precios_cantidad" | "precios_cantidad_unidad">>;

/** Una escala del descuento por cantidad: llevando `desde` o más, cada una a `precio`. */
export type Escala = { desde: number; precio: number };

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** El artículo tiene unidad suelta y con precio. */
export const tieneUnidad = (p: Datos): boolean => !!p.tiene_unidad && num(p.precio_unidad) > 0;

export const precioBulto = (p: Datos): number => num(p.precio);

/** null si el artículo no se vende por unidad. */
export const precioUnidad = (p: Datos): number | null => (tieneUnidad(p) ? num(p.precio_unidad) : null);

/** Unidades que trae cada bulto (1 si no tiene unidad suelta). */
export const unidadesPorBulto = (p: Datos): number => Math.max(1, num(p.quantity) || 1);

export const hayBulto = (p: Datos): boolean =>
  p.stock_actual == null ? p.Stock !== false : num(p.stock_actual) > 0;

export const hayUnidad = (p: Datos): boolean =>
  tieneUnidad(p) && (p.stock_unidades == null ? p.Stock !== false : num(p.stock_unidades) > 0);

export const hay = (p: Datos, tipo: Tipo): boolean => (tipo === "Unidad" ? hayUnidad(p) : hayBulto(p));

// --------------------------------------------------- Descuento por cantidad
// El sistema manda, por presentación, la lista de escalas (texto JSON, NULL si
// no tiene): "llevando 10 o más, $11 c/u; llevando 90 o más, $10". Vale la
// escala más alta a la que se llega; por debajo de la primera, el precio de
// siempre. Es la misma cuenta que hace el mostrador del sistema
// (SistemaYa/src/dominio/escalas.js).

/** Lee una lista de escalas (texto JSON o ya leída), ordenada de menor a mayor. */
export function leerEscalas(valor: unknown): Escala[] {
  let lista = valor;
  if (typeof lista === "string") {
    try { lista = JSON.parse(lista); } catch { lista = null; }
  }
  if (!Array.isArray(lista)) return [];
  return lista
    .map((e) => ({ desde: Number(e?.desde), precio: Number(e?.precio) }))
    .filter((e) => Number.isFinite(e.desde) && e.desde > 1 && Number.isFinite(e.precio) && e.precio > 0)
    .sort((a, b) => a.desde - b.desde);
}

/** Las escalas de la presentación elegida. */
export const escalasDe = (p: Datos, tipo: Tipo): Escala[] =>
  leerEscalas(tipo === "Unidad" ? p.precios_cantidad_unidad : p.precios_cantidad);

/** El precio de cada una llevando esa cantidad. */
export function precioPorCantidad(base: number, escalas: Escala[] | undefined | null, cantidad: number): number {
  let precio = base;
  for (const e of escalas || []) if (cantidad >= e.desde) precio = e.precio;
  return precio;
}

/** Precio de la presentación elegida (por cada una, llevando esa cantidad). */
export const precioDe = (p: Datos, tipo: Tipo, cantidad = 1): number =>
  precioPorCantidad(tipo === "Unidad" ? precioUnidad(p) ?? 0 : precioBulto(p), escalasDe(p, tipo), cantidad);

/** Nombre de la presentación elegida: el del suelto si es "Unidad" y el sistema lo mandó. */
export const nombreDe = (p: Pick<Product, "nombre"> & Partial<Pick<Product, "nombre_unidad">>, tipo: Tipo): string =>
  (tipo === "Unidad" && p.nombre_unidad?.trim()) || p.nombre || "";

/** Cuál se muestra elegida al principio: el bulto, salvo que solo haya unidades. */
export const tipoInicial = (p: Datos): Tipo => (!hayBulto(p) && hayUnidad(p) ? "Unidad" : "Bulto");

/** Una presentación que existe y se puede elegir. */
export const tipoValido = (p: Datos, tipo: string | undefined): Tipo =>
  tipo === "Unidad" && tieneUnidad(p) ? "Unidad" : tipo === "Bulto" ? "Bulto" : tipoInicial(p);
