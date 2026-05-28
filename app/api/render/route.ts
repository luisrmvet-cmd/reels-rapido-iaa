// app/api/render/route.ts
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";

// FFmpeg precisa do runtime Node (não Edge) e de execução dinâmica.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // segundos (ajuste conforme seu host)

// Aponta o fluent-ffmpeg para o binário do ffmpeg-static.
// Sem isto, ele procura "ffmpeg" no PATH do sistema e falha com ENOENT.
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic as unknown as string);
}

/**
 * Gera um slideshow vertical 1080x1920 a partir de imagens nomeadas
 * 1.png, 2.png, ... dentro de `dir`. Cada imagem aparece 3 segundos.
 */
function renderVideo(dir: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(path.join(dir, "%d.png"))
      // -framerate 1/3 => cada imagem dura 3s. -start_number 1 => começa em 1.png
      .inputOptions(["-framerate", "1/3", "-start_number", "1"])
      .videoFilters([
        // encaixa a imagem dentro de 1080x1920 sem distorcer...
        "scale=1080:1920:force_original_aspect_ratio=decrease",
        // ...e preenche o resto com preto (letterbox/pillarbox)
        "pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black",
        "setsar=1",
        "format=yuv420p",
      ])
      .outputOptions([
        "-r", "30",              // 30 fps de saída
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-pix_fmt", "yuv420p",   // compatível com todos os players/navegadores
        "-movflags", "+faststart",
      ])
      .on("start", (cmd) => console.log("[render] ffmpeg:", cmd))
      .on("error", (err) => reject(err))
      .on("end", () => resolve())
      .save(outputPath);
  });
}

export async function POST(req: NextRequest) {
  const jobId = randomUUID();
  try {
    const form = await req.formData();

    // Coleta TODAS as imagens, independente do nome do campo (image1, images, etc.)
    const files: File[] = [];
    for (const value of form.values()) {
      if (value instanceof File && value.size > 0) files.push(value);
    }

    if (files.length === 0) {
      return NextResponse.json(
        { ok: false, jobId, error: "Nenhuma imagem recebida." },
        { status: 400 }
      );
    }

    // Salva em public/renders/{jobId}/1.png, 2.png, ...
    const dir = path.join(process.cwd(), "public", "renders", jobId);
    await mkdir(dir, { recursive: true });

    for (let i = 0; i < files.length; i++) {
      const buffer = Buffer.from(await files[i].arrayBuffer());
      // Salvamos sempre como .png; o ffmpeg detecta o formato real pelo conteúdo,
      // então JPG/WEBP salvos com este nome também decodificam normalmente.
      await writeFile(path.join(dir, `${i + 1}.png`), buffer);
    }

    const outputPath = path.join(dir, "video.mp4");
    await renderVideo(dir, outputPath);

    return NextResponse.json({
      ok: true,
      jobId,
      count: files.length,
      url: `/renders/${jobId}/video.mp4`,
    });
  } catch (err) {
    // Sempre devolve JSON válido — nunca uma página HTML de erro.
    console.error("[render] ERRO:", err);
    return NextResponse.json(
      {
        ok: false,
        jobId,
        error: err instanceof Error ? err.message : "Falha ao gerar o vídeo.",
      },
      { status: 500 }
    );
  }
}
