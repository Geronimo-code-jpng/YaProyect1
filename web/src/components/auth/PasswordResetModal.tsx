import { useState } from "react"
import { useAuth } from "../../contexts/AuthContext";
import { sendRecoveryEmail, verifyResetToken, resetPassword } from "../../lib/catalogApi";
import { useAlert } from "../../contexts/AlertContext";

export default function PasswordResetModal() {
  const { showSuccess, showError } = useAlert();
  const [loading, setLoading] = useState(false);
  const { closePasswordResetModal } = useAuth();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [showPasswordInputs, setShowPasswordInputs] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userData, setUserData] = useState(null);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await sendRecoveryEmail(email);

      if (!result.success) {
        showError(result.error || 'Error enviando email de recuperación');
        return;
      }

      showSuccess("Email de recuperación enviado correctamente. Revisa tu email para obtener el código.");
      // Mostrar campo para ingresar el código
      setShowTokenInput(true);
    } catch {
      showError("Error enviando email de recuperación");
    } finally {
      setLoading(false);
    }
  };

  // Validar contraseña
  const validatePassword = (password) => {
    if (password.length < 6) {
      return 'La contraseña debe tener 6 o más caracteres';
    }
    return null;
  };

  const handleTokenVerify = async () => {
    if (!token.trim()) {
      showError('El código es requerido');
      return;
    }

    setLoading(true);

    try {
      const result = await verifyResetToken(token, email);

      if (!result.success) {
        showError(result.error || 'Código inválido o expirado');
        return;
      }

      // Guardar datos del usuario
      setUserData({ email: result.email });

      setShowPasswordInputs(true);
      showSuccess('Código verificado. Ahora ingresa tu nueva contraseña.');

    } catch {
      showError('Error verificando código');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      showError('Las contraseñas no coinciden');
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      showError(passwordError);
      return;
    }

    setLoading(true);

    try {
      const result = await resetPassword(token, newPassword);

      if (!result.success) {
        showError(result.error || 'Error actualizando contraseña');
        return;
      }

      showSuccess('Contraseña actualizada correctamente');
      closePasswordResetModal();

    } catch (error) {
      console.error('Error actualizando contraseña:', error);
      showError('Error actualizando contraseña');
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
        
        {!showTokenInput ? (
          <>
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
          </>
        ) : !showPasswordInputs ? (
          <>
            <p className="text-gray-600 text-center mb-6">
              Revisa tu email e ingresa el código que recibiste
            </p>

            <div className="space-y-4">
              <input
                type="text"
                name="token"
                placeholder="Código de recuperación"
                className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 font-medium focus:border-[#FF6600] focus:outline-none"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
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
                  onClick={handleTokenVerify}
                  disabled={loading}
                  className="flex-1 py-3 bg-zinc-900 hover:bg-black disabled:bg-gray-400 text-white font-black rounded-xl transition shadow-lg"
                >
                  {loading ? "Verificando..." : "Verificar Código"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="text-gray-600 text-center mb-6">
              Ingresa tu nueva contraseña (mínimo 6 caracteres)
            </p>

            <div className="space-y-4">
              <input
                type="password"
                name="newPassword"
                placeholder="Nueva contraseña"
                className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 font-medium focus:border-[#FF6600] focus:outline-none"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirmar contraseña"
                className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 font-medium focus:border-[#FF6600] focus:outline-none"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                  onClick={handlePasswordChange}
                  disabled={loading}
                  className="flex-1 py-3 bg-zinc-900 hover:bg-black disabled:bg-gray-400 text-white font-black rounded-xl transition shadow-lg"
                >
                  {loading ? "Actualizando..." : "Cambiar Contraseña"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
