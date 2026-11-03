"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import { fetchPedidosByUserId, fetchProductosCompartido } from "../../lib/catalogApi";
import { aTarjeta, hayBulto } from "../home/FilaProductos";
import { BotonAgregar } from "../home/HomeProductCard";
import type { Product } from "../../types";

const CUANTOS = 2;
const pesos = (n: number) => `$${Math.round(n).toLocaleString("es-AR")}`;

const leerCarrito = (raw: unknown): { Id?: number | string }[] => {
  if (Array.isArray(raw)) return raw;
  try {
    const lista = JSON.parse(String(raw));
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
};

// Ids que el cliente ya compró, de lo que más veces pidió a lo que menos
async function idsDeSusCompras(userId: string): Promise<number[]> {
  const pedidos = await fetchPedidosByUserId(userId);
  const veces = new Map<number, number>();
  for (const pedido of pedidos) {
    const enEste = new Set(leerCarrito(pedido.carrito).map((i) => Number(i.Id)).filter(Boolean));
    for (const id of enEste) veces.set(id, (veces.get(id) || 0) + 1);
  }
  return [...veces.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
}

// Del más vendido al menos (api/productos/ranking). Si no responde, los que
// tienen el tilde de "más vendido".
async function idsMasVendidos(catalogo: Product[]): Promise<number[]> {
  try {
    const res = await fetch("/api/productos/ranking");
    if (res.ok) {
      const ranking = await res.json();
      if (Array.isArray(ranking) && ranking.length) return ranking.map(Number);
    }
  } catch {}
  return catalogo.filter((p) => p.mas_vendido).map((p) => Number(p.Id));
}

/**
 * Debajo de "Enviar pedido": hasta 2 productos para sumar. Primero lo que el
 * cliente ya compró otras veces; si no tiene compras (o no alcanzan), los más
 * vendidos. Se saltean los que no tienen stock y los que ya están en el carrito,
 * así que si el primero no hay, va el segundo, y así.
 */
export default function SugerenciasCarrito() {
  const { cart } = useCart();
  const { user } = useAuth();
  const [lista, setLista] = useState<{ p: Product; deSusCompras: boolean }[] | null>(null);
  // Lo que había en el carrito al armar la lista: lo que se agregue desde acá
  // sigue a la vista (con su − / +) en vez de desaparecer
  const [excluidos, setExcluidos] = useState<Set<string> | null>(null);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const catalogo = await fetchProductosCompartido();
      const porId = new Map(catalogo.map((p) => [Number(p.Id), p]));
      const suyos = user?.id ? await idsDeSusCompras(user.id).catch(() => []) : [];
      const masVendidos = await idsMasVendidos(catalogo);
      const vistos = new Set<number>();
      const candidatos = [
        ...suyos.map((id) => ({ id, deSusCompras: true })),
        ...masVendidos.map((id) => ({ id, deSusCompras: false })),
      ]
        .filter(({ id }) => !vistos.has(id) && vistos.add(id))
        .map(({ id, deSusCompras }) => ({ p: porId.get(id), deSusCompras }))
        .filter((c): c is { p: Product; deSusCompras: boolean } => !!c.p && hayBulto(c.p));
      if (!cancelado) setLista(candidatos);
    })().catch((err) => console.error("Error armando sugerencias:", err));
    return () => {
      cancelado = true;
    };
  }, [user?.id]);

  if (lista && !excluidos && cart.length > 0) setExcluidos(new Set(cart.map((i) => String(i.Id))));

  if (!lista || !excluidos) return null;
  const elegidos = lista.filter(({ p }) => !excluidos.has(String(p.Id))).slice(0, CUANTOS);
  if (!elegidos.length) return null;

  const deSusCompras = elegidos.some((e) => e.deSusCompras);

  return (
    <div className="mt-6 pt-5 border-t border-gray-100">
      <h3 className="font-black text-gray-900">{deSusCompras ? "¿Lo sumás de nuevo?" : "¿Te olvidaste de algo?"}</h3>
      <p className="text-xs text-gray-500 mb-3">
        {deSusCompras ? "Lo que llevaste en otros pedidos" : "Lo que más se llevan nuestros clientes"}
      </p>
      <div className="space-y-2">
        {elegidos.map(({ p }) => {
          const producto = aTarjeta(p);
          return (
            <div key={p.Id} className="flex items-center gap-3 rounded-xl border border-gray-100 p-2">
              <div className="relative w-14 h-14 shrink-0 rounded-lg bg-gray-50">
                <Image src={producto.image} alt={p.nombre} fill sizes="56px" className="object-contain p-1 mix-blend-multiply" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-800 leading-snug line-clamp-2">{p.nombre}</p>
                <p className="text-sm font-black text-[#FF6600]">
                  {pesos(producto.price)}
                  {producto.originalPrice && (
                    <span className="ml-1.5 text-xs font-normal text-gray-400 line-through">{pesos(producto.originalPrice)}</span>
                  )}
                </p>
              </div>
              <BotonAgregar product={producto} className="w-28 h-9 shrink-0" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
