import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { decode } from 'jpeg-js';

import { calcularVarianzaLaplaciana } from './nitidez-metric';

const ANCHO_MAXIMO = 320;
const VARIANZA_MINIMA = 500;

export async function validarNitidezFoto(uri: string): Promise<void> {
  const imagen = await ImageManipulator.manipulate(uri)
    .resize({ width: ANCHO_MAXIMO })
    .renderAsync();
  const miniatura = await imagen.saveAsync({
    format: SaveFormat.JPEG,
    compress: 1,
  });
  const archivo = new File(miniatura.uri);

  try {
    const bytes = new Uint8Array(await archivo.arrayBuffer());
    const decodificada = decode(bytes, {
      useTArray: true,
      formatAsRGBA: true,
    });
    const varianza = calcularVarianzaLaplaciana(
      decodificada.data,
      decodificada.width,
      decodificada.height,
    );
    if (varianza < VARIANZA_MINIMA) {
      throw new Error(
        'La foto parece borrosa. Limpia la lente, mejora la luz y vuelve a tomarla.',
      );
    }
  } finally {
    if (archivo.exists) archivo.delete();
  }
}
