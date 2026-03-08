"""
Amazon India web scraper using Playwright.
Scrapes product reviews and competitor product info.

Anti-bot strategy:
- Realistic User-Agent and browser headers
- Random delays between page loads (3-8 seconds)
- Graceful fallback on CAPTCHA or blocking
- Never crashes — always returns partial data
"""

import asyncio
import random
import re
from datetime import datetime
from typing import Optional
from playwright.async_api import async_playwright, TimeoutError as PWTimeout

# Realistic browser headers to avoid detection
HEADERS = {
    "Accept-Language": "en-IN,en;q=0.9,hi;q=0.8",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
}

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
]


def _random_delay(min_s=3, max_s=8):
    return random.uniform(min_s, max_s)


def _is_blocked(content: str) -> bool:
    """Detect common Amazon bot-block signals."""
    signals = [
        "Type the characters you see",
        "Enter the characters you see below",
        "Sorry, we just need to make sure",
        "robot check",
        "captcha",
        "Enter the characters",
    ]
    lower = content.lower()
    return any(s.lower() in lower for s in signals)


def _parse_date(date_str: str) -> Optional[datetime]:
    """Parse Amazon review date strings like 'Reviewed in India on 5 March 2024'"""
    try:
        match = re.search(r'(\d+\s+\w+\s+\d{4})', date_str)
        if match:
            return datetime.strptime(match.group(1), "%d %B %Y")
    except Exception:
        pass
    return None


async def scrape_reviews(asin: str, max_pages: int = 5) -> list[dict]:
    """
    Scrape Amazon India product reviews for a given ASIN.
    Returns list of review dicts. Returns [] on block/failure.
    """
    reviews = []
    base_url = (
        f"https://www.amazon.in/product-reviews/{asin}"
        f"/ref=cm_cr_arp_d_viewopt_srt?sortBy=recent&pageNumber="
    )

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-blink-features=AutomationControlled",
                "--disable-dev-shm-usage",
            ]
        )
        context = await browser.new_context(
            user_agent=random.choice(USER_AGENTS),
            extra_http_headers=HEADERS,
            viewport={"width": 1366, "height": 768},
            locale="en-IN",
        )

        # Remove webdriver fingerprint
        await context.add_init_script(
            "Object.defineProperty(navigator, 'webdriver', { get: () => undefined });"
        )

        page = await context.new_page()

        for page_num in range(1, max_pages + 1):
            try:
                url = f"{base_url}{page_num}"
                await page.goto(url, timeout=30000, wait_until="domcontentloaded")
                await asyncio.sleep(_random_delay(2, 5))

                content = await page.content()

                if _is_blocked(content):
                    print(f"[Scraper] CAPTCHA detected on page {page_num} for {asin}.")
                    break

                review_elements = await page.query_selector_all('[data-hook="review"]')

                if not review_elements:
                    print(f"[Scraper] No reviews on page {page_num} — last page.")
                    break

                for el in review_elements:
                    try:
                        review_id = await el.get_attribute("id") or f"{asin}_{len(reviews)}"

                        author_el = await el.query_selector('[class*="a-profile-name"]')
                        author = (await author_el.inner_text()).strip() if author_el else "Anonymous"

                        rating_el = await el.query_selector('[data-hook="review-star-rating"] .a-icon-alt')
                        rating_text = (await rating_el.inner_text()).strip() if rating_el else "3 out of 5"
                        rating = float(rating_text.split(" ")[0]) if rating_text else 3.0

                        title_el = await el.query_selector('[data-hook="review-title"] span:not([class])')
                        title = (await title_el.inner_text()).strip() if title_el else ""

                        body_el = await el.query_selector('[data-hook="review-body"] span')
                        text = (await body_el.inner_text()).strip() if body_el else ""

                        date_el = await el.query_selector('[data-hook="review-date"]')
                        date_str = (await date_el.inner_text()).strip() if date_el else ""
                        review_date = _parse_date(date_str)

                        verified_el = await el.query_selector('[data-hook="avp-badge"]')
                        verified = verified_el is not None

                        reviews.append({
                            "review_id": review_id,
                            "asin": asin,
                            "author": author,
                            "rating": rating,
                            "title": title,
                            "text": text,
                            "date": review_date,
                            "verified_purchase": verified,
                            "platform": "amazon",
                        })
                    except Exception as e:
                        print(f"[Scraper] Error parsing review: {e}")
                        continue

                print(f"[Scraper] Page {page_num}: {len(review_elements)} reviews scraped")
                await asyncio.sleep(_random_delay(3, 7))

            except PWTimeout:
                print(f"[Scraper] Timeout on page {page_num} for {asin}")
                break
            except Exception as e:
                print(f"[Scraper] Error on page {page_num}: {e}")
                break

        await browser.close()

    print(f"[Scraper] Total for {asin}: {len(reviews)}")
    return reviews


