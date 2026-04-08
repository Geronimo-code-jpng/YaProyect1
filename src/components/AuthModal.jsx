import { useAuth } from "../contexts/AuthContext";
import { supabase as supabaseClient } from "../lib/supabase";
import { useState } from "react";

export default function AuthModal() {
  const {
    showAuthModal,
    closeAuthModal,
    activeTab,
    switchTab,
    authError,
    showError,
  } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errores, setErrores] = useState([])

  const mostrarToast = (mensaje) => {
    const toast = document.getElementById("toastExito");
    if (toast) {
      document.getElementById("toastMsg").innerText = mensaje;
      toast.classList.remove("translate-x-[150%]");
      setTimeout(() => {
        toast.classList.add("translate-x-[150%]");
      }, 4000);
    }
  };

  const cerrarPromo = () => {
    const promoModal = document.getElementById("promoModal");
    if (promoModal) {
      promoModal.classList.add("hidden");
    }
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

  async function iniciarSesion(event) {
    const btn = event.currentTarget;

    // Safe button content update
    const spinner = document.createElement("i");
    spinner.className = "fas fa-spinner fa-spin";
    const text = document.createTextNode(" Ingresando...");

    const originalContent = btn.innerHTML;
    btn.innerHTML = "";
    btn.appendChild(spinner);
    btn.appendChild(text);
    btn.disabled = true;

    // Obtener y limpiar valores
    const email = document.getElementById("logEmail")?.value?.trim() || "";
    const pass = document.getElementById("logPass")?.value || "";

    if (!email) {
      errores.push("El email es obligatorio");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errores.push("El email no es válido");
    }

    if (!pass) {
      errores.push("La contraseña es obligatoria");
    }

    if (errores.length > 0) {
      // Mostrar errores individualmente como alertas
      errores.forEach((error) => {
        setTimeout(() => {
          alert(error);
        }, 100);
      });
      // Restaurar el botón antes de salir
      btn.innerHTML = originalContent;
      btn.disabled = false;
      return; // Salir de la función sin lanzar error
    }

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (error) {
        if (error.message === "Invalid login credentials")
          throw new Error("Correo o contraseña incorrectos.");
        if (error.message === "Email not confirmed")
          throw new Error(
            "Tu cuenta está bloqueada porque falta confirmar el correo.",
          );
        throw new Error(error.message);
      }

      closeAuthModal();
      cerrarPromo();
      mostrarToast("¡Sesión iniciada!");

      // Check for admin role
      const { data: perfil } = await supabaseClient
        .from("perfiles")
        .select("rol")
        .eq("id", data.user.id)
        .single();

      if (perfil && perfil.rol === "admin") {
        const adminBtn = document.getElementById("btnIrAdmin");
        if (adminBtn) adminBtn.classList.remove("hidden");
      }

      await checkSession();
    } catch (err) {
      showError(err.message);
      btn.innerHTML = originalContent;
      btn.disabled = false;
    } finally {
      btn.innerHTML = originalContent;
      btn.disabled = false;
    }
  }

  async function registrarUsuario(formData) {
    // Obtener y limpiar valores
    const email = formData.email;
    const pass = formData.password;
    const nombre = formData.name;
    const tel = formData.phone;
    const dir = formData.direction;
    const tipo = formData.type;

    // Validaciones mejoradas
    const errores = [];

    if (!email) {
      setErrores([...errores, "El email es obligatorio"]);
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrores([...errores, "El email no es válido"]);
    }

    if (!pass) {
      setErrores([...errores, "La contraseña es obligatoria"]);
    } else if (pass.length < 6) {
      setErrores([...errores, "La contraseña debe tener 6 caracteres mínimo"]);
    }

    if (!nombre) {
      setErrores([...errores, "El nombre es obligatorio"]);
    } else if (nombre.length < 2) {
      setErrores([...errores, "El nombre debe tener al menos 2 caracteres"]);
    }

    if (!tel) {
      setErrores([...errores, "El teléfono es obligatorio"]);
    } else if (!/^\d{10,}$/.test(tel.replace(/\D/g, ""))) {
      setErrores([...errores, "El teléfono debe tener al menos 10 dígitos"]);
    }

    if (errores.length > 0) {
      // Mostrar errores individualmente como alertas
      errores.forEach((error) => {
        setTimeout(() => {
          alert(error);
        }, 100);
      });
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
              email: email, // Agregamos el email
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
          // Mostrar mensaje específico para confirmación de email
          closeAuthModal();
          cerrarPromo();
          mostrarToast(
            "¡Cuenta creada! Revisa tu email para confirmar la cuenta.",
          );
          return;
        }

        closeAuthModal();
        cerrarPromo();
        mostrarToast("¡Cuenta creada exitosamente!");
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
          <div
            id="authError"
            className={`${authError ? "" : "hidden"} mb-4 p-3 bg-red-100 text-red-700 text-sm font-bold rounded-lg border border-red-200`}
          >
            {authError}
          </div>

          <div
            id="formLogin"
            className={`${activeTab === "login" ? "" : "hidden"} space-y-4`}
          >
            <input
              type="email"
              id="logEmail"
              placeholder="Tu Email"
              className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 font-medium focus:border-[#FF6600] focus:outline-none"
            />
            <input
              type="password"
              id="logPass"
              placeholder="Contraseña"
              className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 font-medium focus:border-[#FF6600] focus:outline-none"
            />
            <button
              onClick={(e) => iniciarSesion(e)}
              className="w-full mt-2 py-4 bg-zinc-900 hover:bg-black text-white text-lg font-black rounded-xl transition shadow-lg"
            >
              Ingresar
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const data = Object.fromEntries(formData);
              registrarUsuario(data);
            }}
            className={`${activeTab === "register" ? "" : "hidden"} space-y-4`}
          >
            <input
              type="text"
              id="regNombre"
              name="name"
              placeholder="Nombre completo o Local"
              className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 font-medium focus:border-[#FF6600] focus:outline-none"
            />
            <input
              type="email"
              id="regEmail"
              name="email"
              placeholder="Correo electrónico"
              className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 font-medium focus:border-[#FF6600] focus:outline-none"
            />
            <input
              type="tel"
              id="regTelefono"
              name="phone"
              placeholder="Teléfono"
              className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 font-medium focus:border-[#FF6600] focus:outline-none"
            />
            <input
              type="text"
              id="regDireccion"
              name="direction"
              placeholder="Dirección para envíos (Opcional)"
              className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 font-medium focus:border-[#FF6600] focus:outline-none"
            />
            <input
              type="password"
              id="regPass"
              name="password"
              placeholder="Crear Contraseña (Mínimo 6 caracteres)"
              className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 font-medium focus:border-[#FF6600] focus:outline-none"
            />

            <select
              id="regTipo"
              name="type"
              className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 font-medium focus:border-[#FF6600] focus:outline-none text-gray-700"
            >
              <option value="Personal">Compra Personal</option>
              <option value="Kiosco">Kiosco</option>
              <option value="Almacén">Almacén / Despensa</option>
              <option value="Empresa">Empresa / Oficina</option>
            </select>

            <button
              type="submit"
              onClick={() => setLoading(true)}
              className="w-full mt-2 py-4 bg-[#FF6600] hover:bg-orange-700 text-white text-lg font-black rounded-xl transition shadow-lg"
            >
              {loading ? "Creando..." : "Crear Mi Cuenta"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
