import { makeRedirectUri } from 'expo-auth-session';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import type { User } from '@supabase/supabase-js';

import type { Entrenador } from '@/domain/models/entrenador';

import { supabase } from '../services/supabase-service';

function aEntrenador(usuario: User): Entrenador {
  const correo = usuario.email;
  if (!correo) throw new Error('La cuenta de Google no devolvió un correo');

  const candidatos: unknown[] = [
    usuario.user_metadata['full_name'],
    usuario.user_metadata['name'],
    correo.split('@')[0],
  ];
  const nombre =
    candidatos.find(
      (candidato): candidato is string =>
        typeof candidato === 'string' && candidato.trim().length > 0,
    ) ?? 'Entrenador';
  const apodo = Array.from(nombre.trim().replace(/\s+/g, ' '))
    .slice(0, 20)
    .join('');

  return {
    id: usuario.id,
    email: correo,
    apodo: Array.from(apodo).length >= 3 ? apodo : 'Entrenador',
  };
}

export const entrenadorRepository = {
  async leerEntrenador(): Promise<Entrenador | null> {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw new Error(`No se pudo recuperar la sesión: ${error.message}`);
    return data.session ? aEntrenador(data.session.user) : null;
  },

  async iniciarSesionGoogle(): Promise<Entrenador | null> {
    const redirectTo = makeRedirectUri();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) throw new Error(`No se pudo iniciar el login con Google: ${error.message}`);
    if (!data.url) throw new Error('Supabase no devolvió la URL de Google');

    const resultado = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (resultado.type === 'cancel' || resultado.type === 'dismiss') return null;
    if (resultado.type !== 'success') {
      throw new Error('No se pudo completar el inicio de sesión con Google');
    }

    const parametros = Linking.parse(resultado.url).queryParams;
    const codigo = parametros?.code;
    if (typeof codigo !== 'string') {
      const errorOAuth = parametros?.error_description ?? parametros?.error;
      const detalle = typeof errorOAuth === 'string' ? `: ${errorOAuth}` : '';
      throw new Error(`Google no devolvió el código de autorización${detalle}`);
    }

    const { data: sesion, error: errorIntercambio } =
      await supabase.auth.exchangeCodeForSession(codigo);
    if (errorIntercambio) {
      throw new Error(`No se pudo validar la sesión de Google: ${errorIntercambio.message}`);
    }
    if (!sesion.user) throw new Error('Supabase no devolvió el usuario autenticado');

    return aEntrenador(sesion.user);
  },

  async cerrarSesion(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(`No se pudo cerrar la sesión: ${error.message}`);
  },
};
