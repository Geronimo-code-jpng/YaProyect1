import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { setOpenProfileRef } from '../utils/profileUtils';
import { supabase } from '../lib/supabase';

export default function ProfileModal() {
  const { userProfile, logout } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [dbUserProfile, setDbUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  const openProfile = useCallback(() => setShowModal(true), [setShowModal]);
  const closeProfile = () => setShowModal(false);
  
  const loadUserDataFromDB = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('email', userProfile.email)
        .single();
      
      if (error) {
        console.error('Error cargando datos del perfil:', error);
        return;
      }
      
      setDbUserProfile(data);
    } catch (err) {
      console.error('Error en loadUserDataFromDB:', err);
    } finally {
      setLoading(false);
    }
  }, [userProfile?.email]);
  
  // Store the function in the ref using useEffect
  useEffect(() => {
    setOpenProfileRef(openProfile);
  }, [openProfile]);

  // Cargar datos del usuario desde la base de datos cuando se abre el modal
  useEffect(() => {
    if (showModal && userProfile?.email) {
      loadUserDataFromDB();
    }
  }, [showModal, userProfile?.email, loadUserDataFromDB]);

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-9999 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl modal-animate shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b flex justify-between items-center bg-gray-50">
          <h3 className="text-2xl font-black flex items-center gap-3">
            <i className="fas fa-user text-[#FF6600]"></i>
            Mi Perfil
          </h3>
          <button 
            onClick={closeProfile}
            className="text-4xl text-gray-400 hover:text-black leading-none"
          >
            &times;
          </button>
        </div>

        <div className="p-8 bg-gray-50 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información Personal */}
            <div className="space-y-4">
              <h4 className="font-black text-lg text-gray-800 border-b pb-2">Información Personal</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-bold text-gray-600">Nombre</label>
                  <div className="p-3 bg-white border rounded-lg">
                    {loading ? 'Cargando...' : (dbUserProfile?.nombre || userProfile?.nombre || 'No especificado')}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-600">Email</label>
                  <div className="p-3 bg-white border rounded-lg">
                    {loading ? 'Cargando...' : (dbUserProfile?.email || userProfile?.email || 'No especificado')}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-600">Teléfono</label>
                  <div className="p-3 bg-white border rounded-lg">
                    {loading ? 'Cargando...' : (dbUserProfile?.telefono || userProfile?.telefono || 'No especificado')}
                  </div>
                </div>
              </div>
            </div>

            {/* Dirección y Tipo */}
            <div className="space-y-4">
              <h4 className="font-black text-lg text-gray-800 border-b pb-2">Dirección y Tipo</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-bold text-gray-600">Tipo de Cliente</label>
                  <div className="p-3 bg-white border rounded-lg capitalize">
                    {loading ? 'Cargando...' : (dbUserProfile?.tipo_cliente || userProfile?.tipo_cliente || 'No especificada')}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-600">Dirección</label>
                  <div className="p-3 bg-white border rounded-lg min-h-[60px]">
                    {loading ? 'Cargando...' : (dbUserProfile?.direccion || userProfile?.direccion || 'No especificada')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="mt-6 flex gap-3 justify-center">
            <button 
              onClick={() => alert('Función de edición próximamente')}
              className="px-6 py-3 bg-[#FF6600] hover:bg-orange-700 text-white font-black rounded-xl transition shadow-lg"
            >
              <i className="fas fa-edit mr-2"></i>
              Editar Perfil
            </button>
            <button 
              onClick={() => {
                if (confirm('¿Estás seguro que quieres cerrar sesión?')) {
                  logout();
                  closeProfile();
                }
              }}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl transition shadow-lg"
            >
              <i className="fas fa-sign-out-alt mr-2"></i>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

