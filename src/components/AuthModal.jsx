import { useAuth } from "../contexts/AuthContext";
import { supabase as supabaseClient } from "../lib/supabase";
import { useState } from "react";
import PasswordResetModal from "./PasswordResetModal";
import { verifyPassword } from "../utils/passwordUtils";

export default function AuthModal() {
  const {
    showAuthModal,
    showPasswordResetModal,
    user,
    userProfile,
    openAuthModal,
    closeAuthModal,
    openPasswordResetModal,
    closePasswordResetModal,
    activeTab,
    switchTab,
    authError,
    showError,
  } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errores, setErrores] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: ""
  });

  
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({ ...prev, [name]: value }));
  };

  const checkSession = async () => {
    try {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      return session;
    } catch (err) {
      console.error("Error sesión:", err);
      return null;
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    
    const { email, password } = loginForm;

    if (!email) {
      setLoginError("El email es obligatorio");
      setLoginLoading(false);
      return;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLoginError("El email no es válido");
      setLoginLoading(false);
      return;
    }

    if (!password) {
      setLoginError("La contraseña es obligatoria");
      setLoginLoading(false);
      return;
    }

    try {
      // Verificar usuario y contraseña en tabla perfiles
      const { data: profileData, error: profileError } = await supabaseClient
        .from('perfiles')
        .select('*')
        .eq('email', email)
        .single();

      if (profileError || !profileData) {
        setLoginError("Email o contraseña incorrectos");
        setLoginLoading(false);
        return;
      }

      // Verificar si el usuario tiene contraseña en perfiles
      if (!profileData.password) {
        setLoginError("Este usuario no tiene contraseña configurada");
        setLoginLoading(false);
        return;
      }

      // Verificar contraseña con bcrypt
      const isPasswordValid = await verifyPassword(password, profileData.password);
      
      if (!isPasswordValid) {
        setLoginError("Email o contraseña incorrectos");
        setLoginLoading(false);
        return;
      }

      // Si la contraseña es correcta, crear sesión local sin Supabase Auth
      const userSession = {
        id: profileData.id,
        email: profileData.email,
        nombre: profileData.nombre,
        rol: profileData.rol,
        isLoggedIn: true,
        loginTime: new Date().toISOString(),
        aud: 'local',
        role: 'authenticated',
        app_metadata: {},
        user_metadata: {},
        created_at: profileData.created_at
      };
      
      // Guardar sesión en localStorage
      localStorage.setItem('userSession', JSON.stringify(userSession));

      closeAuthModal();
      setToastMessage("¡Sesión iniciada!");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
      
      // Recargar página para que AuthContext detecte la sesión local
      window.location.reload();
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrores([]);
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    await registrarUsuario(data);
  };

  async function registrarUsuario(formData) {
    const { email, password: pass, name: nombre, phone: tel, direction: dir, type: tipo } = formData;

    // Validaciones mejoradas
    const erroresValidacion = [];

    if (!email) {
      erroresValidacion.push("El email es obligatorio");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      erroresValidacion.push("El email no es válido");
    }

    if (!pass) {
      erroresValidacion.push("La contraseña es obligatoria");
    } else if (pass.length < 6) {
      erroresValidacion.push("La contraseña debe tener 6 caracteres mínimo");
    }

    if (!nombre) {
      erroresValidacion.push("El nombre es obligatorio");
    } else if (nombre.length < 2) {
      erroresValidacion.push("El nombre debe tener al menos 2 caracteres");
    }

    if (!tel) {
      erroresValidacion.push("El teléfono es obligatorio");
    } else if (!/^\d{10,}$/.test(tel.replace(/\D/g, ""))) {
      erroresValidacion.push("El teléfono debe tener al menos 10 dígitos");
    }

    if (erroresValidacion.length > 0) {
      setErrores(erroresValidacion);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password: pass,
      });

      if (error) {
        if (error.message.includes("rate limit"))
          throw new Error(
            "Límite de registros alcanzado. Intenta de nuevo más tarde.",
          );
        if (error.message.includes("User already registered"))
          throw new Error(
            "Este email ya está registrado. Intenta con otro email.",
          );
        throw new Error(error.message);
      }

      if (data.user) {
        const { error: profileErr } = await supabaseClient
          .from("perfiles")
          .insert([
            {
              id: data.user.id,
              email: email,
              nombre: nombre,
              telefono: tel,
              tipo_cliente: tipo,
              direccion: dir || null,
            },
          ]);

        if (profileErr) {
          console.error("Error al guardar perfil:", profileErr);
          throw new Error(
            "Error al guardar los datos del perfil. Intenta nuevamente.",
          );
        }

        if (!data.session) {
          closeAuthModal();
          setToastMessage(
            "¡Cuenta creada! Revisa tu email para confirmar la cuenta.",
          );
          setShowToast(true);
          setTimeout(() => setShowToast(false), 4000);
          return;
        }

        closeAuthModal();
        setToastMessage("¡Cuenta creada exitosamente!");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
        await checkSession();
      }
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!showAuthModal) return null;

  return (
    <>
      <div
        id="authModal"
        className="fixed inset-0 bg-black/80 z-9999 flex items-center justify-center p-4 backdrop-blur-sm"
      >
        <div className="bg-white rounded-3xl w-full max-w-md flex flex-col modal-animate shadow-2xl overflow-hidden relative">
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-5 text-3xl text-gray-400 hover:text-black leading-none z-10"
          >
            &times;
          </button>

          <div className="flex border-b">
            <button
              onClick={() => switchTab("login")}
              id="tabLogin"
              className={`flex-1 py-4 font-black border-b-4 ${
                activeTab === "login"
                  ? "text-gray-800 border-[#FF6600]"
                  : "text-gray-400 border-transparent hover:text-gray-800"
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => switchTab("register")}
              id="tabRegister"
              className={`flex-1 py-4 font-bold border-b-4 ${
                activeTab === "register"
                  ? "text-gray-800 border-[#FF6600]"
                  : "text-gray-400 border-transparent hover:text-gray-800"
              }`}
            >
              Crear Cuenta
            </button>
          </div>

          <div className="p-8 bg-gray-50 max-h-[80vh] overflow-y-auto">
            {authError && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm font-bold rounded-lg border border-red-200">
                {authError}
              </div>
            )}
            
            {loginError && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm font-bold rounded-lg border border-red-200">
                {loginError}
              </div>
            )}
            
            {errores.length > 0 && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm font-bold rounded-lg border border-red-200">
                {errores.map((error, index) => (
                  <div key={index}>{error}</div>
                ))}
              </div>
            )}

            <form
              onSubmit={handleLoginSubmit}
              className={`${activeTab === "login" ? "" : "hidden"} space-y-4`}
            >
              <input
                type="email"
                name="email"
                value={loginForm.email}
                onChange={handleLoginChange}
                placeholder="Tu Email"
                className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 font-medium focus:border-[#FF6600] focus:outline-none"
                required
              />
              <input
                type="password"
                name="password"
                value={loginForm.password}
                onChange={handleLoginChange}
                placeholder="Contraseña"
                className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 font-medium focus:border-[#FF6600] focus:outline-none"
                required
              />
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full mt-2 py-4 bg-zinc-900 hover:bg-black disabled:bg-gray-400 text-white text-lg font-black rounded-xl transition shadow-lg"
              >
                {loginLoading ? "Ingresando..." : "Ingresar"}
              </button>
              <button onClick={openPasswordResetModal} className="w-full text-black/60 cursor-pointer hover:text-black/80">
                ¿Olvidaste tu contraseña?
              </button>
            </form>

            <form
              onSubmit={handleRegisterSubmit}
              className={`${activeTab === "register" ? "" : "hidden"} space-y-4`}
            >
              <input
                type="text"
                name="name"
                placeholder="Nombre completo o Local"
                className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 font-medium focus:border-[#FF6600] focus:outline-none"
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Correo electrónico"
                className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 font-medium focus:border-[#FF6600] focus:outline-none"
                required
              />
              <input
                type="tel"
                name="phone"
                placeholder="Teléfono"
                className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 font-medium focus:border-[#FF6600] focus:outline-none"
                required
              />
              <input
                type="text"
                name="direction"
                placeholder="Dirección para envíos (Opcional)"
                className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 font-medium focus:border-[#FF6600] focus:outline-none"
              />
              <input
                type="password"
                name="password"
                placeholder="Crear Contraseña (Mínimo 6 caracteres)"
                className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 font-medium focus:border-[#FF6600] focus:outline-none"
                required
                minLength="6"
              />

              <select
                name="type"
                className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 font-medium focus:border-[#FF6600] focus:outline-none text-gray-700"
                required
              >
                <option value="Personal">Compra Personal</option>
                <option value="Kiosco">Kiosco</option>
                <option value="Almacén">Almacén / Despensa</option>
                <option value="Empresa">Empresa / Oficina</option>
              </select>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-4 bg-[#FF6600] hover:bg-orange-700 disabled:bg-gray-400 text-white text-lg font-black rounded-xl transition shadow-lg"
              >
                {loading ? "Creando..." : "Crear Mi Cuenta"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div
          id="toastExito"
          className={`fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-transform duration-300 ${
            showToast ? "translate-x-0" : "translate-x-[150%]"
          }`}
        >
          <div className="flex items-center gap-2">
            <i className="fas fa-check-circle"></i>
            <span id="toastMsg">{toastMessage}</span>
          </div>
        </div>
      )}

      {showPasswordResetModal && <PasswordResetModal />}
    </>
  );
}
