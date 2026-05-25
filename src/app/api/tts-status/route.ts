import { NextResponse } from "next/server";
import { ttsConfigurado } from "@/lib/tts";

export const runtime = "nodejs";

/**
 * GET /api/tts-status
 * Retorna se o TTS (ElevenLabs) está configurado no servidor.
 * Usado pelo cliente para mostrar/esconder o toggle de voz.
 */
export async function GET() {
  return NextResponse.json({ disponivel: ttsConfigurado() });
}
