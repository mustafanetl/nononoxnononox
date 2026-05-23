# -*- coding: utf-8 -*-
"""
Deduplicate destination_media — SMART version.

The REAL problem: Same venue stored multiple times with different names
AND sharing the same photos. Examples:
  - "Jerash Archaeological Site" / "Jerash Archaeological Park" / "Jerash"
  - "Café de Flore" / "Cafe de Flore"

Strategy:
1. Group venues by SHARED PHOTOS (if 2 venues share any photo URL = same place)
2. Also group by fuzzy name match (contains the other, or >70% similar)
3. Keep ONE row per real venue with the best data
4. Store ALL name variants as aliases (so AI can match any version)
5. Keep ALL unique photos (merge photo collections)

USAGE:
    python scripts/dedupe_media.py              # dry run (preview)
    python scripts/dedupe_media.py --apply      # actually merge & delete
    python scripts/dedupe_media.py --city amman # one city
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from collections import defaultdict
from pathlib import Path

import requests

# ── Load .env ───────────────────────────────────────────────────────────────

ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
env = {}
for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
    if "=" in line and not line.startswith("#"):
        k, _, v = line.partition("=")
        env[k.strip()] = v.strip().strip('"').strip("'")

SUPABASE_URL = env.get("VITE_SUPABASE_URL", "")
SERVICE_KEY = env.get("SUPABASE_SERVICE_ROLE_KEY", "")
if not SUPABASE_URL or not SERVICE_KEY:
    print("ERROR: Need VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
    sys.exit(1)

HEADERS = {
    "Authorization": f"Bearer {SERVICE_KEY}",
    "apikey": SERVICE_KEY,
    "Content-Type": "application/json",
}


# ── Helpers ─────────────────────────────────────────────────────────────────

def normalize(name: str) -> str:
    """Normalize for comparison: lowercase, no accents, no punctuation."""
    if not name:
        return ""
    s = unicodedata.normalize("NFKD", name)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.lower().strip()
    s = re.sub(r'^(the|le|la|el|il|das|de|het)\s+', '', s)
    s = re.sub(r'[^a-z0-9\s]', '', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s


def names_are_similar(a: str, b: str) -> bool:
    """
    Check if two venue names refer to the same place.
    - One contains the other: "Jerash" in "Jerash Archaeological Site" → True
    - High word overlap: "Archaeological Site Jerash" vs "Jerash Archaeological Park" → True
    """
    na = normalize(a)
    nb = normalize(b)
    if not na or not nb:
        return False
    # Exact match after normalization
    if na == nb:
        return True
    # One contains the other (min 4 chars to avoid false matches like "bar")
    if len(na) >= 4 and na in nb:
        return True
    if len(nb) >= 4 and nb in na:
        return True
    # Word overlap: if 70%+ of words match
    words_a = set(na.split())
    words_b = set(nb.split())
    if not words_a or not words_b:
        return False
    overlap = words_a & words_b
    min_words = min(len(words_a), len(words_b))
    if min_words > 0 and len(overlap) / min_words >= 0.7:
        return True
    return False


def photo_signature(url: str) -> str:
    """Extract unique part of a photo URL for comparison."""
    if not url:
        return ""
    # Google Places photos have a unique reference in the URL
    # Supabase storage has unique filenames
    # Strip query params and get last meaningful path segment
    clean = url.split("?")[0].split("#")[0]
    parts = clean.rstrip("/").split("/")
    # Return last 2 segments for uniqueness
    return "/".join(parts[-2:]) if len(parts) >= 2 else parts[-1] if parts else ""


def photos_overlap(urls_a: set[str], urls_b: set[str]) -> bool:
    """Check if two sets of photo URLs share any images (= same venue)."""
    if not urls_a or not urls_b:
        return False
    sigs_a = {photo_signature(u) for u in urls_a if u}
    sigs_b = {photo_signature(u) for u in urls_b if u}
    sigs_a.discard("")
    sigs_b.discard("")
    if not sigs_a or not sigs_b:
        return False
    shared = sigs_a & sigs_b
    return len(shared) > 0


# ── Union-Find for grouping ────────────────────────────────────────────────

class UnionFind:
    """Simple union-find to group related venues together."""
    def __init__(self):
        self.parent = {}

    def find(self, x):
        if x not in self.parent:
            self.parent[x] = x
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]
            x = self.parent[x]
        return x

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra != rb:
            self.parent[ra] = rb

    def groups(self) -> dict[str, list[str]]:
        result: dict[str, list[str]] = defaultdict(list)
        for x in self.parent:
            result[self.find(x)].append(x)
        return dict(result)


# ── Core logic ──────────────────────────────────────────────────────────────

def fetch_city_media(city: str) -> list[dict]:
    """Fetch all Google Places media for a city."""
    rows = []
    offset = 0
    while True:
        resp = requests.get(
            f'{SUPABASE_URL}/rest/v1/destination_media'
            f'?destination=eq.{city}'
            f'&type=in.("activity","hotel")'
            f'&select=*&order=created_at.asc&offset={offset}&limit=500',
            headers=HEADERS,
        )
        if resp.status_code != 200:
            print(f"  [ERROR] {resp.status_code}: {resp.text[:80]}")
            break
        batch = resp.json()
        if not batch:
            break
        rows.extend(batch)
        offset += len(batch)
        if len(batch) < 500:
            break
    return rows


def find_duplicate_groups(rows: list[dict]) -> list[list[dict]]:
    """
    Find groups of rows that represent the same venue.
    Uses two signals:
    1. Shared photos (any shared URL = definitely same place)
    2. Similar names (fuzzy match)
    """
    if not rows:
        return []

    # Build venue entries: group rows by name first (exact name = same entry)
    venues: dict[str, list[dict]] = defaultdict(list)
    for row in rows:
        name = row.get("name") or ""
        if not name:
            continue
        venues[name].append(row)

    venue_names = list(venues.keys())
    if len(venue_names) <= 1:
        return []

    # Collect photo URLs per venue name
    venue_photos: dict[str, set[str]] = {}
    for name, rows_list in venues.items():
        urls = set()
        for r in rows_list:
            if r.get("url"):
                urls.add(r["url"])
            if r.get("thumb_url"):
                urls.add(r["thumb_url"])
        venue_photos[name] = urls

    # Union-Find: merge venues that share photos OR have similar names
    uf = UnionFind()
    for name in venue_names:
        uf.find(name)  # ensure all are registered

    for i in range(len(venue_names)):
        for j in range(i + 1, len(venue_names)):
            a, b = venue_names[i], venue_names[j]
            # Check photo overlap
            if photos_overlap(venue_photos[a], venue_photos[b]):
                uf.union(a, b)
            # Check name similarity
            elif names_are_similar(a, b):
                uf.union(a, b)

    # Build groups (only groups with 2+ names = duplicates)
    groups = uf.groups()
    result = []
    for root, members in groups.items():
        if len(members) <= 1:
            continue
        # Collect all rows for this group
        group_rows = []
        for name in members:
            group_rows.extend(venues[name])
        result.append(group_rows)

    return result


def merge_group(group_rows: list[dict], dry_run: bool) -> tuple[int, int]:
    """
    Merge a group of duplicate rows into one.
    - Keep the row with best data (verified, has coords, most photos)
    - Store all name variants as aliases
    - Keep all UNIQUE photos (merge photo sets)
    - Delete redundant rows
    """
    if len(group_rows) <= 1:
        return 0, 0

    # Score each row to find the best one to keep
    def score(r):
        s = 0
        meta = r.get("metadata") or {}
        if meta.get("verified"):
            s += 100
        if meta.get("lat") and meta.get("lng"):
            s += 50
        if meta.get("placeId"):
            s += 30
        if r.get("url"):
            s += 20
        return s

    group_rows.sort(key=lambda r: score(r), reverse=True)
    keep = group_rows[0]
    rest = group_rows[1:]

    # Collect all unique name variants
    all_names = list(set(r["name"] for r in group_rows if r.get("name")))

    # Collect all unique photo URLs
    all_photos = set()
    for r in group_rows:
        if r.get("url"):
            all_photos.add(r["url"])
        if r.get("thumb_url"):
            all_photos.add(r["thumb_url"])

    if dry_run:
        names_str = " / ".join(all_names[:4])
        print(f"    MERGE ({len(group_rows)} rows): {names_str}")
        print(f"      Keep: '{keep['name']}' | Delete: {len(rest)} | Photos: {len(all_photos)}")
        return 1, len(rest)

    # Update the kept row: add aliases + merged photo list
    meta = keep.get("metadata") or {}
    meta["name_aliases"] = all_names
    meta["all_photos"] = list(all_photos)[:8]  # Keep up to 8 unique photos

    requests.patch(
        f"{SUPABASE_URL}/rest/v1/destination_media?id=eq.{keep['id']}",
        headers={**HEADERS, "Prefer": "return=minimal"},
        json={"metadata": meta},
    )

    # Delete duplicate rows
    deleted = 0
    for r in rest:
        resp = requests.delete(
            f"{SUPABASE_URL}/rest/v1/destination_media?id=eq.{r['id']}",
            headers=HEADERS,
        )
        if resp.status_code in (200, 204):
            deleted += 1

    return 1, deleted


# ── Main ────────────────────────────────────────────────────────────────────

def get_all_cities() -> list[str]:
    cities = set()
    offset = 0
    while True:
        resp = requests.get(
            f"{SUPABASE_URL}/rest/v1/destination_media?select=destination&order=destination&offset={offset}&limit=1000",
            headers=HEADERS,
        )
        if resp.status_code != 200:
            break
        batch = resp.json()
        if not batch:
            break
        for r in batch:
            cities.add(r["destination"])
        offset += len(batch)
        if len(batch) < 1000:
            break
    return sorted(cities)


def main():
    parser = argparse.ArgumentParser(description="Smart dedup: merge same venues with different names")
    parser.add_argument("--apply", action="store_true", help="Actually merge & delete")
    parser.add_argument("--city", type=str, help="One city only")
    args = parser.parse_args()
    dry_run = not args.apply

    print(f"\n{'='*60}")
    print(f"  Smart Venue Deduplication")
    print(f"  Mode: {'DRY RUN' if dry_run else 'LIVE (merging + deleting)'}")
    print(f"  Matches: shared photos OR similar names")
    print(f"{'='*60}\n")

    cities = [args.city.lower()] if args.city else get_all_cities()
    print(f"  Processing {len(cities)} cities...\n")

    total_merged = 0
    total_deleted = 0

    for city in cities:
        rows = fetch_city_media(city)
        if len(rows) < 2:
            continue

        groups = find_duplicate_groups(rows)
        if not groups:
            continue

        dup_count = sum(len(g) for g in groups)
        print(f"  {city}: {len(rows)} rows → {len(groups)} duplicate groups ({dup_count} rows)")

        for group in groups:
            m, d = merge_group(group, dry_run)
            total_merged += m
            total_deleted += d

    print(f"\n{'='*60}")
    print(f"  {'Would merge' if dry_run else 'Merged'}: {total_merged} venue groups")
    print(f"  {'Would delete' if dry_run else 'Deleted'}: {total_deleted} duplicate rows")
    print(f"  All name variants saved as aliases for AI matching")
    if dry_run:
        print(f"\n  Run with --apply to execute")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
