import { interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import React from "react";

export type VarianteTexto = "padrao" | "legenda_tiktok";

interface Props {
  /** Texto exibido. Emojis recebem animação de bounce sutil. */
  texto: string;
  /** Frame em que a animação de entrada começa. Default: 0 */
  delayFrames?: number;
  /** Tamanho da fonte em pixels (vídeo 1080x1920 → use 70-120). Default: 88 */
  tamanhoFonte?: number;
  /** Cor do texto. Default: white */
  cor?: string;
  /** Animação de saída (fade-out) ativada antes do fim. Default: true */
  comFadeOut?: boolean;
  /**
   * Variante visual:
   *  - "padrao": texto solto com sombra (estilo Reels)
   *  - "legenda_tiktok": cada linha com fundo blur translúcido (estilo TikTok captions)
   */
  variante?: VarianteTexto;
  /** Glow atrás do texto. Default: true */
  comGlow?: boolean;
  /** Largura máxima do texto em px (afeta a quebra). Default: undefined */
  larguraMaxima?: number;
  /** Estilo extra opcional aplicado ao container externo */
  style?: React.CSSProperties;
}

/**
 * Texto premium para Remotion:
 *  - entrada smooth spring com fade + slide-up
 *  - easing premium (bezier customizado)
 *  - sombra cinematográfica + glow opcional
 *  - bounce sutil nos emojis
 *  - fade-out + leve blur de saída pra crossfade
 *  - variante "legenda_tiktok" com fundo blur por linha
 *  - quebra automática inteligente em linhas
 */
export function AnimatedText({
  texto,
  delayFrames = 0,
  tamanhoFonte = 88,
  cor = "white",
  comFadeOut = true,
  variante = "padrao",
  comGlow = true,
  larguraMaxima,
  style,
}: Props) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // ENTRADA: spring premium ~400ms
  const entrada = spring({
    frame: frame - delayFrames,
    fps,
    config: {
      damping: 20,
      stiffness: 130,
      mass: 0.65,
    },
    durationInFrames: 14,
  });

  const translateY = interpolate(entrada, [0, 1], [50, 0], {
    easing: Easing.bezier(0.16, 1, 0.3, 1), // ease-out-expo, sensação premium
  });
  const opacidadeEntrada = interpolate(entrada, [0, 1], [0, 1]);

  // SAÍDA: fade + blur leve nos últimos frames (transição cinematográfica)
  const opacidadeSaida = comFadeOut
    ? interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      })
    : 1;

  const blurSaida = comFadeOut
    ? interpolate(frame, [durationInFrames - 10, durationInFrames], [0, 4], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  const opacidade = opacidadeEntrada * opacidadeSaida;

  // Quebra texto em linhas (split natural por palavras se for legenda TikTok)
  const linhas =
    variante === "legenda_tiktok" ? quebrarEmLinhas(texto, 16) : [texto];

  return (
    <div
      style={{
        transform: `translateY(${translateY}px)`,
        opacity: opacidade,
        filter: blurSaida > 0 ? `blur(${blurSaida}px)` : undefined,
        textAlign: "center",
        maxWidth: larguraMaxima ? `${larguraMaxima}px` : "100%",
        willChange: "transform, opacity, filter",
        display: "flex",
        flexDirection: "column",
        gap: variante === "legenda_tiktok" ? 12 : 0,
        alignItems: "center",
        ...style,
      }}
    >
      {linhas.map((linha, idxLinha) => (
        <LinhaDeTexto
          key={idxLinha}
          texto={linha}
          variante={variante}
          tamanhoFonte={tamanhoFonte}
          cor={cor}
          comGlow={comGlow}
          frameAtual={frame - delayFrames}
        />
      ))}
    </div>
  );
}

