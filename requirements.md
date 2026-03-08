# Requirements: Market Intelligence for D2C Brands

## Problem Statement

D2C brands face a critical gap in understanding the root causes behind sales fluctuations. Existing analytics tools (Shopify, Amazon Seller Central, Meta Ads, Google Analytics) show what is happening—sales drops, conversion declines, rating falls—but fail to explain why these changes occur. When sales drop 15-20%, founders must manually investigate across multiple data sources to determine if the cause is competitor activity, negative reviews, pricing issues, supply problems, trend shifts, or delivery delays.

## Solution Overview

An AI-driven diagnostic platform that automatically correlates signals from multiple sources to generate clear, actionable explanations for sales performance changes. The system moves beyond descriptive dashboards to provide diagnostic intelligence that directly answers "why did this happen?" and suggests corrective actions.

## Target Users

**Target Users:**
- D2C brands in skincare, beauty, supplements, personal care, and Amazon-first brands
- Have marketing teams but lack data science capabilities
- Rely heavily on online sales channels
- Need to make quick decisions based on market signals

## Core Functional Requirements

### 1. Data Integration Layer

**Sales Platform Integration (API-Based)**
- Connect to Shopify via official API (requires merchant app installation)
- Connect to Amazon Seller Central via SP-API (requires seller authorization)
- Integrate with Google Analytics 4 API (with client permission)
- Track revenue metrics at SKU level
- Monitor conversion rates, cart abandonment, and order volume
- Detect anomalies in sales patterns (threshold: >10% deviation from baseline)

**Review & Sentiment Analysis (Web Scraping)**
- Scrape product reviews from Amazon, Flipkart, Nykaa, and brand websites
- Handle anti-scraping measures (rate limiting, proxy rotation, headless browsers)
- Perform aspect-based sentiment analysis to identify specific issues (e.g., "leakage," "fragrance," "packaging," "skin irritation")
- Track sentiment trends over time with weekly granularity
- Identify emerging complaint themes before they become widespread
- Implement change detection to adapt to website redesigns

**Social Media Monitoring (Hybrid: API + Scraping)**
- Track brand mentions and hashtags via web scraping (Instagram, TikTok)
- Use Twitter/X API for tweet monitoring (if budget allows)
- Scrape YouTube comments and video engagement metrics
- Monitor influencer posts and engagement metrics
- Detect viral content related to brand or competitors
- Measure social sentiment and engagement velocity

**Competitor Intelligence (Web Scraping)**
- Scrape competitor product pages for pricing, ratings, and availability
- Track competitor product launches and SKU additions
- Monitor pricing changes and discount campaigns daily
- Scrape Meta Ad Library for competitor advertising activity
- Identify market share shifts within product categories
- Store historical snapshots for trend analysis

### 2. Intelligence & Correlation Engine

**Pattern Detection**
- Apply time-series analysis to identify correlations between events
- Calculate lag effects (e.g., review spike in week 2 → sales drop in week 3)
- Rank contributing factors by statistical impact strength
- Distinguish between correlation and likely causation

**Root Cause Analysis**
- Generate weighted explanations for performance changes
- Attribute percentage impact to each identified factor
- Prioritize factors by actionability and business impact
- Filter out noise and focus on statistically significant signals

**Anomaly Detection**
- Automatically flag unusual patterns in sales, reviews, or competitor activity
- Set dynamic thresholds based on historical performance
- Trigger alerts for critical changes requiring immediate attention

### 3. Output & Reporting

**Diagnostic Summaries**
- Generate natural language explanations for sales changes
- Example: "Sales dropped 18% primarily due to: (1) 40% spike in negative reviews mentioning leakage (impact: 60%), (2) Competitor X launched similar product at 20% lower price (impact: 30%), (3) 15% decline in category social engagement (impact: 10%)"
- Provide confidence scores for each explanation

**Actionable Recommendations**
- Suggest specific corrective actions based on root causes
- Examples: "Improve packaging quality," "Run 15% discount campaign," "Restart influencer partnerships," "Address delivery delay complaints"
- Prioritize recommendations by expected ROI and implementation effort

**Alert System**
- Real-time notifications for critical changes
- Customizable alert thresholds per metric
- Multi-channel delivery (email, Slack, SMS)

