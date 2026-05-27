"use client";

import { useEffect, useState } from "react";
import type { RoteiroGerado, ImagemUpload } from "../types";
import type {
  EstadoRender,
  PayloadRender,
  IdTemplate,
  IdVoz,
} from "../types/video";
import { TEMPLATE_DEFAULT } from "../lib/templates";
import { VOZ_DEFAULT } from "../lib/vozes";
import { prepararImagens } from "../lib/preparoImagens";
import SeletorTemplate from "./SeletorTemplate";
import SeletorVoz from "./SeletorVoz";
import SeletorVideoFundo from "./SeletorVideoFundo";
import EditorRoteiro from "./EditorRoteiro";

interface Props {
  roteiro: RoteiroGerado;
  imagens: ImagemUpload[];
}

export default function GeradorVideo({ roteiro: roteiroInicial, imagens }: Props) {
  const [roteiro, setRoteiro] = useState<RoteiroGerado>(roteiroInicial);
  const [estado, setEstado] = useState<EstadoRender>({ tipo: "idle" });
  const [editando, setEditando] = useState(false);
  const [comMusica, setComMusica] = useState(false);
  const [musicaDisponivel, setMusicaDisponivel] = useState(false);
  const [comVoz, setComVoz] = useState(false);
  const [vozDisponivel, setVozDisponivel] = useState(false);
  const [vozId, setVozId] = useState<IdVoz>(VOZ_DEFAULT);
  const [comLegendaPPP, setComLegendaPPP] = useState(true);
  const [template, setTemplate] = useState<IdTemplate>(TEMPLATE_DEFAULT);
  const [videoFundoUrl, setVideoFundoUrl] = useState<string | null>(null);

  // Sincroniza quando o pai gera um novo roteiro
  useEffect(() => {
    setRoteiro(roteiroInicial);
  }, [roteiroInicial]);

  useEffect(() => {
    fetch("/api/tts-status")
      .then((r) => r.json())
      .then((d) => setVozDisponivel(!!d?.disponivel))
      .catch(() => setVozDisponivel(false));

    fetch("/api/musicas")
      .then((r) => r.json())
      .then((d) =>
        setMusicaDisponivel(Array.isArray(d?.musicas) && d.musicas.length > 0)
      )
      .catch(() => setMusicaDisponivel(false));
  }, []);

  useEffect(() => {
    return () => {
      if (estado.tipo === "concluido") {
        URL.revokeObjectURL(estado.videoUrl);
      }
    };
  }, [estado]);

  async function gerarVideo() {
    // Limpa COMPLETAMENTE qualquer estado anterior (erro, vídeo pronto, etc)
    // antes de começar nova tentativa. Evita que mensagens antigas fiquem
    // visíveis na tela durante o novo render.
    if (estado.tipo === "concluido") {
      URL.revokeObjectURL(estado.videoUrl);
    }
    setEstado({ tipo: "idle" });

    const timestampTentativa = new Date().toISOString();

    // Chama o servico de render direto, sem passar pela Vercel.
    // Vercel tem timeout de 60s -> renders longos dao 504.
    // Render.com nao tem esse limite.
    const renderServiceUrl = process.env.NEXT_PUBLIC_RENDER_SERVICE_URL;
    if (!renderServiceUrl) {
      console.error(
        "[render] NEXT_PUBLIC_RENDER_SERVICE_URL nao configurada. Definir em Vercel > Settings > Environment Variables e fazer Redeploy."
      );
      setEstado({
        tipo: "erro",
        mensagem:
          "Servico de render nao configurado. Falta env var NEXT_PUBLIC_RENDER_SERVICE_URL no Vercel.",
        debug: {
          endpoint: "(nao configurado)",
          timestamp: timestampTentativa,
        },
      });
      return;
    }
    const endpoint = `${renderServiceUrl.replace(/\/+$/, "")}/render`;
    console.log("[render] usando endpoint:", endpoint);

    // alias usado pelo logging mais abaixo
    const endpointDestino = endpoint;

    try {
      setEstado({ tipo: "preparando" });
      const imagensSerializadas = await prepararImagens(imagens);

      const duracaoVideoSegundos = roteiro.cenas.reduce(
        (acc, c) => acc + c.duracaoSegundos,
        0
      );
      const estimativaMs =
        duracaoVideoSegundos * 6000 +
        (comVoz ? roteiro.cenas.length * 3000 : 0);

      if (comVoz) {
        setEstado({
          tipo: "gerando_voz",
          cenaAtual: 0,
          totalCenas: roteiro.cenas.length,
        });
        // Simula progresso de geração de voz (não temos progresso real do server)
        let cenaSimulada = 0;
        const intervalVoz = setInterval(() => {
          cenaSimulada = Math.min(cenaSimulada + 1, roteiro.cenas.length);
          setEstado((prev) =>
            prev.tipo === "gerando_voz"
              ? {
                  tipo: "gerando_voz",
                  cenaAtual: cenaSimulada,
                  totalCenas: roteiro.cenas.length,
                }
              : prev
          );
        }, 2200);
        // Após 80% do tempo estimado de voz, troca pra renderizando
        setTimeout(
          () => {
            clearInterval(intervalVoz);
            setEstado({ tipo: "renderizando", progresso: 0.05 });
          },
          roteiro.cenas.length * 2400
        );
      } else {
        setTimeout(
          () => setEstado({ tipo: "renderizando", progresso: 0.05 }),
          200
        );
      }

      const inicio = Date.now();
      const intervalProgresso = setInterval(() => {
        setEstado((prev) => {
          if (prev.tipo !== "renderizando") return prev;
          const decorrido = Date.now() - inicio;
          const p = Math.min(0.92, decorrido / estimativaMs);
          return { tipo: "renderizando", progresso: p };
        });
      }, 400);

      const payload: PayloadRender = {
        roteiro,
        imagens: imagensSerializadas,
        comMusica: comMusica && musicaDisponivel,
        template,
        comLegendaPalavraPalavra: comLegendaPPP,
        comVoz: comVoz && vozDisponivel,
        vozId,
        videoFundoUrl,
      };

      console.log(
        `[debug-render] ${timestampTentativa} POST ${endpointDestino}`,
        { payload: { ...payload, imagens: `${payload.imagens.length} imagens` } }
      );

      // =================================================================
      // FASE 1: POST /render → recebe { jobId }
      // =================================================================
      const respPost = await fetch(endpointDestino, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!respPost.ok) {
        clearInterval(intervalProgresso);
        const erroTexto = await respPost.text();
        let mensagem = `HTTP ${respPost.status} ${respPost.statusText}`;
        try {
          const erroJson = JSON.parse(erroTexto);
          if (erroJson?.erro) mensagem = erroJson.erro;
          else if (erroJson?.error) mensagem = erroJson.error;
          else if (erroJson?.message) mensagem = erroJson.message;
        } catch {
          if (erroTexto && erroTexto.length < 500) mensagem = erroTexto;
        }
        console.error(`[debug-render] erro POST /render:`, erroTexto);
        throw new Error(mensagem);
      }

      const { jobId } = (await respPost.json()) as { jobId: string };
      if (!jobId) {
        clearInterval(intervalProgresso);
        throw new Error("Resposta sem jobId");
      }
      console.log(`[debug-render] jobId recebido: ${jobId}`);

      // Para a barra falsa - vamos usar progresso real do servidor
      clearInterval(intervalProgresso);

      // =================================================================
      // FASE 2: polling em /jobs/:id/status a cada 2s, ate done/error
      // =================================================================
      const TIMEOUT_TOTAL_MS = 8 * 60 * 1000; // 8min - timeout de seguranca
      const INTERVALO_POLLING_MS = 2000;
      const inicioPolling = Date.now();
      const statusUrl = `${endpointDestino.replace(/\/render$/, "")}/jobs/${jobId}/status`;
      const videoUrl = `${endpointDestino.replace(/\/render$/, "")}/jobs/${jobId}/video`;

      type EstadoJob = "pending" | "rendering" | "done" | "error";
      let estadoJob: EstadoJob = "pending";
      let mensagemErro = "";
      let progressoJob = 0;
      let etapaAtual = "iniciando";
      let falhasPolling = 0;
      let pollNumero = 0;

      while (Date.now() - inicioPolling < TIMEOUT_TOTAL_MS) {
        await new Promise((r) => setTimeout(r, INTERVALO_POLLING_MS));
        pollNumero++;

        let dataStatus: {
          estado: EstadoJob;
          progresso: number;
          etapa: string;
          videoUrl?: string;
          erro?: string;
          tempoNaEtapa?: number;
          tempoTotal?: number;
        };
        try {
          const respStatus = await fetch(statusUrl);
          if (!respStatus.ok) {
            falhasPolling++;
            console.warn(
              `[debug-render] poll ${pollNumero}: status HTTP ${respStatus.status} (falha ${falhasPolling}/3)`
            );
            setEstado({
              tipo: "renderizando",
              progresso: progressoJob,
              etapa: falhasPolling >= 3 ? "verificando conexao..." : etapaAtual,
            });
            continue;
          }
          dataStatus = await respStatus.json();
          falhasPolling = 0;
        } catch (e) {
          falhasPolling++;
          console.warn(
            `[debug-render] poll ${pollNumero}: erro de rede (falha ${falhasPolling}/3):`,
            e
          );
          setEstado({
            tipo: "renderizando",
            progresso: progressoJob,
            etapa: falhasPolling >= 3 ? "verificando conexao..." : etapaAtual,
          });
          continue;
        }

        // LOG COMPLETO do retorno do status pra debug
        console.log(
          `[debug-render] poll ${pollNumero} status RAW:`,
          JSON.stringify(dataStatus)
        );

        estadoJob = dataStatus.estado;
        progressoJob = (dataStatus.progresso ?? 0) / 100;
        etapaAtual = dataStatus.etapa || "processando";

        setEstado({
          tipo: "renderizando",
          progresso: Math.min(0.99, progressoJob),
          etapa: etapaAtual,
        });

        // Alarme se vier estado inesperado (nao deveria acontecer)
        if (
          estadoJob !== "pending" &&
          estadoJob !== "rendering" &&
          estadoJob !== "done" &&
          estadoJob !== "error"
        ) {
          console.error(
            `[debug-render] poll ${pollNumero}: estado DESCONHECIDO=${estadoJob}. Backend mudou?`
          );
        }

        if (estadoJob === "done") {
          console.log(`[debug-render] poll ${pollNumero}: estado=done CONFIRMADO. Vou baixar MP4.`);
          break;
        }
        if (estadoJob === "error") {
          mensagemErro = dataStatus.erro || "Render falhou";
          console.error(`[debug-render] poll ${pollNumero}: estado=error. erro="${mensagemErro}"`);
          break;
        }
      }

      if (estadoJob === "error") throw new Error(mensagemErro);
      if (estadoJob !== "done") {
        throw new Error(
          `Render demorou mais que 8 minutos sem terminar (ultima etapa: ${etapaAtual}). O servidor pode estar travado - tente de novo em alguns minutos.`
        );
      }

      // =================================================================
      // FASE 3: baixar o MP4
      // =================================================================
      console.log(`[debug-render] baixando MP4 de ${videoUrl}`);
      const respVideo = await fetch(videoUrl);
      if (!respVideo.ok) {
        throw new Error(`Falha ao baixar MP4: HTTP ${respVideo.status}`);
      }
      const blob = await respVideo.blob();
      console.log(
        `[debug-render] MP4 baixado, tamanho=${(blob.size / 1024 / 1024).toFixed(2)}MB type=${blob.type}`
      );

      // Sanidade: MP4 deve ter pelo menos 10KB e tipo video/mp4 ou application/octet-stream
      if (blob.size < 10000) {
        throw new Error(
          `MP4 invalido: tamanho=${blob.size} bytes (esperado > 10KB). Servidor pode ter gerado arquivo corrompido.`
        );
      }
      if (
        blob.type &&
        !blob.type.includes("video") &&
        !blob.type.includes("octet-stream")
      ) {
        console.warn(
          `[debug-render] AVISO: blob.type=${blob.type} (esperado video/mp4)`
        );
      }

      const url = URL.createObjectURL(blob);
      // Player local usa blob URL (necessario pro <video> tocar imediato)
      // Botao baixar usa URL direta do backend (evita re-download em memoria)
      setEstado({
        tipo: "concluido",
        videoUrl: url,
        urlDownloadDireto: videoUrl,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido";
      console.error(`[debug-render] ERRO em ${timestampTentativa}:`, msg);
      setEstado({
        tipo: "erro",
        mensagem: msg,
        debug: {
          endpoint: endpointDestino,
          timestamp: timestampTentativa,
        },
      });
    }
  }

  function baixar() {
    if (estado.tipo !== "concluido") return;
    // Prefere URL direta do servidor (mais leve, suporta range requests).
    // Fallback pra blob URL local se o servidor nao retornou URL direta.
    const urlParaBaixar = estado.urlDownloadDireto ?? estado.videoUrl;
    const a = document.createElement("a");
    a.href = urlParaBaixar;
    a.download = `reel-${Date.now()}.mp4`;
    // target=_blank ajuda em alguns navegadores quando href eh cross-origin
    if (estado.urlDownloadDireto) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // ===== Modo editor =====
  if (editando) {
    return (
      <EditorRoteiro
        roteiroInicial={roteiro}
        onConfirmar={(r) => {
          setRoteiro(r);
          setEditando(false);
        }}
        onCancelar={() => setEditando(false)}
      />
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-500 to-violet-600 flex items-center justify-center text-sm">
          🎥
        </div>
        <h3 className="font-bold text-white">Gerar Vídeo MP4</h3>
      </div>

      {estado.tipo === "idle" && (
        <>
          {/* Botão editar roteiro */}
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm bg-zinc-800 border border-zinc-700 text-amber-400 active:scale-[0.98]"
          >
            ✏️ Editar roteiro antes de gerar
          </button>

          <SeletorTemplate valor={template} onChange={setTemplate} />

          {/* Vídeo de fundo (B-roll) — sub-etapa 8.1.A */}
          <SeletorVideoFundo
            valor={videoFundoUrl}
            onChange={setVideoFundoUrl}
          />

          {/* Legenda PPP */}
          <label className="flex items-center gap-3 p-3 bg-zinc-800 rounded-xl cursor-pointer active:scale-[0.98]">
            <input
              type="checkbox"
              checked={comLegendaPPP}
              onChange={(e) => setComLegendaPPP(e.target.checked)}
              className="w-5 h-5 accent-fuchsia-500 shrink-0"
            />
            <div className="flex-1">
              <div className="text-sm font-semibold text-white">
                📝 Legenda palavra-por-palavra
              </div>
              <div className="text-xs text-zinc-400">
                {comVoz && vozDisponivel
                  ? "✨ Sincronização perfeita com a voz"
                  : "Estilo TikTok, palavras animadas"}
              </div>
            </div>
          </label>

          {/* Música */}
          <label
            className={`flex items-center gap-3 p-3 bg-zinc-800 rounded-xl ${
              musicaDisponivel ? "cursor-pointer active:scale-[0.98]" : "opacity-60"
            }`}
          >
            <input
              type="checkbox"
              checked={comMusica && musicaDisponivel}
              disabled={!musicaDisponivel}
              onChange={(e) => setComMusica(e.target.checked)}
              className="w-5 h-5 accent-fuchsia-500 shrink-0"
            />
            <div className="flex-1">
              <div className="text-sm font-semibold text-white">
                🎵 Música de fundo
              </div>
              <div className="text-xs text-zinc-400">
                {musicaDisponivel
                  ? comVoz
                    ? "Fade in/out + ducking automático quando voz toca"
                    : "Detectada em /public/audio/ com fade in/out"
                  : "Adicione um MP3 em /public/audio/ pra ativar"}
              </div>
            </div>
          </label>

          {/* Voz IA */}
          <label
            className={`flex items-center gap-3 p-3 bg-zinc-800 rounded-xl ${
              vozDisponivel ? "cursor-pointer active:scale-[0.98]" : "opacity-60"
            }`}
          >
            <input
              type="checkbox"
              checked={comVoz && vozDisponivel}
              disabled={!vozDisponivel}
              onChange={(e) => setComVoz(e.target.checked)}
              className="w-5 h-5 accent-fuchsia-500 shrink-0"
            />
            <div className="flex-1">
              <div className="text-sm font-semibold text-white">
                🎙️ Voz IA (ElevenLabs)
              </div>
              <div className="text-xs text-zinc-400">
                {vozDisponivel
                  ? "Narração PT-BR + sincronização perfeita + cache local"
                  : "Configure ELEVENLABS_API_KEY no .env.local"}
              </div>
            </div>
          </label>

          {/* Seletor de voz (só se ativada) */}
          {comVoz && vozDisponivel && (
            <SeletorVoz valor={vozId} onChange={setVozId} />
          )}

          <button
            type="button"
            onClick={gerarVideo}
            className="w-full py-4 rounded-2xl font-extrabold text-base bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white shadow-lg shadow-fuchsia-500/30 active:scale-95"
          >
            🎬 Gerar Vídeo MP4
          </button>
        </>
      )}

      {estado.tipo === "preparando" && (
        <LoadingPremium texto="Preparando imagens..." emoji="🖼️" />
      )}

      {estado.tipo === "gerando_voz" && (
        <div className="space-y-3 py-3">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-violet-600/20 border border-fuchsia-500/30 mb-3">
              <span className="text-3xl animate-pulse">🎙️</span>
            </div>
            <p className="text-sm font-semibold text-white">
              Gerando narração com IA...
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Cena {estado.cenaAtual + 1} de {estado.totalCenas}
            </p>
          </div>
          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-fuchsia-500 to-violet-600 transition-all duration-500"
              style={{
                width: `${((estado.cenaAtual + 1) / estado.totalCenas) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {estado.tipo === "renderizando" && (
        <div className="space-y-3 py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-300 font-semibold flex items-center gap-2">
              <span className="inline-block animate-spin">⚙️</span>
              Renderizando vídeo...
            </span>
            <span className="text-fuchsia-400 font-bold">
              {Math.round(estado.progresso * 100)}%
            </span>
          </div>
          <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-fuchsia-500 to-violet-600 transition-all duration-300 ease-out relative overflow-hidden"
              style={{ width: `${estado.progresso * 100}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
            </div>
          </div>
          {estado.etapa && (
            <p className="text-xs text-zinc-400 text-center font-mono">
              {estado.etapa}
            </p>
          )}
          <p className="text-xs text-zinc-500 text-center">
            Isso pode demorar 60-180 segundos para 15s de vídeo. Não feche a aba.
          </p>
        </div>
      )}

      {estado.tipo === "concluido" && (
        <div className="space-y-3">
          <div className="bg-black rounded-2xl overflow-hidden">
            <video
              src={estado.videoUrl}
              controls
              playsInline
              className="w-full aspect-[9/16] object-contain"
            />
          </div>
          <button
            type="button"
            onClick={baixar}
            className="w-full py-4 rounded-2xl font-extrabold text-base bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 active:scale-95"
          >
            ⬇️ Baixar MP4
          </button>
          <button
            type="button"
            onClick={() => setEstado({ tipo: "idle" })}
            className="w-full py-3 rounded-2xl font-bold text-sm bg-zinc-800 text-white active:scale-95"
          >
            🔄 Gerar novamente
          </button>
        </div>
      )}

      {estado.tipo === "erro" && (
        <div className="space-y-3">
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-2xl p-3">
            ❌ {estado.mensagem}
          </div>

          {/* Bloco de debug temporário - mostra:
              - endpoint chamado (deve ser https://reels-render-service.onrender.com/render)
              - timestamp da tentativa (confirma que é nova, não cache antigo)
          */}
          {estado.debug && (
            <div className="bg-zinc-800/60 border border-zinc-700 text-zinc-400 text-[10px] rounded-2xl p-3 font-mono leading-relaxed">
              <div>🔍 debug</div>
              <div>endpoint: {estado.debug.endpoint}</div>
              <div>timestamp: {estado.debug.timestamp}</div>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              // Limpa COMPLETAMENTE o estado antes do retry.
              // Próximo gerarVideo() vai começar do zero,
              // sem mensagem antiga visível.
              setEstado({ tipo: "idle" });
              // Dispara nova tentativa
              gerarVideo();
            }}
            className="w-full py-3 rounded-2xl font-bold bg-zinc-800 text-white active:scale-95"
          >
            Tentar de novo
          </button>
        </div>
      )}
    </div>
  );
}

function LoadingPremium({
  texto,
  emoji,
}: {
  texto: string;
  emoji: string;
}) {
  return (
    <div className="text-center py-8">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-violet-600/20 border border-fuchsia-500/30 mb-3">
        <span className="text-3xl animate-pulse">{emoji}</span>
      </div>
      <p className="text-sm font-semibold text-white">{texto}</p>
    </div>
  );
}
