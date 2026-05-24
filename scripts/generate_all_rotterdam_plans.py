# -*- coding: utf-8 -*-
"""
Generate ALL Rotterdam cached plans from the venue database.

Creates plans for EVERY combination so cache always hits:
- Durations: 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14 days (13)
- Vibes: foodie, romantic, adventure, cultural, nightlife, relaxed, family-friendly, mixed (8)
- Travelers: couple, solo, friends, family (4)
- Total: 13 × 8 × 4 = 416 unique plans

Plans are assembled algorithmically from the venue DB:
- Geographic clustering (nearby venues same day)
- Proper meal rhythm (breakfast → activity → lunch → activity → dinner → optional evening)
- No repeated venues within a plan
- Vibe-appropriate venue selection
- Rating-weighted selection (better venues picked first)

USAGE:
    python scripts/generate_all_rotterdam_plans.py
    python scripts/generate_all_rotterdam_plans.py --dry-run
    python scripts/generate_all_rotterdam_plans.py --vibe foodie --duration 5
"""

from __future__ import annotations
import json
import math
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
HEADERS = {"Authorization": f"Bearer {SERVICE_KEY}", "apikey": SERVICE_KEY,
           "Content-Type": "application/json", "Prefer": "return=minimal"}


# ── Configuration ───────────────────────────────────────────────────────────

DURATIONS = list(range(2, 31))  # 2 through 30 days
VIBES = ["foodie", "romantic", "adventure", "cultural", "nightlife", "relaxed", "family-friendly", "mixed"]
TRAVELERS = ["couple", "solo", "friends", "family"]

# Image category mapping for activity cards
IMAGE_MAP = {
    "dining": "food", "cafe": "food", "nightlife": "concert",
    "culture": "museum", "sightseeing": "sunset", "outdoor": "hiking",
    "shopping": "market", "experience": "cruise", "wellness": "spa",
}

# Day titles per vibe (variety pool)
DAY_TITLES = {
    "foodie": ["Culinary Discovery", "Market & Michelin", "Local Flavors", "Tasting Rotterdam",
               "Waterfront Dining", "Hidden Food Gems", "International Bites", "Farm to Fork",
               "Sweet & Savory", "Chef's Table Day", "Street Food Safari", "Brunch to Late Night",
               "Harbor-side Feasts", "Dutch Delicacies", "Global Kitchen Tour"],
    "romantic": ["Sunset & Wine", "Waterfront Romance", "Art & Intimacy", "Hidden Gems Together",
                 "River Views", "Candlelit Evening", "Garden Strolls", "Rooftop Dreams",
                 "Morning for Two", "Secret Spots", "Golden Hour Walk", "Cozy Corners",
                 "Bridge to Bridge", "City Lights", "Quiet Mornings"],
    "adventure": ["Urban Exploration", "Rooftop to Harbor", "Off the Beaten Path", "Heights & Depths",
                  "Cycle the City", "Water & Sky", "Discover by Boat", "Street Art Trail",
                  "Architecture Hunt", "Industrial Heritage", "Bridge Climbing", "Night Adventure",
                  "Port Discovery", "Underground Rotterdam", "Active Morning"],
    "cultural": ["Art & Architecture", "Museum Quarter", "Heritage Walk", "Design & History",
                 "Gallery Hopping", "Creative District", "War & Reconstruction", "Modern Masters",
                 "Dutch Design Day", "Photography Walk", "Literary Rotterdam", "Theatre District",
                 "Maritime History", "Architecture Icons", "Cultural Deep Dive"],
    "nightlife": ["Bar Hopping", "Late Night Vibes", "Cocktails & Views", "Underground Scene",
                  "Rooftop Crawl", "Live Music Night", "Witte de With Pub Trail", "Speakeasy Circuit",
                  "DJ Sets & Dancing", "Craft Beer Trail", "Jazz & Wine", "Midnight Snacks",
                  "Pre-game to Party", "Sunset Drinks", "After Dark"],
    "relaxed": ["Slow Morning", "Park & Café", "Easy River Walk", "Waterside Chill",
                "No Rush Day", "Read & Sip", "Garden Escape", "Afternoon Drift",
                "Wellness & Food", "Quiet Neighborhoods", "Bench to Brunch", "Canal-side Peace",
                "Cloud Watching", "Cozy Indoor Day", "Wind-down"],
    "family-friendly": ["Family Fun Day", "Kids & Culture", "Park Adventures", "Interactive Discovery",
                        "Outdoor Play", "Museum Magic", "Boat & Bikes", "Ice Cream Trail",
                        "Splash & Learn", "Zoo & Snacks", "Building Blocks City", "Rainy Day Plan",
                        "Treasure Hunt", "Harbor Expedition", "Nature & Science"],
    "mixed": ["Best of Rotterdam", "City Highlights", "A Bit of Everything", "Classic & Modern",
              "Full Day Out", "East to West", "North to South", "Iconic Stops",
              "Local Favorites", "Tourist + Local", "Surprise Mix", "Hidden & Famous",
              "Old & New", "Land & Water", "All-rounder Day"],
}


