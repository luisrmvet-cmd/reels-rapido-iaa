"use client";

import { useState } from "react";
import type { RoteiroGerado, Cena } from "@/types";

interface Props {
  roteiroInicial: RoteiroGerado;
  onConfirmar: (roteiroEditado: RoteiroGerado) => void;
  onCancelar: () => void;
}

/**
 * Editor manual do roteiro antes de gerar voz.
 * Permite ajustar:
 *  - capa
 *  - texto de tela de cada cena
 *  - narração de cada cena (o que será falado pelo TTS)
 *  - CTA final
 */
export default function EditorRoteiro({
  roteiroInicial,
  onConfirmar,
  onCancelar,
}: Props) {
  const [roteiro, setRoteiro] = useState<RoteiroGerado>(roteiroInicial);

  function atualizarCena(idx: number, campo: keyof Cena, valor: string) {
    const novasCenas = [...roteiro.cenas];
    novasCenas[idx] = { ...novasCenas[idx], [campo]: valor };
    setRoteiro({ ...roteiro, cenas: novasCenas });
  }

  function caracteresNarracaoTotal(): number {
    return roteiro.cenas.reduce(
      (acc, c) => acc + (c.narracao?.trim().length ?? 0),
      0
    );
  }

  const totalChars = caracteresNarracaoTotal();

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-sm">
          ✏️
        </div>
        <h3 className="font-bold text-white flex-1">Editar Roteiro</h3>
      </div>

      <p className="text-xs text-zinc-400">
        Ajuste textos e narração antes de gerar voz. Total: <span className="text-amber-400 font-bold">{totalChars} caracteres</span> {totalChars > 0 && "de narração"}.
      </p>

      {/* Capa */}
      <div>
        <label className="block text-xs font-semibold text-zinc-300 mb-1">
          🎬 Capa
        </label>
        <input
          type="text"
          value={roteiro.capa}
          onChange={(e) => setRoteiro({ ...roteiro, capa: e.target.value })}
          className="w-full px-3 py-2 rounded-xl bg-zinc-800 text-white text-sm outline-none focus:ring-2 focus:ring-fuchsia-500"
        />
      </div>

      {/* Cenas */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-zinc-300">
          🎞️ Cenas
        </label>
        {roteiro.cenas.map((cena, idx) => (
          <div
            key={cena.numero}
            className="bg-zinc-800 border border-zinc-700 rounded-xl p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-fuchsia-400">
                CENA {cena.numero}
              </span>
              <span className="text-xs text-zinc-500">
                {cena.duracaoSegundos}s
              </span>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                Texto na tela
              </label>
              <input
                type="text"
                value={cena.textoTela}
                onChange={(e) =>
                  atualizarCena(idx, "textoTela", e.target.value)
                }
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 text-white text-sm outline-none focus:ring-2 focus:ring-fuchsia-500"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                🎙️ Narração (o que a voz vai falar)
              </label>
              <textarea
                value={cena.narracao}
                onChange={(e) =>
                  atualizarCena(idx, "narracao", e.target.value)
                }
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 text-white text-sm outline-none focus:ring-2 focus:ring-fuchsia-500 resize-none"
              />
              <p className="text-[10px] text-zinc-500 mt-1 text-right">
                {cena.narracao.length} chars
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div>
        <label className="block text-xs font-semibold text-zinc-300 mb-1">
          📣 CTA final
        </label>
        <input
          type="text"
          value={roteiro.ctaFinal}
          onChange={(e) => setRoteiro({ ...roteiro, ctaFinal: e.target.value })}
          className="w-full px-3 py-2 rounded-xl bg-zinc-800 text-white text-sm outline-none focus:ring-2 focus:ring-fuchsia-500"
        />
      </div>

      {/* Ações */}
      <div className="grid grid-cols-2 gap-2 pt-2">
        <button
          type="button"
          onClick={onCancelar}
          className="py-3 rounded-xl font-bold bg-zinc-800 text-white text-sm active:scale-95"
        >
          ← Cancelar
        </button>
        <button
          type="button"
          onClick={() => onConfirmar(roteiro)}
          className="py-3 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm shadow-lg shadow-amber-500/30 active:scale-95"
        >
          ✓ Confirmar
        </button>
      </div>
    </div>
  );
}
