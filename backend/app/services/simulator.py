import random
import os
import json
import boto3
from datetime import datetime, timedelta
import uuid

# --- Realistic Names ---
AUTHORS = [
    "Priya S.", "Rahul M.", "Anjali K.", "Suresh R.", "Meera P.",
    "Neha Gupta", "Vikram Singh", "Rohit D.", "Kavita Sharma", "Aditya",
    "Sneha", "Amit Verma", "Tarun B.", "Pooja Desai", "Manish K.",
    "Nisha R.", "Varun T.", "Shruti Jain", "Deepak", "Ayesha M.",
]

# --- Sentiment Texts by Branch/Category ---
POSITIVE_TEMPLATES = [
    "Absolutely love this {branch}! It exceeded my expectations. Will definitely repurchase.",
    "The quality of this {branch} is amazing. Great experience overall.",
    "Great value for money. This {branch} does exactly what it claims.",
    "I've been using this {branch} for a while now and I am very satisfied.",
    "Super effective. Best {branch} I have tried recently.",
    "Highly recommend this {branch}. It feels very premium.",
    "Finally found a {branch} that works perfectly. Will buy again.",
    "So good! This {branch} is a must-have in my daily routine."
]

NEGATIVE_TEMPLATES = [
    "The packaging arrived damaged. Quality of this {branch} needs improvement.",
    "Started having issues after using this {branch}. Not what I expected.",
    "Terrible packaging. It broke on first use and the {branch} was ruined.",
    "Good {branch} but delivery took 10 days. Very slow shipping.",
    "This {branch} feels very cheap. Did not like the quality.",
    "Not worth the price. This {branch} did absolutely nothing for me.",
    "Received a defective {branch}. Extremely disappointed with the seller.",
    "Caused a lot of frustration. Avoid this {branch} if you want peace of mind."
]

NEUTRAL_TEMPLATES = [
    "It's an okay {branch}. Nothing special, but gets the job done.",
    "Decent {branch} for the price point. Might explore other options next time.",
    "Average {branch}. Not bad, but not great either."
]

# --- Themes ---
THEME_MAPPING = {
    "packag": "Packaging Quality",
    "damaged": "Packaging Quality",
    "broke": "Packaging Quality",
    "ruined": "Packaging Quality",
    "cheap": "Product Quality",
    "defective": "Product Quality",
    "frustration": "Product Quality",
    "delivery": "Delivery Delay",
    "shipping": "Delivery Delay",
    "value": "Value for Money",
    "price": "Value for Money",
    "quality": "Product Quality",
    "premium": "Product Quality",
    "good": "Product Quality"
}

def generate_review(branch: str, simulated_now: datetime) -> dict:
    rating_choice = random.choices([5, 4, 3, 2, 1], weights=[45, 25, 10, 8, 12], k=1)[0]
    
    # Text Generation
    if rating_choice >= 4:
        template = random.choice(POSITIVE_TEMPLATES)
    elif rating_choice <= 2:
        template = random.choice(NEGATIVE_TEMPLATES)
    else:
        template = random.choice(NEUTRAL_TEMPLATES)

    text = template.format(branch=branch.lower())
    
    # --- AWS Lambda Integration for Sentiment Computing ---
    lambda_enabled = os.environ.get('AWS_ACCESS_KEY_ID') is not None
    score = None
    themes_str = ""
    
    if lambda_enabled:
        try:
            lambda_client = boto3.client('lambda', region_name=os.environ.get('AWS_DEFAULT_REGION', 'us-east-1'))
            payload = json.dumps({"text": text})
            response = lambda_client.invoke(
                FunctionName='marketsense-sentiment-analyzer',
                InvocationType='RequestResponse',
                Payload=payload
            )
            result = json.loads(response['Payload'].read().decode())
            if 'body' in result:
                body = json.loads(result['body'])
                score = body.get('sentiment_score')
                themes_str = body.get('themes', '')
        except Exception:
            pass # Fallback to local
            
    # Local fallback computation if Lambda is skipped or fails
    if score is None:
        if rating_choice >= 4:
            score = random.uniform(0.5, 1.0)
        elif rating_choice <= 2:
            score = random.uniform(-1.0, -0.3)
        else:
            score = random.uniform(-0.2, 0.4)
            
        themes_set = set()
        text_lower = text.lower()
        for kw, theme in THEME_MAPPING.items():
            if kw in text_lower:
                themes_set.add(theme)
        themes_str = ",".join(themes_set)

    text = template.format(branch=branch.lower())
    themes = set()
    text_lower = text.lower()
    for kw, theme in THEME_MAPPING.items():
        if kw in text_lower:
            themes.add(theme)
            
    days_ago = random.randint(0, 30)
    review_date = simulated_now - timedelta(days=days_ago)
    return {
        "review_id": str(uuid.uuid4()),
        "asin": branch.replace(" ", "").lower(),
        "author": random.choice(AUTHORS),
        "title": f"Review for {branch}",
        "rating": float(rating_choice),
        "text": text,
        "date": review_date,
        "verified_purchase": random.choice([True, True, True, False]),
        "platform": random.choice(["Amazon", "Nykaa", "Flipkart"]),
        "sentiment_score": round(score, 3),
        "complaint_themes": themes_str,
        "scraped_at": simulated_now
    }

def generate_competitor(brand: str, branch: str, simulated_now: datetime) -> dict:
    base_price = random.randint(4, 15) * 100 - 1
    price_change_pct = round(random.uniform(-25.0, 10.0), 1)
    original_price = base_price
    current_price = base_price
    if price_change_pct < -5.0:
        current_price = int(base_price * (1 + (price_change_pct / 100)))
    in_stock = random.choices([True, False], weights=[85, 15], k=1)[0]
    
    # Generate an actual Amazon search link since we don't have real ASINs
    search_query = f"{brand} {branch}".replace(' ', '+')
    
    return {
        "asin": f"comp_{brand.replace(' ', '').lower()}",
        "url": f"https://www.amazon.com/s?k={search_query}",
        "name": f"{brand} {branch}",
        "brand_id": brand,
        "is_competitor": True,
        "competitor_label": brand,
        "current_price": float(current_price),
        "original_price": float(original_price),
        "rating": round(random.uniform(3.5, 4.8), 1),
        "review_count": random.randint(100, 5000),
        "in_stock": in_stock,
        "product_title": f"{brand} - Top Rated {branch}",
        "last_scraped_at": simulated_now
    }

def generate_sales_data(brand_id: str, sku: str, simulated_now: datetime, days_ago: int, is_anomaly: bool) -> dict:
    """Generates randomized 14-day trailing sales data, with an injected anomaly over the last 3 days."""
    date = simulated_now - timedelta(days=days_ago)
    
    # Base randomized revenue between 12k and 25k per day
    base_revenue = random.randint(15, 25) * 1000 + random.randint(100, 900)
    
    if is_anomaly:
        base_revenue = int(base_revenue * random.uniform(0.65, 0.85)) # Drop by 15-35%
        
    avg_price = random.randint(400, 900)
    units_sold = int(base_revenue / avg_price)
    
    return {
        "brand_id": brand_id,
        "sku": sku,
        "date": date,
        "revenue": float(base_revenue),
        "units_sold": units_sold,
        "source": random.choice(["Shopify", "Amazon", "Nykaa"])
    }
