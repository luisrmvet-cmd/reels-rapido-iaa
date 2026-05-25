"use client";

import { useRef } from "react";
import type { ImagemUpload } from "@/types";

interface Props {
  imagens: ImagemUpload[];
  onChange: (imagens: ImagemUpload[]) => void;
  min?: number;
  max?: number;
}

export default function UploadImagens({
  imagens,
  onChange,
  min = 3,
  max = 5,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function abrirSeletor() {
    inputRef.current?.click();
  }

  function handleArquivosSelecionados(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(e.target.files ?? []);
    if (arquivos.length === 0) return;

    const espacoLivre = max - imagens.length;
    const arquivosAceitos = arquivos.slice(0, espacoLivre);

    const novosUploads: ImagemUpload[] = arquivosAceitos.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    onChange([...imagens, ...novosUploads]);

    // Limpa o input pra permitir selecionar o mesmo arquivo de novo se precisar
    if (inputRef.current) inputRef.current.value = "";
  }

  function removerImagem(id: string) {
    const alvo = imagens.find((i) => i.id === id);
    if (alvo) URL.revokeObjectURL(alvo.previewUrl);
    onChange(imagens.filter((i) => i.id !== id));
  }

  const cheio = imagens.length >= max;

  return (
    <div>
      <label className="block text-sm font-semibold text-zinc-300 mb-2">
        Imagens / prints ({imagens.length}/{max})
      </label>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleArquivosSelecionados}
      />

      <div className="grid grid-cols-3 gap-2">
        {imagens.map((img, idx) => (
          <div
            key={img.id}
            className="relative aspect-[9/16] rounded-xl overflow-hidden bg-zinc-800"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.previewUrl}
              alt={`Imagem ${idx + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => removerImagem(img.id)}
              className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center active:scale-90"
              aria-label="Remover imagem"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 6l12 12M6 18L18 6"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs font-bold px-2 py-0.5 rounded-md">
              {idx + 1}
            </div>
          </div>
        ))}

        {!cheio && (
          <button
            type="button"
            onClick={abrirSeletor}
            className="aspect-[9/16] rounded-xl border-2 border-dashed border-zinc-600 flex flex-col items-center justify-center text-zinc-400 active:scale-95 active:bg-zinc-800"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-xs mt-1 font-semibold">Adicionar</span>
          </button>
        )}
      </div>

      <p className="mt-2 text-xs text-zinc-500">
        Mínimo {min}, máximo {max} imagens. Toque em uma imagem para remover.
      </p>
    </div>
  );
}
