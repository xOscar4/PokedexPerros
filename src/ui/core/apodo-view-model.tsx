import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
 
import { entrenadorRepository } from '@/data/repositories/entrenador-repository';
import type { Entrenador } from '@/domain/models/entrenador';
 
// Es un ViewModel compartido: el apodo lo necesitan la Pokédex, la captura
// y el perfil. Por eso vive en un contexto de React y no en una sola pantalla.
// No guarda nada por su cuenta: lee y escribe a través del repositorio.
type EstadoApodo = {
  entrenadorId: string | null;
  apodo: string | null;
  correo: string | null;
  listo: boolean;
  autenticando: boolean;
  errorAutenticacion: string | null;
  iniciarSesionGoogle: () => Promise<void>;
  cerrarSesion: () => Promise<void>;
};
 
const ApodoContext = createContext<EstadoApodo | null>(null);
 
export function ApodoProvider({ children }: { children: ReactNode }) {
  const [entrenador, setEntrenador] = useState<Entrenador | null>(null);
  const [listo, setListo] = useState(false);
  const [autenticando, setAutenticando] = useState(false);
  const [errorAutenticacion, setErrorAutenticacion] = useState<string | null>(null);
 
  useEffect(() => {
    let vigente = true;
    entrenadorRepository
      .leerEntrenador()
      .then((sesion) => vigente && setEntrenador(sesion))
      .catch((e: unknown) => {
        if (vigente) {
          setErrorAutenticacion(
            e instanceof Error ? e.message : 'No se pudo recuperar la sesión',
          );
          setEntrenador(null);
        }
      })
      .finally(() => vigente && setListo(true));
    return () => {
      vigente = false;
    };
  }, []);
 
  async function iniciarSesionGoogle() {
    setErrorAutenticacion(null);
    setAutenticando(true);
    try {
      const sesion = await entrenadorRepository.iniciarSesionGoogle();
      if (sesion) setEntrenador(sesion);
    } catch (e) {
      setErrorAutenticacion(
        e instanceof Error ? e.message : 'No se pudo iniciar sesión con Google',
      );
    } finally {
      setAutenticando(false);
    }
  }
 
  async function cerrarSesion() {
    setErrorAutenticacion(null);
    setAutenticando(true);
    try {
      await entrenadorRepository.cerrarSesion();
      setEntrenador(null);
    } catch (e) {
      setErrorAutenticacion(
        e instanceof Error ? e.message : 'No se pudo cerrar la sesión',
      );
    } finally {
      setAutenticando(false);
    }
  }
 
  return (
    <ApodoContext.Provider
      value={{
        entrenadorId: entrenador?.id ?? null,
        apodo: entrenador?.apodo ?? null,
        correo: entrenador?.email ?? null,
        listo,
        autenticando,
        errorAutenticacion,
        iniciarSesionGoogle,
        cerrarSesion,
      }}>
      {children}
    </ApodoContext.Provider>
  );
}
 
export function useApodo(): EstadoApodo {
  const valor = useContext(ApodoContext);
  if (!valor) throw new Error('useApodo debe usarse dentro de <ApodoProvider>');
  return valor;
}
