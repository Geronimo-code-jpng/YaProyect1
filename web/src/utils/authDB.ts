import { apiLogin } from '../lib/catalogApi';
import { UserSession } from '../types';

export const loginWithDB = async (email: string, password: string): Promise<{success: boolean, user?: UserSession, error?: string}> => {
  try {
    const result = await apiLogin(email, password);

    if (!result.success || !result.user) {
      return { success: false, error: result.error || 'Error de autenticación' };
    }

    const session: UserSession = {
      id: result.user.id,
      email: result.user.email,
      nombre: result.user.nombre,
      rol: result.user.rol,
      isLoggedIn: true,
      loginTime: new Date().toISOString()
    };

    localStorage.setItem('userSession', JSON.stringify(session));

    return { success: true, user: session };

  } catch (error) {
    console.error('Error en loginWithDB:', error);
    return { success: false, error: 'Error en el servidor' };
  }
};

export const logoutFromDB = (): void => {
  localStorage.removeItem('userSession');
  window.location.reload();
};

export const getCurrentUserFromDB = (): UserSession | null => {
  try {
    const session = localStorage.getItem('userSession');
    if (!session) return null;

    const userSession = JSON.parse(session) as UserSession;
    
    // Verificar que la sesión no haya expirado (24 horas)
    const loginTime = new Date(userSession.loginTime);
    const now = new Date();
    const hoursDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff > 24 || !userSession.isLoggedIn) {
      localStorage.removeItem('userSession');
      return null;
    }

    return userSession;
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    localStorage.removeItem('userSession');
    return null;
  }
};
