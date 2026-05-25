import FormularioReel from "@/components/FormularioReel";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Container mobile-first com largura máxima */}
      <div className="mx-auto max-w-md px-4 pt-6 pb-24">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-600 flex items-center justify-center text-lg">
              🎬
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Reels Rápido <span className="text-fuchsia-400">IA</span>
            </h1>
          </div>
          <p className="text-sm text-zinc-400">
            Crie roteiros prontos para Reels e TikTok em segundos
          </p>
        </header>

        {/* Formulário */}
        <FormularioReel />
      </div>
    </main>
  );
}