# ── Fetch & prepare venues ──────────────────────────────────────────────────

def fetch_venues() -> list[dict]:
    """Fetch all Rotterdam venues (sort_order=0 rows have full metadata)."""
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
    venues = []
    for r in rows:
        if not r.get("name"):
            continue
        meta = r.get("metadata") or {}
        venues.append({"name": r["name"], **meta})
    return venues


def haversine(lat1, lng1, lat2, lng2) -> float:
    """Distance in km between two points."""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
    return R * 2 * math.asin(math.sqrt(a))


# ── Venue selection logic ───────────────────────────────────────────────────

def matches_vibe(venue: dict, vibe: str) -> bool:
    """Check if venue matches the requested vibe."""
    if vibe == "mixed":
        return True
    vibes = venue.get("vibes", [])
    return vibe in vibes or "mixed" in vibes


def matches_traveler(venue: dict, traveler: str) -> bool:
    """Check if venue matches the traveler type."""
    travelers = venue.get("travelers", [])
    if not travelers:
        return True
    return traveler in travelers


def score_venue(venue: dict, vibe: str, traveler: str) -> float:
    """Score a venue for selection priority (higher = better)."""
    score = 0.0
    # Rating bonus (0-5 scale → 0-50 points)
    rating = venue.get("rating") or 0
    score += rating * 10
    # Review count bonus (more reviews = more trusted)
    reviews = venue.get("review_count") or 0
    if reviews > 1000: score += 20
    elif reviews > 500: score += 15
    elif reviews > 100: score += 10
    elif reviews > 50: score += 5
    # Vibe match bonus
    vibes = venue.get("vibes", [])
    if vibe in vibes: score += 15
    # Traveler match bonus
    travelers = venue.get("travelers", [])
    if traveler in travelers: score += 10
    # Small random factor for variety
    score += random.uniform(0, 8)
    return score


def pick_venue(pool: list[dict], used: set, vibe: str, traveler: str, near_lat=None, near_lng=None) -> dict | None:
    """Pick best available venue from pool, preferring nearby if coords given."""
    available = [v for v in pool if v["name"] not in used]
    if not available:
        return None

    # Score all candidates
    scored = [(v, score_venue(v, vibe, traveler)) for v in available]

    # If we have a reference location, boost nearby venues
    if near_lat and near_lng:
        for i, (v, s) in enumerate(scored):
            vlat = v.get("lat")
            vlng = v.get("lng")
            if vlat and vlng:
                dist = haversine(near_lat, near_lng, vlat, vlng)
                if dist < 1: scored[i] = (v, s + 20)      # Very close
                elif dist < 2: scored[i] = (v, s + 12)    # Walking distance
                elif dist < 4: scored[i] = (v, s + 5)     # Short transit

    # Sort by score descending
    scored.sort(key=lambda x: -x[1])

    # Pick from top candidates with some randomness
    top_n = min(4, len(scored))
    choice = random.choice(scored[:top_n])[0]
    used.add(choice["name"])
    return choice


def get_pool(venues: list[dict], vibe: str, traveler: str, category: str = "", meal_type: str = "") -> list[dict]:
    """Get filtered venue pool."""
    results = []
    for v in venues:
        if not matches_vibe(v, vibe): continue
        if not matches_traveler(v, traveler): continue
        if category and v.get("category") != category: continue
        if meal_type and meal_type not in (v.get("meal_type") or []): continue
        results.append(v)
    # If strict filter gives too few results, relax vibe requirement
    if len(results) < 5 and category:
        for v in venues:
            if v.get("category") == category and v["name"] not in [r["name"] for r in results]:
                results.append(v)
    return results


# ── Build one day ───────────────────────────────────────────────────────────