function LinhaDeTexto({
  texto,
  variante,
  tamanhoFonte,
  cor,
  comGlow,
  frameAtual,
}: {
  texto: string;
  variante: VarianteTexto;
  tamanhoFonte: number;
  cor: string;
  comGlow: boolean;
  frameAtual: number;
}) {
  const partes = quebrarTextoPorEmojis(texto);

  // Glow pulsante (sutil) — só na variante padrão
  const intensidadeGlow = comGlow
    ? 0.7 + Math.sin(frameAtual * 0.05) * 0.15
    : 0;

  const estiloBase: React.CSSProperties = {
    fontSize: tamanhoFonte,
    fontWeight: 900,
    lineHeight: 1.1,
    fontFamily: "system-ui, -apple-system, sans-serif",
    letterSpacing: "-0.02em",
    color: cor,
    display: "inline-block",
  };

  // ===== VARIANTE LEGENDA TIKTOK =====
  if (variante === "legenda_tiktok") {
    return (
      <span
        style={{
          ...estiloBase,
          padding: "16px 28px",
          background: "rgba(0, 0, 0, 0.65)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: 18,
          boxShadow:
            "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
          textShadow: "0 2px 6px rgba(0,0,0,0.6)",
        }}
      >
        {partes.map((p, i) =>
          p.ehEmoji ? (
            <EmojiBounce key={i} emoji={p.texto} indice={i} frame={frameAtual} />
          ) : (
            <React.Fragment key={i}>{p.texto}</React.Fragment>
          )
        )}
      </span>
    );
  }

  // ===== VARIANTE PADRÃO (com glow + sombra cinematográfica) =====
  const sombras = [
    // Sombras de profundidade (cinematográficas)
    "0 6px 30px rgba(0,0,0,0.95)",
    "0 3px 12px rgba(0,0,0,0.9)",
    "0 0 1px rgba(0,0,0,0.6)",
  ];

  if (comGlow) {
    // Glow colorido pulsante (sensação viral TikTok)
    sombras.push(
      `0 0 ${28 * intensidadeGlow}px rgba(217, 70, 239, ${0.35 * intensidadeGlow})`
    );
    sombras.push(
      `0 0 ${48 * intensidadeGlow}px rgba(124, 58, 237, ${0.22 * intensidadeGlow})`
    );
  }

  return (
    <span
      style={{
        ...estiloBase,
        textShadow: sombras.join(", "),
      }}
    >
      {partes.map((p, i) =>
        p.ehEmoji ? (
          <EmojiBounce key={i} emoji={p.texto} indice={i} frame={frameAtual} />
        ) : (
          <React.Fragment key={i}>{p.texto}</React.Fragment>
        )
      )}
    </span>
  );
}

/**
 * Emoji com bounce sutil contínuo.
 */
function EmojiBounce({
  emoji,
  indice,
  frame,
}: {
  emoji: string;
  indice: number;
  frame: number;
}) {
  const fase = indice * 0.7;
  const oscilacao = Math.sin(frame * 0.18 + fase);
  const translateY = oscilacao * 5;
  const escala = 1 + oscilacao * 0.035;

  return (
    <span
      style={{
        display: "inline-block",
        transform: `translateY(${translateY}px) scale(${escala})`,
        willChange: "transform",
      }}
    >
      {emoji}
    </span>
  );
}

/**
 * Quebra um texto em segmentos alternando texto / emoji.
 */
function quebrarTextoPorEmojis(
  texto: string
): Array<{ texto: string; ehEmoji: boolean }> {
  const regexEmoji =
    /([\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1FA70}-\u{1FAFF}]+)/gu;

  const partes: Array<{ texto: string; ehEmoji: boolean }> = [];
  let ultimoIndice = 0;
  let match: RegExpExecArray | null;

  while ((match = regexEmoji.exec(texto)) !== null) {
    if (match.index > ultimoIndice) {
      partes.push({
        texto: texto.slice(ultimoIndice, match.index),
        ehEmoji: false,
      });
    }
    partes.push({ texto: match[0], ehEmoji: true });
    ultimoIndice = match.index + match[0].length;
  }

  if (ultimoIndice < texto.length) {
    partes.push({ texto: texto.slice(ultimoIndice), ehEmoji: false });
  }

  return partes.length > 0 ? partes : [{ texto, ehEmoji: false }];
}

/**
 * Quebra texto em linhas tentando não passar de maxCaracteresPorLinha
 * sem cortar palavras. Estilo TikTok captions.
 */
function quebrarEmLinhas(texto: string, maxCaracteresPorLinha: number): string[] {
  const palavras = texto.split(/\s+/);
  const linhas: string[] = [];
  let linhaAtual = "";

  for (const palavra of palavras) {
    const tentativa = linhaAtual ? `${linhaAtual} ${palavra}` : palavra;
    if (tentativa.length <= maxCaracteresPorLinha || linhaAtual === "") {
      linhaAtual = tentativa;
    } else {
      linhas.push(linhaAtual);
      linhaAtual = palavra;
    }
  }
  if (linhaAtual) linhas.push(linhaAtual);

  return linhas;
}
