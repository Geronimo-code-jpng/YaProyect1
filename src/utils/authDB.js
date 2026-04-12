import { supabase } from '../lib/supabase';
import { verifyPassword } from './passwordUtils';

export const loginWithDB = async (email, password) => {
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

    // 2. Verificar si tiene contraseña
    if (!user.password) {
      return { success: false, error: 'Usuario sin contraseña configurada' };
    }

    // 3. Verificar contraseña
    const isPasswordValid = await verifyPassword(password, user.password);
    
    if (!isPasswordValid) {
      return { success: false, error: 'Contraseña incorrecta' };
    }

    // 4. Crear sesión local
    const session = {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
      isLoggedIn: true,
      loginTime: new Date().toISOString(),
      created_at: user.created_at
    };

    // 5. Guardar en localStorage
    localStorage.setItem('userSession', JSON.stringify(session));

    return { success: true, user: session };

  } catch (error) {
    console.error('Error en loginWithDB:', error);
    return { success: false, error: 'Error en el servidor' };
  }
};

export const logoutFromDB = () => {
  localStorage.removeItem('userSession');
  window.location.reload();
};

export const getCurrentUserFromDB = () => {
  try {
    const session = localStorage.getItem('userSession');
    if (!session) return null;

    const userSession = JSON.parse(session);
    
    // Verificar que la sesión no haya expirado (24 horas)
    const loginTime = new Date(userSession.loginTime);
    const now = new Date();
    const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
    
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
