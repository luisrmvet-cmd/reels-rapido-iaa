"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { IdVoz } from "@/types/video";
import { listarVozes } from "@/lib/vozes";

interface Props {
  valor: IdVoz;
  onChange: (v: IdVoz) => void;
}

type FiltroGenero = "todas" | "feminina" | "masculina";

type EstadoPreview =
  | { tipo: "idle" }
  | { tipo: "carregando"; vozId: IdVoz }
  | { tipo: "tocando"; vozId: IdVoz }
  | { tipo: "erro"; vozId: IdVoz; mensagem: string };

export default function SeletorVoz({ valor, onChange }: Props) {
  const [filtro, setFiltro] = useState<FiltroGenero>("todas");
  const [preview, setPreview] = useState<EstadoPreview>({ tipo: "idle" });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  const vozes = useMemo(() => listarVozes(), []);
  const vozesFiltradas = useMemo(
    () =>
      filtro === "todas" ? vozes : vozes.filter((v) => v.genero === filtro),
    [vozes, filtro]
  );

  // Cleanup: para áudio e revoga URL ao desmontar
  useEffect(() => {
    return () => {
      pararAudioAtual();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pararAudioAtual() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }

  async function tocarPreview(vozId: IdVoz, e: React.MouseEvent) {
    e.stopPropagation(); // não dispara o onClick da seleção da voz

    // Se já está tocando essa voz, para
    if (preview.tipo === "tocando" && preview.vozId === vozId) {
      pararAudioAtual();
      setPreview({ tipo: "idle" });
      return;
    }

    // Se está tocando outra, para antes de começar
    pararAudioAtual();
    setPreview({ tipo: "carregando", vozId });

    try {
      const resp = await fetch("/api/tts-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vozId }),
      });

      if (!resp.ok) {
        const err = await resp
          .json()
          .catch(() => ({ erro: `HTTP ${resp.status}` }));
        throw new Error(err?.erro || `HTTP ${resp.status}`);
      }

      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      urlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        pararAudioAtual();
        setPreview({ tipo: "idle" });
      };
      audio.onerror = () => {
        pararAudioAtual();
        setPreview({
          tipo: "erro",
          vozId,
          mensagem: "Falha ao tocar áudio",
        });
      };

      await audio.play();
      setPreview({ tipo: "tocando", vozId });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido";
      pararAudioAtual();
      setPreview({ tipo: "erro", vozId, mensagem: msg });
      // Limpa erro após 3s
      setTimeout(() => {
        setPreview((p) =>
          p.tipo === "erro" && p.vozId === vozId ? { tipo: "idle" } : p
        );
      }, 3000);
    }
  }

  function iconePreview(vozId: IdVoz) {
    if (preview.tipo === "carregando" && preview.vozId === vozId) {
      return (
        <span className="inline-block animate-spin text-base">⏳</span>
      );
    }
    if (preview.tipo === "tocando" && preview.vozId === vozId) {
      return <span className="text-base">⏸️</span>;
    }
    if (preview.tipo === "erro" && preview.vozId === vozId) {
      return <span className="text-base">❌</span>;
    }
    return <span className="text-base">🔊</span>;
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-zinc-300">
        🎙️ Escolha a voz
      </label>

      {/* Filtros */}
      <div className="grid grid-cols-3 gap-1">
        {(["todas", "feminina", "masculina"] as FiltroGenero[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFiltro(f)}
            className={`py-2 rounded-lg text-xs font-bold transition-all ${
              filtro === f
                ? "bg-fuchsia-500 text-white"
                : "bg-zinc-800 text-zinc-400 active:scale-95"
            }`}
          >
            {f === "todas" ? "Todas" : f === "feminina" ? "👩 Fem" : "👨 Masc"}
          </button>
        ))}
      </div>

      {/* Lista de vozes */}
      <div className="grid grid-cols-1 gap-1.5 max-h-72 overflow-y-auto pr-1">
        {vozesFiltradas.map((voz) => {
          const ativo = valor === voz.id;
          const ehErro =
            preview.tipo === "erro" && preview.vozId === voz.id;

          return (
            <div
              key={voz.id}
              onClick={() => onChange(voz.id)}
              className={`
                flex items-center gap-2 p-2.5 rounded-xl text-left transition-all cursor-pointer
                ${
                  ativo
                    ? "bg-gradient-to-r from-fuchsia-500/20 to-violet-600/20 border-2 border-fuchsia-500"
                    : "bg-zinc-800 border-2 border-transparent active:scale-[0.98]"
                }
              `}
            >
              <span className="text-2xl shrink-0">{voz.emoji}</span>
              <div className="flex-1 min-w-0">
                <div
                  className={`font-bold text-sm ${ativo ? "text-white" : "text-zinc-200"}`}
                >
                  {voz.nome}{" "}
                  <span className="text-[10px] text-zinc-500 font-normal">
                    ({voz.genero})
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 truncate">
                  {ehErro
                    ? `❌ ${preview.mensagem}`
                    : voz.descricao}
                </div>
              </div>

              {/* Botão preview */}
              <button
                type="button"
                onClick={(e) => tocarPreview(voz.id, e)}
                aria-label={`Ouvir prévia de ${voz.nome}`}
                className="w-9 h-9 rounded-full bg-zinc-700 hover:bg-zinc-600 active:scale-90 flex items-center justify-center shrink-0 transition-all"
              >
                {iconePreview(voz.id)}
              </button>

              {ativo && (
                <div className="w-5 h-5 rounded-full bg-fuchsia-500 flex items-center justify-center shrink-0">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-zinc-500 leading-relaxed">
        💡 Toque em 🔊 para ouvir uma prévia. Vozes do roster premade
        ElevenLabs com modelo multilingual em PT-BR (leve sotaque).
        Para vozes nativas BR, é necessário plano Creator+ da ElevenLabs.
      </p>
    </div>
  );
}
