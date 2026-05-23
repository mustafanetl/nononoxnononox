# -*- coding: utf-8 -*-
"""
Generate ALL Rotterdam cached plans from YOUR venue database.

This script:
1. Fetches all Rotterdam venues from your DB
2. For each combo (duration × vibe × traveler), assembles a plan using YOUR venues
3. Saves each plan to cached_plans table

The plans ONLY use venue names that exist in your destination_media table,
so the frontend can always find photos for them.

USAGE:
    python scripts/generate_all_rotterdam_plans.py
    python scripts/generate_all_rotterdam_plans.py --dry-run
"""

from __future__ import annotations
import json
import random
import sys
import time
from pathlib import Path

import requests

# ── Load .env ───────────────────────────────────────────────────────────────

env = {}
for l in Path(__file__).resolve().parents[1].joinpath(".env").read_text().splitlines():
    if "=" in l and not l.startswith("#"):
        k, _, v = l.partition("=")
        env[k.strip()] = v.strip().strip('"')

SUPABASE_URL = env.get("VITE_SUPABASE_URL", "")
SERVICE_KEY = env.get("SUPABASE_SERVICE_ROLE_KEY", "")
OPENROUTER_KEY = env.get("OPENROUTER_API_KEY", "")

HEADERS = {"Authorization": f"Bearer {SERVICE_KEY}", "apikey": SERVICE_KEY, "Content-Type": "application/json", "Prefer": "return=minimal"}


# ── Fetch venues ────────────────────────────────────────────────────────────

