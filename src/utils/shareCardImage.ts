/**
 * Generates a 1080×1920 (9:16 Instagram Story / TikTok) JPEG recap card for a
 * trip plan using the Canvas 2D API — no runtime dependencies.
 *
 * We deliberately avoid embedding the destination hero photo: most of our
 * hero images come from Google Places (places.googleapis.com) which does
 * not serve a permissive CORS header, so `canvas.toDataURL()` would throw
 * SecurityError("tainted canvas"). Instead we draw a pure-brand design that
 * holds up on its own and doesn't depend on third-party image rights.
 */

type CardData = {
  destination: string;
  origin?: string;
  days: number;
  stops: number;
  stays: number;
  flights: number;
  dayTitles?: string[];
};

const WIDTH = 1080;
const HEIGHT = 1920;

const PRIMARY = "hsl(234, 62%, 47%)";
const PRIMARY_LIGHT = "hsl(234, 62%, 58%)";
const PRIMARY_DARK = "hsl(234, 62%, 32%)";

/** Wraps text at `maxWidth`, returns the lines. */
const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = 3,
): string[] => {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const attempt = current ? current + " " + w : w;
    if (ctx.measureText(attempt).width <= maxWidth) {
      current = attempt;
    } else {
      if (current) lines.push(current);
      current = w;
      if (lines.length === maxLines - 1) break;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, maxLines);
};

const drawJollidayMark = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string,
) => {
  // Same silhouette as <LogoMark /> (4-pointed north-star), rasterized from the SVG path.
  const scale = size / 64;
  ctx.save();
  ctx.translate(cx - size / 2, cy - size / 2);
  ctx.scale(scale, scale);
  ctx.fillStyle = color;
  const path = new Path2D(
    "M32 12 C32.7 20.5 34.8 28.4 41.8 30.4 C48.8 32.4 48.8 31.2 50.8 32 C48.8 32.8 48.8 31.6 41.8 33.6 C34.8 35.6 32.7 43.5 32 52 C31.3 43.5 29.2 35.6 22.2 33.6 C15.2 31.6 15.2 32.8 13.2 32 C15.2 31.2 15.2 32.4 22.2 30.4 C29.2 28.4 31.3 20.5 32 12 Z",
  );
  ctx.fill(path);
  ctx.restore();
};

const drawNoise = (ctx: CanvasRenderingContext2D, alpha = 0.04) => {
  const img = ctx.getImageData(0, 0, WIDTH, HEIGHT);
  const buf = img.data;
  for (let i = 0; i < buf.length; i += 4) {
    const n = (Math.random() * 2 - 1) * 12;
    buf[i] = Math.max(0, Math.min(255, buf[i] + n));
    buf[i + 1] = Math.max(0, Math.min(255, buf[i + 1] + n));
    buf[i + 2] = Math.max(0, Math.min(255, buf[i + 2] + n));
    buf[i + 3] = Math.min(255, buf[i + 3] * (1 + alpha * 0));
  }
  ctx.putImageData(img, 0, 0);
};

