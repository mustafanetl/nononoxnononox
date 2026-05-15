# -*- coding: utf-8 -*-
"""
Warm the Jolliday plan cache by generating plans for popular EU destinations
across common (duration, vibe, traveler) combinations.

The rzuma-chat edge function auto-saves every approved plan to public.cached_plans
keyed by "destination|duration|vibe|travelerType". Once warmed, real users hit the
cache and get a plan instantly without burning tokens.

USAGE
    python scripts/warm_plan_cache.py                    # full run
    python scripts/warm_plan_cache.py --limit 5          # first 5 combos only
    python scripts/warm_plan_cache.py --destination Paris  # one city
    python scripts/warm_plan_cache.py --dry-run          # show what would run

REQUIRES
    .env with VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
    pip install requests python-dotenv
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import requests

# ── Load .env (lightweight, no python-dotenv dependency) ────────────────────

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


# ── Combos to warm ─────────────────────────────────────────────────────────

# Top EU destinations by international tourist arrivals + Jolliday's expected use.
DESTINATIONS = [
    # Western EU classics
    "Paris", "Amsterdam", "Barcelona", "Madrid", "Lisbon", "Porto",
    "Rome", "Florence", "Milan", "Venice", "Naples",
    "Berlin", "Munich", "Hamburg",
    "Vienna", "Prague", "Budapest",
    "Brussels", "Bruges",
    "Dublin", "Edinburgh", "London",
    # Nordics
    "Stockholm", "Copenhagen", "Oslo", "Helsinki", "Reykjavik",
    # Mediterranean / coast
    "Athens", "Santorini", "Mykonos", "Crete",
    "Dubrovnik", "Split",
    "Valletta", "Nice", "Marseille",
    # Eastern / scenic
    "Krakow", "Warsaw",
    "Zurich", "Interlaken",
    "Istanbul",
]

# (duration_days, vibe, traveler_type, prompt_template)
# Vibes match what the chat edge function detects:
#   romantic | adventure | cultural | foodie | nightlife | relaxed | family-friendly | mixed
COMBOS: list[tuple[int, str, str]] = [
    (3, "mixed", "couple"),
    (3, "cultural", "couple"),
    (3, "foodie", "couple"),
    (3, "romantic", "couple"),
    (4, "mixed", "couple"),
    (4, "foodie", "couple"),
    (5, "cultural", "couple"),
    (5, "relaxed", "couple"),
    (3, "mixed", "solo"),
    (3, "nightlife", "friends"),
    (4, "mixed", "family"),
    (5, "family-friendly", "family"),
]

VIBE_PHRASE = {
    "mixed": "a bit of everything",
    "cultural": "culture and museums",
    "foodie": "food and restaurants",
    "romantic": "romantic and intimate",
    "adventure": "adventure and active",
    "nightlife": "nightlife and going out",
    "relaxed": "relaxed and slow-paced",
    "family-friendly": "family-friendly with kids",
}

TRAVELER_PHRASE = {
    "couple": "as a couple",
    "solo": "solo traveler",
    "friends": "with friends",
    "family": "as a family with two kids (ages 6 and 9)",
}

# Origin city — needed because the AI requires an origin to generate flights.
# Stockholm is a good default for an EU-wide cache (same flight prices order
# of magnitude from all major EU hubs; users who visit from elsewhere will
# only see slightly different flight prices, everything else is identical).
ORIGIN = "Stockholm"


def make_prompt(destination: str, duration: int, vibe: str, traveler: str) -> str:
    """Build a single user message that bypasses every clarifying question.

    Includes destination + origin + duration + vibe + who + dates so the
    AI generates the plan in one shot (no follow-up questions).
    """
    return (
        f"{ORIGIN} → {destination} for {duration} days, {VIBE_PHRASE[vibe]} vibe, "
        f"{TRAVELER_PHRASE[traveler]}, traveling next month. Generate the full plan now."
    )


# ── Streaming chat call ────────────────────────────────────────────────────

@dataclass
class StreamResult:
    text: str
    elapsed: float
    chunks: int


def call_chat_streaming(prompt: str, timeout: float = 180.0) -> StreamResult:
    """POST to rzuma-chat and drain the SSE stream. Returns concatenated content."""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {ANON_KEY}",
        "apikey": ANON_KEY,
    }
    body = {
        "messages": [{"role": "user", "content": prompt}],
    }
    started = time.monotonic()
    out = []
    chunks = 0

    with requests.post(CHAT_URL, headers=headers, json=body, stream=True, timeout=timeout) as r:
        if r.status_code == 429:
            raise RuntimeError("rate limited (429)")
        if r.status_code != 200:
            raise RuntimeError(f"chat failed: {r.status_code} — {r.text[:200]}")

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
                content = (
                    parsed.get("choices", [{}])[0].get("delta", {}).get("content")
                    or ""
                )
                if content:
                    out.append(content)
                    chunks += 1
            except json.JSONDecodeError:
                continue

    return StreamResult(text="".join(out), elapsed=time.monotonic() - started, chunks=chunks)


def looks_like_plan(text: str) -> bool:
    """Quick check that we got a real structured plan back, not a follow-up question."""
    needed = ["```flights", "```hotels", "```activities", "```itinerary"]
    return all(tok in text for tok in needed)


def save_to_cache(destination: str, duration: int, vibe: str, traveler: str, content: str) -> tuple[bool, str]:
    """Call cache-plan to persist the generated plan. Returns (success, message)."""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {ANON_KEY}",
        "apikey": ANON_KEY,
    }
    body = {
        "destination": destination,
        "duration": duration,
        "vibe": vibe,
        "travelerType": traveler,
        "origin": ORIGIN,
        "content": content,
    }
    try:
        r = requests.post(CACHE_URL, headers=headers, json=body, timeout=20)
        if r.status_code != 200:
            return False, f"cache HTTP {r.status_code}: {r.text[:200]}"
        data = r.json()
        if data.get("cached"):
            return True, "already cached"
        if data.get("ok"):
            return True, "saved"
        return False, f"unexpected response: {data}"
    except Exception as e:
        return False, str(e)


# ── Main loop ──────────────────────────────────────────────────────────────


def iter_jobs(destinations: list[str], combos: list[tuple[int, str, str]]):
    for dest in destinations:
        for duration, vibe, traveler in combos:
            yield dest, duration, vibe, traveler


def main():
    parser = argparse.ArgumentParser(description="Warm the Jolliday plan cache.")
    parser.add_argument("--destination", help="Single destination (e.g. Paris)", default=None)
    parser.add_argument("--limit", type=int, help="Only run the first N combos", default=None)
    parser.add_argument("--dry-run", action="store_true", help="Print prompts without calling")
    parser.add_argument("--delay", type=float, default=2.5,
                        help="Seconds to sleep between calls (default 2.5)")
    args = parser.parse_args()

    destinations = [args.destination] if args.destination else DESTINATIONS
    jobs = list(iter_jobs(destinations, COMBOS))
    if args.limit:
        jobs = jobs[: args.limit]

    print(f"Warming {len(jobs)} plan combos against {CHAT_URL}")
    print(f"Destinations: {len(destinations)}  ·  Combos per destination: {len(COMBOS)}")
    print(f"Delay between calls: {args.delay}s")
    if args.dry_run:
        print("\n=== DRY RUN — no requests will be sent ===\n")

    successes = 0
    failures = 0
    skipped = 0
    started_total = time.monotonic()

    for i, (dest, duration, vibe, traveler) in enumerate(jobs, start=1):
        prompt = make_prompt(dest, duration, vibe, traveler)
        cache_key = f"{dest.lower()}|{duration}|{vibe}|{traveler}"
        label = f"[{i:>3}/{len(jobs)}] {cache_key}"
        print(f"{label}")
        print(f"        prompt: {prompt}")

        if args.dry_run:
            continue

        try:
            res = call_chat_streaming(prompt)
            if not res.text:
                print(f"        ❌ empty response")
                failures += 1
            elif not looks_like_plan(res.text):
                # AI asked a clarifying question instead of generating — our
                # prompt failed to provide enough info to skip discovery.
                preview = res.text.replace("\n", " ")[:140]
                print(f"        ⚠ no plan (got: {preview!r})")
                skipped += 1
            else:
                kb = len(res.text) // 1024
                cached_ok, cache_msg = save_to_cache(dest, duration, vibe, traveler, res.text)
                marker = "✅" if cached_ok else "⚠"
                print(f"        {marker} {res.elapsed:.1f}s · {res.chunks} chunks · {kb}KB · cache: {cache_msg}")
                if cached_ok:
                    successes += 1
                else:
                    failures += 1
        except Exception as e:
            print(f"        ❌ {e}")
            failures += 1

        time.sleep(args.delay)

    total = time.monotonic() - started_total
    print()
    print(f"Done in {total/60:.1f} min  ·  ✅ {successes}  ⚠ {skipped}  ❌ {failures}")


if __name__ == "__main__":
    main()