async def scrape_product_info(asin: str) -> dict:
    """
    Scrape Amazon India product page for price, rating, stock status.
    Returns dict with product info. Returns {} on failure.
    """
    url = f"https://www.amazon.in/dp/{asin}"
    result = {}

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-setuid-sandbox",
                  "--disable-blink-features=AutomationControlled", "--disable-dev-shm-usage"]
        )
        context = await browser.new_context(
            user_agent=random.choice(USER_AGENTS),
            extra_http_headers=HEADERS,
            viewport={"width": 1366, "height": 768},
            locale="en-IN",
        )
        await context.add_init_script(
            "Object.defineProperty(navigator, 'webdriver', { get: () => undefined });"
        )

        page = await context.new_page()

        try:
            await page.goto(url, timeout=30000, wait_until="domcontentloaded")
            await asyncio.sleep(_random_delay(2, 4))

            content = await page.content()
            if _is_blocked(content):
                print(f"[Scraper] CAPTCHA on product page for {asin}")
                return {}

            # Title
            title_el = await page.query_selector("#productTitle")
            title = (await title_el.inner_text()).strip() if title_el else ""

            # Price — try multiple selectors
            price = None
            for selector in [
                ".a-price .a-offscreen",
                "#priceblock_ourprice",
                "#priceblock_dealprice",
                ".a-price-whole",
                "#corePrice_feature_div .a-price .a-offscreen",
            ]:
                price_el = await page.query_selector(selector)
                if price_el:
                    price_text = re.sub(r"[₹,\s]", "", (await price_el.inner_text()).split(".")[0])
                    try:
                        price = float(price_text)
                        break
                    except ValueError:
                        continue

            # Original/MRP
            original_price = None
            orig_el = await page.query_selector(".a-text-price .a-offscreen")
            if orig_el:
                orig_text = re.sub(r"[₹,\s]", "", (await orig_el.inner_text()).split(".")[0])
                try:
                    original_price = float(orig_text)
                except ValueError:
                    pass

            # Rating
            rating = None
            for sel in ['[data-hook="rating-out-of-text"]', '#acrPopover .a-icon-alt']:
                rating_el = await page.query_selector(sel)
                if rating_el:
                    match = re.search(r"(\d+\.?\d*)", await rating_el.inner_text())
                    if match:
                        rating = float(match.group(1))
                        break

            # Review count
            review_count = None
            rc_el = await page.query_selector("#acrCustomerReviewText")
            if rc_el:
                rc_text = re.sub(r"[^0-9]", "", await rc_el.inner_text())
                if rc_text:
                    review_count = int(rc_text)

            # Stock
            in_stock = True
            stock_el = await page.query_selector("#availability span")
            if stock_el:
                stock_text = (await stock_el.inner_text()).lower()
                if "out of stock" in stock_text or "unavailable" in stock_text:
                    in_stock = False

            result = {
                "asin": asin,
                "product_title": title,
                "current_price": price,
                "original_price": original_price,
                "rating": rating,
                "review_count": review_count,
                "in_stock": in_stock,
                "last_scraped_at": datetime.utcnow(),
            }

        except Exception as e:
            print(f"[Scraper] Error scraping product {asin}: {e}")
        finally:
            await browser.close()

    return result
