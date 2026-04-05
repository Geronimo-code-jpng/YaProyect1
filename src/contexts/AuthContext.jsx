import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { supabaseClient } from "../db/supabeClient";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [authError, setAuthError] = useState("");
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // Obtener y combinar datos del perfil con los del auth
  const getProfileData = useCallback(async (authUser) => {
    if (!authUser) return { userWithProfile: null, profile: null };

    try {
      const { data: profile, error } = await supabaseClient
        .from("perfiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      // PGRST116 = no rows found, no es un error crítico
      if (error && error.code !== "PGRST116") {
        console.error("Error buscando perfil:", error.message);
      }

      const userWithProfile = {
        ...authUser,
        nombre:
          profile?.nombre ||
          authUser.user_metadata?.nombre ||
          authUser.user_metadata?.full_name ||
          "",
        telefono: profile?.telefono || authUser.user_metadata?.telefono || "",
        direccion:
          profile?.direccion || authUser.user_metadata?.direccion || "",
        email: authUser.email || "",
        rol: profile?.rol || "user",
        tipo_cliente: profile?.tipo_cliente || "Personal",
      };

      return { userWithProfile, profile: profile || null };
    } catch (err) {
      console.error("Error en getProfileData:", err);
      // Devolver el usuario base sin perfil en vez de fallar
      return {
        userWithProfile: {
          ...authUser,
          nombre:
            authUser.user_metadata?.nombre ||
            authUser.user_metadata?.full_name ||
            authUser.email?.split('@')[0] || // Usar parte del email como fallback
            "",
          telefono: authUser.user_metadata?.telefono || "",
          direccion: authUser.user_metadata?.direccion || "",
          email: authUser.email || "",
          rol: "user",
          tipo_cliente: "Personal",
        },
        profile: null,
      };
    }
  }, []);

  // Extender sesión cuando el usuario está activo
  const extendSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabaseClient.auth.getSession();
      if (session && !error) {
        // Refrescar el token para extender la sesión
        await supabaseClient.auth.refreshSession();
        console.log("Sesión extendida exitosamente");
      }
    } catch (err) {
      console.error("Error extendiendo sesión:", err);
    }
  }, []);

  useEffect(() => {
    // Revisar sesión inicial
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabaseClient.auth.getSession();

        if (session?.user) {
          const { userWithProfile, profile } = await getProfileData(
            session.user,
          );
          setUser(userWithProfile);
          setUserProfile(profile);
          console.log("Sesión restaurada exitosamente para:", userWithProfile.email);
        }
      } catch (err) {
        console.error("Error inicializando auth:", err);
        // Limpiar sesión corrupta si existe
        try {
          await supabaseClient.auth.signOut();
        } catch (signOutErr) {
          console.error("Error limpiando sesión:", signOutErr);
        }
      }
    };

    initializeAuth();

    // Escuchar cambios en el estado de autenticación
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event, session?.user?.email);
      
      if (session?.user) {
        const { userWithProfile, profile } = await getProfileData(session.user);
        setUser(userWithProfile);
        setUserProfile(profile);
      } else {
        setUser(null);
        setUserProfile(null);
      }
    });

    // Configurar listener para extender sesión con actividad del usuario
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    let lastActivity = Date.now();
    
    const handleActivity = () => {
      const now = Date.now();
      // Extender sesión cada 30 minutos de actividad
      if (now - lastActivity > 30 * 60 * 1000) {
        extendSession();
        lastActivity = now;
      }
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, true);
    });

    return () => {
      subscription.unsubscribe();
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity, true);
      });
    };
  }, [getProfileData, extendSession]);

  const openAuthModal = () => {
    setShowAuthModal(true);
    setAuthError("");
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
    setAuthError("");
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setAuthError("");
  };

  const showError = (message) => {
    setAuthError(message);
  };

  const logout = async () => {
    await supabaseClient.auth.signOut();
  };

  // Permite refrescar el perfil manualmente (útil tras editar datos)
  const refreshProfile = async () => {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();
    if (session?.user) {
      const { userWithProfile, profile } = await getProfileData(session.user);
      setUser(userWithProfile);
      setUserProfile(profile);
    }
  };

  const value = {
    showAuthModal,
    activeTab,
    authError,
    user,
    userProfile,
    openAuthModal,
    closeAuthModal,
    switchTab,
    showError,
    logout,
    refreshProfile,
    extendSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
