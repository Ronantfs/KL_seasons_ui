export interface ProcessedImage {
  dataUrl: string;
  base64: string;
  width: number;
  height: number;
}

const TARGET_W = 400;
const TARGET_H = 225;
const TARGET_RATIO = TARGET_W / TARGET_H;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // strip "data:image/webp;base64," prefix
      const idx = result.indexOf(",");
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function processImageFile(file: File): Promise<ProcessedImage> {
  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(dataUrl);

  const canvas = document.createElement("canvas");
  canvas.width = TARGET_W;
  canvas.height = TARGET_H;
  const ctx = canvas.getContext("2d")!;

  // center-crop to 16:9
  const srcRatio = img.width / img.height;
  let sx: number, sy: number, sw: number, sh: number;

  if (srcRatio > TARGET_RATIO) {
    // source is wider — crop horizontally
    sh = img.height;
    sw = img.height * TARGET_RATIO;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    // source is taller — crop vertically
    sw = img.width;
    sh = img.width / TARGET_RATIO;
    sx = 0;
    sy = (img.height - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, TARGET_W, TARGET_H);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))),
      "image/webp",
      0.8,
    );
  });

  const processedDataUrl = URL.createObjectURL(blob);
  const base64 = await blobToBase64(blob);

  return {
    dataUrl: processedDataUrl,
    base64,
    width: TARGET_W,
    height: TARGET_H,
  };
}

/** Strip extension and replace non-safe chars with underscores. */
export function sanitizeImageName(filename: string): string {
  const withoutExt = filename.replace(/\.[^.]+$/, "");
  return withoutExt.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_");
}
