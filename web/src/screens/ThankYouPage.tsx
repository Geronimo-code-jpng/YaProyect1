"use client";

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";

export default function ThankYouPage() {
  const router = useRouter();
  const [data, setData] = useState<{
    datosCliente?: string;
    totalAbonado?: number;
    pedidoId?: number;
    items?: any[];
  } | null>(null);
  const consumed = useRef(false);

  useEffect(() => {
    // Guarda contra el doble-invocado de efectos de React StrictMode: sin
    // esto, la segunda pasada encuentra el sessionStorage ya vaciado por la
    // primera y pisa el estado recién seteado con uno vacío.
    if (consumed.current) return;
    consumed.current = true;

    const raw = sessionStorage.getItem("thankyouData");
    if (raw) {
      setData(JSON.parse(raw));
      sessionStorage.removeItem("thankyouData");
    } else {
      setData({});
    }
  }, []);

  const datosCliente = data?.datosCliente;
  const total = data?.totalAbonado;
  const pedidoId = data?.pedidoId;
  const items = data?.items || [];

  // Efecto para disparar el evento de compra a GTM
  useEffect(() => {
    if (pedidoId) {
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).dataLayer.push({
        event: "purchase",
        ecommerce: {
          transaction_id: pedidoId.toString(),
          value: total,
          currency: "ARS",
          items: items.map((item) => ({
            item_id: item.Id,
            item_name: item.nombre,
            price: item.precio,
            quantity: item.cantidad,
          })),
        },
      });
    }
  }, [pedidoId, total, items]);

  if (data === null) return null;

  // Medida de seguridad: Si alguien entra a /thankyoupage directo sin comprar, lo mandamos al inicio
  if (!datosCliente) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p>No hay datos del pedido.</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 text-[#FF6600] font-bold"
        >
          Volver a la tienda
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen flex justify-center bg-gray-50 py-12">
      <div className="max-w-md w-full px-4 text-center">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />

          <h1 className="text-3xl font-black text-gray-900 mb-2">
            ¡Gracias por enviar tu pedido, {datosCliente || "cliente"}!!
          </h1>

          <p className="text-gray-600 mb-6">
            Hemos recibido tu pedido,nos pondremos en contacto contigo pronto!
          </p>

          <div className="bg-gray-50 rounded-xl p-4 mb-8">
            <h3 className="font-bold text-gray-700 mb-2">resumen del pedido</h3>
            <div className="flex justify-between text-lg font-black text-[#FF6600]">
              <span>Total a pagar:</span>
              <span>${total?.toLocaleString("es-AR")}</span>
            </div>
            {pedidoId && (
              <div className="text-xs text-gray-400 mt-2">
                ID de pedido: {pedidoId}
              </div>
            )}
          </div>

          <button
            onClick={() => router.push("/")}
            className="w-full bg-[#FF6600] hover:bg-orange-700 text-white font-black rounded-xl py-4 transition"
          >
            Volver a la tienda
          </button>
        </div>
      </div>
    </div>
  );
}
