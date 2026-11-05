/**
 * Leitura mínima de cabeçalhos JPG/PNG (sem dependências):
 * confirma o tipo real do arquivo pelos bytes e obtém largura × altura.
 */

export type TipoImagem = "image/jpeg" | "image/png";
export const TAMANHO_MAX = 10 * 1024 * 1024; // 10 MB

export function tipoPorAssinatura(b: Uint8Array): TipoImagem | null {
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  return null;
}

export function dimensoes(b: Uint8Array): { w: number; h: number } | null {
  const tipo = tipoPorAssinatura(b);
  if (tipo === "image/png") {
    if (b.length < 24) return null;
    const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
    return { w: dv.getUint32(16), h: dv.getUint32(20) };
  }
  if (tipo === "image/jpeg") {
    const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) {
        i++;
        continue;
      }
      const marcador = b[i + 1];
      // SOF0..SOF15, exceto DHT (C4), JPG (C8) e DAC (CC)
      if (marcador >= 0xc0 && marcador <= 0xcf && marcador !== 0xc4 && marcador !== 0xc8 && marcador !== 0xcc) {
        let h = dv.getUint16(i + 5);
        let w = dv.getUint16(i + 7);
        const rot = orientacaoExif(b);
        if (rot >= 5 && rot <= 8) [w, h] = [h, w];
        return { w, h };
      }
      if (marcador === 0xd8 || marcador === 0x01 || (marcador >= 0xd0 && marcador <= 0xd7)) {
        i += 2;
        continue;
      }
      i += 2 + dv.getUint16(i + 2);
    }
  }
  return null;
}

/** Orientação EXIF (1..8). Fotos de celular giradas trocam largura e altura. */
function orientacaoExif(b: Uint8Array): number {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  let i = 2;
  while (i + 4 < b.length && b[i] === 0xff) {
    const marcador = b[i + 1];
    const len = dv.getUint16(i + 2);
    if (marcador === 0xe1 && b[i + 4] === 0x45 && b[i + 5] === 0x78 && b[i + 6] === 0x69 && b[i + 7] === 0x66) {
      const tiff = i + 10;
      const le = b[tiff] === 0x49;
      const u16 = (o: number) => dv.getUint16(o, le);
      const u32 = (o: number) => dv.getUint32(o, le);
      const ifd = tiff + u32(tiff + 4);
      if (ifd + 2 > b.length) return 1;
      const n = u16(ifd);
      for (let k = 0; k < n; k++) {
        const e = ifd + 2 + k * 12;
        if (e + 10 > b.length) break;
        if (u16(e) === 0x0112) return u16(e + 8);
      }
      return 1;
    }
    if (marcador === 0xda) break;
    i += 2 + len;
  }
  return 1;
}

export type ArquivoValidado = { bytes: Buffer; tipo: TipoImagem; w: number; h: number; ext: "jpg" | "png" };

/** Valida tipo (pelos bytes, não só pelo nome) e tamanho. Lança Error com mensagem para o usuário. */
export async function validarArquivo(f: unknown, nome: string): Promise<ArquivoValidado> {
  if (!f || typeof f !== "object" || !("arrayBuffer" in f)) {
    throw new ErroValidacao(`Envie a foto do ${nome}.`);
  }
  const file = f as File;
  if (file.size === 0) throw new ErroValidacao(`A foto do ${nome} está vazia.`);
  if (file.size > TAMANHO_MAX) throw new ErroValidacao(`A foto do ${nome} passa de 10 MB.`);
  const bytes = Buffer.from(await file.arrayBuffer());
  const tipo = tipoPorAssinatura(bytes);
  if (!tipo) throw new ErroValidacao(`A foto do ${nome} precisa ser JPG ou PNG.`);
  const dim = dimensoes(bytes);
  if (!dim || dim.w < 32 || dim.h < 32) throw new ErroValidacao(`Não foi possível ler a foto do ${nome}.`);
  return { bytes, tipo, w: dim.w, h: dim.h, ext: tipo === "image/png" ? "png" : "jpg" };
}

export class ErroValidacao extends Error {
  status = 400;
  /** id da análise salva com status ERRO, quando houver */
  analiseId?: string;
}
