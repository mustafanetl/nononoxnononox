"""
Test script: Browse https://nononoxnononox.vercel.app/, make a plan,
and log all network requests/responses to understand what's happening.

Usage: python test_plan_flow.py
Output: test_plan_log.json (full request/response log)
"""

import asyncio
import json
import time
from datetime import datetime
from playwright.async_api import async_playwright

SITE_URL = "https://nononoxnononox.vercel.app"
LOG_FILE = "test_plan_log.json"

# Collect all network activity
network_log = []


async def main():
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Starting browser test...")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 900},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        )
        page = await context.new_page()

        # Intercept ALL network requests and responses
        async def on_request(request):
            entry = {
                "timestamp": datetime.now().isoformat(),
                "type": "request",
                "method": request.method,
                "url": request.url,
                "headers": dict(request.headers),
                "post_data": None,
            }
            # Capture POST body for API calls
            if request.method == "POST" and request.post_data:
                try:
                    entry["post_data"] = json.loads(request.post_data)
                except:
                    entry["post_data"] = request.post_data[:2000]
            
            # Only log API calls (not static assets)
            if "functions/v1/" in request.url or "supabase" in request.url:
                network_log.append(entry)
                print(f"  -> {request.method} {request.url.split('/')[-1]}")

        async def on_response(response):
            url = response.url
            if "functions/v1/" not in url and "supabase" not in url:
                return
            
            entry = {
                "timestamp": datetime.now().isoformat(),
                "type": "response",
                "status": response.status,
                "url": url,
                "headers": dict(response.headers),
                "body": None,
            }
            
            try:
                content_type = response.headers.get("content-type", "")
                if "text/event-stream" in content_type:
                    entry["body"] = "(SSE stream - captured via page console)"
                elif "json" in content_type:
                    body = await response.text()
                    entry["body"] = json.loads(body) if body else None
                else:
                    body = await response.text()
                    entry["body"] = body[:3000] if body else None
            except Exception as e:
                entry["body"] = f"(error reading body: {e})"
            
            network_log.append(entry)
            status_icon = "✓" if response.status < 400 else "✗"
            print(f"  <- {status_icon} {response.status} {url.split('/')[-1]}")

        page.on("request", on_request)
        page.on("response", on_response)

        # Capture console logs (useful for SSE stream content)
        sse_chunks = []
        page_errors = []
        async def on_console(msg):
            text = msg.text
            if "rzuma-chat" in text or "review-trip" in text or "enrich" in text:
                sse_chunks.append({"time": datetime.now().isoformat(), "msg": text})
            if msg.type == "error":
                page_errors.append({"time": datetime.now().isoformat(), "msg": text[:500]})

        page.on("console", on_console)
        
        # Capture page crashes
        async def on_pageerror(error):
            page_errors.append({"time": datetime.now().isoformat(), "msg": str(error)[:500]})
        page.on("pageerror", on_pageerror)

        # Step 1: Navigate to the landing page
        print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Navigating to {SITE_URL}")
        await page.goto(SITE_URL, wait_until="networkidle")
        await asyncio.sleep(1)
        
        # Clear localStorage to avoid stale state from previous runs
        await page.evaluate("localStorage.clear()")
        await page.reload(wait_until="networkidle")
        await asyncio.sleep(2)
        
        # Take screenshot of initial state
        await page.screenshot(path="screenshot_01_initial.png")
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Screenshot: screenshot_01_initial.png")

        # Step 2: Type a plan request
        plan_request = "Plan a 3 day trip to Stockholm from London"
        print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Typing: '{plan_request}'")
        
        # Find the textarea/input
        textarea = page.locator("textarea").first
        if not await textarea.is_visible():
            textarea = page.locator("input[type='text']").first
        
        await textarea.fill(plan_request)
        await asyncio.sleep(0.5)
        await page.screenshot(path="screenshot_02_typed.png")

        # Step 3: Submit the message
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Submitting message...")
        
        # Try pressing Enter or clicking send button
        send_btn = page.locator("button[type='submit'], button:has(svg)").last
        try:
            await textarea.press("Enter")
        except:
            await send_btn.click()
        
        await asyncio.sleep(1)
        await page.screenshot(path="screenshot_03_sent.png")
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Screenshot: screenshot_03_sent.png")

        # Step 4: Wait for the crafting animation
        print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Waiting for crafting animation...")
        await asyncio.sleep(3)
        await page.screenshot(path="screenshot_04_crafting.png")
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Screenshot: screenshot_04_crafting.png")

        # Step 5: Wait for the plan to stream in (up to 60 seconds)
        print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Waiting for plan to complete (up to 90s)...")
        
        # Monitor for plan completion - look for TripSummaryCard or quickreplies
        plan_appeared = False
        for i in range(90):
            await asyncio.sleep(1)
            
            # Check for plan card
            summary_card = page.locator("[class*='rounded-3xl'][class*='cursor-pointer']")
            quick_replies = page.locator("button:has-text('Make it cheaper'), button:has-text('Add more'), button:has-text('Looks great')")
            
            if await summary_card.count() > 0 or await quick_replies.count() > 0:
                plan_appeared = True
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Plan card/quickreplies detected!")
                break
            
            # Take periodic screenshots
            if i in [10, 20, 30, 45, 60]:
                await page.screenshot(path=f"screenshot_05_waiting_{i}s.png")
                print(f"  ... {i}s elapsed, still waiting")

        await asyncio.sleep(2)
        await page.screenshot(path="screenshot_06_final.png")
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Screenshot: screenshot_06_final.png")

        # Wait extra time for QA revision to complete
        print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Waiting 20s more for QA revision to complete...")
        await asyncio.sleep(20)
        await page.screenshot(path="screenshot_07_after_qa.png")
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Screenshot: screenshot_07_after_qa.png")

        if not plan_appeared:
            print(f"\n[WARNING] Plan card did NOT appear after 90 seconds!")
            # Capture page content for debugging
            page_content = await page.content()
            with open("page_dump.html", "w", encoding="utf-8") as f:
                f.write(page_content)
            print("  Saved page HTML to page_dump.html")

        # Step 6: Check what's visible on the page
        print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Checking page state...")
        
        # Check for various elements
        checks = {
            "crafting_map_component": "[class*='animate-fade-in'] svg[viewBox='0 0 700 240']",
            "summary_card": "[class*='rounded-3xl'][class*='cursor-pointer']",
            "error_message": "[class*='destructive'][class*='rounded-xl']",
            "loading_spinner": "[class*='animate-spin']",
            "assistant_message": "[class*='prose'], [class*='leading-relaxed']",
            "quick_replies": "button:has-text('Make it cheaper'), button:has-text('Looks great')",
            "thinking_indicator": "span:has-text('Thinking')",
        }
        
        for name, selector in checks.items():
            try:
                count = await page.locator(selector).count()
                visible = count > 0
                print(f"  {name}: {'VISIBLE' if visible else 'not found'} (count={count})")
            except:
                print(f"  {name}: error checking")

        # Capture error text if visible
        try:
            error_el = page.locator("[class*='destructive'][class*='rounded-xl'] span")
            if await error_el.count() > 0:
                error_text = await error_el.first.inner_text()
                print(f"\n  ERROR TEXT: {error_text}")
        except:
            pass

        # Step 7: Click the plan card to open the trip detail page
        print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Clicking plan card to open trip detail...")
        summary_card = page.locator("[class*='rounded-3xl'][class*='cursor-pointer']")
        if await summary_card.count() > 0:
            # Check sessionStorage before click
            ss_before = await page.evaluate("sessionStorage.getItem('jolliday-trip-detail')")
            print(f"  sessionStorage before click: {'SET' if ss_before else 'EMPTY'} ({len(ss_before) if ss_before else 0} chars)")
            
            # Use evaluate to click — bypasses Playwright's stability check
            await asyncio.sleep(2)
            await page.evaluate("document.querySelector('[class*=\"rounded-3xl\"][class*=\"cursor-pointer\"]').click()")
            await asyncio.sleep(2)
            
            # Check sessionStorage after click
            ss_after = await page.evaluate("sessionStorage.getItem('jolliday-trip-detail')")
            print(f"  sessionStorage after click: {'SET' if ss_after else 'EMPTY'} ({len(ss_after) if ss_after else 0} chars)")
            
            await asyncio.sleep(3)
            await page.screenshot(path="screenshot_08_trip_detail.png")
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Screenshot: screenshot_08_trip_detail.png")
            
            # Check for JS errors
            errors = await page.evaluate("window.__pageErrors || []")
            if errors:
                print(f"  JS Errors: {errors}")
            
            # Check if page actually has any DOM content
            html_len = await page.evaluate("document.body.innerHTML.length")
            print(f"  Body innerHTML length: {html_len}")
            
            # Check if React root has content
            root_html = await page.evaluate("document.getElementById('root')?.innerHTML?.substring(0, 200) || 'NO ROOT'")
            print(f"  React root content: {root_html}")
            
            # Check trip detail page elements
            current_url = page.url
            print(f"  Current URL: {current_url}")
            
            trip_checks = {
                "destination_title": "h1, h2, h3",
                "itinerary_days": "[class*='day'], [class*='Day']",
                "back_button": "button:has(svg)",
                "hotel_section": "text=Hotel, text=hotel, text=Stay",
                "activity_slots": "[class*='slot'], [class*='Slot'], [class*='time']",
            }
            
            for name, selector in trip_checks.items():
                try:
                    count = await page.locator(selector).count()
                    print(f"  {name}: {'VISIBLE' if count > 0 else 'not found'} (count={count})")
                except:
                    print(f"  {name}: error checking")
            
            # Get page text content for debugging
            try:
                body_text = await page.locator("body").inner_text()
                # Look for key plan content
                has_destination = "Stockholm" in body_text or "stockholm" in body_text
                has_days = "Day 1" in body_text or "day 1" in body_text
                has_activities = "Museum" in body_text or "museum" in body_text or "Restaurant" in body_text
                print(f"\n  Content checks:")
                print(f"    Has destination name: {has_destination}")
                print(f"    Has day references: {has_days}")
                print(f"    Has activities: {has_activities}")
                print(f"    Body text (first 300 chars): {body_text[:300]}")
            except Exception as e:
                print(f"  Could not read body text: {e}")
        else:
            print("  [FAIL] No plan card found to click!")

        # Capture the assistant's response text
        try:
            assistant_msgs = page.locator("[class*='leading-relaxed'], .prose")
            count = await assistant_msgs.count()
            if count > 0:
                last_text = await assistant_msgs.last.inner_text()
                print(f"\n  Last assistant text (first 500 chars):")
                print(f"  {last_text[:500]}")
        except Exception as e:
            print(f"  Could not read assistant text: {e}")

        # Save the full network log
        full_log = {
            "test_time": datetime.now().isoformat(),
            "plan_request": plan_request,
            "plan_appeared": plan_appeared,
            "network_requests": network_log,
            "sse_console_logs": sse_chunks,
            "page_errors": page_errors,
        }
        
        with open(LOG_FILE, "w", encoding="utf-8") as f:
            json.dump(full_log, f, indent=2, default=str)
        
        print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Full log saved to {LOG_FILE}")
        print(f"  Total API calls logged: {len(network_log)}")
        
        # Keep browser open briefly for manual inspection
        print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Closing browser in 5 seconds...")
        await asyncio.sleep(5)
        await browser.close()

    print("\nDone! Check these files:")
    print(f"  - {LOG_FILE} (full network log)")
    print(f"  - screenshot_*.png (visual snapshots)")


if __name__ == "__main__":
    asyncio.run(main())
