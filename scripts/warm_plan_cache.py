# -*- coding: utf-8 -*-
"""
Warm the Jolliday venue/photo cache by generating plans for popular EU cities.

This script has a multi-turn conversation with the AI — if it asks questions,
we answer them until it generates the full plan. Then we call review + enrich
to cache all venues and photos.

USAGE:
    python scripts/warm_plan_cache.py                    # full run
    python scripts/warm_plan_cache.py --limit 5          # first 5 combos
    python scripts/warm_plan_cache.py --destination Paris # one city
    python scripts/warm_plan_cache.py --dry-run          # show what would run

REQUIRES:
    pip install requests
"""

from __future__ import annotations

import argparse
import datetime
import json
import os
import re
import sys
import time
from pathlib import Path

import requests

# ── Load .env ───────────────────────────────────────────────────────────────

ENV_PATH = Path(__file__).resolve().parents[1] / ".env"


def load_env() -> dict:
    out: dict[str, str] = {}
    if not ENV_PATH.exists():
        return out
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        out[key.strip()] = val.strip().strip('"').strip("'")
    return out


ENV = load_env()
SUPABASE_URL = ENV.get("VITE_SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL", "")
ANON_KEY = (
    ENV.get("VITE_SUPABASE_PUBLISHABLE_KEY")
    or os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY", "")
)

if not SUPABASE_URL or not ANON_KEY:
    print("ERROR: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be set in .env")
    sys.exit(1)

CHAT_URL = f"{SUPABASE_URL}/functions/v1/rzuma-chat"
CACHE_URL = f"{SUPABASE_URL}/functions/v1/cache-plan"
REVIEW_URL = f"{SUPABASE_URL}/functions/v1/review-trip-plan"
ENRICH_URL = f"{SUPABASE_URL}/functions/v1/enrich-destination"

HEADERS = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {ANON_KEY}",
    "apikey": ANON_KEY,
}

# ── Destinations ────────────────────────────────────────────────────────────

DESTINATIONS = [
    "Paris", "Amsterdam", "Barcelona", "Madrid", "Lisbon", "Porto",
    "Rome", "Florence", "Milan", "Venice", "Naples",
    "Berlin", "Munich", "Hamburg",
    "Vienna", "Prague", "Budapest",
    "Brussels", "Bruges",
    "Dublin", "Edinburgh", "London",
    "Stockholm", "Copenhagen", "Oslo", "Helsinki", "Reykjavik",
    "Athens", "Santorini", "Dubrovnik", "Split",
    "Valletta", "Nice", "Marseille",
    "Krakow", "Warsaw",
    "Zurich", "Istanbul",
    "Malaga", "Seville",
]

ORIGIN = "Stockholm"

COMBOS: list[tuple[int, str, str]] = [
    (7, "mixed", "couple"),
    (7, "cultural", "couple"),
    (7, "foodie", "couple"),
    (7, "romantic", "couple"),
    (7, "adventure", "couple"),
    (7, "nightlife", "friends"),
    (7, "family-friendly", "family"),
]

VIBE_PHRASE = {
    "mixed": "a bit of everything",
    "cultural": "culture and museums",
    "foodie": "food and restaurants",
    "romantic": "romantic",
    "adventure": "adventure",
    "nightlife": "nightlife",
    "relaxed": "relaxed",
    "family-friendly": "family-friendly",
}

TRAVELER_PHRASE = {
    "couple": "couple",
    "solo": "solo",
    "friends": "friends",
    "family": "family with 2 kids ages 6 and 9",
}


# ── Helpers ─────────────────────────────────────────────────────────────────

def looks_like_plan(text: str) -> bool:
    return "```activities" in text and "```itinerary" in text


def stream_chat(messages: list[dict], timeout: float = 300.0) -> str:
    """Send messages to rzuma-chat and drain the SSE stream. Returns full text."""
    body = {"messages": messages}
    out = []
    chunks = 0

    with requests.post(CHAT_URL, headers=HEADERS, json=body, stream=True, timeout=timeout) as r:
        if r.status_code == 429:
            raise RuntimeError("rate limited (429)")
        if r.status_code != 200:
            raise RuntimeError(f"chat failed: {r.status_code} — {r.text[:300]}")

        for raw in r.iter_lines(decode_unicode=True):
            if not raw:
                continue
            if raw.startswith(":"):
                continue
            if not raw.startswith("data: "):
                continue
            data = raw[6:].strip()
            if data == "[DONE]":
                break
            try:
                parsed = json.loads(data)
                content = parsed.get("choices", [{}])[0].get("delta", {}).get("content") or ""
                if content:
                    out.append(content)
                    chunks += 1
                    if chunks % 30 == 0:
                        sys.stdout.write(".")
                        sys.stdout.flush()
            except json.JSONDecodeError:
                continue

    if chunks > 20:
        sys.stdout.write("\n")
        sys.stdout.flush()

    return "".join(out)


