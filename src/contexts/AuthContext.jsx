import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUserFromDB } from '../utils/authDB';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [authError, setAuthError] = useState('');

  // Inicializar autenticación desde localStorage
  useEffect(() => {
    const currentUser = getCurrentUserFromDB();
    
    if (currentUser) {
      // setUser con datos de autenticación
      setUser({
        id: currentUser.id,
        email: currentUser.email,
        aud: 'local',
        role: 'authenticated',
        app_metadata: {},
        user_metadata: {},
        created_at: currentUser.created_at
      });
      
      // setUserProfile con datos del perfil
      setUserProfile({
        id: currentUser.id,
        email: currentUser.email,
        nombre: currentUser.nombre,
        rol: currentUser.rol,
        created_at: currentUser.created_at
      });
    } else {
      setUser(null);
      setUserProfile(null);
    }
  }, []);

  // Escuchar cambios en localStorage (para múltiples pestañas)
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'userSession') {
        const currentUser = getCurrentUserFromDB();
        if (currentUser) {
          // setUser con datos de autenticación
          setUser({
            id: currentUser.id,
            email: currentUser.email,
            aud: 'local',
            role: 'authenticated',
            app_metadata: {},
            user_metadata: {},
            created_at: currentUser.created_at
          });
          
          // setUserProfile con datos del perfil
          setUserProfile({
            id: currentUser.id,
            email: currentUser.email,
            nombre: currentUser.nombre,
            rol: currentUser.rol,
            created_at: currentUser.created_at
          });
        } else {
          setUser(null);
          setUserProfile(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const openAuthModal = () => {
    setShowAuthModal(true);
    setAuthError("");
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
    setAuthError("");
  };

  const openPasswordResetModal = () => {
    setShowPasswordResetModal(true);
  };

  const closePasswordResetModal = () => {
    setShowPasswordResetModal(false);
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setAuthError("");
  };

  const showError = (message) => {
    setAuthError(message);
  };

  const logout = async () => {
    try {
      // Limpiar estado local
      setUser(null);
      setUserProfile(null);
      setAuthError("");
      
      // Limpiar localStorage
      localStorage.removeItem('userSession');
      
      console.log("Sesión local cerrada exitosamente");
      
      // Recargar página para limpiar cualquier estado residual
      window.location.reload();
    } catch (err) {
      console.error("Error cerrando sesión:", err);
      // Asegurarse de limpiar localStorage incluso si hay error
      localStorage.removeItem('userSession');
      window.location.reload();
    }
  };

  const value = {
    user,
    userProfile,
    showAuthModal,
    showPasswordResetModal,
    activeTab,
    authError,
    openAuthModal,
    closeAuthModal,
    openPasswordResetModal,
    closePasswordResetModal,
    switchTab,
    showError,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
