"use client";

import { useEffect, useState } from "react";
import { fetchPromoEnvio, type PromoEnvio } from "../lib/catalogApi";

// Sellos de la promo de envío gratis de la cuenta. null mientras carga o si
// falla. El carrito igual vuelve a preguntar justo antes de mandar el pedido
// (promoAlMandar), así el envío gratis se gasta siempre que corresponde.
export function usePromoEnvio(userId?: string | null) {
  const [promo, setPromo] = useState<PromoEnvio | null>(null);
  useEffect(() => {
    let vivo = true;
    fetchPromoEnvio(userId)
      .then((p) => vivo && setPromo(p))
      .catch(() => vivo && setPromo(null));
    return () => {
      vivo = false;
    };
  }, [userId]);
  return [promo, setPromo] as const;
}

export const tieneEnvioGratis = (promo: PromoEnvio | null) => !!(promo?.activa && promo.gratis);

// Lo de ahora, al tocar "Enviar pedido". Si cambió respecto de lo que se está
// mostrando, devuelve la nueva para que el cliente vea el total correcto antes
// de confirmar.
export async function promoAlMandar(userId: string | null | undefined, mostrada: PromoEnvio | null) {
  if (!userId) return { cambio: false, promo: mostrada };
  try {
    const ahora = await fetchPromoEnvio(userId);
    return { cambio: tieneEnvioGratis(ahora) !== tieneEnvioGratis(mostrada), promo: ahora };
  } catch {
    return { cambio: false, promo: mostrada };
  }
}
