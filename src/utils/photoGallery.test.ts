import { describe, expect, it } from "vitest";

import {
  createDistinctPhotoGallery,
  dedupePhotos,
  normalizePhotoIdentity,
  pickDestinationPhotos,
  pickVenuePhotos,
  selectGalleryPhotos,
  selectVenuePhotos,
} from "./photoGallery";

describe("dedupePhotos", () => {
  it("preserves first-seen order for unique URLs", () => {
    const result = dedupePhotos([
      "https://a.com/1.jpg",
      "https://b.com/2.jpg",
      "https://c.com/3.jpg",
    ]);
    expect(result).toEqual([
      "https://a.com/1.jpg",
      "https://b.com/2.jpg",
      "https://c.com/3.jpg",
    ]);
  });

  it("collapses case-insensitive duplicates", () => {
    const result = dedupePhotos([
      "https://Example.com/Photo.jpg",
      "https://example.com/photo.jpg",
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe("https://Example.com/Photo.jpg");
  });

  it("ignores query strings and fragments when comparing", () => {
    const result = dedupePhotos([
      "https://cdn.example.com/photo.jpg?w=200",
      "https://cdn.example.com/photo.jpg?w=800",
      "https://cdn.example.com/photo.jpg#thumb",
    ]);
    expect(result).toEqual(["https://cdn.example.com/photo.jpg?w=200"]);
  });

  it("skips empty, whitespace, null, and non-string entries", () => {
    const result = dedupePhotos([
      "",
      "   ",
      null,
      undefined,
      "https://a.com/1.jpg",
    ]);
    expect(result).toEqual(["https://a.com/1.jpg"]);
  });

  it("accepts Photo objects and reduces them to URLs", () => {
    const result = dedupePhotos([
      { url: "https://a.com/1.jpg" },
      { url: "https://a.com/1.jpg?w=400" },
      "https://b.com/2.jpg",
    ]);
    expect(result).toEqual(["https://a.com/1.jpg", "https://b.com/2.jpg"]);
  });

  it("returns an empty array for non-array inputs", () => {
    expect(dedupePhotos(null)).toEqual([]);
    expect(dedupePhotos(undefined)).toEqual([]);
  });

  it("handles relative paths by falling back to manual query stripping", () => {
    const result = dedupePhotos(["/img/a.jpg?v=1", "/img/a.jpg?v=2"]);
    expect(result).toEqual(["/img/a.jpg?v=1"]);
  });
});

describe("selectGalleryPhotos", () => {
  it("prioritizes enriched, then venuePhotos, then curated", () => {
    const result = selectGalleryPhotos({
      enriched: ["https://e.com/1.jpg", "https://e.com/2.jpg"],
      venuePhotos: {
        v1: [{ url: "https://v.com/a.jpg" }, { url: "https://v.com/b.jpg" }],
      },
      curated: ["https://c.com/x.jpg"],
    });
    expect(result).toEqual([
      "https://e.com/1.jpg",
      "https://e.com/2.jpg",
      "https://v.com/a.jpg",
      "https://v.com/b.jpg",
      "https://c.com/x.jpg",
    ]);
  });

  it("deduplicates across sources ignoring query strings", () => {
    const result = selectGalleryPhotos({
      enriched: ["https://cdn.com/p.jpg?w=100"],
      venuePhotos: { v1: [{ url: "https://cdn.com/p.jpg?w=400" }] },
      curated: ["https://CDN.com/p.jpg"],
    });
    expect(result).toEqual(["https://cdn.com/p.jpg?w=100"]);
  });

  it("caps the result at the default max of 12", () => {
    const enriched = Array.from({ length: 20 }, (_, i) => `https://e.com/${i}.jpg`);
    const result = selectGalleryPhotos({ enriched });
    expect(result).toHaveLength(12);
    expect(result[0]).toBe("https://e.com/0.jpg");
    expect(result[11]).toBe("https://e.com/11.jpg");
  });

  it("respects a custom max", () => {
    const result = selectGalleryPhotos({
      enriched: ["a", "b", "c", "d"].map((k) => `https://e.com/${k}.jpg`),
      max: 2,
    });
    expect(result).toEqual(["https://e.com/a.jpg", "https://e.com/b.jpg"]);
  });

  it("returns an empty array when max is 0", () => {
    expect(
      selectGalleryPhotos({ enriched: ["https://e.com/a.jpg"], max: 0 })
    ).toEqual([]);
  });

  it("returns an empty array when no sources are provided", () => {
    expect(selectGalleryPhotos({})).toEqual([]);
  });

  it("tolerates missing fields and malformed entries", () => {
    const result = selectGalleryPhotos({
      enriched: undefined,
      venuePhotos: {
        v1: [
          { url: null as unknown as string },
          { url: "https://v.com/ok.jpg" },
        ],
      },
      curated: undefined,
    });
    expect(result).toEqual(["https://v.com/ok.jpg"]);
  });
});

describe("normalizePhotoIdentity", () => {
  it("strips query params and lowercases absolute URLs", () => {
    expect(normalizePhotoIdentity("https://Example.COM/Path/IMG.JPG?x=1")).toBe(
      "https://example.com/path/img.jpg"
    );
  });

  it("handles malformed URLs by trimming query string", () => {
    expect(normalizePhotoIdentity("not a url?q=1")).toBe("not a url");
  });
});

describe("pickDestinationPhotos", () => {
  it("prefers enriched photos over curated fallbacks", () => {
    const result = pickDestinationPhotos(
      [{ url: "https://e.com/1.jpg", caption: "hero" }],
      ["https://city.com/x.jpg"],
      3,
    );
    expect(result).toEqual([
      { url: "https://e.com/1.jpg", caption: "hero" },
      { url: "https://city.com/x.jpg" },
    ]);
  });

  it("deduplicates across sources ignoring query strings", () => {
    const result = pickDestinationPhotos(
      [{ url: "https://cdn.com/p.jpg?w=100" }],
      ["https://CDN.com/p.jpg?w=400"],
      5,
    );
    expect(result).toEqual([{ url: "https://cdn.com/p.jpg?w=100" }]);
  });

  it("caps the result at `count`", () => {
    const enriched = Array.from({ length: 10 }, (_, i) => ({ url: `https://e.com/${i}.jpg` }));
    const result = pickDestinationPhotos(enriched, [], 3);
    expect(result).toHaveLength(3);
    expect(result.map((p) => p.url)).toEqual([
      "https://e.com/0.jpg",
      "https://e.com/1.jpg",
      "https://e.com/2.jpg",
    ]);
  });

  it("returns [] for null / undefined / empty inputs", () => {
    expect(pickDestinationPhotos(null, null, 5)).toEqual([]);
    expect(pickDestinationPhotos(undefined, undefined, 5)).toEqual([]);
    expect(pickDestinationPhotos([], [], 5)).toEqual([]);
  });

  it("returns [] when count is 0 or negative", () => {
    expect(
      pickDestinationPhotos([{ url: "https://e.com/1.jpg" }], [], 0),
    ).toEqual([]);
    expect(
      pickDestinationPhotos([{ url: "https://e.com/1.jpg" }], [], -4),
    ).toEqual([]);
  });

  it("preserves thumbUrl and caption when provided", () => {
    const result = pickDestinationPhotos(
      [{ url: "https://e.com/1.jpg", thumbUrl: "https://e.com/1_s.jpg", caption: "Sunset" }],
      [],
      1,
    );
    expect(result).toEqual([
      { url: "https://e.com/1.jpg", thumbUrl: "https://e.com/1_s.jpg", caption: "Sunset" },
    ]);
  });

  it("accepts bare string URLs in addition to Photo objects", () => {
    const result = pickDestinationPhotos(
      ["https://e.com/1.jpg"],
      ["https://city.com/x.jpg"],
      5,
    );
    expect(result).toEqual([
      { url: "https://e.com/1.jpg" },
      { url: "https://city.com/x.jpg" },
    ]);
  });
});

describe("pickVenuePhotos", () => {
  it("returns up to `count` photos for the requested venue", () => {
    const result = pickVenuePhotos(
      "Eiffel Tower",
      {
        "Eiffel Tower": [
          { url: "https://v.com/a.jpg" },
          { url: "https://v.com/b.jpg" },
          { url: "https://v.com/c.jpg" },
        ],
        "Louvre": [{ url: "https://v.com/l.jpg" }],
      },
      2,
    );
    expect(result).toEqual([
      { url: "https://v.com/a.jpg" },
      { url: "https://v.com/b.jpg" },
    ]);
  });

  it("deduplicates duplicate venue entries", () => {
    const result = pickVenuePhotos(
      "v1",
      {
        v1: [
          { url: "https://v.com/a.jpg?w=100" },
          { url: "https://v.com/a.jpg?w=400" },
          { url: "https://v.com/b.jpg" },
        ],
      },
      4,
    );
    expect(result).toEqual([
      { url: "https://v.com/a.jpg?w=100" },
      { url: "https://v.com/b.jpg" },
    ]);
  });

  it("returns [] for unknown venue keys", () => {
    expect(
      pickVenuePhotos("Unknown", { "Known": [{ url: "https://v.com/a.jpg" }] }, 3),
    ).toEqual([]);
  });

  it("returns [] when the map is null / undefined / empty", () => {
    expect(pickVenuePhotos("x", null, 3)).toEqual([]);
    expect(pickVenuePhotos("x", undefined, 3)).toEqual([]);
    expect(pickVenuePhotos("x", {}, 3)).toEqual([]);
  });

  it("returns [] for empty / non-string venue keys", () => {
    expect(pickVenuePhotos("", { x: [{ url: "https://v.com/a.jpg" }] }, 3)).toEqual([]);
    expect(
      pickVenuePhotos(null, { x: [{ url: "https://v.com/a.jpg" }] }, 3),
    ).toEqual([]);
  });

  it("returns [] when count is 0", () => {
    expect(
      pickVenuePhotos("v1", { v1: [{ url: "https://v.com/a.jpg" }] }, 0),
    ).toEqual([]);
  });

  it("accepts string entries in addition to Photo objects", () => {
    const result = pickVenuePhotos(
      "v1",
      { v1: ["https://v.com/a.jpg", { url: "https://v.com/b.jpg" }] },
      5,
    );
    expect(result).toEqual([
      { url: "https://v.com/a.jpg" },
      { url: "https://v.com/b.jpg" },
    ]);
  });

  it("accepts legacy { photo, thumbPhoto } shape", () => {
    const result = pickVenuePhotos(
      "v1",
      {
        v1: [
          { photo: "https://v.com/a.jpg", thumbPhoto: "https://v.com/a_s.jpg" },
          { photo: null },
        ],
      },
      5,
    );
    expect(result).toEqual([
      { url: "https://v.com/a.jpg", thumbUrl: "https://v.com/a_s.jpg" },
    ]);
  });
});

describe("createDistinctPhotoGallery (legacy)", () => {
  it("still orders primary first and respects limit", () => {
    const gallery = createDistinctPhotoGallery({
      primary: "https://p.com/main.jpg",
      sources: [["https://p.com/extra1.jpg", "https://p.com/extra2.jpg"], "https://p.com/extra3.jpg"],
      limit: 2,
    });
    expect(gallery).toEqual(["https://p.com/main.jpg", "https://p.com/extra1.jpg"]);
  });
});

describe("selectVenuePhotos", () => {
  it("returns hero + thumb + photo array, deduplicated and ordered", () => {
    const result = selectVenuePhotos({
      realPhoto: "https://v.com/hero.jpg",
      thumbPhoto: "https://v.com/hero.jpg?w=100",
      realPhotos: ["https://v.com/hero.jpg?w=800", "https://v.com/extra.jpg"],
    });
    expect(result).toEqual(["https://v.com/hero.jpg", "https://v.com/extra.jpg"]);
  });

  it("supports the { photo, photos } shape", () => {
    const result = selectVenuePhotos({
      photo: "https://v.com/a.jpg",
      photos: ["https://v.com/b.jpg", "https://v.com/c.jpg"],
    });
    expect(result).toEqual([
      "https://v.com/a.jpg",
      "https://v.com/b.jpg",
      "https://v.com/c.jpg",
    ]);
  });

  it("falls back through url/photo/realPhoto/image/realImage for the hero", () => {
    expect(selectVenuePhotos({ url: "https://v.com/u.jpg" })).toEqual(["https://v.com/u.jpg"]);
    expect(selectVenuePhotos({ image: "https://v.com/i.jpg" })).toEqual(["https://v.com/i.jpg"]);
    expect(selectVenuePhotos({ realImage: "https://v.com/ri.jpg" })).toEqual([
      "https://v.com/ri.jpg",
    ]);
  });

  it("returns thumb-only entries when nothing else is present", () => {
    expect(selectVenuePhotos({ thumbUrl: "https://v.com/t.jpg" })).toEqual([
      "https://v.com/t.jpg",
    ]);
  });

  it("caps the result at `max`", () => {
    const photos = Array.from({ length: 10 }, (_, i) => `https://v.com/${i}.jpg`);
    expect(selectVenuePhotos({ realPhotos: photos }, 3)).toEqual([
      "https://v.com/0.jpg",
      "https://v.com/1.jpg",
      "https://v.com/2.jpg",
    ]);
  });

  it("returns [] for null / undefined / empty venues", () => {
    expect(selectVenuePhotos(null)).toEqual([]);
    expect(selectVenuePhotos(undefined)).toEqual([]);
    expect(selectVenuePhotos({})).toEqual([]);
  });

  it("returns [] when max is 0 or negative", () => {
    const venue = { realPhoto: "https://v.com/a.jpg" };
    expect(selectVenuePhotos(venue, 0)).toEqual([]);
    expect(selectVenuePhotos(venue, -2)).toEqual([]);
  });

  it("filters out empty strings in photo arrays", () => {
    const result = selectVenuePhotos({
      photos: ["", "   ", "https://v.com/ok.jpg", null as unknown as string],
    });
    expect(result).toEqual(["https://v.com/ok.jpg"]);
  });

  it("deduplicates across query string and case differences", () => {
    const result = selectVenuePhotos({
      realPhoto: "https://v.com/Photo.JPG?w=100",
      realPhotos: ["https://V.COM/photo.jpg?w=800", "https://v.com/other.jpg"],
    });
    expect(result).toEqual([
      "https://v.com/Photo.JPG?w=100",
      "https://v.com/other.jpg",
    ]);
  });
});
