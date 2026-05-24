# -*- coding: utf-8 -*-
"""
Scrape venues from Google Maps using 5 parallel browsers.
Splits the venue list into 5 groups, each browser handles one group.

USAGE:
    python scripts/scrape_parallel.py --city Rotterdam
    python scripts/scrape_parallel.py --city Rotterdam --dry-run
    python scripts/scrape_parallel.py --city Rotterdam --browsers 3

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
import threading
from pathlib import Path
from urllib.parse import quote_plus
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests
from playwright.sync_api import sync_playwright, Page, TimeoutError as PwTimeout

# ── Load .env ───────────────────────────────────────────────────────────────
ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
env = {}
for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
    if "=" in line and not line.startswith("#"):
        k, _, v = line.partition("=")
        env[k.strip()] = v.strip().strip('"').strip("'")

SUPABASE_URL = env.get("VITE_SUPABASE_URL", "")
SERVICE_KEY = env.get("SUPABASE_SERVICE_ROLE_KEY", "")
HEADERS = {"Authorization": f"Bearer {SERVICE_KEY}", "apikey": SERVICE_KEY, "Content-Type": "application/json"}

VENUES_FILE = Path(__file__).parent / "venues_to_scrape.txt"
RESULTS_FILE = Path(__file__).parent / "scrape_results.json"

# Thread-safe results collection
results_lock = threading.Lock()
all_results = []
stats = {"found": 0, "not_found": 0}


def slug(name: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", name.lower().strip())
    return s.strip("-")[:60]


def upload_photo(city: str, venue_name: str, photo_url: str, index: int) -> str | None:
    """Download photo and upload to Supabase Storage."""
    try:
        img_data = requests.get(photo_url, timeout=15).content
        if len(img_data) < 5000:
            return None

        file_hash = hashlib.md5(img_data).hexdigest()[:10]
        filename = f"{slug(venue_name)}-{file_hash}{'-' + str(index) if index > 0 else ''}.jpg"
        storage_path = f"venues/{city}/{filename}"

        upload_url = f"{SUPABASE_URL}/storage/v1/object/destination-media/{storage_path}"
        r = requests.post(upload_url, headers={**HEADERS, "Content-Type": "image/jpeg"}, data=img_data)
        
        if r.status_code in (200, 201, 409):
            return f"{SUPABASE_URL}/storage/v1/object/public/destination-media/{storage_path}"
        return None
    except Exception as e:
        return None


def save_venue_to_db(city: str, venue_name: str, metadata: dict):
    """Save venue + 4 unique photos to destination_media table."""
    photos = metadata.get("photos", [])
    if not photos:
        return
    
    # Ensure all photos are unique (by base URL)
    seen = set()
    unique_photos = []
    for p in photos:
        base = re.sub(r"=.*$", "", p)
        if base not in seen:
            seen.add(base)
            unique_photos.append(p)
    photos = unique_photos[:4]
    
    if not photos:
        return
    
    # Main row with full metadata
    main_row = {
        "destination": city.lower(),
        "name": venue_name,
        "type": "venue",
        "url": photos[0],
        "thumb_url": photos[0],
        "source": "google_places",
        "media_type": "photo",
        "sort_order": 0,
        "metadata": {**metadata, "photos": photos, "verified": True},
    }
    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/destination_media",
        headers={**HEADERS, "Prefer": "return=minimal"},
        json=main_row
    )
    if r.status_code not in (200, 201):
        print(f"    DB save failed: {r.status_code} {r.text[:80]}")
        return

    # Additional photo rows (unique, not same as main)
    for i in range(1, len(photos)):
        photo_row = {
            "destination": city.lower(),
            "name": venue_name,
            "type": "venue",
            "url": photos[i],
            "thumb_url": photos[i],
            "source": "google_places",
            "media_type": "photo",
            "sort_order": i,
            "metadata": {"photo_index": i},
        }
        requests.post(
            f"{SUPABASE_URL}/rest/v1/destination_media",
            headers={**HEADERS, "Prefer": "return=minimal"},
            json=photo_row
        )


def scrape_venue(page: Page, venue_name: str, city: str, dry_run: bool = False) -> dict | None:
    """Search for a venue on Google Maps and extract data + photos."""
    search_query = f"{venue_name} {city}"
    url = f"https://www.google.com/maps/search/{quote_plus(search_query)}?hl=en"

    try:
        page.goto(url, wait_until="domcontentloaded", timeout=15000)
        time.sleep(4)

        # Handle cookie consent
        if "consent" in page.url:
            try:
                page.click("button:visible:has-text('Accept all')", timeout=3000)
                time.sleep(2)
                page.goto(url, wait_until="domcontentloaded", timeout=15000)
                time.sleep(4)
            except:
                pass

        # Find venue name
        found_name = None
        for sel in ["h1.DUwDvf", "h1.fontHeadlineLarge"]:
            el = page.query_selector(sel)
            if el:
                txt = el.inner_text().strip()
                if txt and "google" not in txt.lower():
                    found_name = txt
                    break

        if not found_name:
            # Click first NON-AD search result
            # Ads have "Ad" or "Sponsored" labels — skip them
            try:
                results = page.query_selector_all("a.hfpxzc")
                for result in results:
                    # Check if this result is an ad (has sponsored indicator nearby)
                    parent = result.query_selector("xpath=..")
                    is_ad = False
                    if parent:
                        parent_text = parent.inner_text().lower()
                        if "sponsored" in parent_text or "ad ·" in parent_text:
                            is_ad = True
                    if not is_ad:
                        result.click()
                        time.sleep(3)
                        el = page.query_selector("h1.DUwDvf")
                        if el:
                            found_name = el.inner_text().strip()
                        break
            except:
                pass

        if not found_name:
            return None

        actual_name = found_name
        
        # Verify the result is roughly what we searched for
        # (avoid saving wrong venues from ads/unrelated results)
        search_lower = venue_name.lower().split()[0]  # First word of search
        actual_lower = actual_name.lower()
        # If first word of search isn't in the result AND result isn't in search, skip
        if (search_lower not in actual_lower and 
            actual_lower.split()[0] not in venue_name.lower() and
            len(venue_name) > 5):
            # Might be a wrong result — skip
            return None

        # Rating
        rating = None
        rating_el = page.query_selector("div.F7nice span[aria-hidden='true']")
        if rating_el:
            try:
                rating = float(rating_el.inner_text())
            except:
                pass

        # Review count
        review_count = None
        review_el = page.query_selector("span[aria-label*='review']")
        if review_el:
            label = review_el.get_attribute("aria-label") or ""
            m = re.search(r"([\d,\.]+)", label)
            if m:
                review_count = int(m.group(1).replace(",", "").replace(".", ""))

        # Address
        address = None
        addr_el = page.query_selector("button[data-item-id='address'] div.fontBodyMedium")
        if addr_el:
            address = addr_el.inner_text().strip()

        # Category
        category_el = page.query_selector("button[jsaction*='category'] span")
        category_text = category_el.inner_text().strip() if category_el else ""

        # Coordinates from URL
        lat, lng = None, None
        current_url = page.url
        coord_match = re.search(r"@(-?\d+\.\d+),(-?\d+\.\d+)", current_url)
        if coord_match:
            lat = float(coord_match.group(1))
            lng = float(coord_match.group(2))

        # Photos — grab 4 UNIQUE high-res googleusercontent images
        photos = []
        if not dry_run:
            imgs = page.query_selector_all("img[src*='googleusercontent']")
            seen_bases = set()  # Track base URLs to avoid duplicates
            for img in imgs:
                src = img.get_attribute("src") or ""
                if len(src) < 50:
                    continue
                # Get the base URL without size params (to detect duplicates)
                base = re.sub(r"=.*$", "", src)
                if base in seen_bases:
                    continue
                seen_bases.add(base)
                # Make it high-res
                hires = base + "=w1200-h800-k-no"
                photos.append(hires)
                if len(photos) >= 4:
                    break

        return {
            "name": actual_name,
            "search_name": venue_name,
            "rating": rating,
            "review_count": review_count,
            "address": address,
            "category_text": category_text,
            "lat": lat,
            "lng": lng,
            "photo_urls": photos[:4],
        }

    except PwTimeout:
        return None
    except Exception as e:
        return None


def worker(browser_id: int, venues: list[str], city: str, dry_run: bool):
    """One browser worker that scrapes its assigned group of venues."""
    print(f"  🌐 Browser {browser_id} starting with {len(venues)} venues")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(locale="en-US", viewport={"width": 1280, "height": 800})
        page = context.new_page()

        # Initial cookie accept
        try:
            page.goto("https://www.google.com/maps?hl=en", wait_until="domcontentloaded", timeout=15000)
            time.sleep(2)
            page.click("button:visible:has-text('Accept all')", timeout=4000)
            time.sleep(2)
        except:
            pass

        for i, venue_name in enumerate(venues):
            result = scrape_venue(page, venue_name, city, dry_run)

            if result:
                with results_lock:
                    stats["found"] += 1
                    all_results.append(result)

                if not dry_run and result["photo_urls"]:
                    metadata = {
                        "rating": result["rating"],
                        "review_count": result["review_count"],
                        "address": result["address"],
                        "lat": result["lat"],
                        "lng": result["lng"],
                        "category_text": result["category_text"],
                        "photos": result["photo_urls"][:4],
                        "search_name": venue_name,
                    }
                    save_venue_to_db(city, result["name"], metadata)

                print(f"  [B{browser_id}] ✓ {i+1}/{len(venues)} {result['name']} (★{result['rating']}, {len(result['photo_urls'])} pics)")
            else:
                with results_lock:
                    stats["not_found"] += 1
                
                # Save as unverified so we know this venue doesn't exist
                if not dry_run:
                    failed_row = {
                        "destination": city.lower(),
                        "name": venue_name,
                        "type": "venue",
                        "url": None,
                        "thumb_url": None,
                        "source": "google_places",
                        "media_type": "photo",
                        "sort_order": 0,
                        "metadata": {"verified": False, "search_name": venue_name},
                    }
                    requests.post(
                        f"{SUPABASE_URL}/rest/v1/destination_media",
                        headers={**HEADERS, "Prefer": "return=minimal"},
                        json=failed_row
                    )
                
                print(f"  [B{browser_id}] ✗ {i+1}/{len(venues)} {venue_name}")

            time.sleep(2)

        browser.close()

    print(f"  🌐 Browser {browser_id} done!")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--city", default="Rotterdam")
    parser.add_argument("--browsers", type=int, default=5)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if not VENUES_FILE.exists():
        print(f"ERROR: {VENUES_FILE} not found")
        sys.exit(1)

    venues = [v.strip() for v in VENUES_FILE.read_text().splitlines() if v.strip()]
    print(f"\n🚀 Scraping {len(venues)} venues for {args.city} with {args.browsers} browsers")
    print(f"   Dry run: {args.dry_run}\n")

    # Split venues into groups
    n = args.browsers
    groups = [venues[i::n] for i in range(n)]

    # Run browsers in parallel threads
    threads = []
    for i, group in enumerate(groups):
        t = threading.Thread(target=worker, args=(i+1, group, args.city, args.dry_run))
        threads.append(t)
        t.start()
        time.sleep(2)  # Stagger browser launches

    # Wait for all to finish
    for t in threads:
        t.join()

    # Summary
    print(f"\n{'═' * 60}")
    print(f"✅ Done! Found: {stats['found']}, Not found: {stats['not_found']}")
    print(f"   Total: {stats['found']}/{len(venues)} venues scraped")
    print(f"{'═' * 60}")

    # Save results
    with open(RESULTS_FILE, "w") as f:
        json.dump(all_results, f, indent=2)
    print(f"Results saved to {RESULTS_FILE}")


if __name__ == "__main__":
    main()
