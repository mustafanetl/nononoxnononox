# -*- coding: utf-8 -*-
"""
Warm the Jolliday venue/photo cache by using a real browser to generate plans.

This script opens jolliday.online/chat in a headless browser, types a trip
request, waits for the full plan + photo enrichment to complete, then moves
to the next city. This triggers the FULL client-side flow:
  1. AI generates plan
  2. QA review verifies venues via Google Places → caches in destination_media
  3. Photo enrichment fetches Google Places photos → caches in destination_media

After this runs, real users hitting the same venues get instant cached photos
with zero Google Places API calls.

USAGE:
    python scripts/warm_browser.py                     # full run (41 cities)
    python scripts/warm_browser.py --limit 5           # first 5 cities
    python scripts/warm_browser.py --headed            # show the browser window
    python scripts/warm_browser.py --city Paris        # single city

REQUIRES:
    pip install playwright
    python -m playwright install chromium
"""

from __future__ import annotations

import argparse
import time
import sys

from playwright.sync_api import sync_playwright, Page, Browser

SITE_URL = "https://jolliday.online"
CHAT_URL = f"{SITE_URL}/chat"

# Top EU destinations — 7-day trips to maximize venue coverage
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


def make_query(destination: str) -> str:
    """Build a one-shot query that gives the AI everything it needs."""
    return (
        f"{ORIGIN} to {destination}, 7 days, couple, mixed vibe, next month"
    )


def wait_for_plan_complete(page: Page, timeout_s: int = 180) -> bool:
    """Wait until the plan card appears (meaning plan + enrichment is done)."""
    try:
        # The plan card has the "Open the full plan" button
        page.wait_for_selector(
            'button:has-text("Open the full plan"), button:has-text("Öppna hela planen")',
            timeout=timeout_s * 1000,
        )
        return True
    except Exception:
        return False


def wait_for_enrichment(page: Page, extra_wait: int = 8):
    """After plan card appears, wait a bit more for photo enrichment to finish."""
    # The enrichment runs async after the card shows — give it time to complete
    time.sleep(extra_wait)


def run_city(page: Page, destination: str, headed: bool = False) -> tuple[bool, float]:
    """Navigate to chat, type the query, wait for plan completion."""
    started = time.monotonic()

    # Navigate to chat page fresh (clears previous conversation)
    page.goto(CHAT_URL, wait_until="networkidle", timeout=30000)
    time.sleep(2)

    # Find the chat input and type the query
    query = make_query(destination)

    # Try to find the textarea input
    input_sel = 'textarea[placeholder], textarea, input[type="text"]'
    try:
        page.wait_for_selector(input_sel, timeout=10000)
    except Exception:
        print(f"        ❌ Could not find chat input")
        return False, time.monotonic() - started

    # Type the query
    textarea = page.locator("textarea").first
    textarea.fill(query)
    time.sleep(0.5)

    # Press Enter to send
    textarea.press("Enter")

    # Wait for the plan to complete (plan card appears)
    print(f"        ⏳ Waiting for plan...")
    success = wait_for_plan_complete(page, timeout_s=180)

    if not success:
        print(f"        ❌ Plan did not complete within 3 minutes")
        return False, time.monotonic() - started

    # Wait extra for photo enrichment to finish caching
    print(f"        📸 Waiting for photos to cache...")
    wait_for_enrichment(page, extra_wait=12)

    elapsed = time.monotonic() - started
    return True, elapsed


def main():
    parser = argparse.ArgumentParser(description="Warm Jolliday cache via browser automation.")
    parser.add_argument("--city", help="Single city to warm", default=None)
    parser.add_argument("--limit", type=int, help="Only run first N cities", default=None)
    parser.add_argument("--headed", action="store_true", help="Show browser window")
    args = parser.parse_args()

    cities = [args.city] if args.city else DESTINATIONS
    if args.limit:
        cities = cities[:args.limit]

    print(f"🌍 Warming {len(cities)} cities via browser at {SITE_URL}")
    print(f"   Mode: {'headed' if args.headed else 'headless'}")
    print(f"   Query template: '{make_query('[CITY]')}'")
    print()

    successes = 0
    failures = 0
    total_start = time.monotonic()

    with sync_playwright() as p:
        browser: Browser = p.chromium.launch(headless=not args.headed)
        context = browser.new_context(
            viewport={"width": 430, "height": 932},  # iPhone 14 Pro Max
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        )
        page = context.new_page()

        for i, city in enumerate(cities, start=1):
            print(f"[{i:>2}/{len(cities)}] {city}")
            print(f"        query: {make_query(city)}")

            try:
                ok, elapsed = run_city(page, city, headed=args.headed)
                if ok:
                    print(f"        ✅ Done in {elapsed:.0f}s")
                    successes += 1
                else:
                    failures += 1
            except Exception as e:
                print(f"        ❌ Error: {e}")
                failures += 1

            # Small pause between cities
            if i < len(cities):
                time.sleep(3)

        browser.close()

    total = time.monotonic() - total_start
    print()
    print(f"Done in {total/60:.1f} min  ·  ✅ {successes}  ❌ {failures}")


if __name__ == "__main__":
    main()
