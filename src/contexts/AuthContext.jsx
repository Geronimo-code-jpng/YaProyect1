import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { supabase as supabaseClient } from "../lib/supabase";

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

  // Función de reintentos con exponential backoff
  const retryWithBackoff = useCallback(async (fn, maxRetries = 3, delay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        // Si es el último intento o no es un error recuperable, lanzar el error
        if (i === maxRetries - 1 || !isRetriableError(error)) {
          throw error;
        }
        
        // Esperar con exponential backoff
        const waitTime = delay * Math.pow(2, i);
        console.warn(`Reintentando operación (${i + 1}/${maxRetries}) en ${waitTime}ms... Error:`, error.message);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }, []);

  // Track if auth is initializing to prevent multiple concurrent operations
  const [isInitializing, setIsInitializing] = useState(false);

  // Determinar si un error es recuperable
  const isRetriableError = useCallback((error) => {
    if (!error) return false;
    
    const errorMessage = error.message || error.toString();
    const retriableErrors = [
      'AbortError',
      'NetworkError',
      'timeout',
      'connection',
      'lock request',
      'fetch error',
      'ECONNRESET',
      'ETIMEDOUT',
      'Lock',
      'stole it',
      'NavigatorLockAcquireTimeoutError'
    ];
    
    return retriableErrors.some(err => 
      errorMessage.toLowerCase().includes(err.toLowerCase())
    );
  }, []);

  // Obtener y combinar datos del perfil con los del auth
  const getProfileData = useCallback(async (authUser) => {
    if (!authUser) return { userWithProfile: null, profile: null };

    try {
      const fetchProfile = async () => {
        const { data: profile, error } = await supabaseClient
          .from("perfiles")
          .select("*")
          .eq("id", authUser.id)
          .single();

        // PGRST116 = no rows found, no es un error crítico
        if (error && error.code !== "PGRST116") {
          console.error("Error buscando perfil:", error.message);
          throw error;
        }
        
        return profile;
      };

      // Usar reintentos para la búsqueda de perfil con timeout para evitar locks
      const profile = await Promise.race([
        retryWithBackoff(fetchProfile, 3, 1000),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout buscando perfil')), 10000)
        )
      ]);

      const userWithProfile = {
        ...authUser,
        nombre:
          profile?.nombre ||
          authUser.user_metadata?.nombre ||
          authUser.user_metadata?.full_name ||
          authUser.email?.split('@')[0] || "",
        telefono: profile?.telefono || authUser.user_metadata?.telefono || "",
        direccion:
          profile?.direccion || authUser.user_metadata?.direccion || "",
        email: authUser.email || "",
        rol: profile?.rol || "user",
        tipo_cliente: profile?.tipo_cliente || "Personal",
        cantidad_pedidos: profile?.cantidad_pedidos || 0,
      };

      return { userWithProfile, profile: profile || null };
    } catch (err) {
      console.error("Error en getProfileData:", err);
      
      // Si es un AbortError o lock error, devolver usuario base sin perfil
      if (err.message.includes('AbortError') || err.message.includes('lock') || err.message.includes('Timeout')) {
        console.warn("Lock error detectado, usando fallback de usuario base");
        return {
          userWithProfile: {
            ...authUser,
            nombre:
              authUser.user_metadata?.nombre ||
              authUser.user_metadata?.full_name ||
              authUser.email?.split('@')[0] || "",
            telefono: authUser.user_metadata?.telefono || "",
            direccion: authUser.user_metadata?.direccion || "",
            email: authUser.email || "",
            rol: "user",
            tipo_cliente: "Personal",
            cantidad_pedidos: 0,
          },
          profile: null,
        };
      }
      
      // Para otros errores, también devolver usuario base
      return {
        userWithProfile: {
          ...authUser,
          nombre:
            authUser.user_metadata?.nombre ||
            authUser.user_metadata?.full_name ||
            authUser.email?.split('@')[0] || "",
          telefono: authUser.user_metadata?.telefono || "",
          direccion: authUser.user_metadata?.direccion || "",
          email: authUser.email || "",
          rol: "user",
          tipo_cliente: "Personal",
          cantidad_pedidos: 0,
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
    // Crear AbortController para cancelar operaciones si el componente se desmonta
    const abortController = new AbortController();
    
    // Revisar sesión inicial
    const initializeAuth = async () => {
      // Prevent multiple concurrent initializations
      if (isInitializing) {
        console.log("Auth initialization already in progress, skipping...");
        return;
      }
      
      setIsInitializing(true);
      
      try {
        const {
          data: { session },
        } = await supabaseClient.auth.getSession();

        // Si el componente fue desmontado, no continuar
        if (abortController.signal.aborted) return;

        if (session?.user) {
          try {
            const { userWithProfile, profile } = await getProfileData(session.user);
            
            // Verificar nuevamente si no fue abortado
            if (abortController.signal.aborted) return;
            
            setUser(userWithProfile);
            setUserProfile(profile);
            console.log("Sesión restaurada exitosamente para:", session.user.email);
          } catch (profileError) {
            console.error("Error cargando perfil, usando usuario base:", profileError);
            
            if (!abortController.signal.aborted) {
              setUser(session.user);
              setUserProfile(null);
            }
          }
        } else {
          // No hay sesión, limpiar estado
          if (!abortController.signal.aborted) {
            setUser(null);
            setUserProfile(null);
          }
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error("Error inicializando auth:", error);
          // Limpiar sesión corrupta si existe
          try {
            await supabaseClient.auth.signOut();
          } catch (signOutErr) {
            console.error("Error limpiando sesión:", signOutErr);
          }
          // Forzar limpieza de estado
          setUser(null);
          setUserProfile(null);
          setAuthError("");
        }
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();

    // Escuchar cambios en el estado de autenticación
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event, session?.user?.email);
      
      // Limpiar estado inmediatamente para evitar estados inconsistentes
      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null);
        setUserProfile(null);
        setAuthError("");
        return;
      }
      
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const { userWithProfile, profile } = await getProfileData(session.user);
          setUser(userWithProfile);
          setUserProfile(profile);
          setAuthError("");
        } catch (err) {
          console.error("Error cargando perfil en sign-in:", err);
          // No dejar el estado en loading, limpiarlo
          setUser(null);
          setUserProfile(null);
          setAuthError("Error cargando perfil del usuario");
        }
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
      // Cancelar operaciones pendientes para evitar orphaned locks
      abortController.abort();
      
      // Limpiar subscription de Supabase
      if (subscription) {
        subscription.unsubscribe();
      }
      
      // Remover event listeners
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity, true);
      });
    };
  }, [getProfileData, extendSession, isInitializing]);

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
    try {
      // Limpiar estado local primero
      setUser(null);
      setUserProfile(null);
      setAuthError("");
      
      // Luego hacer logout en Supabase
      await supabaseClient.auth.signOut();
      
      console.log("Sesión cerrada exitosamente");
    } catch (err) {
      console.error("Error cerrando sesión:", err);
      // Forzar limpieza de estado aunque falle el logout
      setUser(null);
      setUserProfile(null);
      setAuthError("");
    }
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
