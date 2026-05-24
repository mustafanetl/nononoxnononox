# -*- coding: utf-8 -*-
"""
Fetch all Rotterdam venues from the database and output as a formatted list.
Use this to see what venues are available before writing plans.

USAGE:
    python scripts/fetch_venue_list.py
    python scripts/fetch_venue_list.py --json  (output as JSON file)
    python scripts/fetch_venue_list.py --category dining
"""

import json
import sys
from pathlib import Path

import requests

env = {}
for l in Path(__file__).resolve().parents[1].joinpath(".env").read_text().splitlines():
    if "=" in l and not l.startswith("#"):
        k, _, v = l.partition("=")
        env[k.strip()] = v.strip().strip('"')

SUPABASE_URL = env.get("VITE_SUPABASE_URL", "")
SERVICE_KEY = env.get("SUPABASE_SERVICE_ROLE_KEY", "")


def fetch_all():
    rows = []
    offset = 0
    while True:
        r = requests.get(
            f"{SUPABASE_URL}/rest/v1/destination_media"
            f"?destination=eq.rotterdam&sort_order=eq.0&select=name,metadata"
            f"&offset={offset}&limit=500",
            headers={"Authorization": f"Bearer {SERVICE_KEY}", "apikey": SERVICE_KEY},
        )
        batch = r.json()
        if not batch:
            break
        rows.extend(batch)
        offset += len(batch)
        if len(batch) < 500:
            break
    return [{"name": r["name"], **(r.get("metadata") or {})} for r in rows if r.get("name")]


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--json", action="store_true", help="Output as JSON file")
    parser.add_argument("--category", type=str, help="Filter by category")
    args = parser.parse_args()

    venues = fetch_all()
    print(f"Total venues: {len(venues)}\n")

    # Count by category
    cats = {}
    for v in venues:
        cat = v.get("category", "unknown")
        cats[cat] = cats.get(cat, 0) + 1
    print("Categories:")
    for cat, count in sorted(cats.items(), key=lambda x: -x[1]):
        print(f"  {cat}: {count}")
    print()

    # Filter if requested
    if args.category:
        venues = [v for v in venues if v.get("category") == args.category]
        print(f"Filtered to {len(venues)} venues in '{args.category}'\n")

    # Sort by rating (highest first)
    venues.sort(key=lambda v: -(v.get("rating") or 0))

    if args.json:
        out_path = Path(__file__).parent / "venue_list.json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(venues, f, ensure_ascii=False, indent=2)
        print(f"Saved to {out_path}")
    else:
        # Pretty print
        for v in venues:
            rating = v.get("rating", "?")
            reviews = v.get("review_count", "?")
            cat = v.get("category", "?")
            vibes = ", ".join(v.get("vibes", []))
            meals = ", ".join(v.get("meal_type", []))
            hood = v.get("neighborhood", "")
            print(f"  ★{rating} ({reviews} reviews) [{cat}] {v['name']}")
            print(f"    Vibes: {vibes} | Meals: {meals} | Area: {hood}")
            if v.get("hours"):
                print(f"    Hours: {v['hours'][:80]}")
            print()


if __name__ == "__main__":
    main()
