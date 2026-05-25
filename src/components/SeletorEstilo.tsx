"use client";

import type { EstiloReel } from "@/types";

interface Props {
  valor: EstiloReel;
  onChange: (valor: EstiloReel) => void;
}

const ESTILOS: { id: EstiloReel; titulo: string; descricao: string; emoji: string }[] = [
  { id: "venda", titulo: "Venda", descricao: "Para converter em clique", emoji: "💰" },
  { id: "demonstracao", titulo: "Demonstração", descricao: "Passo a passo", emoji: "🎯" },
  { id: "dor", titulo: "Dor / Problema", descricao: "Identificação emocional", emoji: "💔" },
  { id: "curiosidade", titulo: "Curiosidade", descricao: "Prende a atenção", emoji: "🤯" },
  { id: "prova_social", titulo: "Prova Social", descricao: "Antes e depois", emoji: "🔥" },
];

export default function SeletorEstilo({ valor, onChange }: Props) {
  return (
    <div>
      <label className="block text-sm font-semibold text-zinc-300 mb-2">
        Estilo do Reel
      </label>
      <div className="grid grid-cols-1 gap-2">
        {ESTILOS.map((estilo) => {
          const ativo = valor === estilo.id;
          return (
            <button
              key={estilo.id}
              type="button"
              onClick={() => onChange(estilo.id)}
              className={`
                flex items-center gap-3 p-4 rounded-2xl text-left transition-all
                ${
                  ativo
                    ? "bg-gradient-to-r from-fuchsia-500/20 to-violet-600/20 border-2 border-fuchsia-500"
                    : "bg-zinc-800 border-2 border-transparent active:scale-[0.98]"
                }
              `}
            >
              <span className="text-3xl">{estilo.emoji}</span>
              <div className="flex-1">
                <div className={`font-bold ${ativo ? "text-white" : "text-zinc-200"}`}>
                  {estilo.titulo}
                </div>
                <div className="text-xs text-zinc-400">{estilo.descricao}</div>
              </div>
              {ativo && (
                <div className="w-6 h-6 rounded-full bg-fuchsia-500 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
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
            </button>
          );
        })}
      </div>
    </div>
  );
}
