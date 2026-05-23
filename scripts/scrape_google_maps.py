# -*- coding: utf-8 -*-
"""
Scrape Google Maps for restaurants, cafés, bars, and attractions.

Uses your VISIBLE browser to search Google Maps by category for each city.
Downloads 4 photos per venue, uploads to Supabase Storage, saves all data.

Each venue is tagged with: category, meal_type, vibes, travelers, price_level,
time_of_day — so the plan assembly algorithm can pick the right venues.

USAGE:
    python scripts/scrape_google_maps.py --city Rotterdam
    python scripts/scrape_google_maps.py --city Rotterdam --category restaurants
    python scripts/scrape_google_maps.py --limit 5
    python scripts/scrape_google_maps.py --dry-run

REQUIRES:
    pip install playwright requests
    python -m playwright install chromium
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import time
from pathlib import Path
from urllib.parse import quote_plus

import requests
from playwright.sync_api import sync_playwright, Page

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
    print("ERROR: Need VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env")
    sys.exit(1)

HEADERS = {
    "Authorization": f"Bearer {SERVICE_KEY}",
    "apikey": SERVICE_KEY,
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}
STORAGE_BUCKET = "destination-media"


# ── Search categories per city ──────────────────────────────────────────────

SEARCH_QUERIES = {
    "restaurants_fine": "best fine dining restaurants in {city}",
    "restaurants_casual": "best casual restaurants in {city}",
    "restaurants_breakfast": "best breakfast spots in {city}",
    "restaurants_brunch": "best brunch places in {city}",
    "restaurants_italian": "best italian restaurants in {city}",
    "restaurants_asian": "best asian restaurants in {city}",
    "restaurants_seafood": "best seafood restaurants in {city}",
    "restaurants_local": "best local traditional food in {city}",
    "restaurants_vegetarian": "best vegetarian restaurants in {city}",
    "restaurants_romantic": "romantic dinner restaurants in {city}",
    "cafes": "best coffee shops cafes in {city}",
    "bars_cocktail": "best cocktail bars in {city}",
    "bars_rooftop": "rooftop bars in {city}",
    "bars_wine": "wine bars in {city}",
    "bars_pub": "best pubs beer bars in {city}",
    "attractions_museums": "best museums in {city}",
    "attractions_landmarks": "famous landmarks in {city}",
    "attractions_parks": "best parks gardens in {city}",
    "attractions_viewpoints": "best viewpoints in {city}",
    "attractions_markets": "best markets in {city}",
    "attractions_neighborhoods": "best neighborhoods to walk in {city}",
}

# Map search category → venue tags
CATEGORY_TAGS = {
    "restaurants_fine": {"category": "dining", "meal_type": ["dinner"], "price_level": "luxury", "time_of_day": "evening", "vibes": ["foodie", "romantic"]},
    "restaurants_casual": {"category": "dining", "meal_type": ["lunch", "dinner"], "price_level": "mid", "time_of_day": "afternoon", "vibes": ["foodie", "mixed"]},
    "restaurants_breakfast": {"category": "dining", "meal_type": ["breakfast"], "price_level": "budget", "time_of_day": "morning", "vibes": ["mixed", "relaxed"]},
    "restaurants_brunch": {"category": "dining", "meal_type": ["breakfast", "lunch"], "price_level": "mid", "time_of_day": "morning", "vibes": ["relaxed", "foodie"]},
    "restaurants_italian": {"category": "dining", "meal_type": ["lunch", "dinner"], "price_level": "mid", "time_of_day": "evening", "vibes": ["romantic", "foodie"]},
    "restaurants_asian": {"category": "dining", "meal_type": ["lunch", "dinner"], "price_level": "mid", "time_of_day": "evening", "vibes": ["foodie", "mixed"]},
    "restaurants_seafood": {"category": "dining", "meal_type": ["lunch", "dinner"], "price_level": "mid", "time_of_day": "afternoon", "vibes": ["foodie", "relaxed"]},
    "restaurants_local": {"category": "dining", "meal_type": ["lunch", "dinner"], "price_level": "mid", "time_of_day": "afternoon", "vibes": ["cultural", "foodie"]},
    "restaurants_vegetarian": {"category": "dining", "meal_type": ["lunch", "dinner"], "price_level": "mid", "time_of_day": "afternoon", "vibes": ["relaxed", "mixed"]},
    "restaurants_romantic": {"category": "dining", "meal_type": ["dinner"], "price_level": "luxury", "time_of_day": "evening", "vibes": ["romantic"]},
    "cafes": {"category": "cafe", "meal_type": ["breakfast", "snack"], "price_level": "budget", "time_of_day": "morning", "vibes": ["relaxed", "mixed"]},
    "bars_cocktail": {"category": "nightlife", "meal_type": ["drinks"], "price_level": "mid", "time_of_day": "night", "vibes": ["nightlife", "romantic"]},
    "bars_rooftop": {"category": "nightlife", "meal_type": ["drinks"], "price_level": "mid", "time_of_day": "evening", "vibes": ["romantic", "nightlife"]},
    "bars_wine": {"category": "nightlife", "meal_type": ["drinks"], "price_level": "mid", "time_of_day": "evening", "vibes": ["romantic", "foodie"]},
    "bars_pub": {"category": "nightlife", "meal_type": ["drinks"], "price_level": "budget", "time_of_day": "night", "vibes": ["nightlife", "mixed"]},
    "attractions_museums": {"category": "culture", "meal_type": [], "price_level": "mid", "time_of_day": "morning", "vibes": ["cultural", "mixed"]},
    "attractions_landmarks": {"category": "sightseeing", "meal_type": [], "price_level": "budget", "time_of_day": "morning", "vibes": ["mixed", "cultural"]},
    "attractions_parks": {"category": "sightseeing", "meal_type": [], "price_level": "budget", "time_of_day": "afternoon", "vibes": ["relaxed", "romantic", "family-friendly"]},
    "attractions_viewpoints": {"category": "sightseeing", "meal_type": [], "price_level": "budget", "time_of_day": "evening", "vibes": ["romantic", "mixed"]},
    "attractions_markets": {"category": "shopping", "meal_type": ["snack"], "price_level": "budget", "time_of_day": "morning", "vibes": ["foodie", "cultural"]},
    "attractions_neighborhoods": {"category": "sightseeing", "meal_type": [], "price_level": "budget", "time_of_day": "afternoon", "vibes": ["mixed", "cultural", "relaxed"]},
}

# Traveler type mapping (all venues get tagged)
def infer_travelers(tags: dict) -> list[str]:
    """Infer which traveler types a venue suits."""
    travelers = []
    vibes = tags.get("vibes", [])
    price = tags.get("price_level", "mid")
    if "romantic" in vibes: travelers.append("couple")
    if "nightlife" in vibes: travelers.extend(["friends", "solo"])
    if "family-friendly" in vibes: travelers.append("family")
    if "mixed" in vibes: travelers.extend(["couple", "friends", "solo"])
    if price == "budget": travelers.extend(["solo", "friends"])
    if price == "luxury": travelers.append("couple")
    return list(set(travelers)) or ["couple", "friends", "solo"]


# ── Destinations ────────────────────────────────────────────────────────────

DESTINATIONS = [
    "Rotterdam", "Paris", "Amsterdam", "Barcelona", "Madrid", "Lisbon",
    "Rome", "Florence", "Milan", "Venice", "Naples",
    "Berlin", "Munich", "Vienna", "Prague", "Budapest",
    "London", "Edinburgh", "Dublin", "Brussels",
    "Stockholm", "Copenhagen", "Oslo", "Helsinki",
    "Athens", "Dubrovnik", "Istanbul",
    "Tokyo", "Bangkok", "Singapore", "Dubai",
    "Marrakech", "Cape Town",
]


# ── Helpers ─────────────────────────────────────────────────────────────────

def upload_image(image_bytes: bytes, city: str, venue_name: str, index: int) -> str:
    name_hash = hashlib.md5(f"{city}|{venue_name}".encode()).hexdigest()[:10]
    safe_name = re.sub(r'[^a-z0-9]+', '-', venue_name.lower())[:40].strip('-')
    suffix = f"-{index}" if index > 0 else ""
    file_path = f"venues/{city.lower()}/{safe_name}-{name_hash}{suffix}.jpg"

    resp = requests.post(
        f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{file_path}",
        headers={
            "Authorization": f"Bearer {SERVICE_KEY}",
            "apikey": SERVICE_KEY,
            "Content-Type": "image/jpeg",
            "x-upsert": "true",
        },
        data=image_bytes,
        timeout=30,
    )
    if resp.status_code in (200, 201):
        return f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{file_path}"
    return ""


def download_image(url: str) -> bytes | None:
    try:
        r = requests.get(url, timeout=20, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })
        if r.status_code == 200 and len(r.content) > 1000:
            return r.content
    except Exception:
        pass
    return None


def save_venue(city: str, name: str, photos: list[str], tags: dict, extra_meta: dict) -> bool:
    """Save venue to destination_media with full tagging."""
    travelers = infer_travelers(tags)
    row = {
        "destination": city.lower().strip(),
        "type": "venue",
        "name": name,
        "url": photos[0] if photos else "",
        "thumb_url": photos[0] if photos else "",
        "source": "google_maps_stored",
        "media_type": "photo",
        "sort_order": 0,
        "metadata": {
            **extra_meta,
            "photos": photos,
            "category": tags.get("category", ""),
            "meal_type": tags.get("meal_type", []),
            "vibes": tags.get("vibes", []),
            "travelers": travelers,
            "price_level": tags.get("price_level", "mid"),
            "time_of_day": tags.get("time_of_day", ""),
            "verified": True,
        },
    }
    try:
        resp = requests.post(
            f"{SUPABASE_URL}/rest/v1/destination_media",
            headers=HEADERS,
            json=row,
            timeout=15,
        )
        return resp.status_code in (200, 201, 204)
    except Exception:
        return False


def already_exists(city: str, name: str) -> bool:
    try:
        resp = requests.get(
            f"{SUPABASE_URL}/rest/v1/destination_media"
            f"?destination=eq.{city.lower()}&name=eq.{name}&type=eq.venue&select=id&limit=1",
            headers={"Authorization": f"Bearer {SERVICE_KEY}", "apikey": SERVICE_KEY},
            timeout=10,
        )
        return resp.status_code == 200 and len(resp.json()) > 0
    except Exception:
        return False


# ── Google Maps Scraping ────────────────────────────────────────────────────

def accept_cookies(page: Page):
    try:
        for sel in ['button:has-text("Accept all")', 'button:has-text("Acceptera alla")',
                    'button:has-text("Alles accepteren")', 'button:has-text("Accept")']:
            btn = page.locator(sel).first
            if btn.is_visible(timeout=1500):
                btn.click()
                time.sleep(1)
                return
    except Exception:
        pass


def scrape_search_results(page: Page, city: str, query: str, max_results: int = 15) -> list[dict]:
    """
    Search Google Maps and extract venue list from results panel.
    Returns [{name, rating, address, price_level, url}]
    """
    search_url = f"https://www.google.com/maps/search/{quote_plus(query)}"
    page.goto(search_url, wait_until="domcontentloaded", timeout=30000)
    time.sleep(4)
    accept_cookies(page)

    # Scroll the results panel to load more
    results_panel = page.locator('[role="feed"], [role="list"]').first
    for _ in range(8):
        try:
            if results_panel.is_visible(timeout=1000):
                results_panel.evaluate("el => el.scrollTop = el.scrollHeight")
            else:
                page.evaluate("window.scrollBy(0, 500)")
        except Exception:
            page.evaluate("window.scrollBy(0, 500)")
        time.sleep(1.5)

    # Extract venue links from results
    venues = []
    seen = set()

    # Google Maps results are <a> elements with href containing /maps/place/
    links = page.locator('a[href*="/maps/place/"]')
    count = links.count()

    for i in range(min(count, max_results * 2)):
        try:
            el = links.nth(i)
            href = el.get_attribute("href") or ""
            
            # Get venue name from aria-label
            name = el.get_attribute("aria-label") or ""
            if not name or len(name) < 3:
                continue
            if name in seen:
                continue
            seen.add(name)

            venues.append({"name": name, "maps_url": href})

            if len(venues) >= max_results:
                break
        except Exception:
            continue

    return venues


def scrape_venue_detail(page: Page, venue_name: str, city: str) -> dict | None:
    """
    Click into a venue on Google Maps and extract full details + photos.
    """
    data = {}

    try:
        # Wait for place panel to be visible
        time.sleep(2.5)

        # Get name from h1
        try:
            h1 = page.locator('h1').first
            if h1.is_visible(timeout=3000):
                data["name"] = h1.inner_text().strip()
        except Exception:
            data["name"] = venue_name

        # Get rating + review count from the rating section
        # Google Maps shows: "4.5 (1,234)" or "4.5 stars 1,234 reviews"
        try:
            # The rating number is usually in a span near the stars
            all_text = page.locator('[class*="fontDisplayLarge"]').first
            if all_text.is_visible(timeout=2000):
                txt = all_text.inner_text().strip()
                m = re.match(r'^([\d.]+)$', txt)
                if m:
                    data["rating"] = float(m.group(1))
        except Exception:
            pass

        # Try alternative rating selector
        if not data.get("rating"):
            try:
                # Look for aria-label with stars info
                star_el = page.locator('[aria-label*="star"]').first
                if star_el.is_visible(timeout=1500):
                    label = star_el.get_attribute("aria-label") or ""
                    m = re.search(r'([\d.]+)\s*star', label)
                    if m:
                        data["rating"] = float(m.group(1))
            except Exception:
                pass

        # Review count
        try:
            review_el = page.locator('[aria-label*="review"]').first
            if review_el.is_visible(timeout=1500):
                label = review_el.get_attribute("aria-label") or review_el.inner_text()
                m = re.search(r'([\d,]+)\s*review', label.replace(',', ''))
                if m:
                    data["review_count"] = int(m.group(1))
        except Exception:
            pass

        # Price level + cuisine type from the info line below the name
        # Google Maps shows something like: "€€€ · French restaurant"
        try:
            # Look for the category/price line (usually right below rating)
            info_buttons = page.locator('button[jsaction*="category"]')
            if info_buttons.count() > 0:
                for j in range(min(info_buttons.count(), 3)):
                    txt = info_buttons.nth(j).inner_text().strip()
                    if txt and len(txt) > 1 and txt.isascii():
                        # Check if it's a price indicator
                        if all(c in "€$£" for c in txt.replace(" ", "")):
                            euro_count = max(txt.count("€"), txt.count("$"), txt.count("£"))
                            if euro_count == 1: data["price_indicator"] = "budget"
                            elif euro_count == 2: data["price_indicator"] = "mid"
                            elif euro_count >= 3: data["price_indicator"] = "luxury"
                        else:
                            # It's a cuisine/category type
                            if not data.get("cuisine"):
                                data["cuisine"] = txt[:50]
        except Exception:
            pass

        # Fallback: try to get cuisine from the subtitle text
        if not data.get("cuisine"):
            try:
                # The line under the name often has "Restaurant · €€ · French"
                subtitle = page.locator('[class*="fontBodyMedium"] span, [class*="subtitle"]')
                for j in range(min(subtitle.count(), 5)):
                    txt = subtitle.nth(j).inner_text().strip()
                    if txt and len(txt) > 2 and "€" not in txt and "$" not in txt:
                        if any(word in txt.lower() for word in ["restaurant", "café", "bar", "museum", "park", "italian", "french", "asian", "japanese", "chinese", "indian", "mexican", "thai", "dutch", "seafood"]):
                            data["cuisine"] = txt[:50]
                            break
            except Exception:
                pass

        # Get address
        try:
            addr_btn = page.locator('button[data-item-id="address"]')
            if addr_btn.is_visible(timeout=1500):
                label = addr_btn.get_attribute("aria-label") or ""
                data["address"] = label.replace("Address: ", "").strip()[:200]
        except Exception:
            pass

        # Get opening hours (actual hours, not button text)
        try:
            hours_btn = page.locator('[data-item-id*="hour"]')
            if hours_btn.is_visible(timeout=1500):
                aria = hours_btn.get_attribute("aria-label") or ""
                # aria-label usually contains actual hours like "Open ⋅ Closes 11 PM"
                if aria and "Show" not in aria:
                    data["hours"] = aria[:100]
                else:
                    # Try the visible text inside
                    inner = hours_btn.inner_text().strip()
                    if inner and "Show" not in inner:
                        data["hours"] = inner[:100]
        except Exception:
            pass

        # Get coordinates from URL
        try:
            current_url = page.url
            coord_match = re.search(r'@(-?\d+\.\d+),(-?\d+\.\d+)', current_url)
            if coord_match:
                data["lat"] = float(coord_match.group(1))
                data["lng"] = float(coord_match.group(2))
        except Exception:
            pass

        # Get neighborhood from address
        if data.get("address"):
            parts = data["address"].split(",")
            if len(parts) >= 3:
                data["neighborhood"] = parts[-3].strip()[:40]
            elif len(parts) >= 2:
                data["neighborhood"] = parts[-2].strip()[:40]

        # Get photos (from visible images in the place panel)
        photos = []
        try:
            imgs = page.locator('img[src*="googleusercontent.com"]')
            seen_sigs = set()
            for j in range(min(imgs.count(), 15)):
                src = imgs.nth(j).get_attribute("src") or ""
                if not src or len(src) < 50:
                    continue
                # Skip tiny thumbnails
                if any(f"=w{s}" in src or f"=s{s}" in src for s in ["36", "48", "64", "32", "24"]):
                    continue
                # Upgrade to large
                src = re.sub(r'=w\d+-h\d+[^"\']*', '=w800-h600', src)
                src = re.sub(r'=s\d+[^"\']*', '=s800', src)
                sig = src.split("/")[-1][:40]
                if sig in seen_sigs:
                    continue
                seen_sigs.add(sig)
                photos.append(src)
                if len(photos) >= 4:
                    break
        except Exception:
            pass

        data["photos"] = photos
        return data if (data.get("name") or data.get("lat")) else None

    except Exception as e:
        print(f"    [ERROR] {e}")
        return None


# ── Main pipeline ───────────────────────────────────────────────────────────

def process_category(page: Page, city: str, cat_key: str, dry_run: bool = False) -> int:
    """Scrape one category for a city."""
    query_template = SEARCH_QUERIES[cat_key]
    query = query_template.format(city=city)
    tags = CATEGORY_TAGS[cat_key]

    print(f"\n  [{cat_key}] Searching: {query}")

    # Search Google Maps
    search_url = f"https://www.google.com/maps/search/{quote_plus(query)}"
    page.goto(search_url, wait_until="domcontentloaded", timeout=30000)
    time.sleep(4)
    accept_cookies(page)

    # Scroll results panel to load more
    for _ in range(6):
        try:
            page.evaluate("""
                const feed = document.querySelector('[role="feed"]');
                if (feed) feed.scrollTop = feed.scrollHeight;
                else window.scrollBy(0, 500);
            """)
        except Exception:
            pass
        time.sleep(1.5)

    # Get all venue names from results first
    links = page.locator('a[href*="/maps/place/"]')
    count = links.count()
    venue_names = []
    for i in range(min(count, 12)):
        try:
            name = links.nth(i).get_attribute("aria-label") or ""
            if name and len(name) > 2 and name not in venue_names:
                venue_names.append(name)
        except Exception:
            continue

    print(f"    Found {len(venue_names)} venues")
    if not venue_names:
        return 0

    saved = 0

    # Process each venue: go directly to its Google Maps page
    for name in venue_names:
        if already_exists(city, name):
            continue

        if dry_run:
            print(f"    (dry) {name}")
            continue

        try:
            # Go DIRECTLY to this venue's page
            direct_url = f"https://www.google.com/maps/search/{quote_plus(name + ' ' + city)}"
            page.goto(direct_url, wait_until="domcontentloaded", timeout=20000)
            time.sleep(3.5)

            # Scrape detail panel
            detail = scrape_venue_detail(page, name, city)
            if not detail:
                print(f"    ✗ {name}: no data")
                continue

            # Download & upload 4 photos to YOUR server
            photos_on_server = []
            for idx, photo_url in enumerate(detail.get("photos", [])[:4]):
                img_bytes = download_image(photo_url)
                if img_bytes:
                    uploaded = upload_image(img_bytes, city, name, idx)
                    if uploaded:
                        photos_on_server.append(uploaded)

            # Build metadata
            extra_meta = {
                "address": detail.get("address", ""),
                "lat": detail.get("lat"),
                "lng": detail.get("lng"),
                "rating": detail.get("rating"),
                "review_count": detail.get("review_count"),
                "hours": detail.get("hours", ""),
                "cuisine": detail.get("cuisine", ""),
                "neighborhood": detail.get("neighborhood", ""),
                "price_indicator": detail.get("price_indicator", ""),
                "duration": "1.5h" if tags["category"] in ("dining", "cafe", "nightlife") else "2h",
            }

            final_tags = {**tags}
            if detail.get("price_indicator"):
                final_tags["price_level"] = detail["price_indicator"]

            # Save to DB immediately
            if save_venue(city, name, photos_on_server, final_tags, extra_meta):
                saved += 1
                r = detail.get("rating", "?")
                print(f"    ✓ {name} | ★{r} | {len(photos_on_server)} photos → DB")
            else:
                print(f"    ✗ {name}: DB save failed")

            time.sleep(1.5)

        except Exception as e:
            print(f"    [ERROR] {name}: {e}")
            continue

    return saved


def process_city(page: Page, city: str, categories: list[str] | None = None, dry_run: bool = False) -> int:
    """Process all categories for a city."""
    cats = categories or list(SEARCH_QUERIES.keys())
    total = 0

    for cat in cats:
        if cat not in SEARCH_QUERIES:
            print(f"  [SKIP] Unknown category: {cat}")
            continue
        total += process_category(page, city, cat, dry_run)

    return total


# ── Entry point ─────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Scrape Google Maps → venue pool")
    parser.add_argument("--city", type=str, help="One city")
    parser.add_argument("--category", type=str, help="One category (e.g. restaurants_fine)")
    parser.add_argument("--limit", type=int, default=0, help="Max cities")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--start-from", type=str)
    args = parser.parse_args()

    cities = DESTINATIONS
    if args.city:
        cities = [args.city]
    elif args.start_from:
        try:
            i = next(i for i, c in enumerate(DESTINATIONS) if c.lower() == args.start_from.lower())
            cities = DESTINATIONS[i:]
        except StopIteration:
            print(f"City not found: {args.start_from}")
            sys.exit(1)
    if args.limit > 0:
        cities = cities[:args.limit]

    categories = [args.category] if args.category else None

    print(f"\n{'='*60}")
    print(f"  Google Maps Venue Scraper")
    print(f"  Cities: {len(cities)} | Categories: {len(categories or SEARCH_QUERIES)}")
    print(f"  Mode: {'DRY RUN' if args.dry_run else 'LIVE'}")
    print(f"  Target: ~150 venues per city")
    print(f"{'='*60}\n")

    total = 0
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=False, slow_mo=200)
        ctx = browser.new_context(
            viewport={"width": 1366, "height": 900},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            locale="en-GB",
            timezone_id="Europe/London",
        )
        page = ctx.new_page()

        try:
            for i, city in enumerate(cities):
                print(f"\n{'='*60}")
                print(f"  [{i+1}/{len(cities)}] {city}")
                print(f"{'='*60}")
                n = process_city(page, city, categories, args.dry_run)
                total += n
                print(f"\n  {city}: +{n} venues saved")
                if i < len(cities) - 1:
                    time.sleep(3)
        except KeyboardInterrupt:
            print("\n\nInterrupted. Progress saved.")
        finally:
            browser.close()

    print(f"\n{'='*60}")
    print(f"  DONE — {total} venues saved total")
    print(f"  Table: destination_media | type=venue | source=google_maps_stored")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
