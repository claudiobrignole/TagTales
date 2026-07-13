/**
 * On-screen watermark: logo (white) + tagtalesgallery.com.
 * Mode: both | text (diagonal labels) | logo (corner mark).
 */
export type WatermarkMode = "both" | "text" | "logo";

export function resolveWatermarkMode(img: {
  watermarkEnabled?: boolean;
  watermarkMode?: WatermarkMode | "" | null;
}): WatermarkMode | null {
  if (img.watermarkMode === "both" || img.watermarkMode === "text" || img.watermarkMode === "logo") {
    return img.watermarkMode;
  }
  // Legacy: boolean toggle → both layers
  if (img.watermarkEnabled) return "both";
  return null;
}

export default function ImageWatermarkOverlay({
  mode = "both",
}: {
  mode?: WatermarkMode;
}) {
  const showText = mode === "both" || mode === "text";
  const showLogo = mode === "both" || mode === "logo";
  const tiles = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[5] select-none overflow-hidden"
      aria-hidden="true"
    >
      {showText && (
        <div className="absolute inset-[-35%] flex rotate-[-28deg] flex-wrap content-center justify-center gap-x-10 gap-y-14 opacity-[0.28]">
          {tiles.map((i) => (
            <span
              key={i}
              className="shrink-0 font-['Karla'] text-[11px] font-normal tracking-[0.18em] text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.85)] md:text-sm"
            >
              tagtalesgallery.com
            </span>
          ))}
        </div>
      )}

      {showLogo && (
        <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-md bg-black/35 px-2.5 py-1.5 backdrop-blur-[2px] md:bottom-5 md:left-5 md:gap-2.5 md:px-3 md:py-2">
          <img
            src="/TAGTALES-2lines-white.png"
            alt=""
            className="h-8 w-auto object-contain mix-blend-screen md:h-10"
            draggable={false}
          />
        </div>
      )}
    </div>
  );
}

export function buildWatermarkedSrc(
  originalUrl: string,
  mode: WatermarkMode = "both",
): string {
  if (!originalUrl?.trim()) return originalUrl;
  const params = new URLSearchParams({
    src: originalUrl,
    mode,
  });
  return `/api/media/watermark?${params.toString()}`;
}

export function resolveExhibitionImageSrc(img: {
  url?: string;
  watermarkEnabled?: boolean;
  watermarkMode?: WatermarkMode | "" | null;
}): string {
  const url = img.url || "";
  if (!url) return "";
  const mode = resolveWatermarkMode(img);
  if (mode && !/\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url)) {
    return buildWatermarkedSrc(url, mode);
  }
  return url;
}
