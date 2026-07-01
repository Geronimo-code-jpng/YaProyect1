import { useState } from "react"
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { hashPassword } from "../utils/passwordUtils";
import { supabase } from "../lib/supabase";
import { loginWithDB } from "../utils/authDB";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errores, setErrores] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    direction: "",
    password: "",
    confirmPassword: "",
    type: "Personal",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrores([]); // Clear errors on input change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrores([]);

    await registrarUsuario(formData);
  };

  async function registrarUsuario(data) {
    const {
      email,
      password: pass,
      name: nombre,
      phone: tel,
      direction: dir,
      type: tipo,
      confirmPassword,
    } = data;

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

    if (pass !== confirmPassword) {
      erroresValidacion.push("Las contraseñas no coinciden");
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
      // Verificar si el email ya existe en la base de datos
      const { data: existingUser, error: checkError } = await supabase
        .from("perfiles")
        .select("email")
        .eq("email", email)
        .single();

      if (existingUser) {
        throw new Error("Este email ya está registrado");
      }
      if (checkError) {
        throw new Error(checkError.message);
      }

      // Hashear la contraseña
      const hashedPassword = await hashPassword(pass);

      // Crear usuario en la base de datos
      const { error: profileErr } = await supabase.from("perfiles").insert([
        {
          email: email,
          password: hashedPassword,
          nombre: nombre,
          telefono: tel,
          tipo_cliente: tipo || "minorista",
          direccion: dir || null,
          rol: "user",
        },
      ]);

      if (profileErr) {
        console.error("Error al guardar perfil:", profileErr);
        throw new Error(
          "Error al guardar los datos del perfil. Intenta nuevamente.",
        );
      }

      // Iniciar sesión automáticamente después del registro
      const loginResult = await loginWithDB(email, pass);

      if (loginResult.success) {
        setTimeout(() => {
          navigate("/");
          window.location.reload(); // Reload to update auth state
        }, 1000);
      } else {
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (err) {
      setErrores([err.message]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 to-red-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Back button */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Volver a la tienda
        </button>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-[#FF6600] rounded-full flex items-center justify-center text-white text-3xl font-black italic mx-auto mb-4">
              YA
            </div>
            <h1 className="text-3xl font-black text-gray-900">Crear Cuenta</h1>
            <p className="text-gray-600 mt-2">
              Registrate para obtener beneficios exclusivos
            </p>
          </div>

          {/* Error messages */}
          {errores.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-bold rounded-xl">
              {errores.map((error, index) => (
                <div key={index} className="mb-1">
                  {error}
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-bold text-gray-700 mb-2"
              >
                Nombre completo o Local
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Tu nombre completo"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-medium focus:border-[#FF6600] focus:outline-none transition"
                required
                autoComplete="name"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-bold text-gray-700 mb-2"
              >
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="tu@email.com"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-medium focus:border-[#FF6600] focus:outline-none transition"
                required
                autoComplete="email"
              />
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-bold text-gray-700 mb-2"
              >
                Teléfono
              </label>
              <input
                id="phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="342 1234567"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-medium focus:border-[#FF6600] focus:outline-none transition"
                required
                autoComplete="tel"
              />
            </div>

            {/* Address (Optional) */}
            <div>
              <label
                htmlFor="direction"
                className="block text-sm font-bold text-gray-700 mb-2"
              >
                Dirección para envíos (Opcional)
              </label>
              <input
                id="direction"
                type="text"
                name="direction"
                value={formData.direction}
                onChange={handleInputChange}
                placeholder="Calle y número"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-medium focus:border-[#FF6600] focus:outline-none transition"
                autoComplete="street-address"
              />
            </div>

            {/* Customer Type */}
            <div>
              <label
                htmlFor="type"
                className="block text-sm font-bold text-gray-700 mb-2"
              >
                Tipo de cliente
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-medium focus:border-[#FF6600] focus:outline-none transition text-gray-700"
                required
              >
                <option value="Personal">Compra Personal</option>
                <option value="Kiosco">Kiosco</option>
                <option value="Almacén">Almacén / Despensa</option>
                <option value="Empresa">Empresa / Oficina</option>
              </select>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-bold text-gray-700 mb-2"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl font-medium focus:border-[#FF6600] focus:outline-none transition"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-bold text-gray-700 mb-2"
              >
                Confirmar Contraseña
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Repite tu contraseña"
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl font-medium focus:border-[#FF6600] focus:outline-none transition"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Terms and conditions */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                required
                className="mt-1 w-4 h-4 text-[#FF6600] border-gray-300 rounded focus:ring-[#FF6600]"
              />
              <label htmlFor="terms" className="text-sm text-gray-600">
                Acepto los{" "}
                <Link
                  to="/terminos"
                  className="text-[#FF6600] hover:text-orange-700"
                >
                  términos y condiciones
                </Link>{" "}
                y la{" "}
                <Link
                  to="/privacidad"
                  className="text-[#FF6600] hover:text-orange-700"
                >
                  política de privacidad
                </Link>
              </label>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF6600] hover:bg-orange-700 disabled:bg-gray-400 text-white text-lg font-black py-4 rounded-xl transition shadow-lg disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creando cuenta...
                </span>
              ) : (
                "Crear Mi Cuenta"
              )}
            </button>
          </form>

          {/* Login link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              ¿Ya tenés cuenta?{" "}
              <Link
                to="/login"
                className="text-[#FF6600] hover:text-orange-700 font-bold"
              >
                Iniciá sesión
              </Link>
            </p>
          </div>

          {/* Benefits */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4">
              Beneficios de tu cuenta
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <svg
                    className="w-4 h-4 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    $1.000 OFF en tu primera compra
                  </p>
                  <p className="text-sm text-gray-600">
                    En compras mayores a $80.000
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <svg
                    className="w-4 h-4 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Acceso a ofertas exclusivas
                  </p>
                  <p className="text-sm text-gray-600">
                    Promociones solo para miembros
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <svg
                    className="w-4 h-4 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Historial de pedidos
                  </p>
                  <p className="text-sm text-gray-600">
                    Revisá tus compras anteriores
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
