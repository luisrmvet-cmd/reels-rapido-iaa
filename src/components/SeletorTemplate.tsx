"use client";

import type { IdTemplate } from "@/types/video";
import { TEMPLATES } from "@/lib/templates";

interface Props {
  valor: IdTemplate;
  onChange: (v: IdTemplate) => void;
}

export default function SeletorTemplate({ valor, onChange }: Props) {
  const lista = Object.values(TEMPLATES);

  return (
    <div>
      <label className="block text-sm font-semibold text-zinc-300 mb-2">
        🎨 Template visual
      </label>
      <div className="grid grid-cols-1 gap-2">
        {lista.map((t) => {
          const ativo = valor === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              className={`
                flex items-center gap-3 p-3 rounded-2xl text-left transition-all
                ${
                  ativo
                    ? "bg-gradient-to-r from-fuchsia-500/20 to-violet-600/20 border-2 border-fuchsia-500"
                    : "bg-zinc-800 border-2 border-transparent active:scale-[0.98]"
                }
              `}
            >
              <span className="text-2xl">{t.emoji}</span>
              <div className="flex-1">
                <div
                  className={`font-bold text-sm ${ativo ? "text-white" : "text-zinc-200"}`}
                >
                  {t.nome}
                </div>
                <div className="text-xs text-zinc-400">{t.descricao}</div>
              </div>
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
            </button>
          );
        })}
      </div>
    </div>
  );
}
