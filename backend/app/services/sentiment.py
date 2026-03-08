"""
Keyword-based sentiment analysis for D2C product reviews.
No external API needed — uses curated keyword dictionaries.
"""

from typing import Tuple


# Complaint themes with associated keywords
COMPLAINT_THEMES = {
    "Packaging / Leakage": [
        "leak", "leakage", "spill", "broke", "broken", "cap", "lid", "seal",
        "damaged", "packaging", "bottle", "cracked", "burst", "open",
    ],
    "Skin Irritation": [
        "irritat", "burn", "burning", "sting", "stinging", "rash", "breakout",
        "acne", "pimple", "allergic", "allerg", "reaction", "sensitive", "red",
        "redness", "itchy", "itch",
    ],
    "Fragrance": [
        "smell", "smells", "odor", "odour", "fragrance", "scent", "stink",
        "stinks", "perfume", "chemical smell", "weird smell", "strong smell",
    ],
    "Delivery Delay": [
        "late", "delay", "delayed", "slow delivery", "took long", "weeks",
        "shipping", "arrived late", "wrong product", "missing",
    ],
    "Moisturizing Effect": [
        "moistur", "hydrat", "glow", "soft", "smooth", "nourish", "absorb",
        "texture", "feels great", "love it", "amazing", "excellent", "best",
    ],
    "Value for Money": [
        "worth", "value", "price", "cheap", "expensive", "cost", "affordable",
        "money", "budget", "overpriced", "good deal", "reasonable",
    ],
    "Effectiveness": [
        "work", "works", "effective", "result", "results", "difference",
        "did not work", "useless", "no effect", "visible", "improvement",
    ],
}

NEGATIVE_THEMES = {"Packaging / Leakage", "Skin Irritation", "Fragrance", "Delivery Delay"}
POSITIVE_THEMES = {"Moisturizing Effect", "Value for Money", "Effectiveness"}

# Positive/negative booster words for score calculation
POSITIVE_WORDS = [
    "love", "great", "excellent", "amazing", "best", "good", "perfect",
    "wonderful", "fantastic", "happy", "satisfied", "recommend",
    "brilliant", "superb", "outstanding",
]

NEGATIVE_WORDS = [
    "bad", "terrible", "worst", "hate", "awful", "horrible", "poor",
    "disappointed", "waste", "useless", "never", "not", "don't", "doesn't",
    "didn't", "fake", "fraud", "cheap quality", "regret",
]


def analyze_review(text: str, rating: float) -> tuple[float, list[str]]:
    """
    Returns (sentiment_score, [matched_themes])
    sentiment_score ranges from -1.0 (very negative) to 1.0 (very positive)
    """
    if not text:
        # Base score from star rating alone
        return (rating - 3) / 2.0, []

    text_lower = text.lower()
    matched_themes = []

    # Match themes
    for theme, keywords in COMPLAINT_THEMES.items():
        if any(kw in text_lower for kw in keywords):
            matched_themes.append(theme)

    # Calculate score: start from rating (normalized to -1..1)
    score = (rating - 3) / 2.0  # 1★ → -1.0, 3★ → 0.0, 5★ → 1.0

    # Adjust for positive/negative word presence
    pos_hits = sum(1 for w in POSITIVE_WORDS if w in text_lower)
    neg_hits = sum(1 for w in NEGATIVE_WORDS if w in text_lower)
    score += (pos_hits * 0.1) - (neg_hits * 0.1)

    # Clamp to [-1, 1]
    score = max(-1.0, min(1.0, score))

    return round(score, 3), matched_themes
