import { supabase } from '../lib/supabase';

export const checkPasswordColumn = async () => {
  try {
    // Intentar seleccionar la columna password
    const { data, error } = await supabase
      .from('perfiles')
      .select('password')
      .limit(1);
    
    console.log('Verificación columna password:', { data, error });
    return { data, error };
  } catch (err) {
    console.error('Error verificando columna password:', err);
    return { data: null, error: err };
  }
};

export const testPasswordUpdate = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase
      .from('perfiles')
      .update({ password })
      .eq('email', email)
      .select();
    
    console.log('Test update password:', { data, error });
    return { data, error };
  } catch (err) {
    console.error('Error test update:', err);
    return { data: null, error: err };
  }
};
