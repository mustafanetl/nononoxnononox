# -*- coding: utf-8 -*-
"""
Verify & Enrich a plan using Google Maps in the BROWSER (no API key needed).

Takes a generated plan, opens Google Maps for each venue, verifies it exists,
grabs photos, and saves everything to your Supabase Storage + DB.

Then saves the plan to the cached_plans table so users get it instantly.

USAGE:
    python scripts/verify_plan.py scripts/plans/rotterdam_5d_foodie_couple.md
    python scripts/verify_plan.py scripts/plans/rotterdam_5d_foodie_couple.md --dry-run

REQUIRES:
    pip install playwright requests
    python -m playwright install chromium
"""

from __future__ import annotations

import argparse
import hashlib
import json
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
STORAGE_BUCKET = "destination-media"

if not SUPABASE_URL or not SERVICE_KEY:
    print("ERROR: Need VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env")
    sys.exit(1)

HEADERS = {
    "Authorization": f"Bearer {SERVICE_KEY}",
    "apikey": SERVICE_KEY,
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}


# ── Parse plan ──────────────────────────────────────────────────────────────

def parse_plan(filepath: str) -> tuple[str, dict]:
    """Parse plan file. Returns (raw_content, parsed_blocks)."""
    text = Path(filepath).read_text(encoding="utf-8")
    blocks = {}
    for match in re.finditer(r'```(\w+)\s*\n(.*?)\n```', text, re.DOTALL):
        block_type = match.group(1)
        content = match.group(2).strip()
        try:
            blocks[block_type] = json.loads(content)
        except json.JSONDecodeError:
            blocks[block_type] = content
    return text, blocks


def extract_venues(blocks: dict, city: str) -> list[dict]:
    """Extract all unique venues from the plan."""
    venues = []
    seen = set()

    for act in blocks.get("activities", []):
        name = act.get("name", "")
        if name and name not in seen:
            seen.add(name)
            venues.append({"name": name, "neighborhood": act.get("neighborhood", ""), "type": "activity"})

    for day in blocks.get("itinerary", []):
        for slot in day.get("slots", []):
            name = slot.get("venue", "")
            if name and name not in seen:
                seen.add(name)
                venues.append({"name": name, "neighborhood": slot.get("neighborhood", ""), "type": "activity"})

    for hotel in blocks.get("hotels", []):
        name = hotel.get("name", "")
        if name and name not in seen:
            seen.add(name)
            venues.append({"name": name, "neighborhood": hotel.get("location", ""), "type": "hotel"})

    return venues


# ── Google Maps browser scraping ────────────────────────────────────────────

def verify_venue_on_maps(page: Page, venue_name: str, city: str, neighborhood: str = "") -> dict | None:
    """
    Search Google Maps for a venue using the browser.
    Returns: {name, address, lat, lng, rating, photos: [urls]}
    """
    query = f"{venue_name}, {neighborhood}, {city}" if neighborhood else f"{venue_name}, {city}"
    url = f"https://www.google.com/maps/search/{quote_plus(query)}"

    try:
        page.goto(url, wait_until="domcontentloaded", timeout=20000)
        time.sleep(3)

        # Accept cookies if prompted
        try:
            accept_btn = page.locator('button:has-text("Accept all"), button:has-text("Acceptera alla"), button:has-text("Alles accepteren")')
            if accept_btn.first.is_visible(timeout=2000):
                accept_btn.first.click()
                time.sleep(1)
        except Exception:
            pass

        # Wait for the place panel to load
        time.sleep(2)

        data = {}

        # Get place name from the panel
        try:
            title = page.locator('h1[class*="header"], h1[class*="title"], [data-header-feature-id] h1').first
            if title.is_visible(timeout=3000):
                data["name"] = title.inner_text().strip()
        except Exception:
            pass

        # Get rating
        try:
            rating_el = page.locator('[class*="rating"] span[aria-hidden="true"], [role="img"][aria-label*="star"]').first
            if rating_el.is_visible(timeout=2000):
                rating_text = rating_el.get_attribute("aria-label") or rating_el.inner_text()
                m = re.search(r'([\d.]+)', rating_text)
                if m:
                    data["rating"] = float(m.group(1))
        except Exception:
            pass

        # Get address
        try:
            addr_el = page.locator('[data-item-id="address"] [class*="fontBodyMedium"], button[data-item-id="address"]').first
            if addr_el.is_visible(timeout=2000):
                data["address"] = addr_el.inner_text().strip()[:200]
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

        # Get photos from the page
        photos = []
        try:
            # Google Maps shows photos in the place panel
            img_els = page.locator('img[src*="googleusercontent.com"], img[src*="gstatic.com/mapspro"]')
            count = img_els.count()
            for i in range(min(count, 8)):
                src = img_els.nth(i).get_attribute("src") or ""
                if src and "googleusercontent" in src and len(src) > 50:
                    # Upgrade to larger size
                    src = re.sub(r'=w\d+-h\d+', '=w800-h600', src)
                    src = re.sub(r'=s\d+', '=s800', src)
                    if src not in photos:
                        photos.append(src)
                if len(photos) >= 4:
                    break
        except Exception:
            pass

        data["photos"] = photos

        # Verify it's a real place (has at least a name or coordinates)
        if data.get("name") or data.get("lat"):
            return data
        return None

    except Exception as e:
        print(f"    [ERROR] Maps: {e}")
        return None


# ── Upload & Save ───────────────────────────────────────────────────────────

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


def upload_to_storage(image_bytes: bytes, city: str, venue_name: str, index: int) -> str:
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


