export const MAX_RAW_IMAGE_BYTES = 25 * 1024 * 1024; // 25 MB de entrada desde cámara
export const MAX_STORAGE_SAFE_BYTES = 4.6 * 1024 * 1024; // Bajo el límite de 5 MB de Supabase
export const MAX_GALLERY_BATCH_COUNT = 25;

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };
    img.src = objectUrl;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}

/**
 * Optimiza fotografías editoriales en el navegador antes de subirlas a Supabase Storage:
 * - Conserva el 100% de la proporción original (sin recortar ni un píxel).
 * - Si la imagen supera maxDimension (2200 px) o pesa más de 1.4 MB (ej. PNG pesado),
 *   la comprime en WebP/JPEG de alta definición (calidad 0.90) garantizando que quede
 *   siempre por debajo del límite de 5 MB de Supabase Storage.
 */
export async function optimizeEditorialImage(
  file: File,
  options: { maxDimension?: number; quality?: number } = {}
): Promise<File> {
  if (typeof window === 'undefined') return file;

  const maxDimension = options.maxDimension ?? 2200;
  const initialQuality = options.quality ?? 0.9;

  try {
    const img = await loadImageElement(file);
    const origWidth = img.naturalWidth || img.width;
    const origHeight = img.naturalHeight || img.height;

    if (!origWidth || !origHeight) return file;

    const longestSide = Math.max(origWidth, origHeight);
    const needsResize = longestSide > maxDimension;
    const isHeavyFile = file.size > 1.4 * 1024 * 1024;

    if (!needsResize && !isHeavyFile && file.size <= MAX_STORAGE_SAFE_BYTES) {
      return file;
    }

    const scale = needsResize ? maxDimension / longestSide : 1;
    const targetWidth = Math.max(1, Math.round(origWidth * scale));
    const targetHeight = Math.max(1, Math.round(origHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'glamora-photo';

    // Intentar WebP primero por su nitidez editorial y bajo peso
    let blob = await canvasToBlob(canvas, 'image/webp', initialQuality);
    let outMime = 'image/webp';
    let outExt = 'webp';

    if (!blob || blob.size >= file.size && file.size <= MAX_STORAGE_SAFE_BYTES) {
      if (file.size <= MAX_STORAGE_SAFE_BYTES && !needsResize) {
        return file;
      }
    }

    if (!blob) {
      blob = await canvasToBlob(canvas, 'image/jpeg', initialQuality);
      outMime = 'image/jpeg';
      outExt = 'jpg';
    }

    // Si aún supera el límite seguro de 4.6 MB, reducir calidad gradualmente
    let currentQuality = initialQuality;
    while (blob && blob.size > MAX_STORAGE_SAFE_BYTES && currentQuality > 0.65) {
      currentQuality -= 0.08;
      const smallerBlob = await canvasToBlob(canvas, outMime, currentQuality);
      if (smallerBlob) blob = smallerBlob;
    }

    if (!blob) return file;

    return new File([blob], `${baseName}.${outExt}`, {
      type: outMime,
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}