### 4. User Interface

**Dashboard**
- Clean, minimal interface focused on insights over raw data
- Timeline view showing correlated events
- Drill-down capability for detailed analysis
- Mobile-responsive design for on-the-go access

**Report Export**
- PDF and CSV export for sharing with teams
- Scheduled weekly/monthly summary reports
- API access for custom integrations

## MVP Scope

**Phase 1 Focus (3-4 months):**

1. **Shopify Sales Integration (API)**
   - Build Shopify app for merchant installation
   - Connect via Shopify Admin API
   - Track daily sales, conversion rate, and SKU performance
   - Detect sales anomalies (>15% deviation)

2. **Amazon Review Analysis (Web Scraping)**
   - Build robust scraper using Playwright/Puppeteer
   - Implement proxy rotation and rate limiting
   - Scrape and analyze Amazon product reviews
   - Perform aspect-based sentiment analysis
   - Extract top complaint themes and track frequency

3. **Competitor Price Monitoring (Web Scraping)**
   - Scrape top 3-5 competitor product pages
   - Monitor pricing changes daily
   - Detect discount campaigns and stock status
   - Handle CAPTCHA and anti-bot measures

4. **AI Diagnostic Engine**
   - Correlate sales drops with review sentiment changes
   - Correlate sales drops with competitor price changes
   - Generate natural language summaries explaining likely causes

5. **Basic Dashboard**
   - Show sales trend with annotated events
   - Display top review themes with sentiment scores
   - Present AI-generated diagnostic summary

## Non-Functional Requirements

**Performance**
- Data refresh frequency: Every 6 hours for sales and reviews
- Alert delivery: Within 5 minutes of detection
- Dashboard load time: <2 seconds

**Scalability**
- Support 100+ brands in first year
- Handle 10K+ reviews per brand per month
- Process 50+ SKUs per brand

**Security & Compliance**
- SOC 2 Type II compliance
- Encrypted data storage and transmission
- GDPR-compliant data handling
- Secure API key management

**Reliability**
- 99.5% uptime SLA
- Automated failover for critical services
- Daily data backups

## Business Model

**Pricing Tiers:**

- **Starter:** ₹XX,XXX/month
  - 1 sales platform integration
  - Review analysis for up to 10 SKUs
  - 3 competitor tracking
  - Weekly diagnostic reports

- **Growth:** ₹XX,XXX/month
  - 2 sales platform integrations
  - Review analysis for up to 30 SKUs
  - 10 competitor tracking
  - Daily diagnostic reports
  - Social media monitoring (basic)

- **Enterprise:** Custom pricing
  - Unlimited integrations
  - Unlimited SKUs
  - Unlimited competitor tracking
  - Real-time alerts
  - Dedicated account manager
  - Custom AI model training

## Success Metrics

**Product Metrics:**
- Time to first insight: <24 hours after onboarding
- Diagnostic accuracy: >80% (validated by user feedback)
- Alert relevance: <10% false positive rate

**Business Metrics:**
- Customer acquisition: 50 brands in first 6 months
- Retention rate: >85% after 6 months
- NPS score: >50

**User Engagement:**
- Daily active users: >60% of customers
- Average session duration: >5 minutes
- Report export rate: >40% of users weekly

## Future Enhancements

1. **MVP Phase Extensions**
   - Flipkart integration
   - Social media monitoring (requires significant scraping infrastructure)
   - Predictive forecasting
   - Advanced competitor ad tracking
   - Multi-brand comparison

2. **Predictive Intelligence**
   - Forecast sales trends 2-4 weeks ahead
   - Predict impact of planned promotions
   - Early warning system for emerging risks

3. **Expanded Integrations**
   - Nykaa and other regional marketplaces
   - Meta Ads and Google Ads performance data
   - Email marketing platforms (Klaviyo, Mailchimp)

4. **Advanced Social Listening**
   - Reddit, TikTok, and LinkedIn monitoring
   - Influencer ROI tracking
   - Trend prediction based on social signals

5. **Competitive Benchmarking**
   - Market share estimation
   - Category growth tracking
   - Competitive positioning analysis

6. **AI Growth Strategist**
   - Automated A/B test recommendations
   - Product launch timing optimization
   - Pricing strategy suggestions
   - Channel allocation recommendations
