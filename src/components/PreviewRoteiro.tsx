"use client";

import { useState } from "react";
import type { RoteiroGerado, ImagemUpload } from "@/types";
import GeradorVideo from "./GeradorVideo";

interface Props {
  roteiro: RoteiroGerado;
  imagens: ImagemUpload[];
  onVoltar: () => void;
  onRegerar: () => void;
}

export default function PreviewRoteiro({ roteiro, imagens, onVoltar, onRegerar }: Props) {
  const [copiado, setCopiado] = useState<string | null>(null);

  async function copiar(texto: string, id: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(id);
      setTimeout(() => setCopiado(null), 1500);
    } catch {
      // fallback simples
      alert("Não foi possível copiar.");
    }
  }

  const legendaCompleta = `${roteiro.legendaPost}\n\n${roteiro.hashtags.join(" ")}`;

  return (
    <div className="space-y-5">
      {/* Capa */}
      <Bloco titulo="🎬 Texto da capa" onCopiar={() => copiar(roteiro.capa, "capa")} copiado={copiado === "capa"}>
        <p className="text-xl font-extrabold text-white leading-tight">
          {roteiro.capa}
        </p>
      </Bloco>

      {/* Cenas */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-300 mb-2">
          🎞️ Cenas ({roteiro.cenas.length})
        </h3>
        <div className="space-y-2">
          {roteiro.cenas.map((cena) => (
            <div
              key={cena.numero}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-fuchsia-400">
                  CENA {cena.numero}
                </span>
                <span className="text-xs text-zinc-500">
                  {cena.duracaoSegundos}s
                </span>
              </div>
              <p className="text-white font-bold text-base leading-tight mb-2">
                {cena.textoTela}
              </p>
              <p className="text-zinc-400 text-sm italic">
                🎙️ {cena.narracao}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <Bloco titulo="📣 CTA final" onCopiar={() => copiar(roteiro.ctaFinal, "cta")} copiado={copiado === "cta"}>
        <p className="text-lg font-bold text-white">{roteiro.ctaFinal}</p>
      </Bloco>

      {/* Legenda */}
      <Bloco
        titulo="📝 Legenda do post"
        onCopiar={() => copiar(legendaCompleta, "legenda")}
        copiado={copiado === "legenda"}
      >
        <p className="text-zinc-200 text-sm whitespace-pre-wrap">
          {roteiro.legendaPost}
        </p>
        <p className="text-fuchsia-400 text-sm mt-2 font-medium">
          {roteiro.hashtags.join(" ")}
        </p>
      </Bloco>

      {/* Ações */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          type="button"
          onClick={onVoltar}
          className="py-4 rounded-2xl font-bold bg-zinc-800 text-white active:scale-95"
        >
          ← Voltar
        </button>
        <button
          type="button"
          onClick={onRegerar}
          className="py-4 rounded-2xl font-bold bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white shadow-lg shadow-fuchsia-500/30 active:scale-95"
        >
          🔄 Gerar outro
        </button>
      </div>

      <div className="text-center text-xs text-zinc-500 pt-2">
        ⬇️ Agora gere o vídeo MP4
      </div>

      {/* Gerador de Vídeo MP4 */}
      <GeradorVideo roteiro={roteiro} imagens={imagens} />
    </div>
  );
}

function Bloco({
  titulo,
  children,
  onCopiar,
  copiado,
}: {
  titulo: string;
  children: React.ReactNode;
  onCopiar: () => void;
  copiado: boolean;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-zinc-300">{titulo}</h3>
        <button
          type="button"
          onClick={onCopiar}
          className="text-xs font-bold text-fuchsia-400 active:scale-95 px-2 py-1 rounded-lg bg-fuchsia-500/10"
        >
          {copiado ? "✓ Copiado" : "Copiar"}
        </button>
      </div>
      {children}
    </div>
  );
}
