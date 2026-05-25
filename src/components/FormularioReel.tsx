"use client";

import { useState } from "react";
import SeletorDuracao from "./SeletorDuracao";
import SeletorEstilo from "./SeletorEstilo";
import UploadImagens from "./UploadImagens";
import PreviewRoteiro from "./PreviewRoteiro";
import { gerarRoteiro } from "@/lib/geradorRoteiro";
import type {
  DuracaoReel,
  EstiloReel,
  ImagemUpload,
  RoteiroGerado,
} from "@/types";

const MIN_IMAGENS = 3;
const MAX_IMAGENS = 5;

export default function FormularioReel() {
  const [assunto, setAssunto] = useState("");
  const [duracao, setDuracao] = useState<DuracaoReel>(15);
  const [estilo, setEstilo] = useState<EstiloReel>("venda");
  const [imagens, setImagens] = useState<ImagemUpload[]>([]);
  const [roteiro, setRoteiro] = useState<RoteiroGerado | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const podeGerar =
    assunto.trim().length >= 5 && imagens.length >= MIN_IMAGENS;

  function gerar() {
    setErro(null);
    if (assunto.trim().length < 5) {
      setErro("Conte um pouco mais sobre o vídeo (mínimo 5 caracteres).");
      return;
    }
    if (imagens.length < MIN_IMAGENS) {
      setErro(`Adicione pelo menos ${MIN_IMAGENS} imagens.`);
      return;
    }

    const novoRoteiro = gerarRoteiro({
      assunto,
      estilo,
      duracao,
      quantidadeImagens: imagens.length,
    });
    setRoteiro(novoRoteiro);
    // rolar pro topo no celular
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function voltarParaFormulario() {
    setRoteiro(null);
  }

  // Se tem roteiro, mostra preview
  if (roteiro) {
    return (
      <PreviewRoteiro
        roteiro={roteiro}
        imagens={imagens}
        onVoltar={voltarParaFormulario}
        onRegerar={gerar}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Assunto */}
      <div>
        <label
          htmlFor="assunto"
          className="block text-sm font-semibold text-zinc-300 mb-2"
        >
          Sobre o que é o vídeo?
        </label>
        <textarea
          id="assunto"
          value={assunto}
          onChange={(e) => setAssunto(e.target.value)}
          placeholder="Ex: meu curso de inglês em 30 dias"
          rows={3}
          className="w-full px-4 py-3 rounded-2xl bg-zinc-800 text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-fuchsia-500 text-base"
        />
        <div className="mt-1 text-xs text-zinc-500 text-right">
          {assunto.length} caracteres
        </div>
      </div>

      {/* Duração */}
      <SeletorDuracao valor={duracao} onChange={setDuracao} />

      {/* Estilo */}
      <SeletorEstilo valor={estilo} onChange={setEstilo} />

      {/* Imagens */}
      <UploadImagens
        imagens={imagens}
        onChange={setImagens}
        min={MIN_IMAGENS}
        max={MAX_IMAGENS}
      />

      {erro && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-2xl p-3">
          {erro}
        </div>
      )}

      {/* Botão gerar - fixo embaixo */}
      <div className="sticky bottom-4 pt-2">
        <button
          type="button"
          onClick={gerar}
          disabled={!podeGerar}
          className={`
            w-full py-5 rounded-2xl font-extrabold text-lg transition-all
            ${
              podeGerar
                ? "bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white shadow-lg shadow-fuchsia-500/40 active:scale-95"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            }
          `}
        >
          ✨ Gerar Roteiro
        </button>
      </div>
    </div>
  );
}
