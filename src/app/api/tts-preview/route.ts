import { NextRequest, NextResponse } from "next/server";
import { gerarVozTTS, ttsConfigurado } from "@/lib/tts";
import type { IdVoz } from "@/types/video";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Frase curta de preview - usada pra dar uma amostra rápida da voz
 * sem queimar muitos caracteres do free tier.
 */
const FRASE_PREVIEW =
  "Olá! Essa é uma prévia da minha voz para o seu vídeo.";

/**
 * POST /api/tts-preview
 * Body: { vozId: IdVoz, textoCustomizado?: string }
 *
 * Retorna o MP3 (audio/mpeg) ou JSON com erro.
 *
 * Reusa exatamente a mesma função gerarVozTTS do pipeline real -
 * o que significa que o cache funciona: se você der preview da voz X
 * e depois usar X no render, o áudio do preview já vai estar em cache.
 */
export async function POST(req: NextRequest) {
  try {
    if (!ttsConfigurado()) {
      return NextResponse.json(
        { erro: "ELEVENLABS_API_KEY não configurada no servidor" },
        { status: 503 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as {
      vozId?: IdVoz;
      textoCustomizado?: string;
    };

    if (!body?.vozId) {
      return NextResponse.json(
        { erro: "Campo 'vozId' obrigatório" },
        { status: 400 }
      );
    }

    // Frase pode ser customizada pelo cliente, mas com limite pra
    // proteger contra uso indevido do endpoint
    const texto = (body.textoCustomizado ?? FRASE_PREVIEW)
      .trim()
      .slice(0, 200);

    if (!texto) {
      return NextResponse.json(
        { erro: "Texto vazio" },
        { status: 400 }
      );
    }

    const resultado = await gerarVozTTS(texto, body.vozId);

    if (!resultado) {
      return NextResponse.json(
        {
          erro:
            "Falha ao gerar preview. Veja logs do servidor (ElevenLabs API).",
        },
        { status: 502 }
      );
    }

    return new NextResponse(new Uint8Array(resultado.buffer), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro desconhecido";
    console.error("[tts-preview]", msg);
    return NextResponse.json({ erro: msg }, { status: 500 });
  }
}
