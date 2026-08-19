import { useState } from "react"

interface RejectDialogProps {
  message: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export default function RejectDialog({ message, onConfirm, onCancel }: RejectDialogProps) {
  const [razon, setRazon] = useState("");

  const handleConfirm = () => {
    if (razon.trim()) {
      onConfirm(razon.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-9999 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <p className="text-gray-800 font-bold text-center mb-4">{message}</p>
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Razón del rechazo (obligatorio):
          </label>
          <textarea
            value={razon}
            onChange={(e) => setRazon(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#FF6600] font-medium"
            placeholder="Ej: No tenemos stock de los productos solicitados"
            rows={3}
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-100 font-black rounded-xl transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!razon.trim()}
            className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Rechazar Pedido
          </button>
        </div>
      </div>
    </div>
  );
}
