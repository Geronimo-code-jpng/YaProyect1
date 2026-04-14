import { supabase } from '../lib/supabase';

export async function verifyTokenAndResetPassword(token: string, newPassword: string): Promise<{success: boolean, message?: string, error?: string}> {
  try {
    // Verificar si el token existe y no ha expirado
    const { data: tokenData, error: tokenError } = await supabase
      .from('email_recovery')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenError) {
      console.error('Error verificando token:', tokenError);
      return { success: false, error: 'Token inválido o expirado' };
    }

    // Verificar si el token ha expirado
    if (new Date(tokenData.expires_at) < new Date()) {
      return { success: false, error: 'Token ha expirado. Solicita uno nuevo.' };
    }

    // Verificar intentos
    if (tokenData.attempts >= 3) {
      return { success: false, error: 'Máximo de intentos alcanzado. Solicita un nuevo token.' };
    }

    // Buscar usuario por profile_id
    const { data: profileData, error: profileError } = await supabase
      .from('perfiles')
      .select('email')
      .eq('id', tokenData.profile_id)
      .single();
    
    if (profileError || !profileData) {
      console.error('Error obteniendo perfil:', profileError);
      return { success: false, error: 'Perfil no encontrado' };
    }

    // Buscar usuario por email usando auth.users
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error buscando usuario:', userError);
      return { success: false, error: 'Error actualizando contraseña' };
    }

    const user = users.find(u => u.email === profileData.email);
    
    if (!user) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    // Actualizar contraseña
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Error actualizando contraseña:', updateError);
      return { success: false, error: 'Error actualizando contraseña' };
    }

    // Eliminar token usado
    await supabase
      .from('email_recovery')
      .delete()
      .eq('token', token);

    return { success: true, message: 'Contraseña actualizada correctamente' };

  } catch (error) {
    console.error('Error en verifyTokenAndResetPassword:', error);
    return { success: false, error: 'Error del servidor' };
  }
}

export async function verifyTokenOnly(token: string): Promise<{success: boolean, email?: string, error?: string}> {
  try {
    const { data: tokenData, error: tokenError } = await supabase
      .from('email_recovery')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenError) {
      return { success: false, error: 'Token inválido o expirado' };
    }

    // Verificar si el token ha expirado
    if (new Date(tokenData.expires_at) < new Date()) {
      return { success: false, error: 'Token ha expirado. Solicita uno nuevo.' };
    }

    // Verificar intentos
    if (tokenData.attempts >= 3) {
      return { success: false, error: 'Máximo de intentos alcanzado. Solicita un nuevo token.' };
    }

    // Obtener email del perfil
    const { data: profileData, error: profileError } = await supabase
      .from('perfiles')
      .select('email')
      .eq('id', tokenData.profile_id)
      .single();
    
    if (profileError || !profileData) {
      return { success: false, error: 'Perfil no encontrado' };
    }

    return { success: true, email: profileData.email };

  } catch (error) {
    console.error('Error en verifyTokenOnly:', error);
    return { success: false, error: 'Error del servidor' };
  }
}
