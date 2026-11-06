"use client";

import { Truck, Gift, Check } from "lucide-react";
import type { PromoEnvio } from "../lib/catalogApi";

const fecha = (iso: string) => {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
};

// Tarjeta de sellos de la promo de envío: 5 pedidos con envío cobrados → el
// 6° con envío gratis. Solo se muestra mientras la promo está vigente.
export default function TarjetaSellos({ promo }: { promo: PromoEnvio | null }) {
  if (!promo?.activa) return null;
  const { sellos, meta, gratis, hasta } = promo;
  const faltan = meta - sellos;

  return (
    <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl shadow-sm border-2 border-[#FF6600]/30 p-6 mb-8">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-[#FF6600]">
            Promo Cyber Week · hasta el {fecha(hasta)}
          </p>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 mt-1">
            {gratis
              ? "¡Tu próximo envío es GRATIS! 🎁"
              : `Te ${faltan === 1 ? "falta 1 pedido" : `faltan ${faltan} pedidos`} para el envío gratis`}
          </h2>
        </div>
        <Truck className="w-10 h-10 text-[#FF6600] shrink-0" />
      </div>

      <div className="grid grid-cols-6 gap-2 sm:gap-3">
        {Array.from({ length: meta }, (_, i) => {
          const lleno = i < sellos;
          return (
            <div
              key={i}
              className={`aspect-square rounded-full flex items-center justify-center border-2 transition ${
                lleno
                  ? "bg-[#FF6600] border-[#FF6600] text-white shadow-md"
                  : "border-dashed border-gray-300 text-gray-300"
              }`}
            >
              {lleno ? <Check className="w-1/2 h-1/2" strokeWidth={3} /> : <span className="font-black">{i + 1}</span>}
            </div>
          );
        })}
        <div
          className={`aspect-square rounded-full flex flex-col items-center justify-center border-2 ${
            gratis
              ? "bg-green-500 border-green-500 text-white shadow-md animate-pulse"
              : "border-dashed border-green-400 text-green-500"
          }`}
        >
          <Gift className="w-2/5 h-2/5" />
          <span className="text-[10px] sm:text-xs font-black leading-none mt-0.5">GRATIS</span>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-4">
        Cada pedido con envío a domicilio suma un sello cuando lo entregamos y se cobra. Con 5
        sellos, el envío de tu 6° pedido es gratis (los productos se pagan normal) y la tarjeta
        vuelve a empezar.
      </p>
    </div>
  );
}
