import type { ImagemUpload } from "@/types";
import type { ImagemSerializada } from "@/types/video";

/**
 * Converte um File em data URL (base64) com compressão para 1080px de largura.
 * Reduz drasticamente o tamanho do payload enviado para a API.
 */
export async function comprimirParaDataUrl(
  file: File,
  larguraAlvo = 1080
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const escala = Math.min(1, larguraAlvo / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas não suportado");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        URL.revokeObjectURL(url);
        resolve(dataUrl);
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

/**
 * Converte a lista de uploads em formato serializável (data URL).
 */
export async function prepararImagens(
  imagens: ImagemUpload[]
): Promise<ImagemSerializada[]> {
  const resultado: ImagemSerializada[] = [];
  for (const img of imagens) {
    const dataUrl = await comprimirParaDataUrl(img.file);
    resultado.push({ id: img.id, dataUrl });
  }
  return resultado;
}
