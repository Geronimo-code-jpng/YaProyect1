import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { supabase as supabaseClient } from "../lib/supabase";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
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
  const isInitializingRef = useRef(false);

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
        
        if (error && error.code === "PGRST116") {
          console.error("Usuario no encontrado en tabla perfiles (PGRST116):", error.message);
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
    
    // Revisar sesión inicial en localStorage
    const initializeAuth = async () => {
      // Prevent multiple concurrent initializations
      if (isInitializingRef.current) {
        return;
      }
      
      isInitializingRef.current = true;
      
      try {
        // Verificar si hay sesión en localStorage
        const storedSession = localStorage.getItem('userSession');
        
        // Si el componente fue desmontado, no continuar
        if (abortController.signal.aborted) return;

        if (storedSession) {
          const userSession = JSON.parse(storedSession);
          
          // Verificar que la sesión sea válida (no expirada)
          const loginTime = new Date(userSession.loginTime);
          const now = new Date();
          const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
          
          if (hoursDiff < 24 && userSession.isLoggedIn) { // Sesión válida por 24 horas
            // Verificar nuevamente si no fue abortado
            if (abortController.signal.aborted) return;
            
            // setUser con datos de autenticación
            setUser({
              id: userSession.id,
              email: userSession.email,
              aud: 'local',
              role: 'authenticated',
              app_metadata: {},
              user_metadata: {},
              created_at: userSession.created_at
            });
            
            // setUserProfile con datos del perfil
            setUserProfile({
              id: userSession.id,
              email: userSession.email,
              nombre: userSession.nombre,
              rol: userSession.rol,
              created_at: userSession.created_at
            });
            
            console.log("Sesión local restaurada para:", userSession.email);
          } else {
            // Sesión expirada, limpiar
            localStorage.removeItem('userSession');
            setUser(null);
            setUserProfile(null);
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
          localStorage.removeItem('userSession');
          setUser(null);
          setUserProfile(null);
        }
      } finally {
        isInitializingRef.current = false;
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
  }, [getProfileData, extendSession]);

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
    showPasswordResetModal,
    activeTab,
    authError,
    user,
    userProfile,
    openAuthModal,
    closeAuthModal,
    openPasswordResetModal,
    closePasswordResetModal,
    switchTab,
    showError,
    logout,
    refreshProfile,
    extendSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
