import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { useAlert } from "../contexts/AlertContext";

export default function PasswordResetTokenModal() {
  const { showSuccess, showError } = useAlert();
  const [loading, setLoading] = useState(false);
  const { closePasswordResetModal } = useAuth();
  
  // Paso 1: Ingresar email y código
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [userData, setUserData] = useState(null);
  
  // Paso 2: Nueva contraseña
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Validar email
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Validar contraseña
  const validatePassword = (password) => {
    if (password.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
    if (!/[A-Z]/.test(password)) {
      return 'La contraseña debe tener al menos una mayúscula';
    }
    if (!/[a-z]/.test(password)) {
      return 'La contraseña debe tener al menos una minúscula';
    }
    if (!/[0-9]/.test(password)) {
      return 'La contraseña debe tener al menos un número';
    }
    return null;
  };

  const handleTokenSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validar email
      if (!validateEmail(email)) {
        showError('Email inválido');
        return;
      }

      if (!token.trim()) {
        showError('El código es requerido');
        return;
      }

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

      // Guardar datos del usuario para el siguiente paso
      setUserData({
        profileId: profileData.id,
        email: profileData.email,
        tokenId: tokenData.id
      });

      setShowPasswordForm(true);
      showSuccess('Código verificado. Ahora ingresa tu nueva contraseña.');

    } catch (error) {
      console.error('Error verificando código:', error);
      showError('Error verificando código');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
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
      // Buscar usuario en auth.users por email
      const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
      
      if (userError) {
        showError('Error actualizando contraseña');
        return;
      }

      const user = users.find(u => u.email === userData.email);
      
      if (!user) {
        showError('Usuario no encontrado');
        return;
      }

      // Actualizar contraseña del usuario
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: newPassword }
      );

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
          {showPasswordForm ? 'Nueva Contraseña' : 'Recuperar Contraseña'}
        </h3>
        
        {!showPasswordForm ? (
          <>
            <p className="text-gray-600 text-center mb-6">
              Ingresa tu email y el código que recibiste
            </p>

            <form onSubmit={handleTokenSubmit} className="space-y-4">
              <input
                type="email"
                name="email"
                placeholder="Tu Email"
                className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 font-medium focus:border-[#FF6600] focus:outline-none"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

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
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-zinc-900 hover:bg-black disabled:bg-gray-400 text-white font-black rounded-xl transition shadow-lg"
                >
                  {loading ? "Verificando..." : "Verificar Código"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <p className="text-gray-600 text-center mb-6">
              Ingresa tu nueva contraseña (mínimo 6 caracteres, 1 mayúscula, 1 minúscula, 1 número)
            </p>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
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
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-zinc-900 hover:bg-black disabled:bg-gray-400 text-white font-black rounded-xl transition shadow-lg"
                >
                  {loading ? "Actualizando..." : "Actualizar Contraseña"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
