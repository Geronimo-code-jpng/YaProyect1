import { createContext, useContext, useState, useEffect } from 'react';
import { supabaseClient } from '../db/supabeClient';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [authError, setAuthError] = useState('');
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          // Fetch user profile
          const { data: profile } = await supabaseClient
            .from('perfiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Error checking session:', error);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          // Fetch user profile
          const { data: profile } = await supabaseClient
            .from('perfiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setUserProfile(profile);
        } else {
          setUser(null);
          setUserProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const openAuthModal = () => {
    setShowAuthModal(true);
    setAuthError('');
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
    setAuthError('');
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setAuthError('');
  };

  const showError = (message) => {
    setAuthError(message);
  };

  const logout = async () => {
    await supabaseClient.auth.signOut();
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
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
