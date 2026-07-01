import { useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export default function ThankYouPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Atrapamos la info que mandó el carrito
  const datosCliente = location.state?.datosCliente;
  const total = location.state?.totalAbonado;
  const pedidoId = location.state?.pedidoId;
  const items = location.state?.items || [];

  // Efecto para disparar el evento de compra a GTM
  useEffect(() => {
    if (pedidoId) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
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

  // Medida de seguridad: Si alguien entra a /thankyoupage directo sin comprar, lo mandamos al inicio
  if (!datosCliente) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p>No hay datos del pedido.</p>
        <button
          onClick={() => navigate("/")}
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
            onClick={() => navigate("/")}
            className="w-full bg-[#FF6600] hover:bg-orange-700 text-white font-black rounded-xl py-4 transition"
          >
            Volver a la tienda
          </button>
        </div>
      </div>
    </div>
  );
}