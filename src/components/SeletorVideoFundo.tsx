"use client";

import { useEffect, useState } from "react";

interface VideoItem {
  nome: string;
  arquivo: string;
  url: string;
  categoria: string;
}

interface CategoriaItem {
  categoria: string;
  videos: VideoItem[];
}

interface Props {
  /** URL atualmente selecionada (null = sem vídeo de fundo) */
  valor: string | null;
  onChange: (url: string | null) => void;
}

/**
 * Permite escolher um vídeo de fundo do `/public/videos/`.
 * Subpastas viram categorias automaticamente.
 *
 * Se não houver nenhum vídeo, o componente renderiza um aviso amigável
 * explicando como adicionar - SEM esconder a UI.
 */
export default function SeletorVideoFundo({ valor, onChange }: Props) {
  const [categorias, setCategorias] = useState<CategoriaItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setErro(null);

    fetch("/api/videos-fundo")
      .then((r) => r.json())
      .then((d) => {
        if (cancelado) return;
        const cats = Array.isArray(d?.categorias) ? d.categorias : [];
        setCategorias(cats);
        if (cats.length > 0) {
          setCategoriaAtiva(cats[0].categoria);
        }
      })
      .catch((e) => {
        if (cancelado) return;
        setErro(String(e?.message ?? e));
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  const ativado = valor !== null;
  const totalVideos = categorias.reduce((acc, c) => acc + c.videos.length, 0);
  const categoriaSelecionada =
    categorias.find((c) => c.categoria === categoriaAtiva) ?? null;

  return (
    <div className="space-y-2">
      {/* Toggle ativar/desativar */}
      <label
        className={`flex items-start gap-3 p-3 bg-zinc-800 rounded-xl ${
          totalVideos > 0
            ? "cursor-pointer active:scale-[0.98]"
            : "opacity-70"
        }`}
      >
        <input
          type="checkbox"
          checked={ativado}
          disabled={totalVideos === 0}
          onChange={(e) => {
            if (e.target.checked) {
              // Ao ativar, seleciona o primeiro vídeo da primeira categoria
              const primeira = categorias[0];
              const primeiroVideo = primeira?.videos[0];
              onChange(primeiroVideo?.url ?? null);
            } else {
              onChange(null);
            }
          }}
          className="w-5 h-5 accent-fuchsia-500 shrink-0 mt-0.5"
        />
        <div className="flex-1">
          <div className="text-sm font-semibold text-white">
            🎞️ Vídeo de fundo (B-roll)
          </div>
          <div className="text-xs text-zinc-400">
            {carregando
              ? "Carregando vídeos disponíveis..."
              : erro
              ? `❌ Erro: ${erro}`
              : totalVideos === 0
              ? "Adicione MP4s em /public/videos/ pra ativar"
              : `${totalVideos} vídeo${totalVideos > 1 ? "s" : ""} disponível${
                  totalVideos > 1 ? "is" : ""
                } em ${categorias.length} categoria${
                  categorias.length > 1 ? "s" : ""
                }`}
          </div>
        </div>
      </label>

      {/* Aviso de timeout Vercel */}
      {ativado && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200">
          <div className="font-semibold mb-1">⚠️ Atenção em produção</div>
          <p className="text-amber-200/80 leading-relaxed">
            Vídeo de fundo aumenta o tempo de render (~+30-50%).
            Em Vercel Free, render pode estourar o timeout de 60s.
            Recomendado: Vercel Pro (300s) ou servidor próprio.
          </p>
        </div>
      )}

      {/* Sem vídeos: dica de como adicionar */}
      {!carregando && totalVideos === 0 && (
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-3 text-xs text-zinc-400 leading-relaxed">
          <div className="font-semibold text-zinc-300 mb-1">
            💡 Como adicionar vídeos
          </div>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>
              Crie a pasta <code className="text-fuchsia-400">public/videos/</code>
            </li>
            <li>
              Adicione subpastas como <code className="text-fuchsia-400">pet/</code>,{" "}
              <code className="text-fuchsia-400">lifestyle/</code> etc.
            </li>
            <li>Coloque MP4s dentro</li>
            <li>App detecta sozinho na próxima reload</li>
          </ol>
        </div>
      )}

      {/* Lista de vídeos por categoria (só se ativado) */}
      {ativado && categorias.length > 0 && (
        <>
          {/* Abas de categorias */}
          {categorias.length > 1 && (
            <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
              {categorias.map((c) => {
                const ativo = c.categoria === categoriaAtiva;
                const labelCategoria =
                  c.categoria === "_geral" ? "Geral" : c.categoria;
                return (
                  <button
                    key={c.categoria}
                    type="button"
                    onClick={() => setCategoriaAtiva(c.categoria)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                      ativo
                        ? "bg-fuchsia-500 text-white"
                        : "bg-zinc-800 text-zinc-400 active:scale-95"
                    }`}
                  >
                    {labelCategoria}{" "}
                    <span className="opacity-60">({c.videos.length})</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Vídeos da categoria ativa */}
          {categoriaSelecionada && (
            <div className="grid grid-cols-2 gap-2">
              {categoriaSelecionada.videos.map((v) => {
                const selecionado = valor === v.url;
                return (
                  <button
                    key={v.url}
                    type="button"
                    onClick={() => onChange(v.url)}
                    className={`group relative rounded-xl overflow-hidden border-2 transition-all aspect-[9/16] bg-zinc-800 active:scale-95 ${
                      selecionado
                        ? "border-fuchsia-500"
                        : "border-transparent"
                    }`}
                  >
                    <video
                      src={v.url}
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover"
                      onMouseEnter={(e) =>
                        (e.currentTarget as HTMLVideoElement).play().catch(() => {})
                      }
                      onMouseLeave={(e) => {
                        const vid = e.currentTarget as HTMLVideoElement;
                        vid.pause();
                        vid.currentTime = 0;
                      }}
                    />
                    {/* Overlay com nome */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2">
                      <div className="text-[10px] text-white font-semibold truncate">
                        {v.nome}
                      </div>
                    </div>
                    {/* Check */}
                    {selecionado && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-fuchsia-500 flex items-center justify-center shadow-lg">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
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
          )}
        </>
      )}

      {/* Indicador: renderização ainda não usa vídeo */}
      {ativado && (
        <p className="text-[10px] text-zinc-500 leading-relaxed italic">
          ℹ️ Etapa 8.1.A: seleção habilitada. Render usando vídeo de fundo
          será ativado na próxima sub-etapa.
        </p>
      )}
    </div>
  );
}
