import { useState, useEffect, useCallback } from "react"
import { useAuth } from "../contexts/AuthContext";
import { useAlert } from "../contexts/AlertContext";
import { supabase } from "../lib/supabase";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Package,
  ShoppingBag,
  ArrowLeft,
  LogOut,
  Save,
  X,
  ChevronRight,
  Edit3,
  Store,
  Shield,
} from "lucide-react";

export default function ProfilePage() {
  const { user, userProfile, logout } = useAuth();
  const { showSuccess, showError } = useAlert();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    nombre: "",
    telefono: "",
    direccion: "",
  });
  const [pedidosRecientes, setPedidosRecientes] = useState([]);
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!userProfile?.email) {
      setIsLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("perfiles")
        .select("*")
        .eq("email", userProfile.email)
        .single();
      if (error) throw error;
      setProfileData(data);
      setEditForm({
        nombre: data.nombre || "",
        telefono: data.telefono || "",
        direccion: data.direccion || "",
      });
    } catch (err) {
      console.error("Error cargando perfil:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.email]);

  const loadRecentOrders = useCallback(async () => {
    if (!user?.id && !userProfile?.email) return;
    try {
      let query = supabase
        .from("pedidos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      if (user?.id) {
        query = query.eq("user_id", user.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      setPedidosRecientes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error cargando pedidos recientes:", err);
    }
  }, [user?.id, userProfile?.email]);

  useEffect(() => {
    loadProfile();
    loadRecentOrders();
  }, [loadProfile, loadRecentOrders]);

  const handleSave = async () => {
    if (!profileData?.email) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("perfiles")
        .update({
          nombre: editForm.nombre.trim(),
          telefono: editForm.telefono.trim(),
          direccion: editForm.direccion.trim(),
        })
        .eq("email", profileData.email);
      if (error) throw error;
      showSuccess("Perfil actualizado correctamente");
      setProfileData((prev) => ({ ...prev, ...editForm }));
      setEditing(false);
    } catch (err) {
      showError("Error al actualizar el perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getTipoClienteBadge = (tipo) => {
    const badges = {
      Personal: "bg-green-100 text-green-700",
      Kiosco: "bg-blue-100 text-blue-700",
      Almacén: "bg-orange-100 text-orange-700",
      Empresa: "bg-purple-100 text-purple-700",
    };
    return badges[tipo] || "bg-gray-100 text-gray-700";
  };

  const getStatusColor = (estado) => {
    const colors = {
      pagado: "text-blue-600",
      aprobado: "text-green-600",
      configurado: "text-blue-600",
      pendiente: "text-yellow-600",
      rechazado: "text-red-600",
      cancelado: "text-gray-600",
      vencido: "text-red-600",
      modificado: "text-orange-600",
    };
    return colors[estado] || "text-gray-600";
  };

  if (!user && !userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 py-20">
        <div className="max-w-md mx-auto text-center px-4">
          <User className="w-20 h-20 text-gray-300 mx-auto mb-6" />
          <h2 className="text-3xl font-black text-gray-900 mb-4">Mi Perfil</h2>
          <p className="text-gray-600 mb-8">Iniciá sesión para ver tu perfil</p>
          <Link
            to="/login"
            className="inline-block bg-[#FF6600] text-white px-8 py-4 rounded-xl font-black hover:bg-orange-700 transition"
          >
            Iniciar Sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center text-gray-500 hover:text-gray-900 mb-4 transition font-medium"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Volver al inicio
        </button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 flex items-center gap-3">
              <User className="text-[#FF6600]" />
              Mi Perfil
            </h1>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 bg-[#FF6600] text-white px-4 py-3 rounded-xl font-bold hover:bg-orange-700 transition text-sm"
            >
              <Edit3 size={18} />
              <span className="hidden sm:inline">Editar Perfil</span>
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-[#FF6600] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-lg font-bold text-gray-500">
              Cargando perfil...
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mb-2">
                  <ShoppingBag className="w-5 h-5 text-[#FF6600]" />
                </div>
                <p className="text-3xl font-black text-gray-900">
                  {profileData?.cantidad_pedidos || 0}
                </p>
                <p className="text-sm font-medium text-gray-500">Pedidos</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-2">
                  <Store className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-sm sm:text-base font-black text-gray-900 truncate">
                  {profileData?.tipo_cliente || "General"}
                </p>
                <p className="text-sm font-medium text-gray-500">
                  Tipo cliente
                </p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-2">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-sm sm:text-base font-black text-gray-900 capitalize">
                  {profileData?.rol || "user"}
                </p>
                <p className="text-sm font-medium text-gray-500">Rol</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <User size={22} className="text-[#FF6600]" />
                  Información Personal
                </h2>
              </div>
              <div className="p-6">
                {editing ? (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        <User size={16} className="inline mr-2" />
                        Nombre
                      </label>
                      <input
                        type="text"
                        value={editForm.nombre}
                        onChange={(e) =>
                          setEditForm((p) => ({
                            ...p,
                            nombre: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#FF6600] font-medium"
                        placeholder="Tu nombre"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        <Phone size={16} className="inline mr-2" />
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={editForm.telefono}
                        onChange={(e) =>
                          setEditForm((p) => ({
                            ...p,
                            telefono: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#FF6600] font-medium"
                        placeholder="Tu teléfono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        <MapPin size={16} className="inline mr-2" />
                        Dirección
                      </label>
                      <input
                        type="text"
                        value={editForm.direccion}
                        onChange={(e) =>
                          setEditForm((p) => ({
                            ...p,
                            direccion: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#FF6600] font-medium"
                        placeholder="Tu dirección"
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 bg-[#FF6600] hover:bg-orange-700 text-white font-black py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {saving ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <Save size={18} />
                            Guardar Cambios
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setEditing(false);
                          setEditForm({
                            nombre: profileData?.nombre || "",
                            telefono: profileData?.telefono || "",
                            direccion: profileData?.direccion || "",
                          });
                        }}
                        className="px-6 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-100 font-black rounded-xl transition flex items-center gap-2"
                      >
                        <X size={18} />
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          <User size={14} className="inline mr-1" />
                          Nombre
                        </label>
                        <p className="text-lg font-bold text-gray-900 mt-1">
                          {profileData?.nombre || "No especificado"}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          <Mail size={14} className="inline mr-1" />
                          Email
                        </label>
                        <p className="text-lg font-bold text-gray-900 mt-1">
                          {profileData?.email || "No especificado"}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          <Phone size={14} className="inline mr-1" />
                          Teléfono
                        </label>
                        <p className="text-lg font-bold text-gray-900 mt-1">
                          {profileData?.telefono || "No especificado"}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          <MapPin size={14} className="inline mr-1" />
                          Dirección
                        </label>
                        <p className="text-lg font-bold text-gray-900 mt-1">
                          {profileData?.direccion || "No especificada"}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          <Store size={14} className="inline mr-1" />
                          Tipo de Cliente
                        </label>
                        <p className="mt-1">
                          <span
                            className={`inline-block px-3 py-1.5 rounded-lg text-sm font-bold ${getTipoClienteBadge(profileData?.tipo_cliente)}`}
                          >
                            {profileData?.tipo_cliente || "General"}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <Package size={22} className="text-[#FF6600]" />
                  Pedidos Recientes
                </h2>
                <Link
                  to="/pedidos"
                  className="text-sm font-bold text-[#FF6600] hover:text-orange-700 transition flex items-center gap-1"
                >
                  Ver todos
                  <ChevronRight size={16} />
                </Link>
              </div>
              <div className="p-6">
                {pedidosRecientes.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">
                      No tenés pedidos aún
                    </p>
                    <Link
                      to="/productos"
                      className="inline-block mt-3 text-[#FF6600] font-bold hover:text-orange-700 transition"
                    >
                      Explorar productos
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pedidosRecientes.map((pedido) => {
                      let total = Number(pedido.total) || 0;
                      return (
                        <Link
                          key={pedido.id}
                          to="/pedidos"
                          className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Package
                                size={18}
                                className="text-gray-600"
                              />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-sm">
                                Pedido #{pedido.id}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(
                                  pedido.created_at,
                                ).toLocaleDateString("es-AR", {
                                  day: "numeric",
                                  month: "short",
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-[#FF6600]">
                              ${total.toLocaleString("es-AR")}
                            </p>
                            <p
                              className={`text-xs font-bold capitalize ${getStatusColor(pedido.estado)}`}
                            >
                              {pedido.estado}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold transition"
              >
                <LogOut size={18} />
                Cerrar Sesión
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
