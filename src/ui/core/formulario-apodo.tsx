import { StyleSheet, View } from 'react-native';
 
import { useApodo } from './apodo-view-model';
import { Boton } from './boton';
import { colores, espacio } from './tema';
import { Texto } from './texto';
 
export function FormularioApodo() {
  const { iniciarSesionGoogle, autenticando, errorAutenticacion } = useApodo();
 
  return (
    <View style={estilos.caja}>
      <Texto variante="subtitulo">Inicia sesión con Google</Texto>
      <Texto variante="nota">
        Tus capturas quedarán asociadas a tu cuenta y solo tú podrás registrarlas.
      </Texto>
      {errorAutenticacion && (
        <Texto style={{ color: colores.alerta }}>{errorAutenticacion}</Texto>
      )}
      <Boton
        titulo="Continuar con Google"
        onPress={() => void iniciarSesionGoogle()}
        cargando={autenticando}
      />
    </View>
  );
}
 
const estilos = StyleSheet.create({
  caja: { gap: espacio.m, padding: espacio.l },
});
