type DistinctPhotoGalleryOptions = {
  primary?: string | null;
  sources?: Array<Array<string | null | undefined> | string | null | undefined>;
  limit?: number;
};

export const normalizePhotoIdentity = (url: string) => {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url.split("?")[0] || url;
  }
};

export const createDistinctPhotoGallery = ({
  primary,
  sources = [],
  limit,
}: DistinctPhotoGalleryOptions) => {
  const gallery: string[] = [];
  const seen = new Set<string>();

  const push = (value?: string | null) => {
    if (!value) return;
    const trimmed = value.trim();
    if (!trimmed) return;
    const identity = normalizePhotoIdentity(trimmed);
    if (seen.has(identity)) return;
    seen.add(identity);
    gallery.push(trimmed);
  };

  push(primary);

  for (const source of sources) {
    if (Array.isArray(source)) {
      source.forEach(push);
    } else {
      push(source);
    }
  }

  return typeof limit === "number" ? gallery.slice(0, limit) : gallery;
};