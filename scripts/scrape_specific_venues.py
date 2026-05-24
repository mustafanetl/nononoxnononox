# -*- coding: utf-8 -*-
"""
Scrape specific venues from Google Maps by name.
Uses Playwright (browser) — FREE, no API costs.

Takes a list of venue names, searches each on Google Maps,
grabs photos + metadata, uploads to Supabase.

USAGE:
    python scripts/scrape_specific_venues.py --city Rotterdam
    python scripts/scrape_specific_venues.py --city Rotterdam --limit 5
    python scripts/scrape_specific_venues.py --city Rotterdam --dry-run

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

# ── Load venue list ─────────────────────────────────────────────────────────
VENUES_FILE = Path(__file__).parent / "venues_to_scrape.txt"


def slug(name: str) -> str:
    """Make a URL-safe slug from a venue name."""
    s = re.sub(r"[^a-z0-9]+", "-", name.lower().strip())
    return s.strip("-")[:60]


def upload_photo(city: str, venue_name: str, photo_url: str, index: int) -> str | None:
    """Download a photo and upload to Supabase Storage."""
    try:
        img_data = requests.get(photo_url, timeout=10).content
        if len(img_data) < 5000:
            return None  # Too small, probably an error/placeholder
        
        ext = "jpg"
        file_hash = hashlib.md5(img_data).hexdigest()[:10]
        filename = f"{slug(venue_name)}-{file_hash}{'-' + str(index) if index > 0 else ''}.{ext}"
        storage_path = f"venues/{city}/{filename}"
        
        upload_url = f"{SUPABASE_URL}/storage/v1/object/destination-media/{storage_path}"
        r = requests.post(
            upload_url,
            headers={**HEADERS, "Content-Type": "image/jpeg"},
            data=img_data
        )
        if r.status_code in (200, 201):
            public_url = f"{SUPABASE_URL}/storage/v1/object/public/destination-media/{storage_path}"
            return public_url
        elif r.status_code == 409:  # Already exists
            public_url = f"{SUPABASE_URL}/storage/v1/object/public/destination-media/{storage_path}"
            return public_url
        else:
            print(f"    Upload failed ({r.status_code}): {r.text[:100]}")
            return None
    except Exception as e:
        print(f"    Photo download/upload error: {e}")
        return None


def save_venue_to_db(city: str, venue_name: str, metadata: dict, photos: list[str]):
    """Save venue + photos to destination_media table."""
    # Main venue entry
    row = {
        "destination": city.lower(),
        "name": venue_name,
        "type": "activity",  # Use 'activity' type so enrich-destination finds it
        "url": photos[0] if photos else None,
        "thumb_url": photos[0] if photos else None,
        "source": "google_maps_scraper",
        "media_type": "photo",
        "metadata": metadata,
    }
    
    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/destination_media",
        headers={**HEADERS, "Prefer": "resolution=merge-duplicates,return=minimal"},
        json=row
    )
    if r.status_code not in (200, 201, 409):
        print(f"    DB save failed: {r.status_code} {r.text[:100]}")


def scrape_venue(page: Page, venue_name: str, city: str, dry_run: bool = False) -> dict | None:
    """Search for a specific venue on Google Maps and extract data."""
    search_query = f"{venue_name} {city} Netherlands"
    url = f"https://www.google.com/maps/search/{quote_plus(search_query)}"
    
    try:
        page.goto(url, wait_until="networkidle", timeout=20000)
        time.sleep(4)
        
        # Handle cookie consent if it appears
        try:
            consent = page.query_selector("button:has-text('Accept all'), button:has-text('Alles accepteren'), form[action*='consent'] button")
            if consent:
                consent.click()
                time.sleep(2)
        except:
            pass
        
        # Check if we landed on a specific place page or a search results list
        # Place page indicators: rating stars, address button, or the action bar
        name_el = page.query_selector("h1.DUwDvf, h1.fontHeadlineLarge, h1[class*='header']")
        
        if not name_el:
            # Maybe it's a list - click first result
            time.sleep(2)
            first_result = page.query_selector("a.hfpxzc, div[role='feed'] a[href*='/maps/place/']")
            if first_result:
                first_result.click()
                time.sleep(3)
                name_el = page.query_selector("h1.DUwDvf, h1.fontHeadlineLarge, h1[class*='header']")
        
        if not name_el:
            # Try another approach - look for any h1 or h2 with text
            all_h1 = page.query_selector_all("h1")
            for h in all_h1:
                txt = h.inner_text().strip()
                if txt and len(txt) > 2 and txt.lower() != "google maps":
                    name_el = h
                    break
        
        if not name_el:
            print(f"    Could not find place page for '{venue_name}'")
            return None
        
        actual_name = name_el.inner_text().strip()
        
        # Get rating
        rating = None
        rating_el = page.query_selector("div.F7nice span[aria-hidden='true']")
        if rating_el:
            try:
                rating = float(rating_el.inner_text())
            except:
                pass
        
        # Get review count
        review_count = None
        review_el = page.query_selector("span[aria-label*='reviews'], span[aria-label*='review']")
        if review_el:
            label = review_el.get_attribute("aria-label") or ""
            m = re.search(r"([\d,]+)", label)
            if m:
                review_count = int(m.group(1).replace(",", ""))
        
        # Get address
        address = None
        addr_el = page.query_selector("button[data-item-id='address'] div.fontBodyMedium")
        if addr_el:
            address = addr_el.inner_text().strip()
        
        # Get category
        category_el = page.query_selector("button[jsaction*='category'] span")
        category_text = category_el.inner_text().strip() if category_el else ""
        
        # Get photos
        photos = []
        if not dry_run:
            # Click photos tab/button
            photo_button = page.query_selector("button[aria-label*='photo'], button[aria-label*='Photo']")
            if photo_button:
                photo_button.click()
                time.sleep(2)
            
            # Get photo URLs from the page
            photo_els = page.query_selector_all("a[data-photo-index] img, div.U39Pmb img, img.gallery-image")
            for img in photo_els[:4]:
                src = img.get_attribute("src") or ""
                if src and "googleusercontent" in src and len(src) > 50:
                    # Get higher res version
                    src = re.sub(r"=w\d+-h\d+", "=w800-h600", src)
                    photos.append(src)
            
            # Alternative: get from background images
            if not photos:
                bg_els = page.query_selector_all("[style*='background-image']")
                for el in bg_els[:4]:
                    style = el.get_attribute("style") or ""
                    m = re.search(r"url\([\"']?(https://[^\"')]+)", style)
                    if m and "googleusercontent" in m.group(1):
                        photos.append(m.group(1))
        
        # Get coordinates from URL
        lat, lng = None, None
        current_url = page.url
        coord_match = re.search(r"@(-?\d+\.\d+),(-?\d+\.\d+)", current_url)
        if coord_match:
            lat = float(coord_match.group(1))
            lng = float(coord_match.group(2))
        
        result = {
            "name": actual_name,
            "search_name": venue_name,
            "rating": rating,
            "review_count": review_count,
            "address": address,
            "category_text": category_text,
            "lat": lat,
            "lng": lng,
            "photos_found": len(photos),
            "photo_urls": photos,
        }
        
        return result
        
    except PwTimeout:
        print(f"    Timeout for '{venue_name}'")
        return None
    except Exception as e:
        print(f"    Error for '{venue_name}': {e}")
        return None


def main():
    parser = argparse.ArgumentParser(description="Scrape specific venues from Google Maps")
    parser.add_argument("--city", default="Rotterdam", help="City name")
    parser.add_argument("--limit", type=int, default=0, help="Limit number of venues (0=all)")
    parser.add_argument("--dry-run", action="store_true", help="Don't upload, just show what would be scraped")
    args = parser.parse_args()
    
    if not VENUES_FILE.exists():
        print(f"ERROR: {VENUES_FILE} not found. Run generate_and_extract_venues.mjs first.")
        sys.exit(1)
    
    venues = [v.strip() for v in VENUES_FILE.read_text().splitlines() if v.strip()]
    if args.limit:
        venues = venues[:args.limit]
    
    print(f"Scraping {len(venues)} venues for {args.city}...")
    print(f"Dry run: {args.dry_run}\n")
    
    results = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # Visible browser
        context = browser.new_context(
            locale="en-US",
            viewport={"width": 1280, "height": 800}
        )
        page = context.new_page()
        
        # Accept cookies if prompted
        page.goto("https://www.google.com/maps", wait_until="networkidle")
        time.sleep(3)
        try:
            accept_btn = page.query_selector("button:has-text('Accept all'), button:has-text('Alles accepteren'), button:has-text('Accepteer alles')")
            if accept_btn:
                accept_btn.click()
                time.sleep(2)
            else:
                # Try form-based consent
                form_btn = page.query_selector("form[action*='consent'] button, button[aria-label*='Accept']")
                if form_btn:
                    form_btn.click()
                    time.sleep(2)
        except:
            pass
        
        for i, venue_name in enumerate(venues):
            print(f"  [{i+1}/{len(venues)}] {venue_name}...", end=" ")
            
            result = scrape_venue(page, venue_name, args.city, args.dry_run)
            
            if result:
                print(f"✓ {result['name']} (★{result['rating']}, {result['photos_found']} photos)")
                results.append(result)
                
                # Upload photos and save to DB
                if not args.dry_run and result['photo_urls']:
                    uploaded_urls = []
                    for idx, photo_url in enumerate(result['photo_urls'][:4]):
                        public_url = upload_photo(args.city.lower(), result['name'], photo_url, idx)
                        if public_url:
                            uploaded_urls.append(public_url)
                    
                    if uploaded_urls:
                        metadata = {
                            "rating": result['rating'],
                            "review_count": result['review_count'],
                            "address": result['address'],
                            "lat": result['lat'],
                            "lng": result['lng'],
                            "category_text": result['category_text'],
                            "photos": uploaded_urls,
                        }
                        save_venue_to_db(args.city.lower(), result['name'], metadata, uploaded_urls)
            else:
                print("✗ Not found")
            
            time.sleep(2)  # Be nice to Google
        
        browser.close()
    
    # Summary
    print(f"\n{'═' * 50}")
    print(f"Done! Found {len(results)}/{len(venues)} venues")
    print(f"{'═' * 50}")
    
    # Save results
    out_file = Path(__file__).parent / "scrape_results.json"
    with open(out_file, "w") as f:
        json.dump(results, f, indent=2)
    print(f"Saved details to {out_file}")


if __name__ == "__main__":
    main()