def auto_reply(ai_response: str) -> str:
    """Generate an automatic reply to the AI's question based on what it's asking."""
    lower = ai_response.lower()

    # If it asks about vibe
    if "vibe" in lower or "type of trip" in lower or "what kind" in lower:
        return "Mixed - a bit of everything"

    # If it asks about dates/when
    if "when" in lower or "date" in lower or "which month" in lower or "timeframe" in lower:
        start = datetime.date.today() + datetime.timedelta(days=30)
        end = start + datetime.timedelta(days=6)
        return f"{start.strftime('%B %d')} to {end.strftime('%B %d')}"

    # If it asks about who/travelers
    if "who" in lower or "travel" in lower and ("solo" in lower or "couple" in lower or "friend" in lower):
        return "Couple"

    # If it asks about origin/flying from
    if "flying from" in lower or "origin" in lower or "departing" in lower or "where are you" in lower:
        return f"Flying from {ORIGIN}"

    # If it asks about budget
    if "budget" in lower:
        return "Mid-range"

    # If it asks about family details
    if "kids" in lower or "children" in lower or "ages" in lower:
        return "2 adults and 2 kids, ages 6 and 9"

    # Generic fallback — just give all info
    start = datetime.date.today() + datetime.timedelta(days=30)
    end = start + datetime.timedelta(days=6)
    return f"{start.strftime('%B %d')} to {end.strftime('%B %d')}, couple, mixed vibe"


def converse_until_plan(destination: str, duration: int, vibe: str, traveler: str) -> str | None:
    """Have a multi-turn conversation until the AI generates a full plan."""
    start = datetime.date.today() + datetime.timedelta(days=30)
    end = start + datetime.timedelta(days=duration - 1)
    date_range = f"{start.strftime('%B %d')}-{end.strftime('%d')}"

    initial_msg = (
        f"{ORIGIN} to {destination}, {date_range}, {duration} days, "
        f"{TRAVELER_PHRASE[traveler]}, {VIBE_PHRASE[vibe]} vibe. "
        f"Generate the full plan."
    )

    messages = [{"role": "user", "content": initial_msg}]
    max_turns = 5

    for turn in range(max_turns):
        response = stream_chat(messages)

        if looks_like_plan(response):
            return response

        if turn == max_turns - 1:
            print(f"        ⚠ Max turns reached without plan")
            return None

        # AI asked a question — auto-reply
        messages.append({"role": "assistant", "content": response})
        reply = auto_reply(response)
        messages.append({"role": "user", "content": reply})
        print(f"        💬 AI asked, replied: '{reply[:60]}'")

    return None


def extract_activity_names(plan_text: str) -> list[str]:
    """Extract activity/venue names from the plan text."""
    names = []
    act_match = re.search(r'```activities\s*(\[[\s\S]*?\])\s*```', plan_text)
    if act_match:
        try:
            activities = json.loads(act_match.group(1))
            for a in activities:
                if isinstance(a, dict) and a.get("name"):
                    names.append(a["name"])
        except json.JSONDecodeError:
            pass
    itin_match = re.search(r'```itinerary\s*(\[[\s\S]*?\])\s*```', plan_text)
    if itin_match:
        try:
            itinerary = json.loads(itin_match.group(1))
            for day in itinerary:
                if isinstance(day, dict) and isinstance(day.get("slots"), list):
                    for slot in day["slots"]:
                        if isinstance(slot, dict) and slot.get("venue"):
                            names.append(slot["venue"])
        except json.JSONDecodeError:
            pass
    return list(set(names))


def extract_hotel_names(plan_text: str) -> list[str]:
    names = []
    hotel_match = re.search(r'```hotels\s*(\[[\s\S]*?\])\s*```', plan_text)
    if hotel_match:
        try:
            hotels = json.loads(hotel_match.group(1))
            for h in hotels:
                if isinstance(h, dict) and h.get("name"):
                    names.append(h["name"])
        except json.JSONDecodeError:
            pass
    return names


