"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { getCurrentUserFromDB } from '../utils/authDB';
import type { UserSession } from '../types';

interface AuthUser {
  id: string;
  email: string;
  aud: string;
  role: string;
  app_metadata: Record<string, unknown>;
  user_metadata: Record<string, unknown>;
}

interface AuthUserProfile {
  id: string;
  email: string;
  nombre?: string;
  rol?: string;
  telefono?: string;
  direccion?: string;
  tipo_cliente?: string;
  cantidad_pedidos?: number;
  cantidad_pedidos_credito?: number;
  estado_cuenta?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  userProfile: AuthUserProfile | null;
  showAuthModal: boolean;
  showPasswordResetModal: boolean;
  activeTab: string;
  authError: string;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  openPasswordResetModal: () => void;
  closePasswordResetModal: () => void;
  switchTab: (tab: string) => void;
  showError: (message: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

function buildUser(currentUser: UserSession): AuthUser {
  return {
    id: currentUser.id,
    email: currentUser.email,
    aud: 'local',
    role: 'authenticated',
    app_metadata: {},
    user_metadata: {}
  };
}

function buildProfile(currentUser: UserSession): AuthUserProfile {
  return {
    id: currentUser.id,
    email: currentUser.email,
    nombre: currentUser.nombre,
    rol: currentUser.rol
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<AuthUserProfile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const currentUser = getCurrentUserFromDB();
    if (currentUser) {
      setUser(buildUser(currentUser));
      setUserProfile(buildProfile(currentUser));
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'userSession') {
        const currentUser = getCurrentUserFromDB();
        if (currentUser) {
          setUser(buildUser(currentUser));
          setUserProfile(buildProfile(currentUser));
        } else {
          setUser(null);
          setUserProfile(null);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const openAuthModal = () => { setShowAuthModal(true); setAuthError(""); };
  const closeAuthModal = () => { setShowAuthModal(false); setAuthError(""); };
  const openPasswordResetModal = () => { setShowPasswordResetModal(true); };
  const closePasswordResetModal = () => { setShowPasswordResetModal(false); };
  const switchTab = (tab: string) => { setActiveTab(tab); setAuthError(""); };
  const showErrorMsg = (message: string) => { setAuthError(message); };

  const logout = async () => {
    try {
      setUser(null);
      setUserProfile(null);
      setAuthError("");
      localStorage.removeItem('userSession');
      window.location.reload();
    } catch (err) {
      localStorage.removeItem('userSession');
      window.location.reload();
    }
  };

  return (
    <AuthContext.Provider value={{
      user, userProfile, showAuthModal, showPasswordResetModal, activeTab, authError,
      openAuthModal, closeAuthModal, openPasswordResetModal, closePasswordResetModal,
      switchTab, showError: showErrorMsg, logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}
