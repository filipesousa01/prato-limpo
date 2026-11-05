import { lerUploadLocal } from "@/lib/armazenamento";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ nome: string }> }) {
  const { nome } = await params;
  const f = await lerUploadLocal(nome);
  if (!f) return new Response("Não encontrada", { status: 404 });
  return new Response(new Uint8Array(f.bytes), {
    headers: {
      "Content-Type": f.tipo,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