const drawBackground = (ctx: CanvasRenderingContext2D) => {
  // Base radial wash
  const g = ctx.createRadialGradient(
    WIDTH * 0.5,
    HEIGHT * 0.1,
    0,
    WIDTH * 0.5,
    HEIGHT * 0.55,
    Math.max(WIDTH, HEIGHT),
  );
  g.addColorStop(0, PRIMARY_LIGHT);
  g.addColorStop(0.55, PRIMARY);
  g.addColorStop(1, PRIMARY_DARK);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Soft orbs
  ctx.globalCompositeOperation = "lighter";
  const orb = (cx: number, cy: number, r: number, a: number) => {
    const og = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    og.addColorStop(0, `rgba(255,255,255,${a})`);
    og.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = og;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  };
  orb(WIDTH * 0.85, HEIGHT * 0.12, 520, 0.28);
  orb(WIDTH * 0.1, HEIGHT * 0.8, 620, 0.18);
  ctx.globalCompositeOperation = "source-over";

  // Dot grid, very subtle
  ctx.fillStyle = "rgba(255,255,255,0.07)";
  const step = 42;
  for (let x = step / 2; x < WIDTH; x += step) {
    for (let y = step / 2; y < HEIGHT; y += step) {
      ctx.beginPath();
      ctx.arc(x, y, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
};

const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

/** Render the image synchronously; resolves once the font set is ready. */
const renderCard = async (data: CardData): Promise<HTMLCanvasElement> => {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");

  // Wait for web fonts so the card doesn't flash Times New Roman on mobile Safari
  try {
    if (typeof document !== "undefined" && (document as any).fonts?.ready) {
      await (document as any).fonts.ready;
    }
  } catch {
    /* ignore */
  }

  drawBackground(ctx);

  // Header — logo + wordmark
  ctx.textAlign = "center";
  drawJollidayMark(ctx, WIDTH / 2 - 120, 150, 56, "#ffffff");
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 52px 'Plus Jakarta Sans', 'Inter', sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText("Jolliday", WIDTH / 2 + 30, 150);

  // Eyebrow "Your trip"
  ctx.font = "600 28px 'Inter', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  const eyebrow = data.origin
    ? `${data.origin.toUpperCase()}   →   ${data.destination.toUpperCase()}`
    : "YOUR JOLLIDAY";
  ctx.fillText(
    eyebrow.length > 40 ? eyebrow.slice(0, 37) + "…" : eyebrow,
    WIDTH / 2,
    280,
  );

  // Destination — big hero title, wrap if needed
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  const destSize = data.destination.length > 12 ? 200 : 260;
  ctx.font = `900 ${destSize}px 'Plus Jakarta Sans', 'Inter', sans-serif`;
  const lines = wrapText(ctx, data.destination, WIDTH - 160, 2);
  const lineHeight = destSize * 1.02;
  const totalHeight = lineHeight * lines.length;
  let y = 460 + lineHeight / 2 + (3 - lines.length) * 30;
  lines.forEach((ln, idx) => {
    ctx.fillText(ln, WIDTH / 2, y + idx * lineHeight);
  });
  y = 460 + totalHeight + 60;

  // Stat tiles row
  const tileStats: { value: string; label: string }[] = [
    { value: String(data.days), label: "DAYS" },
    { value: String(data.stops), label: "STOPS" },
    { value: String(data.stays), label: "STAYS" },
    { value: data.flights > 0 ? String(data.flights) : "—", label: "FLIGHTS" },
  ];
  const tileW = 210;
  const tileH = 180;
  const gap = 22;
  const totalTilesW = tileW * tileStats.length + gap * (tileStats.length - 1);
  const startX = (WIDTH - totalTilesW) / 2;
  tileStats.forEach((s, i) => {
    const x = startX + i * (tileW + gap);
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    drawRoundedRect(ctx, x, y, tileW, tileH, 28);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, x, y, tileW, tileH, 28);
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 84px 'Plus Jakarta Sans', sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText(s.value, x + tileW / 2, y + 70);
    ctx.font = "700 26px 'Inter', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText(s.label, x + tileW / 2, y + tileH - 36);
  });
  y += tileH + 90;

  // Day rail — 8 numbered dots, first filled
  const dotCount = Math.min(8, Math.max(3, data.days));
  const railW = WIDTH - 220;
  const dotSpacing = railW / (dotCount - 1);
  const dotY = y + 30;
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 3;
  ctx.setLineDash([4, 8]);
  ctx.beginPath();
  ctx.moveTo(110, dotY);
  ctx.lineTo(110 + railW, dotY);
  ctx.stroke();
  ctx.setLineDash([]);
  for (let i = 0; i < dotCount; i++) {
    const dx = 110 + i * dotSpacing;
    if (i === 0) {
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(dx, dotY, 14, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = PRIMARY_DARK;
      ctx.beginPath();
      ctx.arc(dx, dotY, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(dx, dotY, 12, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Day titles teaser (first 2 day titles)
  if (data.dayTitles && data.dayTitles.length > 0) {
    y = dotY + 80;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = "600 32px 'Inter', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    const teaser = data.dayTitles
      .slice(0, 2)
      .map((t, i) => `Day ${i + 1} · ${t}`)
      .join("    ·    ");
    const teaserLines = wrapText(ctx, teaser, WIDTH - 160, 2);
    teaserLines.forEach((ln, idx) => {
      ctx.fillText(ln, WIDTH / 2, y + idx * 44);
    });
  }

  // Footer — watermark card
  const footerY = HEIGHT - 220;
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  drawRoundedRect(ctx, 90, footerY, WIDTH - 180, 140, 40);
  ctx.fill();
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  drawJollidayMark(ctx, 170, footerY + 70, 56, "#ffffff");
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 38px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("Planned with Jolliday", 220, footerY + 52);
  ctx.font = "500 26px 'Inter', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText("jolliday.ai · any trip, in one chat", 220, footerY + 92);

  // Final noise pass for depth
  drawNoise(ctx);

  return canvas;
};

/** Produce a Blob for download or share. */
export const generateShareCardBlob = async (data: CardData): Promise<Blob> => {
  const canvas = await renderCard(data);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      0.92,
    );
  });
};

/**
 * Kicks off the best available sharing path and gracefully degrades:
 * 1. navigator.share with the image file (mobile iOS/Android)
 * 2. Otherwise, triggers a direct download of the JPEG
 */
export const shareTripCard = async (
  data: CardData,
): Promise<"shared" | "downloaded" | "failed"> => {
  try {
    const blob = await generateShareCardBlob(data);
    const filename = `jolliday-${data.destination
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}.jpg`;
    const file = new File([blob], filename, { type: "image/jpeg" });

    const nav = navigator as Navigator & {
      canShare?: (d: { files?: File[] }) => boolean;
    };
    if (nav.share && nav.canShare?.({ files: [file] })) {
      await nav.share({
        files: [file],
        title: `My ${data.destination} trip`,
        text: `${data.days} days in ${data.destination} — planned with Jolliday`,
      });
      return "shared";
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return "downloaded";
  } catch (err) {
    if ((err as DOMException)?.name === "AbortError") return "failed";
    // Keep error silent — caller decides how to toast.
    console.error("shareTripCard failed", err);
    return "failed";
  }
};
