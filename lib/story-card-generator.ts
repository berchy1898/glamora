'use client';

export type StoryCardArticleInput = {
  title: string;
  category?: string | null;
  city?: string | null;
  author?: string | null;
  cover_image?: string | null;
  slug: string;
};

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const testLine = current ? `${current} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = testLine;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function downloadArticleStoryCard(
  article: StoryCardArticleInput
): Promise<void> {
  const width = 1080;
  const height = 1920;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Fondo editorial oscuro
  ctx.fillStyle = '#151218';
  ctx.fillRect(0, 0, width, height);

  // Cargar imagen de portada si existe
  if (article.cover_image) {
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = article.cover_image!;
      });

      // Marco central respetando proporción de la foto (sin recortar caras)
      const frameX = 76;
      const frameY = 230;
      const frameW = width - 152;
      const frameH = 1120;

      ctx.fillStyle = '#1e1a23';
      ctx.fillRect(frameX, frameY, frameW, frameH);

      const scale = Math.min(frameW / img.width, frameH / img.height);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const drawX = frameX + (frameW - drawW) / 2;
      const drawY = frameY + (frameH - drawH) / 2;

      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      // Marco fino champagne alrededor
      ctx.strokeStyle = 'rgba(231, 199, 180, 0.38)';
      ctx.lineWidth = 2;
      ctx.strokeRect(frameX, frameY, frameW, frameH);
    } catch {
      // Si CORS impide leer la imagen remota, dibujamos un marco editorial limpio
      ctx.strokeStyle = 'rgba(231, 199, 180, 0.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(76, 230, width - 152, 1120);
    }
  }

  // Cabecera GLAMORA
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e7c7b4';
  ctx.font = '500 20px sans-serif';
  ctx.fillText('T H E   G L A M O R A   D I S P A T C H', width / 2, 102);

  ctx.fillStyle = '#fbf7f2';
  ctx.font = '400 78px Georgia, serif';
  ctx.fillText('GLAMORA', width / 2, 182);

  // Kicker de categoría y ciudad
  const kicker = [article.category || 'EDITORIAL', article.city || 'BOLIVIA']
    .filter(Boolean)
    .join('   ·   ')
    .toUpperCase();

  ctx.fillStyle = '#e7c7b4';
  ctx.font = '600 22px sans-serif';
  ctx.fillText(kicker, width / 2, 1430);

  // Titular del artículo
  ctx.fillStyle = '#fbf7f2';
  ctx.font = '400 62px Georgia, serif';
  const titleLines = wrapCanvasText(ctx, article.title, width - 160).slice(0, 4);
  let y = 1515;
  for (const line of titleLines) {
    ctx.fillText(line, width / 2, y);
    y += 72;
  }

  // Autor o sello inferior
  ctx.fillStyle = 'rgba(244, 234, 224, 0.72)';
  ctx.font = '400 21px sans-serif';
  const footerLabel = article.author
    ? `POR ${article.author.toUpperCase()}   ·   LEER HISTORIA COMPLETA EN GLAMORA`
    : 'LEER HISTORIA COMPLETA EN GLAMORA';
  ctx.fillText(footerLabel, width / 2, 1835);

  // Línea superior e inferior decorativa
  ctx.strokeStyle = 'rgba(231, 199, 180, 0.28)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(76, 1785);
  ctx.lineTo(width - 76, 1785);
  ctx.stroke();

  // Descargar archivo JPG
  const dataUrl = canvas.toDataURL('image/jpeg', 0.94);
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `glamora-story-${article.slug || 'editorial'}.jpg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
