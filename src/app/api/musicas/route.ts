import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

/**
 * GET /api/musicas
 * Lista os arquivos MP3 disponíveis em /public/audio
 * pra serem usados como música de fundo.
 */
export async function GET() {
  try {
    const dir = path.join(process.cwd(), "public", "audio");

    if (!fs.existsSync(dir)) {
      return NextResponse.json({ musicas: [] });
    }

    const arquivos = fs
      .readdirSync(dir)
      .filter((nome) => /\.(mp3|m4a|wav|ogg)$/i.test(nome))
      .map((nome) => ({
        nome: nome.replace(/\.[^.]+$/, ""), // sem extensão
        arquivo: nome,
        url: `/audio/${nome}`,
      }));

    return NextResponse.json({ musicas: arquivos });
  } catch (e) {
    return NextResponse.json({ musicas: [], erro: String(e) });
  }
}