def save_venue_to_db(city: str, name: str, venue_type: str, photos: list[str], metadata: dict) -> bool:
    row = {
        "destination": city.lower().strip(),
        "type": venue_type,
        "name": name,
        "url": photos[0] if photos else "",
        "thumb_url": photos[0] if photos else "",
        "source": "google_maps_stored",
        "media_type": "photo",
        "sort_order": 0,
        "metadata": {**metadata, "photos": photos, "verified": True},
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


def already_verified(city: str, name: str) -> bool:
    try:
        resp = requests.get(
            f"{SUPABASE_URL}/rest/v1/destination_media"
            f"?destination=eq.{city.lower()}&name=eq.{name}&select=id&limit=1",
            headers={"Authorization": f"Bearer {SERVICE_KEY}", "apikey": SERVICE_KEY},
            timeout=10,
        )
        return resp.status_code == 200 and len(resp.json()) > 0
    except Exception:
        return False


def save_plan_to_cache(city: str, duration: int, vibe: str, traveler_type: str, plan_content: str):
    """Save the plan to cached_plans table."""
    cache_key = f"{city}|{duration}|{vibe}|{traveler_type}"
    row = {
        "cache_key": cache_key,
        "destination": city,
        "duration": duration,
        "vibe": vibe,
        "traveler_type": traveler_type,
        "plan_content": plan_content,
        "hit_count": 0,
    }
    resp = requests.post(
        f"{SUPABASE_URL}/rest/v1/cached_plans",
        headers=HEADERS,
        json=row,
        timeout=15,
    )
    if resp.status_code in (200, 201, 204):
        print(f"  ✓ Plan cached: {cache_key}")
    else:
        print(f"  ✗ Cache save failed: {resp.status_code} {resp.text[:100]}")


# ── Main ────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Verify plan via Google Maps browser + save to DB")
    parser.add_argument("plan_file", help="Path to plan .md file")
    parser.add_argument("--dry-run", action="store_true", help="Preview only")
    parser.add_argument("--skip-cache", action="store_true", help="Don't save to cached_plans")
    args = parser.parse_args()

    plan_path = Path(args.plan_file)
    if not plan_path.exists():
        print(f"ERROR: {plan_path} not found")
        sys.exit(1)

    raw_content, blocks = parse_plan(str(plan_path))

    # Determine city + plan params
    dest_info = blocks.get("destination_enrich", {})
    city = dest_info.get("destination", "").lower() if isinstance(dest_info, dict) else ""
    if not city:
        city = input("  City: ").strip().lower()

    # Count days from itinerary
    duration = len(blocks.get("itinerary", []))
    vibe = "foodie"  # TODO: detect from filename or content
    traveler_type = "couple"

    venues = extract_venues(blocks, city)

    print(f"\n{'='*60}")
    print(f"  Plan Verification (Google Maps Browser)")
    print(f"  City: {city} | {duration} days | {vibe} | {traveler_type}")
    print(f"  Venues: {len(venues)}")
    print(f"  Mode: {'DRY RUN' if args.dry_run else 'LIVE'}")
    print(f"{'='*60}\n")

    if args.dry_run:
        for i, v in enumerate(venues):
            print(f"  [{i+1}] {v['name']} ({v['neighborhood']})")
        print(f"\n  Run without --dry-run to verify on Google Maps")
        return

    # Launch browser
    verified = 0
    failed = 0
    skipped = 0

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=False, slow_mo=200)
        ctx = browser.new_context(
            viewport={"width": 1366, "height": 900},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            locale="en-GB",
        )
        page = ctx.new_page()

        for i, venue in enumerate(venues):
            name = venue["name"]
            print(f"  [{i+1}/{len(venues)}] {name}...")

            # Skip if already in DB
            if already_verified(city, name):
                print(f"    ✓ Already cached")
                skipped += 1
                continue

            # Verify on Google Maps
            place_data = verify_venue_on_maps(page, name, city, venue.get("neighborhood", ""))

            if not place_data:
                print(f"    ✗ Not found")
                failed += 1
                time.sleep(1)
                continue

            matched_name = place_data.get("name", name)
            rating = place_data.get("rating", "?")
            print(f"    ✓ Found: {matched_name} | ★{rating}")

            # Download & upload photos
            photos_on_server = []
            for idx, photo_url in enumerate(place_data.get("photos", [])[:4]):
                img_bytes = download_image(photo_url)
                if img_bytes:
                    uploaded = upload_to_storage(img_bytes, city, name, idx)
                    if uploaded:
                        photos_on_server.append(uploaded)

            if photos_on_server:
                print(f"    ✓ {len(photos_on_server)} photos → your server")

            # Save to DB
            metadata = {
                "address": place_data.get("address", ""),
                "lat": place_data.get("lat"),
                "lng": place_data.get("lng"),
                "rating": place_data.get("rating"),
                "matched_name": matched_name,
                "neighborhood": venue.get("neighborhood", ""),
            }

            if save_venue_to_db(city, name, venue["type"], photos_on_server, metadata):
                verified += 1
            else:
                failed += 1

            time.sleep(2)

        browser.close()

    # Save plan to cache
    if not args.skip_cache:
        save_plan_to_cache(city, duration, vibe, traveler_type, raw_content)

    print(f"\n{'='*60}")
    print(f"  Done!")
    print(f"    Verified: {verified}")
    print(f"    Skipped (cached): {skipped}")
    print(f"    Failed: {failed}")
    print(f"    Plan cached as: {city}|{duration}|{vibe}|{traveler_type}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