def save_to_cache(destination: str, duration: int, vibe: str, traveler: str, content: str) -> str:
    body = {
        "destination": destination,
        "duration": duration,
        "vibe": vibe,
        "travelerType": traveler,
        "origin": ORIGIN,
        "content": content,
    }
    try:
        r = requests.post(CACHE_URL, headers=HEADERS, json=body, timeout=20)
        if r.status_code != 200:
            return f"HTTP {r.status_code}"
        data = r.json()
        return "already cached" if data.get("cached") else "saved"
    except Exception as e:
        return str(e)


def review_plan(plan_text: str, destination: str) -> str:
    body = {"planText": plan_text, "destinationHint": destination}
    try:
        r = requests.post(REVIEW_URL, headers=HEADERS, json=body, timeout=90)
        if r.status_code == 429:
            return "rate limited"
        if r.status_code != 200:
            return f"HTTP {r.status_code}"
        data = r.json()
        if data.get("approved"):
            return "approved"
        return f"rejected ({len(data.get('issues', []))} issues)"
    except Exception as e:
        return str(e)


def enrich_destination(destination: str, activity_names: list[str], hotel_names: list[str]) -> str:
    body = {
        "destination": destination,
        "activities": activity_names[:30],
        "hotelNames": hotel_names,
    }
    try:
        r = requests.post(ENRICH_URL, headers=HEADERS, json=body, timeout=120)
        if r.status_code == 429:
            return "rate limited"
        if r.status_code != 200:
            return f"HTTP {r.status_code}"
        data = r.json()
        photos = data.get("activityPhotos", {})
        images = data.get("images", [])
        return f"{len(photos)} venues + {len(images)} hero"
    except Exception as e:
        return str(e)


# ── Main ────────────────────────────────────────────────────────────────────

def iter_jobs(destinations: list[str], combos: list[tuple[int, str, str]]):
    for dest in destinations:
        for duration, vibe, traveler in combos:
            yield dest, duration, vibe, traveler


def main():
    parser = argparse.ArgumentParser(description="Warm the Jolliday plan + venue cache.")
    parser.add_argument("--destination", help="Single destination", default=None)
    parser.add_argument("--limit", type=int, help="Only first N combos", default=None)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--delay", type=float, default=5, help="Seconds between calls")
    args = parser.parse_args()

    destinations = [args.destination] if args.destination else DESTINATIONS
    jobs = list(iter_jobs(destinations, COMBOS))
    if args.limit:
        jobs = jobs[:args.limit]

    print(f"🌍 Warming {len(jobs)} plans ({len(destinations)} cities × {len(COMBOS)} vibes)")
    print(f"   All 7-day plans for maximum venue coverage")
    print(f"   Delay: {args.delay}s between calls")
    if args.dry_run:
        print("\n=== DRY RUN ===\n")

    successes = 0
    failures = 0
    total_start = time.monotonic()

    for i, (dest, duration, vibe, traveler) in enumerate(jobs, start=1):
        cache_key = f"{dest.lower()}|{duration}|{vibe}|{traveler}"
        print(f"\n[{i:>3}/{len(jobs)}] {cache_key}")

        if args.dry_run:
            continue

        try:
            plan_text = converse_until_plan(dest, duration, vibe, traveler)

            if not plan_text:
                print(f"        ❌ No plan generated")
                failures += 1
                time.sleep(args.delay)
                continue

            kb = len(plan_text) // 1024
            activities = extract_activity_names(plan_text)
            hotels = extract_hotel_names(plan_text)
            print(f"        📋 Plan: {kb}KB · {len(activities)} venues · {len(hotels)} hotels")

            # Save plan to cache
            cache_msg = save_to_cache(dest, duration, vibe, traveler, plan_text)
            print(f"        💾 Cache: {cache_msg}")

            # Review (verifies venues via Google Places, caches results)
            review_msg = review_plan(plan_text, dest)
            print(f"        🔍 Review: {review_msg}")

            # Enrich (fetches photos, caches in destination_media)
            enrich_msg = enrich_destination(dest, activities, hotels)
            print(f"        📸 Enrich: {enrich_msg}")

            successes += 1

        except Exception as e:
            print(f"        ❌ {e}")
            failures += 1

        time.sleep(args.delay)

    total = time.monotonic() - total_start
    print(f"\n{'='*50}")
    print(f"Done in {total/60:.1f} min  ·  ✅ {successes}  ❌ {failures}")


if __name__ == "__main__":
    main()
