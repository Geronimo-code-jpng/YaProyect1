"use client";

import { useEffect, useState } from "react";
import { fetchPerfilById, updatePerfil } from "../lib/catalogApi";
import { getCurrentUserFromDB, saveSession } from "../utils/authDB";

// Paso siguiente al registro con Google: Google solo da email y nombre, así
// que acá se piden tipo de cliente, teléfono y dirección (opcional), y se deja
// corregir el nombre. Llega desde OAuthCallbackPage con ?next= a donde seguir.
function destinoSeguro(): string {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

const inputClass =
  "w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-medium focus:border-[#FF6600] focus:outline-none transition";

export default function CompletarPerfilPage() {
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    direccion: "",
    tipo_cliente: "Personal",
  });

  useEffect(() => {
    const session = getCurrentUserFromDB();
    if (!session) {
      window.location.replace("/login");
      return;
    }

    fetchPerfilById(session.id)
      .then((perfil) => {
        // Ya lo completó (p. ej. volvió con "atrás"): seguir de largo.
        if (perfil?.telefono?.trim()) {
          window.location.replace(destinoSeguro());
          return;
        }
        setFormData((prev) => ({
          nombre: perfil?.nombre || session.nombre || prev.nombre,
          telefono: "",
          direccion: perfil?.direccion || "",
          tipo_cliente: perfil?.tipo_cliente || prev.tipo_cliente,
        }));
        setCargando(false);
      })
      .catch((err) => {
        console.error("Error cargando perfil:", err);
        setCargando(false);
      });
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrores([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const session = getCurrentUserFromDB();
    if (!session) {
      window.location.replace("/login");
      return;
    }

    const nombre = formData.nombre.trim();
    const telefono = formData.telefono.trim();
    const direccion = formData.direccion.trim();

    // Mismas reglas que el registro con email (RegisterPage).
    const erroresValidacion: string[] = [];
    if (nombre.length < 2) erroresValidacion.push("El nombre debe tener al menos 2 caracteres");
    if (!telefono) {
      erroresValidacion.push("El teléfono es obligatorio");
    } else if (!/^\d{10,}$/.test(telefono.replace(/\D/g, ""))) {
      erroresValidacion.push("El teléfono debe tener al menos 10 dígitos");
    }
    if (erroresValidacion.length > 0) {
      setErrores(erroresValidacion);
      return;
    }

    setGuardando(true);
    try {
      const actualizado = await updatePerfil(session.id, {
        nombre,
        telefono,
        direccion: direccion || null,
        tipo_cliente: formData.tipo_cliente,
      });
      if (!actualizado) throw new Error("No encontramos tu cuenta");
      // El nombre también va en la sesión (se muestra en el header).
      saveSession({ ...session, nombre: actualizado.nombre });
      window.location.replace(destinoSeguro());
    } catch (err) {
      console.error("Error guardando perfil:", err);
      setErrores(["No pudimos guardar tus datos. Probá de nuevo"]);
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-linear-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <p className="text-gray-600 font-medium">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 to-red-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-[#FF6600] rounded-full flex items-center justify-center text-white text-3xl font-black italic mx-auto mb-4">
              YA
            </div>
            <h1 className="text-3xl font-black text-gray-900">Completá tu perfil</h1>
            <p className="text-gray-600 mt-2">
              Solo falta esto para que puedas hacer tus pedidos
            </p>
          </div>

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
            <div>
              <label htmlFor="tipo_cliente" className="block text-sm font-bold text-gray-700 mb-2">
                Tipo de cliente
              </label>
              <select
                id="tipo_cliente"
                name="tipo_cliente"
                value={formData.tipo_cliente}
                onChange={handleInputChange}
                className={`${inputClass} text-gray-700`}
                required
              >
                <option value="Personal">Compra Personal</option>
                <option value="Kiosco">Kiosco</option>
                <option value="Almacén">Almacén / Despensa</option>
                <option value="Empresa">Empresa / Oficina</option>
              </select>
            </div>

            <div>
              <label htmlFor="nombre" className="block text-sm font-bold text-gray-700 mb-2">
                Nombre completo o Local
              </label>
              <input
                id="nombre"
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                placeholder="Tu nombre completo"
                className={inputClass}
                required
                autoComplete="name"
              />
            </div>

            <div>
              <label htmlFor="telefono" className="block text-sm font-bold text-gray-700 mb-2">
                Teléfono
              </label>
              <input
                id="telefono"
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                placeholder="342 1234567"
                className={inputClass}
                required
                autoComplete="tel"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="direccion" className="block text-sm font-bold text-gray-700 mb-2">
                Dirección para envíos (Opcional)
              </label>
              <input
                id="direccion"
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleInputChange}
                placeholder="Calle y número"
                className={inputClass}
                autoComplete="street-address"
              />
            </div>

            <button
              type="submit"
              disabled={guardando}
              className="w-full bg-[#FF6600] hover:bg-orange-700 disabled:bg-gray-400 text-white text-lg font-black py-4 rounded-xl transition shadow-lg disabled:cursor-not-allowed"
            >
              {guardando ? "Guardando..." : "Continuar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
