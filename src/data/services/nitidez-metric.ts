export function calcularVarianzaLaplaciana(
  rgba: Uint8Array,
  ancho: number,
  alto: number,
): number {
  if (ancho < 3 || alto < 3 || rgba.length !== ancho * alto * 4) {
    throw new Error('La imagen no tiene dimensiones válidas para analizar nitidez');
  }

  const gris = new Float32Array(ancho * alto);
  for (let pixel = 0, indice = 0; pixel < gris.length; pixel++, indice += 4) {
    gris[pixel] = 0.299 * rgba[indice] + 0.587 * rgba[indice + 1] + 0.114 * rgba[indice + 2];
  }

  let suma = 0;
  let sumaCuadrados = 0;
  let cantidad = 0;
  for (let y = 1; y < alto - 1; y++) {
    for (let x = 1; x < ancho - 1; x++) {
      const pixel = y * ancho + x;
      const laplaciano =
        4 * gris[pixel] -
        gris[pixel - 1] -
        gris[pixel + 1] -
        gris[pixel - ancho] -
        gris[pixel + ancho];
      suma += laplaciano;
      sumaCuadrados += laplaciano * laplaciano;
      cantidad++;
    }
  }

  const promedio = suma / cantidad;
  return Math.max(0, sumaCuadrados / cantidad - promedio * promedio);
}
