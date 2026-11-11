import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
 
import { env } from './env';
 
// Service: envuelve una fuente de datos externa y nada más.
export const supabase = createClient(env.supabaseUrl, env.supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});

if (Platform.OS !== 'web') {
  if (AppState.currentState === 'active') {
    void supabase.auth.startAutoRefresh();
  }
  AppState.addEventListener('change', (estado) => {
    if (estado === 'active') {
      void supabase.auth.startAutoRefresh();
    } else {
      void supabase.auth.stopAutoRefresh();
    }
  });
}
 
export function urlPublica(ruta: string): string {
  return supabase.storage.from(env.bucket).getPublicUrl(ruta).data.publicUrl;
}
 
export async function subirImagen(ruta: string, bytes: ArrayBuffer): Promise<void> {
  const { error } = await supabase.storage
    .from(env.bucket)
    .upload(ruta, bytes, { contentType: 'image/jpeg', upsert: false });
  if (error) throw new Error(`No se pudo subir la foto: ${error.message}`);
}
