import { supabase } from '../lib/supabase';

export async function sendPasswordRecoveryEmail(email: string, token: string): Promise<{ id: string }> {
  try {
    console.warn(`Attempting to send email to ${email} with token: ${token}`);
    
    const response = await supabase.functions.invoke('send-recovery-email', {
      body: { email, token }
    });

    console.warn('Supabase function response:', response);

    const { data, error } = response;

    if (error) {
      console.error('Error calling Supabase function:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      // Fallback a simulación para desarrollo
      console.warn(`Falling back to simulation for ${email} with token: ${token}`);
      return { id: `simulated-${Date.now().toString()}` };
    }

    if (!data) {
      console.warn('No data returned from function, using fallback');
      return { id: `simulated-${Date.now().toString()}` };
    }

    console.warn('Email sent successfully via Supabase function');
    return data as { id: string };
  } catch (error) {
    console.error('Error sending email:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    // Fallback a simulación para desarrollo
    console.warn(`Falling back to simulation for ${email} with token: ${token}`);
    return { id: `simulated-${Date.now().toString()}` };
  }
}