def build_day(day_num: int, venues: list[dict], vibe: str, traveler: str, used: set) -> dict:
    """Build one day with 7 slots: breakfast, activity, lunch, activity, cafe, dinner, evening."""
    slots = []
    last_lat, last_lng = None, None

    def add_slot(time_str, prefix, pool, cost, book, dur="1.5h"):
        nonlocal last_lat, last_lng
        v = pick_venue(pool, used, vibe, traveler, last_lat, last_lng)
        if v:
            last_lat = v.get("lat") or last_lat
            last_lng = v.get("lng") or last_lng
            slots.append({
                "time": time_str,
                "activity": f"{prefix}{v['name']}",
                "venue": v["name"],
                "neighborhood": v.get("neighborhood") or v.get("address", "Rotterdam")[:30],
                "duration": dur,
                "cost": cost,
                "bookAhead": book,
                "transitNext": "8 min walk" if len(slots) < 5 else "10 min tram",
            })

    # Morning: Breakfast
    breakfast_pool = get_pool(venues, vibe, traveler, meal_type="breakfast")
    if not breakfast_pool:
        breakfast_pool = get_pool(venues, vibe, traveler, category="cafe")
    add_slot("9:00", "Breakfast at ", breakfast_pool, 15, False, "1h")

    # Morning: Activity (culture/sightseeing)
    if vibe in ("cultural", "mixed", "romantic", "adventure"):
        morning_pool = get_pool(venues, vibe, traveler, category="culture") + \
                       get_pool(venues, vibe, traveler, category="sightseeing")
    elif vibe == "foodie":
        morning_pool = get_pool(venues, vibe, traveler, category="shopping") + \
                       get_pool(venues, vibe, traveler, category="sightseeing")
    elif vibe == "relaxed":
        morning_pool = get_pool(venues, vibe, traveler, category="outdoor") + \
                       get_pool(venues, vibe, traveler, category="sightseeing")
    else:
        morning_pool = get_pool(venues, vibe, traveler, category="sightseeing") + \
                       get_pool(venues, vibe, traveler, category="experience")
    add_slot("10:30", "", morning_pool, 18, True, "1.5h")

    # Lunch
    lunch_pool = get_pool(venues, vibe, traveler, meal_type="lunch")
    if not lunch_pool:
        lunch_pool = get_pool(venues, vibe, traveler, category="dining")
    add_slot("12:30", "Lunch at ", lunch_pool, 25, False, "1.5h")

    # Afternoon: Activity
    if vibe == "adventure":
        aft_pool = get_pool(venues, vibe, traveler, category="experience") + \
                   get_pool(venues, vibe, traveler, category="outdoor")
    elif vibe == "cultural":
        aft_pool = get_pool(venues, vibe, traveler, category="culture") + \
                   get_pool(venues, vibe, traveler, category="sightseeing")
    elif vibe == "relaxed":
        aft_pool = get_pool(venues, vibe, traveler, category="outdoor") + \
                   get_pool(venues, vibe, traveler, category="cafe")
    else:
        aft_pool = get_pool(venues, vibe, traveler, category="sightseeing") + \
                   get_pool(venues, vibe, traveler, category="outdoor") + \
                   get_pool(venues, vibe, traveler, category="experience")
    add_slot("14:30", "", aft_pool, 12, False, "2h")

    # Late afternoon: Coffee/snack
    cafe_pool = get_pool(venues, vibe, traveler, category="cafe")
    add_slot("16:30", "Coffee at ", cafe_pool, 8, False, "45min")

    # Dinner
    dinner_pool = get_pool(venues, vibe, traveler, meal_type="dinner")
    if not dinner_pool:
        dinner_pool = get_pool(venues, vibe, traveler, category="dining")
    add_slot("19:00", "Dinner at ", dinner_pool, 45, True, "2h")

    # Evening (skip for relaxed/family, always for nightlife)
    if vibe == "nightlife" or (vibe in ("romantic", "mixed", "foodie", "adventure") and random.random() > 0.3):
        night_pool = get_pool(venues, vibe, traveler, category="nightlife")
        add_slot("21:30", "Drinks at ", night_pool, 20, False, "1.5h")

    # Pick day title
    titles = DAY_TITLES.get(vibe, DAY_TITLES["mixed"])
    title = titles[(day_num - 1) % len(titles)]

    return {"day": day_num, "title": title, "slots": slots}


# ── Build full plan ─────────────────────────────────────────────────────────

