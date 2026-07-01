import { useState } from "react"
import { useAuth } from "../../contexts/AuthContext";
import { sendPasswordRecoveryEmail } from "../../resend/emailRecovery";
import { supabase } from "../../lib/supabase";
import { useAlert } from "../../contexts/AlertContext";
import { hashPassword } from "../../utils/passwordUtils";

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
      // Verificar si el email existe en la base de datos
      const { data: profileData, error: profileError } = await supabase
        .from('perfiles')
        .select('email')
        .eq('email', email)
        .single();

      if (profileError || !profileData) {
        showError('Este email no está registrado en el sistema');
        return;
      }

      // Generar token aleatorio
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // Usar la función personalizada para enviar email con token
      await sendPasswordRecoveryEmail(email, token);

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
      // Verificar token en la base de datos
      const { data: tokenData, error: tokenError } = await supabase
        .from('email_recovery')
        .select('*')
        .eq('token', token)
        .single();

      if (tokenError) {
        showError('Código inválido o expirado');
        return;
      }

      // Verificar expiración
      if (new Date(tokenData.expires_at) < new Date()) {
        showError('Código expirado. Solicita uno nuevo.');
        return;
      }

      // Verificar intentos
      if (tokenData.attempts >= 3) {
        showError('Máximo de intentos alcanzado. Solicita un nuevo código.');
        return;
      }

      // Obtener datos del perfil
      const { data: profileData, error: profileError } = await supabase
        .from('perfiles')
        .select('id, email')
        .eq('id', tokenData.profile_id)
        .single();

      if (profileError || !profileData) {
        showError('Perfil no encontrado');
        return;
      }

      // Verificar que el email coincida
      if (profileData.email.toLowerCase() !== email.toLowerCase()) {
        showError('El email no coincide con el del código');
        return;
      }

      // Guardar datos del usuario
      setUserData({
        profileId: profileData.id,
        email: profileData.email
      });

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
      // Hashear la contraseña con bcrypt
      const hashedPassword = await hashPassword(newPassword);

      // Actualizar contraseña en la tabla perfiles
      const { error: updateError } = await supabase
        .from('perfiles')
        .update({ password: hashedPassword })
        .eq('email', userData.email);

      if (updateError) {
        showError('Error actualizando contraseña');
        return;
      }

      // Eliminar token usado
      await supabase
        .from('email_recovery')
        .delete()
        .eq('token', token);

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
