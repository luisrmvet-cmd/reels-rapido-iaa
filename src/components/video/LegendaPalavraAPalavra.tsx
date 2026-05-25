import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Template } from "@/lib/templates";
import type { PalavraComTempo } from "@/types/video";

interface Props {
  /** Texto completo da legenda (será dividido em palavras) */
  texto: string;
  /** Frame em que a legenda começa a aparecer (relativo à cena) */
  startFrame: number;
  /** Duração total disponível pra mostrar todas as palavras (em frames) */
  duracaoFrames: number;
  /** Template visual (cores) */
  template: Template;
  /**
   * Timestamps reais por palavra (do ElevenLabs). Se fornecidos,
   * sincronização será PERFEITA com a voz. Senão, cai no fallback proporcional.
   */
  palavrasComTempo?: PalavraComTempo[] | null;
}

interface Tempo {
  inicio: number;
  fim: number;
}

/**
 * Legenda estilo TikTok com palavras aparecendo sincronizadas.
 *
 * Modo 1 (com palavrasComTempo): sincronização PERFEITA com narração TTS,
 *   usando timestamps reais do endpoint /with-timestamps do ElevenLabs.
 *
 * Modo 2 (fallback): sincronização matemática proporcional ao número de
 *   caracteres de cada palavra (palavras maiores ficam mais tempo).
 */
export function LegendaPalavraAPalavra({
  texto,
  startFrame,
  duracaoFrames,
  template,
  palavrasComTempo,
}: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const palavrasTexto = texto.trim().split(/\s+/).filter(Boolean);
  if (palavrasTexto.length === 0) return null;

  // ===== Calcula tempos por palavra =====
  let tempos: Tempo[];

  if (palavrasComTempo && palavrasComTempo.length > 0) {
    // MODO 1: Timestamps reais (perfeitamente sincronizado com a voz)
    tempos = sincronizarComTimestampsReais(
      palavrasTexto,
      palavrasComTempo,
      startFrame,
      fps
    );
  } else {
    // MODO 2: Fallback proporcional
    tempos = sincronizarProporcional(palavrasTexto, startFrame, duracaoFrames);
  }

  // Descobre qual é a palavra "atual" pra destacar
  const indiceAtual = tempos.findIndex(
    (t) => frame >= t.inicio && frame < t.fim
  );

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "12px 16px",
        maxWidth: "100%",
        fontFamily: template.fontFamily,
      }}
    >
      {palavrasTexto.map((palavra, idx) => {
        const t = tempos[idx];
        const jaApareceu = frame >= t.inicio;
        const ehAtual = idx === indiceAtual;

        const entrada = spring({
          frame: frame - t.inicio,
          fps,
          config: { damping: 14, stiffness: 180, mass: 0.5 },
          durationInFrames: 8,
        });

        const escalaEntrada = interpolate(entrada, [0, 1], [0.7, 1]);
        const opacidadeFinal = ehAtual ? 1 : jaApareceu ? 0.55 : 0;
        const escalaFinal = ehAtual ? escalaEntrada * 1.08 : escalaEntrada;

        const [r, g, b] = template.glowCorRgb;
        const corPalavra = ehAtual ? `rgb(${r}, ${g}, ${b})` : "#ffffff";

        const glowAtual =
          ehAtual && template.textoGlow
            ? `0 0 24px rgba(${r}, ${g}, ${b}, 0.7), 0 0 48px rgba(${r}, ${g}, ${b}, 0.4)`
            : "";

        return (
          <span
            key={idx}
            style={{
              opacity: opacidadeFinal,
              transform: `scale(${escalaFinal})`,
              color: corPalavra,
              fontSize: 78,
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              textTransform: template.transformTexto,
              textShadow: [
                "0 4px 20px rgba(0,0,0,0.95)",
                "0 2px 8px rgba(0,0,0,0.9)",
                "0 0 1px rgba(0,0,0,0.6)",
                glowAtual,
              ]
                .filter(Boolean)
                .join(", "),
              willChange: "transform, opacity",
              display: "inline-block",
            }}
          >
            {palavra}
          </span>
        );
      })}
    </div>
  );
}

/**
 * Modo 1: mapeia timestamps reais (em segundos) pra frames.
 *
 * As palavras do texto exibido podem não ser exatamente iguais às palavras
 * do timestamp (ex: pontuação, contrações). Usa estratégia simples: empareia
 * por ordem; se sobrar palavras no texto, distribui o tempo restante.
 */
function sincronizarComTimestampsReais(
  palavrasTexto: string[],
  palavrasComTempo: PalavraComTempo[],
  startFrame: number,
  fps: number
): Tempo[] {
  const tempos: Tempo[] = [];
  const totalPalavrasTimestamp = palavrasComTempo.length;

  for (let i = 0; i < palavrasTexto.length; i++) {
    // Usa o índice correspondente; se não houver, usa o último
    const idxTs = Math.min(i, totalPalavrasTimestamp - 1);
    const pt = palavrasComTempo[idxTs];
    const inicio = startFrame + pt.inicioSegundos * fps;
    const fim = startFrame + pt.fimSegundos * fps;
    tempos.push({ inicio, fim });
  }

  return tempos;
}

/**
 * Modo 2: divisão proporcional ao tamanho de cada palavra.
 */
function sincronizarProporcional(
  palavras: string[],
  startFrame: number,
  duracaoFrames: number
): Tempo[] {
  const pesos = palavras.map((p) => p.length + 3);
  const pesoTotal = pesos.reduce((a, b) => a + b, 0);

  let acumulado = 0;
  return pesos.map((peso) => {
    const inicio = startFrame + (acumulado / pesoTotal) * duracaoFrames;
    acumulado += peso;
    const fim = startFrame + (acumulado / pesoTotal) * duracaoFrames;
    return { inicio, fim };
  });
}
