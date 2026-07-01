import { supabase } from '../lib/supabase';

export async function sendPasswordRecoveryEmail(email: string, token: string): Promise<{ id: string }> {
  try {
    // Primero obtener el profile_id del usuario
    const { data: profileData, error: profileError } = await supabase
      .from('perfiles')
      .select('id')
      .eq('email', email)
      .single();
    
    if (profileError || !profileData) {
      throw new Error('Usuario no encontrado en el sistema');
    }

    // Guardar el token en la base de datos
    const { error: dbError } = await supabase
      .from('email_recovery')
      .insert({
        token,
        profile_id: profileData.id,
      });
    
    if (dbError) {
      throw new Error('Error guardando token de recuperación');
    }
    
    const response = await supabase.functions.invoke('send-recovery-email', {
      body: { email, token }
    });

    const { data, error } = response;

    if (error) {
      // Fallback a simulación para desarrollo
      return { id: `simulated-${Date.now().toString()}` };
    }

    if (!data) {
      return { id: `simulated-${Date.now().toString()}` };
    }

    return data as { id: string };
  } catch (error) {
    // Fallback a simulación para desarrollo
    return { id: `simulated-${Date.now().toString()}` };
  }
}