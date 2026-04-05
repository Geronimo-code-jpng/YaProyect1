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
        }
      } catch (err) {
        console.error("Error inicializando auth:", err);
      }
    };

    initializeAuth();

    // Escuchar cambios en el estado de autenticación
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { userWithProfile, profile } = await getProfileData(session.user);
        setUser(userWithProfile);
        setUserProfile(profile);
      } else {
        setUser(null);
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [getProfileData]);

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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
