"use client";

import type { DuracaoReel } from "@/types";

interface Props {
  valor: DuracaoReel;
  onChange: (valor: DuracaoReel) => void;
}

export default function SeletorDuracao({ valor, onChange }: Props) {
  const opcoes: DuracaoReel[] = [15, 20];

  return (
    <div>
      <label className="block text-sm font-semibold text-zinc-300 mb-2">
        Duração do vídeo
      </label>
      <div className="grid grid-cols-2 gap-3">
        {opcoes.map((opcao) => {
          const ativo = valor === opcao;
          return (
            <button
              key={opcao}
              type="button"
              onClick={() => onChange(opcao)}
              className={`
                py-4 rounded-2xl font-bold text-lg transition-all
                ${
                  ativo
                    ? "bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white shadow-lg shadow-fuchsia-500/30 scale-[1.02]"
                    : "bg-zinc-800 text-zinc-400 active:scale-95"
                }
              `}
            >
              {opcao}s
            </button>
          );
        })}
      </div>
    </div>
  );
}