def build_plan(venues: list[dict], duration: int, vibe: str, traveler: str) -> str:
    """Build a complete cached plan string."""
    used: set = set()
    itinerary = []

    for day in range(1, duration + 1):
        day_data = build_day(day, venues, vibe, traveler, used)
        itinerary.append(day_data)

    # Build activities block from all unique venues used
    activities = []
    seen_act_names = set()
    for day in itinerary:
        for slot in day.get("slots", []):
            name = slot.get("venue", "")
            if not name or name in seen_act_names:
                continue
            seen_act_names.add(name)
            if len(activities) >= 8:
                break
            vdata = next((v for v in venues if v["name"] == name), None)
            if vdata:
                cat = vdata.get("category", "sightseeing")
                activities.append({
                    "id": str(len(activities) + 1),
                    "name": name,
                    "category": cat,
                    "duration": vdata.get("duration", "1.5h"),
                    "price": 15 if cat in ("cafe", "outdoor") else 25 if cat == "dining" else 18,
                    "currency": "€",
                    "image": IMAGE_MAP.get(cat, "museum"),
                    "occasion": "date" if vibe == "romantic" else "group" if traveler == "friends" else "general",
                    "description": (vdata.get("description") or f"Popular {cat} spot in Rotterdam.")[:150],
                    "neighborhood": vdata.get("neighborhood") or "Rotterdam",
                    "hours": vdata.get("hours") or "check hours",
                    "bookAhead": cat in ("dining", "culture", "experience"),
                    "why": f"Rated {vdata.get('rating', 4.5)} stars" + (f" ({vdata.get('review_count', '')} reviews)" if vdata.get('review_count') else "") + ".",
                    "lat": vdata.get("lat", 51.92),
                    "lng": vdata.get("lng", 4.48),
                })

    plan = f"""```activities
{json.dumps(activities[:8], ensure_ascii=False)}
```

```itinerary
{json.dumps(itinerary, ensure_ascii=False)}
```

```weather
{{"destination":"Rotterdam","period":"Flexible dates","temperature":"8-22°C depending on season","conditions":"Maritime climate — mild, occasional rain year-round","packingTip":"Layers, waterproof jacket, comfortable walking shoes"}}
```

```destination_enrich
{{"destination":"Rotterdam","country":"Netherlands","continent":"Europe","language":"Dutch (English widely spoken)","timezone":"CET (UTC+1)","bestMonths":"April-September","currency":"EUR"}}
```

```quickreplies
["Make it cheaper","More food spots","Add nightlife","Swap an activity","Show day trips","More romantic"]
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

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--vibe", type=str, help="Only generate for this vibe")
    parser.add_argument("--duration", type=int, help="Only generate for this duration")
    parser.add_argument("--traveler", type=str, help="Only generate for this traveler type")
    args = parser.parse_args()

    print("Fetching Rotterdam venues...")
    venues = fetch_venues()
    print(f"  Got {len(venues)} venues")

    # Stats
    categories = {}
    for v in venues:
        cat = v.get("category", "unknown")
        categories[cat] = categories.get(cat, 0) + 1
    print(f"  Categories: {json.dumps(categories)}\n")

    if len(venues) < 30:
        print("ERROR: Not enough venues. Run the scraper first.")
        sys.exit(1)

    durations = [args.duration] if args.duration else DURATIONS
    vibes = [args.vibe] if args.vibe else VIBES
    travelers = [args.traveler] if args.traveler else TRAVELERS

    total_plans = len(durations) * len(vibes) * len(travelers)
    print(f"Generating {total_plans} plans ({len(durations)} durations × {len(vibes)} vibes × {len(travelers)} travelers)\n")

    saved = 0
    failed = 0
    for dur in durations:
        for vibe in vibes:
            for traveler in travelers:
                cache_key = f"rotterdam|{dur}|{vibe}|{traveler}"
                if args.dry_run:
                    print(f"  (dry) {cache_key}")
                    saved += 1
                    continue

                plan = build_plan(venues, dur, vibe, traveler)
                if save_plan("rotterdam", dur, vibe, traveler, plan):
                    saved += 1
                    if saved % 20 == 0:
                        print(f"  Progress: {saved}/{total_plans} plans saved...")
                else:
                    failed += 1
                    print(f"  ✗ FAILED: {cache_key}")

    print(f"\n{'='*50}")
    print(f"  DONE — {saved} plans cached for Rotterdam")
    if failed: print(f"  Failed: {failed}")
    print(f"  Coverage: {len(durations)} durations × {len(vibes)} vibes × {len(travelers)} travelers")
    print(f"{'='*50}\n")


if __name__ == "__main__":
    main()
