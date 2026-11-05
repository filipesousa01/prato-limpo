/** Validação no navegador, antes do envio: tipo, tamanho e foto muito escura. */

export const TAMANHO_MAX = 10 * 1024 * 1024;
const LUMINANCIA_MIN = 38; // 0..255

export async function validarFoto(file: File): Promise<string | null> {
  if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
    return "Arquivo inválido: envie uma foto JPG ou PNG.";
  }
  if (file.size > TAMANHO_MAX) return "A foto passa de 10 MB. Reduza a resolução e tente de novo.";
  try {
    const lum = await luminanciaMedia(file);
    if (lum < LUMINANCIA_MIN) return "Foto muito escura. Fotografe com mais luz para o modelo reconhecer os alimentos.";
  } catch {
    return "Não foi possível abrir esta imagem. Ela pode estar corrompida.";
  }
  return null;
}

async function luminanciaMedia(file: File): Promise<number> {
  const bmp = await createImageBitmap(file);
  const lado = 48;
  const canvas = document.createElement("canvas");
  canvas.width = lado;
  canvas.height = lado;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return 255;
  ctx.drawImage(bmp, 0, 0, lado, lado);
  bmp.close?.();
  const { data } = ctx.getImageData(0, 0, lado, lado);
  let soma = 0;
  for (let i = 0; i < data.length; i += 4) soma += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
  return soma / (data.length / 4);
}
