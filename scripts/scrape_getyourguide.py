# -*- coding: utf-8 -*-
"""
Scrape GetYourGuide activities city-by-city using Playwright (VISIBLE browser).

Downloads activity images → uploads to Supabase Storage (destination-media bucket)
→ saves all activity data to destination_media table with type='gyg_activity'.

The data is structured so the AI trip planner can:
1. Use it as context when generating plans (inject top activities per city)
2. Link directly to the activity with your affiliate partner_id
3. Show real prices, ratings, and images from your own server

AFFILIATE LINK FORMAT:
    https://www.getyourguide.com/{activity-path}?partner_id={YOUR_ID}&cmp={CAMPAIGN}
    
    Store the raw activity_url in metadata. At display time, append partner_id.

SETUP:
    1. Add to .env:
       SUPABASE_SERVICE_ROLE_KEY=eyJ...
       GETYOURGUIDE_PARTNER_ID=your_partner_id  (optional, for link building)
    2. pip install playwright requests
    3. python -m playwright install chromium

USAGE:
    python scripts/scrape_getyourguide.py --city Rotterdam
    python scripts/scrape_getyourguide.py --limit 5
    python scripts/scrape_getyourguide.py --dry-run
    python scripts/scrape_getyourguide.py
    python scripts/scrape_getyourguide.py --start-from Berlin
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
SERVICE_KEY = ENV.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
GYG_PARTNER_ID = ENV.get("GETYOURGUIDE_PARTNER_ID") or os.environ.get("GETYOURGUIDE_PARTNER_ID", "")

if not SUPABASE_URL:
    print("ERROR: VITE_SUPABASE_URL must be set in .env")
    sys.exit(1)
if not SERVICE_KEY:
    print("ERROR: SUPABASE_SERVICE_ROLE_KEY must be set in .env")
    print("  Get it from: Supabase Dashboard → Settings → API → service_role (secret)")
    sys.exit(1)

DB_HEADERS = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {SERVICE_KEY}",
    "apikey": SERVICE_KEY,
    "Prefer": "return=minimal",
}

STORAGE_BUCKET = "destination-media"


# ── Destinations ────────────────────────────────────────────────────────────

DESTINATIONS = [
    "Paris", "Amsterdam", "Barcelona", "Madrid", "Lisbon", "Porto",
    "Rome", "Florence", "Milan", "Venice", "Naples",
    "Berlin", "Munich", "Hamburg", "Vienna", "Prague", "Budapest",
    "Brussels", "Dublin", "Edinburgh", "London",
    "Stockholm", "Copenhagen", "Oslo", "Helsinki",
    "Athens", "Santorini", "Dubrovnik", "Split",
    "Nice", "Marseille", "Krakow", "Warsaw", "Zurich", "Seville", "Malaga",
    "Tokyo", "Kyoto", "Osaka", "Bangkok", "Chiang Mai",
    "Singapore", "Kuala Lumpur", "Hong Kong",
    "Seoul", "Busan", "Hanoi", "Ho Chi Minh City",
    "Bali", "Taipei", "Dubai", "Abu Dhabi",
    "Mumbai", "Delhi", "Goa", "Jaipur",
    "Phuket", "Krabi", "Siem Reap",
    "Marrakech", "Casablanca", "Cairo", "Luxor",
    "Nairobi", "Zanzibar", "Cape Town", "Johannesburg",
    "Mauritius", "Seychelles", "Accra", "Dakar",
    "Rotterdam", "Antalya", "Bodrum", "Istanbul",
]

# GYG category mapping → your AI's category system
GYG_TO_AI_CATEGORY = {
    "tours": "sightseeing",
    "food & drink": "dining",
    "food & drinks": "dining",
    "museums": "culture",
    "museums & exhibitions": "culture",
    "outdoor activities": "adventure",
    "day trips": "sightseeing",
    "water activities": "adventure",
    "nightlife": "nightlife",
    "nightlife & entertainment": "nightlife",
    "classes & workshops": "culture",
    "tickets & passes": "sightseeing",
    "transfers & transport": "sightseeing",
    "boat tours": "adventure",
    "walking tours": "sightseeing",
    "bike tours": "adventure",
    "food tours": "dining",
    "cooking classes": "dining",
    "pub crawls": "nightlife",
    "spa & wellness": "romance",
    "shopping": "shopping",
}


# ── Helpers ─────────────────────────────────────────────────────────────────

def normalize_dest(city: str) -> str:
    return city.lower().strip()


def map_category(raw_category: str) -> str:
    """Map GYG category to AI-compatible category."""
    lower = raw_category.lower().strip()
    for key, val in GYG_TO_AI_CATEGORY.items():
        if key in lower:
            return val
    return "sightseeing"  # default


def build_affiliate_url(activity_url: str) -> str:
    """Append partner_id to activity URL for affiliate tracking."""
    if not GYG_PARTNER_ID or not activity_url:
        return activity_url
    sep = "&" if "?" in activity_url else "?"
    return f"{activity_url}{sep}partner_id={GYG_PARTNER_ID}"


def compute_priority_score(rating, review_count, price) -> int:
    """
    Compute a priority score (1=best, 5=worst) based on quality signals.
    
    Score logic:
      1 = Must-see (★4.5+ AND 1000+ reviews)
      2 = Highly recommended (★4.0+ AND 500+ reviews)
      3 = Good option (★3.5+ OR 100+ reviews)
      4 = Decent filler (everything else with data)
      5 = Unknown quality (no rating/reviews)
    """
    try:
        r = float(rating) if rating else 0
        rc = int(review_count) if review_count else 0
    except (ValueError, TypeError):
        return 5

    if r == 0 and rc == 0:
        return 5
    if r >= 4.5 and rc >= 1000:
        return 1
    if r >= 4.0 and rc >= 500:
        return 2
    if r >= 3.5 or rc >= 100:
        return 3
    return 4


def download_image(url: str) -> bytes | None:
    """Download image bytes from URL."""
    try:
        r = requests.get(url, timeout=20, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })
        if r.status_code == 200 and len(r.content) > 500:
            return r.content
    except Exception:
        pass
    return None


def upload_image(image_bytes: bytes, city: str, activity_name: str, index: int = 0) -> str:
    """Upload image to Supabase Storage. Returns PUBLIC URL on your server.
    index=0 is the main image, 1-3 are gallery images."""
    name_hash = hashlib.md5(f"{city}|{activity_name}".encode()).hexdigest()[:10]
    safe_name = re.sub(r'[^a-z0-9]+', '-', activity_name.lower())[:40].strip('-')
    suffix = f"-{index}" if index > 0 else ""
    file_path = f"gyg/{normalize_dest(city)}/{safe_name}-{name_hash}{suffix}.jpg"

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
    print(f"    [UPLOAD FAIL] {resp.status_code}: {resp.text[:100]}")
    return ""


def save_to_db(city: str, name: str, image_url: str, sort_order: int, metadata: dict) -> bool:
    """
    Insert one activity row into destination_media.
    
    The metadata structure is designed for the AI to consume:
    {
        "description": "...",           # What the activity is
        "price": 45.0,                  # Price in local currency (from XX)
        "currency": "EUR",              # Currency code
        "rating": 4.8,                  # Out of 5
        "review_count": 12500,          # Number of reviews
        "duration": "2.5 hours",        # How long it takes
        "category": "sightseeing",      # AI-compatible category
        "gyg_category": "Tours",        # Original GYG category
        "activity_url": "https://...",  # Direct link (add partner_id at display)
        "affiliate_url": "https://...", # Pre-built affiliate link
        "bookAhead": true,              # Whether reservation needed
        "highlights": ["...", "..."],   # Key selling points
        "includes": ["...", "..."],     # What's included
        "neighborhood": "Old Town",     # Area of the city
        "scraped_at": "2026-05-21T..."  # When this was scraped
    }
    """
    row = {
        "destination": normalize_dest(city),
        "type": "gyg_activity",
        "name": name,
        "url": image_url,
        "thumb_url": image_url,
        "source": "getyourguide",
        "media_type": "photo",
        "sort_order": sort_order,
        "metadata": metadata,
    }
    try:
        resp = requests.post(
            f"{SUPABASE_URL}/rest/v1/destination_media",
            headers=DB_HEADERS,
            json=row,
            timeout=15,
        )
        return resp.status_code in (200, 201, 204)
    except Exception as e:
        print(f"    [DB ERROR] {e}")
        return False


def already_scraped(city: str) -> set[str]:
    """Get names of activities already in DB for this city."""
    try:
        resp = requests.get(
            f"{SUPABASE_URL}/rest/v1/destination_media"
            f"?destination=eq.{normalize_dest(city)}&type=eq.gyg_activity&select=name",
            headers={"Authorization": f"Bearer {SERVICE_KEY}", "apikey": SERVICE_KEY},
            timeout=10,
        )
        if resp.status_code == 200:
            return {r["name"] for r in resp.json()}
    except Exception:
        pass
    return set()


# ── Browser scraping ────────────────────────────────────────────────────────

def accept_cookies(page: Page):
    try:
        for sel in ['button:has-text("Accept")', 'button:has-text("Accept all")',
                    'button[id*="accept"]', '[data-testid*="accept"]']:
            btn = page.locator(sel).first
            if btn.is_visible(timeout=1500):
                btn.click()
                time.sleep(0.5)
                return
    except Exception:
        pass


def scroll_page(page: Page, times: int = 6):
    for _ in range(times):
        page.evaluate("window.scrollBy(0, 800)")
        time.sleep(1)


def scrape_listing(page: Page, city: str, max_items: int = 40) -> list[dict]:
    """Scrape GYG search results. Returns [{name, url, image}]."""
    url = f"https://www.getyourguide.com/s/?q={quote_plus(city)}&searchSource=1"
    print(f"  Loading: {url}")

    page.goto(url, wait_until="domcontentloaded", timeout=40000)
    time.sleep(4)
    accept_cookies(page)
    scroll_page(page)

    results: list[dict] = []
    seen: set[str] = set()

    # Strategy 1: JSON-LD
    ld_results = _parse_json_ld(page)
    if ld_results:
        print(f"  → {len(ld_results)} from JSON-LD")
        return ld_results[:max_items]

    # Strategy 2: Parse activity links (-tDIGITS pattern)
    links = page.locator('a[href]')
    count = links.count()
    print(f"  → Scanning {count} links...")

    for i in range(min(count, 500)):
        try:
            el = links.nth(i)
            href = el.get_attribute("href") or ""
            if not re.search(r'-t\d+/?(\?|$)', href):
                continue
            clean = re.sub(r'\?.*$', '', href)
            full_url = clean if clean.startswith("http") else f"https://www.getyourguide.com{clean}"

            title = el.get_attribute("aria-label") or ""
            if not title:
                title = el.inner_text().strip().split("\n")[0]
            title = title.strip()[:150]
            if not title or len(title) < 5 or title.lower() in seen:
                continue
            seen.add(title.lower())

            img_url = ""
            try:
                img = el.locator("img").first
                if img.count() > 0:
                    img_url = img.get_attribute("src") or img.get_attribute("data-src") or ""
                    if "data:image" in img_url or len(img_url) < 20:
                        img_url = ""
            except Exception:
                pass

            results.append({"name": title, "url": full_url, "image": img_url})
            if len(results) >= max_items:
                break
        except Exception:
            continue

    print(f"  → Found {len(results)} activities")
    return results[:max_items]


def _parse_json_ld(page: Page) -> list[dict]:
    """Extract structured data from JSON-LD."""
    results = []
    try:
        scripts = page.locator('script[type="application/ld+json"]')
        for i in range(scripts.count()):
            try:
                data = json.loads(scripts.nth(i).inner_text())
                items = data if isinstance(data, list) else [data]
                for item in items:
                    if item.get("@type") == "ItemList":
                        for elem in item.get("itemListElement", []):
                            sub = elem.get("item", elem)
                            name = sub.get("name", "")
                            if name and len(name) > 3:
                                img = sub.get("image", "")
                                if isinstance(img, list): img = img[0] if img else ""
                                elif isinstance(img, dict): img = img.get("url", "")
                                agg = sub.get("aggregateRating", {}) or {}
                                results.append({
                                    "name": name,
                                    "url": sub.get("url", ""),
                                    "image": img,
                                    "rating": agg.get("ratingValue") if isinstance(agg, dict) else None,
                                    "review_count": agg.get("reviewCount") if isinstance(agg, dict) else None,
                                })
                    elif item.get("@type") in ("Product", "Event", "TouristAttraction"):
                        name = item.get("name", "")
                        if name:
                            img = item.get("image", "")
                            if isinstance(img, list): img = img[0] if img else ""
                            elif isinstance(img, dict): img = img.get("url", "")
                            agg = item.get("aggregateRating", {}) or {}
                            offers = item.get("offers", {}) or {}
                            results.append({
                                "name": name,
                                "url": item.get("url", ""),
                                "image": img,
                                "description": (item.get("description") or "")[:400],
                                "rating": agg.get("ratingValue"),
                                "review_count": agg.get("reviewCount"),
                                "price": offers.get("lowPrice") or offers.get("price"),
                                "currency": offers.get("priceCurrency", "EUR"),
                            })
            except (json.JSONDecodeError, TypeError):
                continue
    except Exception:
        pass
    return results


def scrape_detail(page: Page, activity_url: str) -> dict:
    """
    Visit activity detail page → extract FULL info for the AI.
    
    Extracts everything the AI needs:
    - name, description, price, currency, rating, review_count
    - duration, category, neighborhood
    - highlights, includes (what's in the tour)
    - bookAhead (popular = needs reservation)
    """
    data: dict = {}
    try:
        page.goto(activity_url, wait_until="domcontentloaded", timeout=25000)
        time.sleep(2.5)

        # ── JSON-LD (most reliable source) ──
        scripts = page.locator('script[type="application/ld+json"]')
        for i in range(scripts.count()):
            try:
                parsed = json.loads(scripts.nth(i).inner_text())
                items = parsed if isinstance(parsed, list) else [parsed]
                for item in items:
                    if item.get("@type") in ("Product", "Event", "TouristAttraction", "Thing"):
                        data["name"] = item.get("name", "")
                        data["description"] = (item.get("description") or "")[:500]
                        img = item.get("image", "")
                        if isinstance(img, list): img = img[0] if img else ""
                        elif isinstance(img, dict): img = img.get("url", "")
                        data["image"] = img
                        offers = item.get("offers", {}) or {}
                        data["price"] = offers.get("lowPrice") or offers.get("price")
                        data["currency"] = offers.get("priceCurrency", "EUR")
                        agg = item.get("aggregateRating", {}) or {}
                        data["rating"] = agg.get("ratingValue")
                        data["review_count"] = agg.get("reviewCount")
                        break
            except Exception:
                continue

        # ── DOM fallbacks ──
        if not data.get("name"):
            try:
                h1 = page.locator("h1").first
                if h1.is_visible(timeout=2000):
                    data["name"] = h1.inner_text().strip()
            except Exception:
                pass

        if not data.get("description"):
            try:
                meta = page.locator('meta[name="description"]')
                if meta.count():
                    data["description"] = (meta.get_attribute("content") or "")[:500]
            except Exception:
                pass

        if not data.get("image"):
            try:
                img = page.locator('picture img, img[class*="hero"], img[class*="gallery"]').first
                if img.is_visible(timeout=2000):
                    data["image"] = img.get_attribute("src") or ""
            except Exception:
                pass

        # ── Gallery photos (grab up to 4: main + 3 more) ──
        gallery_urls: list[str] = []
        try:
            # Try multiple selectors for gallery/carousel images
            img_selectors = [
                '[class*="gallery"] img',
                '[class*="carousel"] img',
                '[class*="slider"] img',
                '[data-testid*="gallery"] img',
                '[class*="photo"] img',
                'picture img',
            ]
            seen_srcs: set[str] = set()
            # Add the main image first if we have it
            if data.get("image"):
                gallery_urls.append(data["image"])
                seen_srcs.add(data["image"])

            for sel in img_selectors:
                imgs = page.locator(sel)
                count = imgs.count()
                for j in range(min(count, 10)):
                    try:
                        src = imgs.nth(j).get_attribute("src") or ""
                        # Skip tiny placeholders, data URIs, icons
                        if not src or len(src) < 30:
                            continue
                        if "data:image" in src or "svg" in src:
                            continue
                        if "icon" in src or "logo" in src:
                            continue
                        # Skip if already seen
                        if src in seen_srcs:
                            continue
                        # Only keep reasonably sized images (GYG uses cdn URLs)
                        if "getyourguide" in src or "cdn" in src or "http" in src:
                            seen_srcs.add(src)
                            gallery_urls.append(src)
                        if len(gallery_urls) >= 4:
                            break
                    except Exception:
                        continue
                if len(gallery_urls) >= 4:
                    break
        except Exception:
            pass

        # Store all gallery URLs (will be downloaded + uploaded later)
        data["gallery_images"] = gallery_urls[:4]
        # Ensure main image is set
        if not data.get("image") and gallery_urls:
            data["image"] = gallery_urls[0]

        # ── Duration ──
        try:
            dur_el = page.locator('[class*="duration"], [data-testid*="duration"]').first
            if dur_el.is_visible(timeout=1000):
                data["duration"] = dur_el.inner_text().strip()[:60]
        except Exception:
            pass

        # ── Category from breadcrumb ──
        try:
            crumbs = page.locator('[class*="breadcrumb"] a, nav[aria-label*="Breadcrumb"] a')
            if crumbs.count() >= 2:
                raw_cat = crumbs.nth(crumbs.count() - 2).inner_text().strip()
                data["gyg_category"] = raw_cat
                data["category"] = map_category(raw_cat)
        except Exception:
            pass

        # ── Highlights / What's included (key for AI context) ──
        highlights = []
        try:
            hl_items = page.locator('[class*="highlight"] li, [data-testid*="highlight"] li')
            for j in range(min(hl_items.count(), 5)):
                txt = hl_items.nth(j).inner_text().strip()
                if txt and len(txt) > 3:
                    highlights.append(txt[:100])
        except Exception:
            pass
        if highlights:
            data["highlights"] = highlights

        includes = []
        try:
            inc_items = page.locator('[class*="included"] li, [class*="includes"] li')
            for j in range(min(inc_items.count(), 5)):
                txt = inc_items.nth(j).inner_text().strip()
                if txt and len(txt) > 3:
                    includes.append(txt[:100])
        except Exception:
            pass
        if includes:
            data["includes"] = includes

        # ── Meeting point / Address / Location ──
        try:
            # Try multiple selectors for meeting point info
            meeting_selectors = [
                '[data-testid*="meeting-point"]',
                '[class*="meeting-point"]',
                '[class*="meetingPoint"]',
                'section:has-text("Meeting point") p',
                'section:has-text("Where") p',
                '[class*="location-info"]',
                '[class*="location"] address',
            ]
            for sel in meeting_selectors:
                el = page.locator(sel).first
                if el.count() > 0 and el.is_visible(timeout=800):
                    loc_text = el.inner_text().strip()[:200]
                    if loc_text and len(loc_text) > 5:
                        data["meeting_point"] = loc_text
                        # Try to extract neighborhood from address
                        if not data.get("neighborhood"):
                            data["neighborhood"] = loc_text.split(",")[0].strip()[:60]
                        break
        except Exception:
            pass

        # ── Try to get coordinates from page (Google Maps link or structured data) ──
        try:
            # Check for map links with coordinates
            map_links = page.locator('a[href*="maps"], a[href*="google.com/maps"]')
            if map_links.count() > 0:
                map_href = map_links.first.get_attribute("href") or ""
                # Extract coords from Google Maps URL: @lat,lng or ?q=lat,lng
                coord_match = re.search(r'@(-?\d+\.\d+),(-?\d+\.\d+)', map_href)
                if not coord_match:
                    coord_match = re.search(r'[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)', map_href)
                if coord_match:
                    data["lat"] = float(coord_match.group(1))
                    data["lng"] = float(coord_match.group(2))
        except Exception:
            pass

        # ── Cancellation policy ──
        try:
            cancel_el = page.locator('[class*="cancellation"], [data-testid*="cancellation"]').first
            if cancel_el.count() > 0 and cancel_el.is_visible(timeout=800):
                cancel_text = cancel_el.inner_text().strip()[:80]
                data["free_cancellation"] = "free" in cancel_text.lower()
        except Exception:
            pass

        # ── Languages available ──
        try:
            lang_el = page.locator('[class*="language"], [data-testid*="language"]').first
            if lang_el.count() > 0 and lang_el.is_visible(timeout=800):
                data["languages"] = lang_el.inner_text().strip()[:100]
        except Exception:
            pass

        # ── Group size / Tour type ──
        try:
            group_el = page.locator('[class*="group"], [data-testid*="group"], :text("Private"), :text("Small group")')
            if group_el.count() > 0:
                group_text = group_el.first.inner_text().strip()[:60]
                if "private" in group_text.lower():
                    data["tour_type"] = "private"
                elif "small" in group_text.lower():
                    data["tour_type"] = "small_group"
                else:
                    data["tour_type"] = "group"
        except Exception:
            pass

        # ── Price fallback from DOM ──
        if not data.get("price"):
            try:
                price_el = page.locator('[class*="price"], [data-testid*="price"]').first
                if price_el.is_visible(timeout=1000):
                    txt = price_el.inner_text()
                    m = re.search(r'[\d,.]+', txt.replace(',', ''))
                    if m:
                        data["price"] = float(m.group())
                    if '€' in txt: data["currency"] = "EUR"
                    elif '$' in txt: data["currency"] = "USD"
                    elif '£' in txt: data["currency"] = "GBP"
            except Exception:
                pass

        # ── Determine if bookAhead needed (high review count = popular) ──
        review_count = data.get("review_count")
        if review_count and int(review_count) > 1000:
            data["bookAhead"] = True
        else:
            data["bookAhead"] = False

    except Exception as e:
        print(f"    [DETAIL ERROR] {e}")

    data["activity_url"] = activity_url
    return data


# ── Main pipeline ───────────────────────────────────────────────────────────

def process_city(page: Page, city: str, dry_run: bool = False, max_activities: int = 30):
    """Full pipeline: listing → detail → download image → upload → save to DB."""
    cached = already_scraped(city)
    if cached:
        print(f"  ({len(cached)} already cached)")

    stubs = scrape_listing(page, city, max_items=max_activities + 10)
    if not stubs:
        print(f"  [SKIP] No activities found")
        return 0

    print(f"  Got {len(stubs)} activities from listing")
    saved = 0

    for idx, stub in enumerate(stubs[:max_activities]):
        name = stub.get("name", "").strip()
        if not name or name in cached:
            continue

        if dry_run:
            print(f"  [{idx+1}] (dry) {name[:60]}")
            continue

        print(f"  [{idx+1}/{min(len(stubs), max_activities)}] {name[:55]}...")

        # Get full details from activity page
        detail_url = stub.get("url", "")
        detail = {}
        if detail_url:
            detail = scrape_detail(page, detail_url)
            time.sleep(1.5)

        # Merge data
        final_name = detail.get("name") or name
        gallery_sources = detail.get("gallery_images", [])
        # If no gallery from detail page, use listing image as fallback
        if not gallery_sources:
            fallback_img = detail.get("image") or stub.get("image", "")
            if fallback_img:
                gallery_sources = [fallback_img]

        # Download & upload up to 4 photos to YOUR server
        server_img_urls: list[str] = []
        for img_idx, img_src in enumerate(gallery_sources[:4]):
            if not img_src:
                continue
            img_bytes = download_image(img_src)
            if img_bytes:
                uploaded = upload_image(img_bytes, city, final_name, index=img_idx)
                if uploaded:
                    server_img_urls.append(uploaded)

        if server_img_urls:
            print(f"    ✓ {len(server_img_urls)} photos saved")
        else:
            print(f"    ⚠ No photos (will retry next run)")

        # Main image = first uploaded photo
        server_img_url = server_img_urls[0] if server_img_urls else ""

        # Build metadata for AI consumption
        raw_url = detail.get("activity_url", detail_url)
        metadata = {
            # Core info for AI plan generation
            "description": detail.get("description", ""),
            "price": detail.get("price") or stub.get("price"),
            "currency": detail.get("currency") or stub.get("currency", "EUR"),
            "rating": detail.get("rating") or stub.get("rating"),
            "review_count": detail.get("review_count") or stub.get("review_count"),
            "duration": detail.get("duration", ""),
            "category": detail.get("category", map_category(detail.get("gyg_category", ""))),
            "gyg_category": detail.get("gyg_category", ""),
            # Location data (critical for geographic planning)
            "neighborhood": detail.get("neighborhood", ""),
            "meeting_point": detail.get("meeting_point", ""),
            "lat": detail.get("lat"),
            "lng": detail.get("lng"),
            # Booking intelligence
            "bookAhead": detail.get("bookAhead", False),
            "free_cancellation": detail.get("free_cancellation", False),
            "tour_type": detail.get("tour_type", ""),
            "languages": detail.get("languages", ""),
            # Content for AI context
            "highlights": detail.get("highlights", []),
            "includes": detail.get("includes", []),
            # Links — raw URL + pre-built affiliate link
            "activity_url": raw_url,
            "affiliate_url": build_affiliate_url(raw_url),
            # Priority & scoring
            "priority": compute_priority_score(
                detail.get("rating") or stub.get("rating"),
                detail.get("review_count") or stub.get("review_count"),
                detail.get("price") or stub.get("price"),
            ),
            # Photos (all uploaded to your server)
            "photos": server_img_urls,  # [main, gallery1, gallery2, gallery3]
            # Meta
            "scraped_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }

        if save_to_db(city, final_name, server_img_url, idx, metadata):
            saved += 1
            cached.add(final_name)
            p = metadata["priority"]
            print(f"    ✓ Saved (€{metadata['price'] or '?'} | ★{metadata['rating'] or '?'} | P{p})")
        else:
            print(f"    ✗ DB save failed")

        time.sleep(2)

    print(f"  ───── {city}: +{saved} new ─────")
    return saved


# ── Entry point ─────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Scrape GetYourGuide → Supabase")
    parser.add_argument("--city", type=str, help="Scrape one city")
    parser.add_argument("--limit", type=int, default=0, help="Max cities")
    parser.add_argument("--max-activities", type=int, default=200, help="Max per city")
    parser.add_argument("--dry-run", action="store_true", help="Preview only")
    parser.add_argument("--start-from", type=str, help="Resume from city")
    args = parser.parse_args()

    cities = DESTINATIONS
    if args.city:
        cities = [args.city]
    elif args.start_from:
        try:
            i = next(i for i, c in enumerate(DESTINATIONS) if c.lower() == args.start_from.lower())
            cities = DESTINATIONS[i:]
        except StopIteration:
            print(f"City '{args.start_from}' not in list. Use --city instead.")
            sys.exit(1)
    if args.limit > 0:
        cities = cities[:args.limit]

    print(f"\n{'='*60}")
    print(f"  GetYourGuide Scraper → Jolliday Activity DB")
    print(f"  Cities: {len(cities)} | Max/city: {args.max_activities}")
    print(f"  Mode: {'DRY RUN' if args.dry_run else 'LIVE'}")
    print(f"  Partner ID: {GYG_PARTNER_ID or '(not set)'}")
    print(f"  DB: {SUPABASE_URL[:40]}...")
    print(f"{'='*60}\n")

    total = 0
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=False, slow_mo=300)
        ctx = browser.new_context(
            viewport={"width": 1366, "height": 900},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            locale="en-US",
        )
        page = ctx.new_page()
        page.route("**/*.{woff,woff2,ttf,otf}", lambda r: r.abort())

        try:
            for i, city in enumerate(cities):
                print(f"\n[{i+1}/{len(cities)}] ── {city} ──")
                try:
                    total += process_city(page, city, args.dry_run, args.max_activities)
                except Exception as e:
                    print(f"  [FATAL] {e}")
                if i < len(cities) - 1:
                    time.sleep(3)
        except KeyboardInterrupt:
            print("\n\nInterrupted. Progress saved.")
        finally:
            browser.close()

    print(f"\n{'='*60}")
    print(f"  DONE — {total} activities saved")
    print(f"  Table: destination_media | type=gyg_activity | source=getyourguide")
    print(f"  Affiliate links use partner_id={GYG_PARTNER_ID}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
