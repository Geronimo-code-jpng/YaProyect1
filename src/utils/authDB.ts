import { supabase } from '../lib/supabase';
import { verifyPassword } from './passwordUtils';
import { UserSession } from '../types';

export const loginWithDB = async (email: string, password: string): Promise<{success: boolean, user?: UserSession, error?: string}> => {
  try {
    // 1. Buscar usuario en la base de datos
    const { data: user, error } = await supabase
      .from('perfiles')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    // Type assertion para TypeScript
    const userTyped = user as any;

    // 2. Verificar si tiene contraseña
    if (!userTyped.password) {
      return { success: false, error: 'Usuario sin contraseña configurada' };
    }

    // 3. Verificar contraseña
    const isPasswordValid = await verifyPassword(password, userTyped.password as string);
    
    if (!isPasswordValid) {
      return { success: false, error: 'Contraseña incorrecta' };
    }

    // 4. Crear sesión local
    const session: UserSession = {
      id: userTyped.id as string,
      email: userTyped.email as string,
      nombre: userTyped.nombre as string,
      rol: userTyped.rol as string,
      isLoggedIn: true,
      loginTime: new Date().toISOString()
    };

    // 5. Guardar en localStorage
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
