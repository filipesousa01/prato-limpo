import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Interface de armazenamento das fotos. Hoje grava em /public/uploads;
 * para produção, implemente com S3 ou Supabase Storage e troque em `armazenamento`.
 */
export interface Armazenamento {
  /** Salva e devolve a URL pública. */
  salvar(bytes: Buffer, ext: "jpg" | "png"): Promise<string>;
}

export const PASTA_UPLOADS = path.join(process.cwd(), "public", "uploads");
const NOME_VALIDO = /^[a-f0-9-]{36}\.(jpg|png)$/;

class ArmazenamentoLocal implements Armazenamento {
  async salvar(bytes: Buffer, ext: "jpg" | "png") {
    await mkdir(PASTA_UPLOADS, { recursive: true });
    const nome = `${randomUUID()}.${ext}`;
    await writeFile(path.join(PASTA_UPLOADS, nome), bytes);
    // servido por /api/fotos/[nome], que também funciona em `next start`
    // (arquivos criados em /public depois do build não são servidos pelo Next).
    return `/api/fotos/${nome}`;
  }
}

export async function lerUploadLocal(nome: string): Promise<{ bytes: Buffer; tipo: string } | null> {
  if (!NOME_VALIDO.test(nome)) return null;
  try {
    const bytes = await readFile(path.join(PASTA_UPLOADS, nome));
    return { bytes, tipo: nome.endsWith(".png") ? "image/png" : "image/jpeg" };
  } catch {
    return null;
  }
}

export const armazenamento: Armazenamento = new ArmazenamentoLocal();
