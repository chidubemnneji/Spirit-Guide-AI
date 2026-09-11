// Renders a verse as a shareable square image card (SoulGuide-branded),
// inspired by YouVersion's "Verse Images" — one of the biggest organic
// growth loops in the Bible-app category. Pure canvas, no server round trip.

const SIZE = 1080; // Instagram-friendly square
const BG_TOP = "#0B2A1B";
const BG_BOTTOM = "#1E5631";
const TEXT_COLOR = "#F3EEE4";
const ACCENT_COLOR = "#C9963A";

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function generateVerseImageBlob(verseText: string, reference: string): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, SIZE);
  gradient.addColorStop(0, BG_TOP);
  gradient.addColorStop(1, BG_BOTTOM);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Subtle vignette border
  ctx.strokeStyle = "rgba(243, 238, 228, 0.18)";
  ctx.lineWidth = 2;
  ctx.strokeRect(48, 48, SIZE - 96, SIZE - 96);

  const maxTextWidth = SIZE - 200;

  // Fit verse text: try decreasing font sizes until it fits within the
  // vertical space available.
  let fontSize = 58;
  let lines: string[] = [];
  const cleanText = verseText.replace(/\s+/g, " ").trim();
  while (fontSize > 28) {
    ctx.font = `italic ${fontSize}px Georgia, 'Times New Roman', serif`;
    lines = wrapText(ctx, cleanText, maxTextWidth);
    const totalHeight = lines.length * (fontSize * 1.45);
    if (totalHeight < SIZE - 420) break;
    fontSize -= 4;
  }

  ctx.textAlign = "center";
  ctx.fillStyle = TEXT_COLOR;
  const lineHeight = fontSize * 1.45;
  const startY = SIZE / 2 - ((lines.length - 1) * lineHeight) / 2 - 20;
  lines.forEach((line, i) => {
    ctx.fillText(`${i === 0 ? "“" : ""}${line}${i === lines.length - 1 ? "”" : ""}`, SIZE / 2, startY + i * lineHeight);
  });

  // Reference
  ctx.font = "600 30px system-ui, sans-serif";
  ctx.fillStyle = ACCENT_COLOR;
  ctx.letterSpacing = "3px";
  ctx.fillText(reference.toUpperCase(), SIZE / 2, startY + lines.length * lineHeight + 50);
  ctx.letterSpacing = "0px";

  // Footer wordmark
  ctx.font = "italic 34px Georgia, serif";
  ctx.fillStyle = "rgba(243, 238, 228, 0.85)";
  ctx.fillText("SoulGuide", SIZE / 2, SIZE - 90);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to generate image"));
    }, "image/png");
  });
}

// Shares (via the Web Share API, when it supports files) or falls back to
// triggering a browser download of the generated verse-image PNG.
export async function shareVerseImage(verseText: string, reference: string): Promise<void> {
  const blob = await generateVerseImageBlob(verseText, reference);
  const file = new File([blob], `soulguide-${reference.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`, { type: "image/png" });

  const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean };
  if (nav.canShare && nav.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: reference, text: `"${verseText}" — ${reference}` });
      return;
    } catch {
      // User cancelled or share failed — fall through to download.
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