def fetch_venues() -> list[dict]:
    """Fetch all Rotterdam venues (sort_order=0 = primary row with full metadata)."""
    rows = []
    offset = 0
    while True:
        r = requests.get(
            f"{SUPABASE_URL}/rest/v1/destination_media?destination=eq.rotterdam&sort_order=eq.0&select=name,metadata&offset={offset}&limit=500",
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


# ── Plan assembly ───────────────────────────────────────────────────────────

def filter_venues(venues: list[dict], vibe: str, traveler: str, meal_type: str = "", time_of_day: str = "", category: str = "") -> list[dict]:
    """Filter venues by criteria."""
    results = []
    for v in venues:
        vibes = v.get("vibes", [])
        travelers = v.get("travelers", [])
        meals = v.get("meal_type", [])
        tod = v.get("time_of_day", "")
        cat = v.get("category", "")

        # Vibe match (or "mixed" matches everything)
        if vibe != "mixed" and vibe not in vibes and "mixed" not in vibes:
            continue
        # Traveler match
        if traveler not in travelers and "couple" not in travelers:
            continue
        # Meal type filter
        if meal_type and meal_type not in meals:
            continue
        # Time of day filter
        if time_of_day and tod and tod != time_of_day:
            continue
        # Category filter
        if category and cat != category:
            continue

        results.append(v)
    return results


def pick_venue(venues: list[dict], used: set) -> dict | None:
    """Pick a random venue not yet used."""
    available = [v for v in venues if v["name"] not in used]
    if not available:
        return None
    # Prefer higher rated
    available.sort(key=lambda v: -(v.get("rating") or 0))
    # Pick from top 5 randomly for variety
    top = available[:5]
    choice = random.choice(top)
    used.add(choice["name"])
    return choice


def build_day(day_num: int, venues: list[dict], vibe: str, traveler: str, used: set) -> dict:
    """Build one day of itinerary from venue pool."""
    slots = []

    # Breakfast (9:00)
    breakfast_venues = filter_venues(venues, vibe, traveler, meal_type="breakfast")
    v = pick_venue(breakfast_venues, used)
    if v:
        slots.append({"time": "9:00", "activity": f"Breakfast at {v['name']}", "venue": v["name"],
                      "neighborhood": v.get("neighborhood", "City Center"), "duration": "1h",
                      "cost": 15, "bookAhead": False, "transitNext": "10 min walk"})

    # Morning activity (10:30)
    morning_venues = filter_venues(venues, vibe, traveler, category="culture") + \
                     filter_venues(venues, vibe, traveler, category="sightseeing")
    v = pick_venue(morning_venues, used)
    if v:
        slots.append({"time": "10:30", "activity": f"Visit {v['name']}", "venue": v["name"],
                      "neighborhood": v.get("neighborhood", "City Center"), "duration": "1.5h",
                      "cost": 18, "bookAhead": True, "transitNext": "10 min walk"})

    # Lunch (12:30)
    lunch_venues = filter_venues(venues, vibe, traveler, meal_type="lunch")
    v = pick_venue(lunch_venues, used)
    if v:
        slots.append({"time": "12:30", "activity": f"Lunch at {v['name']}", "venue": v["name"],
                      "neighborhood": v.get("neighborhood", "City Center"), "duration": "1.5h",
                      "cost": 25, "bookAhead": False, "transitNext": "10 min walk"})

    # Afternoon activity (14:30)
    afternoon_venues = filter_venues(venues, vibe, traveler, category="sightseeing") + \
                       filter_venues(venues, vibe, traveler, category="outdoor") + \
                       filter_venues(venues, vibe, traveler, category="shopping") + \
                       filter_venues(venues, vibe, traveler, category="experience")
    v = pick_venue(afternoon_venues, used)
    if v:
        slots.append({"time": "14:30", "activity": f"Explore {v['name']}", "venue": v["name"],
                      "neighborhood": v.get("neighborhood", "City Center"), "duration": "1.5h",
                      "cost": 10, "bookAhead": False, "transitNext": "10 min walk"})

    # Coffee/drinks (16:30)
    cafe_venues = filter_venues(venues, vibe, traveler, category="cafe")
    v = pick_venue(cafe_venues, used)
    if v:
        slots.append({"time": "16:30", "activity": f"Coffee at {v['name']}", "venue": v["name"],
                      "neighborhood": v.get("neighborhood", "City Center"), "duration": "45min",
                      "cost": 8, "bookAhead": False, "transitNext": "10 min walk"})

    # Dinner (19:00)
    dinner_venues = filter_venues(venues, vibe, traveler, meal_type="dinner")
    v = pick_venue(dinner_venues, used)
    if v:
        slots.append({"time": "19:00", "activity": f"Dinner at {v['name']}", "venue": v["name"],
                      "neighborhood": v.get("neighborhood", "City Center"), "duration": "2h",
                      "cost": 45, "bookAhead": True, "transitNext": "10 min walk"})

    # Evening (21:30) — optional based on vibe
    if vibe in ("nightlife", "romantic", "mixed", "foodie"):
        night_venues = filter_venues(venues, vibe, traveler, category="nightlife")
        v = pick_venue(night_venues, used)
        if v:
            slots.append({"time": "21:30", "activity": f"Drinks at {v['name']}", "venue": v["name"],
                          "neighborhood": v.get("neighborhood", "City Center"), "duration": "1.5h",
                          "cost": 20, "bookAhead": False, "transitNext": "—"})

    titles = {
        "foodie": ["Culinary Discovery", "Food Market Day", "Local Flavors", "Gourmet Exploration", "Street Food & Fine Dining"],
        "romantic": ["Waterfront Romance", "Sunset & Wine", "Art & Intimacy", "Hidden Gems Together", "River Views & Candlelight"],
        "adventure": ["Urban Exploration", "Active Discovery", "Off the Beaten Path", "Adrenaline & Views", "Harbor Adventures"],
        "cultural": ["Art & History", "Museum Quarter", "Architecture Walk", "Heritage & Stories", "Creative Rotterdam"],
        "nightlife": ["Bar Hopping", "Late Night Vibes", "Cocktails & Music", "Underground Scene", "Rooftop to Basement"],
        "relaxed": ["Slow Morning", "Park & Café Day", "Easy Strolls", "Waterside Chill", "No Rush Day"],
        "family-friendly": ["Family Fun Day", "Kids & Culture", "Park Adventures", "Interactive Discovery", "Outdoor Play"],
        "mixed": ["Best of Rotterdam", "City Highlights", "A Bit of Everything", "Classic & Modern", "Full Day Out"],
    }
    title = random.choice(titles.get(vibe, titles["mixed"]))

    return {"day": day_num, "title": title, "slots": slots}


def build_plan(venues: list[dict], duration: int, vibe: str, traveler: str) -> str:
    """Build a complete plan and return as formatted text."""
    used: set = set()
    itinerary = []

    for day in range(1, duration + 1):
        day_data = build_day(day, venues, vibe, traveler, used)
        itinerary.append(day_data)

    # Build activities block (unique venues from the plan)
    activities = []
    for i, day in enumerate(itinerary):
        for slot in day.get("slots", []):
            name = slot.get("venue", "")
            if name and name not in [a["name"] for a in activities]:
                # Find venue data
                vdata = next((v for v in venues if v["name"] == name), None)
                if vdata:
                    activities.append({
                        "id": str(len(activities) + 1),
                        "name": name,
                        "category": vdata.get("category", "sightseeing"),
                        "duration": slot.get("duration", "1.5h"),
                        "price": slot.get("cost", 20),
                        "currency": "€",
                        "image": "food" if vdata.get("category") == "dining" else "museum",
                        "occasion": "date",
                        "description": vdata.get("description", f"A popular spot in Rotterdam."),
                        "neighborhood": vdata.get("neighborhood", "City Center"),
                        "hours": vdata.get("hours", "check hours"),
                        "bookAhead": slot.get("bookAhead", False),
                        "why": f"Rated {vdata.get('rating', '4.5')} stars by locals.",
                        "lat": vdata.get("lat", 51.92),
                        "lng": vdata.get("lng", 4.48),
                    })

    # Format as plan text
    plan = f"""```activities
{json.dumps(activities[:8], ensure_ascii=False)}
```

```itinerary
{json.dumps(itinerary, ensure_ascii=False)}
```

```weather
{{"destination":"Rotterdam","period":"Flexible dates","temperature":"12-22°C","conditions":"Maritime climate, mild with occasional rain","packingTip":"Light layers, comfortable walking shoes, a compact umbrella"}}
```

```destination_enrich
{{"destination":"Rotterdam","country":"Netherlands","continent":"Europe","language":"Dutch (English widely spoken)","timezone":"CET (UTC+1)","bestMonths":"May-September"}}
```

```quickreplies
["Make it cheaper","More nightlife","Add a day trip","Swap a restaurant","More romantic spots","Show alternatives"]
```"""

    return plan


# ── Save to cache ───────────────────────────────────────────────────────────

def save_plan(dest: str, duration: int, vibe: str, traveler: str, content: str) -> bool:
    cache_key = f"{dest}|{duration}|{vibe}|{traveler}"
    row = {"cache_key": cache_key, "destination": dest, "duration": duration,
           "vibe": vibe, "traveler_type": traveler, "plan_content": content, "hit_count": 0}
    r = requests.post(f"{SUPABASE_URL}/rest/v1/cached_plans", headers=HEADERS, json=row, timeout=15)
    return r.status_code in (200, 201, 204)


# ── Main ────────────────────────────────────────────────────────────────────

DURATIONS = [3, 5, 7, 10, 14]
VIBES = ["foodie", "romantic", "adventure", "cultural", "nightlife", "relaxed", "family-friendly", "mixed"]
TRAVELERS = ["couple", "solo", "friends", "family"]


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    print("Fetching Rotterdam venues...")
    venues = fetch_venues()
    print(f"  Got {len(venues)} venues\n")

    if len(venues) < 50:
        print("ERROR: Not enough venues. Run the Google Maps scraper first.")
        sys.exit(1)

    total = 0
    for dur in DURATIONS:
        for vibe in VIBES:
            for traveler in TRAVELERS:
                cache_key = f"rotterdam|{dur}|{vibe}|{traveler}"

                if args.dry_run:
                    print(f"  (dry) {cache_key}")
                    total += 1
                    continue

                plan = build_plan(venues, dur, vibe, traveler)
                if save_plan("rotterdam", dur, vibe, traveler, plan):
                    total += 1
                    print(f"  ✓ {cache_key}")
                else:
                    print(f"  ✗ {cache_key} FAILED")

    print(f"\nDone! {total} plans cached for Rotterdam.")


if __name__ == "__main__":
    main()
