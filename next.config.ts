// next.config.js  (ou .mjs/.ts — adapte ao que você já usa)
//
// CRÍTICO: impede o Next de empacotar o fluent-ffmpeg e o binário do
// ffmpeg-static. Sem isto, o caminho do binário aponta para dentro de .next,
// o arquivo não existe (ou perde permissão de execução) e o render falha.

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 15+
  serverExternalPackages: ["fluent-ffmpeg", "ffmpeg-static"],

  // Se você estiver no Next.js 14, REMOVA a linha acima e use esta no lugar:
  // experimental: {
  //   serverComponentsExternalPackages: ["fluent-ffmpeg", "ffmpeg-static"],
  // },
};

export default nextConfig;
