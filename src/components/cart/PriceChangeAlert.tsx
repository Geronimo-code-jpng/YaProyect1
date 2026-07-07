import { AlertTriangle, RefreshCw, Trash2, ArrowLeft } from "lucide-react";
import type { PriceChange } from "../../utils/validateCartItems";

interface PriceChangeAlertProps {
  isOpen: boolean;
  changes: PriceChange[];
  onUpdateCart: () => void;
  onClearCart: () => void;
  onClose: () => void;
}

export default function PriceChangeAlert({
  isOpen,
  changes,
  onUpdateCart,
  onClearCart,
  onClose,
}: PriceChangeAlertProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-yellow-200 bg-yellow-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={24} className="text-yellow-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-yellow-800">
                Cambios detectados en productos
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Algunos productos del carrito cambiaron de precio o stock desde que los agregaste.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {changes.map((change, idx) => (
            <div key={`${change.Id}-${change.tipo}-${idx}`} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-gray-900">{change.nombre}</h4>
                <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                  change.tipo === "Bulto" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                }`}>
                  {change.tipo === "Bulto" ? "Bulto" : "Unidad"}
                </span>
              </div>
              <div className="space-y-2">
                {change.cambios.map((cambio, cIdx) => (
                  <div key={cIdx} className="flex items-center gap-2 text-sm">
                    {cambio.campo === "precio" && (
                      <>
                        <span className="font-medium text-gray-600 w-16">Precio:</span>
                        <span className="text-gray-400 line-through">{cambio.valorViejo}</span>
                        <span className="text-red-600 font-bold">→ {cambio.valorNuevo}</span>
                      </>
                    )}
                    {cambio.campo === "stock" && (
                      <>
                        <span className="font-medium text-gray-600 w-16">Stock:</span>
                        <span className="text-red-600 font-bold">{cambio.valorNuevo}</span>
                      </>
                    )}
                    {cambio.campo === "oferta" && (
                      <>
                        <span className="font-medium text-gray-600 w-16">Oferta:</span>
                        <span className="text-gray-400 line-through">{cambio.valorViejo}</span>
                        <span className="text-red-600 font-bold">→ {cambio.valorNuevo}</span>
                      </>
                    )}
                    {cambio.campo === "existencia" && (
                      <>
                        <span className="font-medium text-gray-600 w-16">Producto:</span>
                        <span className="text-red-600 font-bold">{cambio.valorNuevo}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
            <strong>Importante:</strong> Si no actualizás el carrito, los precios y condiciones del pedido podrían no coincidir al momento de procesarlo.
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50 rounded-b-2xl flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 cursor-pointer py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-100 font-bold rounded-xl transition flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} />
            Volver
          </button>
          <button
            onClick={onClearCart}
            className="flex-1 cursor-pointer py-3 border-2 border-red-300 text-red-600 hover:bg-red-50 font-bold rounded-xl transition flex items-center justify-center gap-2"
          >
            <Trash2 size={18} />
            Vaciar carrito
          </button>
          <button
            onClick={onUpdateCart}
            className="flex-1 cursor-pointer py-3 bg-[#FF6600] hover:bg-orange-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            Actualizar precios
          </button>
        </div>
      </div>
    </div>
  );
}
