"""Debug scraper — no networkidle, just wait for elements."""
import time
from urllib.parse import quote_plus
from playwright.sync_api import sync_playwright

VENUE = "Fenix Food Factory"
CITY = "Rotterdam"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page(locale="en-US", viewport={"width": 1280, "height": 900})
    page.set_default_timeout(10000)
    
    # Go to maps in English
    page.goto("https://www.google.com/maps?hl=en", wait_until="domcontentloaded")
    time.sleep(2)
    
    # Consent
    try:
        page.click("button:visible:has-text('Accept all')", timeout=4000)
        time.sleep(2)
    except:
        print("No consent needed")
    
    # Search
    url = f"https://www.google.com/maps/search/{quote_plus(VENUE + ' ' + CITY)}?hl=en"
    print(f"Searching: {VENUE}")
    page.goto(url, wait_until="domcontentloaded")
    time.sleep(4)
    
    # Consent again?
    if "consent" in page.url:
        try:
            page.click("button:visible:has-text('Accept all')", timeout=3000)
            time.sleep(2)
            page.goto(url, wait_until="domcontentloaded")
            time.sleep(4)
        except:
            pass
    
    print(f"URL: {page.url[:100]}")
    
    # Try multiple selectors to find the venue name
    selectors = ["h1.DUwDvf", "h1.fontHeadlineLarge", "div.lMbq3e h1", "h1", "span.DUwDvf"]
    found_name = None
    for sel in selectors:
        els = page.query_selector_all(sel)
        for el in els:
            txt = el.inner_text().strip()
            if txt and len(txt) > 2 and "google" not in txt.lower() and "map" not in txt.lower():
                found_name = txt
                print(f"✅ Found with '{sel}': {txt}")
                break
        if found_name:
            break
    
    if not found_name:
        # Maybe it's a results list — try clicking first result
        print("No direct match, looking for results list...")
        try:
            page.click("a.hfpxzc", timeout=3000)
            time.sleep(3)
            for sel in selectors:
                el = page.query_selector(sel)
                if el:
                    txt = el.inner_text().strip()
                    if txt and "google" not in txt.lower():
                        found_name = txt
                        print(f"✅ Found after click: {txt}")
                        break
        except:
            print("No results list either")
    
    if not found_name:
        print("❌ Could not find venue name")
        # Dump all text for debugging
        body = page.inner_text("body")[:1000]
        print(f"Page body:\n{body}")
    
    # Rating
    rating_el = page.query_selector("div.F7nice span[aria-hidden='true']")
    if rating_el:
        print(f"Rating: {rating_el.inner_text()}")
    
    # Address
    addr_el = page.query_selector("button[data-item-id='address'] div.fontBodyMedium")
    if addr_el:
        print(f"Address: {addr_el.inner_text()}")
    
    # Photos — look for any googleusercontent images
    imgs = page.query_selector_all("img[src*='googleusercontent']")
    print(f"Photos (googleusercontent): {len(imgs)}")
    for img in imgs[:5]:
        src = img.get_attribute("src") or ""
        print(f"  {src[:120]}")
    
    # Also check lh3/lh5 photos
    imgs2 = page.query_selector_all("img[src*='lh3'], img[src*='lh5']")
    print(f"Photos (lh3/lh5): {len(imgs2)}")
    
    page.screenshot(path="scripts/debug_screenshot.png")
    print("\nDone!")
    time.sleep(8)
    browser.close()
