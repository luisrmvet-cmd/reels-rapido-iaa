import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface VideoItem {
  nome: string; // sem extensão
  arquivo: string; // com extensão
  url: string; // /videos/categoria/arquivo.mp4
  categoria: string;
}

interface CategoriaItem {
  categoria: string; // nome da subpasta
  videos: VideoItem[];
}

const EXTENSOES_VIDEO = /\.(mp4|webm|mov|m4v)$/i;

/**
 * GET /api/videos-fundo
 * Descobre automaticamente vídeos em /public/videos/ e suas subpastas.
 *
 * Resposta:
 * {
 *   total: number,
 *   categorias: [
 *     { categoria: "pet", videos: [{ nome, arquivo, url, categoria }, ...] },
 *     { categoria: "marketing", videos: [...] }
 *   ]
 * }
 *
 * Vídeos diretamente em /public/videos/ (sem subpasta) ficam na
 * categoria especial "_geral".
 *
 * Se a pasta não existir ou estiver vazia, retorna lista vazia (não dá erro).
 */
export async function GET() {
  try {
    const baseDir = path.join(process.cwd(), "public", "videos");
    if (!fs.existsSync(baseDir)) {
      return NextResponse.json({ total: 0, categorias: [] });
    }

    const categorias: CategoriaItem[] = [];

    // 1. Vídeos diretamente em /public/videos/ → categoria "_geral"
    const itensRaiz = fs.readdirSync(baseDir, { withFileTypes: true });
    const videosRaiz: VideoItem[] = itensRaiz
      .filter((e) => e.isFile() && EXTENSOES_VIDEO.test(e.name))
      .map((e) => ({
        nome: e.name.replace(EXTENSOES_VIDEO, ""),
        arquivo: e.name,
        url: `/videos/${e.name}`,
        categoria: "_geral",
      }));

    if (videosRaiz.length > 0) {
      categorias.push({ categoria: "_geral", videos: videosRaiz });
    }

    // 2. Subpastas viram categorias
    const subpastas = itensRaiz
      .filter((e) => e.isDirectory() && !e.name.startsWith("."))
      .map((e) => e.name)
      .sort();

    for (const cat of subpastas) {
      const catDir = path.join(baseDir, cat);
      try {
        const arquivos = fs
          .readdirSync(catDir, { withFileTypes: true })
          .filter((e) => e.isFile() && EXTENSOES_VIDEO.test(e.name))
          .map((e) => ({
            nome: e.name.replace(EXTENSOES_VIDEO, ""),
            arquivo: e.name,
            url: `/videos/${cat}/${e.name}`,
            categoria: cat,
          }));

        if (arquivos.length > 0) {
          categorias.push({ categoria: cat, videos: arquivos });
        }
      } catch {
        // Pasta inacessível, ignora silenciosamente
        continue;
      }
    }

    const total = categorias.reduce((acc, c) => acc + c.videos.length, 0);

    return NextResponse.json({ total, categorias });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[videos-fundo]", msg);
    return NextResponse.json(
      { total: 0, categorias: [], erro: msg },
      { status: 500 }
    );
  }
}
