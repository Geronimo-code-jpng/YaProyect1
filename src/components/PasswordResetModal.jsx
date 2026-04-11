import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { useAlert } from "../contexts/AlertContext";

export default function PasswordResetModal() {
  const { showSuccess, showError } = useAlert();
  const [loading, setLoading] = useState(false);
  const { closePasswordResetModal } = useAuth();
  const [email, setEmail] = useState("");

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Usar el flujo nativo de Supabase para recuperación de contraseña
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error("Error enviando email de recuperación:", error);
        showError("Error enviando email de recuperación");
        return;
      }

      showSuccess("Email de recuperación enviado correctamente");
      closePasswordResetModal();
    } catch (error) {
      console.error("Error enviando email de recuperación:", error);
      showError("Error enviando email de recuperación");
    } finally {
      setLoading(false);
    }
  };

  
  return (
    <div className="fixed inset-0 bg-black/80 z-9999 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-2xl font-bold text-center mb-4">
          Recuperar Contraseña
        </h3>
        <p className="text-gray-600 text-center mb-6">
          Ingresa tu email y te enviaremos las instrucciones para recuperar
          tu contraseña
        </p>

        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Tu Email"
            className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 font-medium focus:border-[#FF6600] focus:outline-none"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="flex gap-3">
            <button
              type="button"
              onClick={closePasswordResetModal}
              className="flex-1 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl transition font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-zinc-900 hover:bg-black disabled:bg-gray-400 text-white font-black rounded-xl transition shadow-lg"
            >
              {loading ? "Enviando..." : "Enviar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
