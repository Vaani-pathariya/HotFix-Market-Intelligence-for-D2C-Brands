# Design: Market Intelligence for D2C Brands

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                          │
│  (React Dashboard + Mobile-Responsive UI + Alert Interface)     │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                      API Gateway Layer                          │
│         (REST API + Authentication + Rate Limiting)             │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
┌────────▼────────┐ ┌───▼──────────┐ ┌─▼──────────────┐
│ Data Collection │ │ Intelligence │ │ User Management│
│    Service      │ │    Engine    │ │    Service     │
└────────┬────────┘ └───┬──────────┘ └────────────────┘
         │              │
┌────────▼──────────────▼────────────────────────────────────────┐
│                      Data Storage Layer                         │
│  (PostgreSQL + TimescaleDB + Redis + S3 + Vector DB)           │
└─────────────────────────────────────────────────────────────────┘
         │
┌────────▼────────────────────────────────────────────────────────┐
│                   External Data Sources                         │
│  (Shopify, Amazon, Flipkart, Social Media, Competitor Sites)   │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Backend
- **Language:** Python 3.11+
- **Framework:** FastAPI (async, high performance, auto-documentation)
- **Task Queue:** Celery with Redis broker
- **Scheduler:** Celery Beat for periodic tasks
- **Web Scraping:** Playwright (headless browser), BeautifulSoup4 (HTML parsing), httpx (async HTTP)
- **Proxy Management:** Bright Data or Oxylabs for residential proxies
- **CAPTCHA Solving:** 2Captcha or Anti-Captcha integration

### Data Storage
- **Primary Database:** PostgreSQL 15+ (relational data, user accounts, configurations)
- **Time-Series Data:** TimescaleDB extension (sales metrics, review trends)
- **Cache:** Redis (session management, rate limiting, real-time counters)
- **Object Storage:** AWS S3 (raw review data, exported reports, backups)
- **Vector Database:** Pinecone or Weaviate (semantic search for reviews, similar issue detection)

### AI/ML Stack
- **NLP Models:** 
  - Hugging Face Transformers (aspect-based sentiment analysis)
  - OpenAI GPT-4 or Claude (diagnostic summary generation)
  - Sentence-BERT (semantic similarity for review clustering)
- **ML Framework:** scikit-learn, statsmodels (time-series analysis, correlation)
- **Data Processing:** Pandas, NumPy, Polars (high-performance data manipulation)

### Frontend
- **Framework:** React 18+ with TypeScript
- **State Management:** Zustand or TanStack Query
- **UI Components:** Tailwind CSS + shadcn/ui
- **Charts:** Recharts or Apache ECharts
- **Build Tool:** Vite

### Infrastructure
- **Cloud Provider:** AWS
- **Compute:** ECS Fargate (containerized services)
- **API Gateway:** AWS API Gateway or Kong
- **Monitoring:** Datadog or New Relic
- **Logging:** CloudWatch + ELK Stack
- **CI/CD:** GitHub Actions

## Component Design

### 1. Data Collection Service

**Purpose:** Fetch data from external sources via APIs and web scraping, normalize, and store

**Sub-Components:**

**a) API Integration Adapters**
```python
# Abstract base class for API integrations
class APIAdapter(ABC):
    @abstractmethod
    async def authenticate(self, credentials: dict) -> bool
    
    @abstractmethod
    async def fetch_sales_data(self, start_date: date, end_date: date) -> List[SalesRecord]
    
    @abstractmethod
    async def validate_connection(self) -> bool

# Concrete implementations
class ShopifyAdapter(APIAdapter):
    """Uses Shopify Admin API - requires app installation"""
    
class AmazonSellerAdapter(APIAdapter):
    """Uses Amazon SP-API - requires seller authorization"""
    
class GoogleAnalyticsAdapter(APIAdapter):
    """Uses GA4 API - requires property access"""
```

**b) Web Scraping Engine**
```python
class ScraperBase(ABC):
    def __init__(self):
        self.browser = None
        self.proxy_manager = ProxyRotator()
        self.captcha_solver = CaptchaSolver()
    
    async def setup_browser(self):
        """Initialize Playwright with anti-detection measures"""
        self.browser = await playwright.chromium.launch(
            headless=True,
            args=['--disable-blink-features=AutomationControlled']
        )
    
    async def fetch_with_retry(self, url: str, max_retries: int = 3):
        """Fetch with proxy rotation and CAPTCHA handling"""
        for attempt in range(max_retries):
            try:
                proxy = self.proxy_manager.get_next()
                page = await self.browser.new_page(proxy=proxy)
                
                await page.goto(url, wait_until='networkidle')
                
                # Check for CAPTCHA
                if await self.detect_captcha(page):
                    await self.captcha_solver.solve(page)
                
                return await page.content()
                
            except Exception as e:
                if attempt == max_retries - 1:
                    raise
                await asyncio.sleep(2 ** attempt)  # Exponential backoff

class AmazonReviewScraper(ScraperBase):
    async def fetch_reviews(self, product_id: str) -> List[Review]:
        """Scrape Amazon product reviews"""
        url = f"https://www.amazon.in/product-reviews/{product_id}"
        html = await self.fetch_with_retry(url)
        soup = BeautifulSoup(html, 'html.parser')
        
        reviews = []
        for review_div in soup.select('[data-hook="review"]'):
            reviews.append(Review(
                review_id=review_div.get('id'),
                rating=self.extract_rating(review_div),
                text=review_div.select_one('[data-hook="review-body"]').text.strip(),
                date=self.parse_date(review_div.select_one('[data-hook="review-date"]').text),
                verified_purchase='Verified Purchase' in review_div.text,
                source='amazon'
            ))
        
        return reviews

class CompetitorPriceScraper(ScraperBase):
    async def fetch_competitor_data(self, product_url: str) -> CompetitorSnapshot:
        """Scrape competitor product page"""
        html = await self.fetch_with_retry(product_url)
        soup = BeautifulSoup(html, 'html.parser')
        
        return CompetitorSnapshot(
            product_id=self.extract_product_id(product_url),
            price=self.extract_price(soup),
            discount_percentage=self.extract_discount(soup),
            rating=self.extract_rating(soup),
            review_count=self.extract_review_count(soup),
            in_stock=self.check_stock_status(soup),
            timestamp=datetime.now()
        )
```

**c) Data Fetcher (Celery Tasks)**
```python
@celery.task(bind=True, max_retries=3)
def fetch_shopify_sales(brand_id: str, date_range: tuple):
    """Fetch sales data via API every 6 hours"""
    adapter = ShopifyAdapter(get_credentials(brand_id))
    sales_data = adapter.fetch_sales_data(*date_range)
    store_sales_data(brand_id, sales_data)
    trigger_anomaly_detection(brand_id)

@celery.task(bind=True, max_retries=3)
def scrape_amazon_reviews(brand_id: str, product_ids: List[str]):
    """Scrape reviews daily"""
    scraper = AmazonReviewScraper()
    for product_id in product_ids:
        reviews = await scraper.fetch_reviews(product_id)
        store_reviews(brand_id, reviews)
        trigger_sentiment_analysis(brand_id, reviews)
        
        # Rate limiting: wait between products
        await asyncio.sleep(random.uniform(5, 10))

@celery.task(bind=True, max_retries=3)
def scrape_competitor_prices(brand_id: str, competitor_urls: List[str]):
    """Scrape competitor data daily"""
    scraper = CompetitorPriceScraper()
    for url in competitor_urls:
        snapshot = await scraper.fetch_competitor_data(url)
        store_competitor_snapshot(brand_id, snapshot)
        detect_price_changes(brand_id, snapshot)
        
        await asyncio.sleep(random.uniform(10, 20))
```

**d) Scraper Health Monitoring**
```python
class ScraperHealthCheck:
    """Detect when scrapers break due to website changes"""
    
    def validate_scraped_data(self, data: dict, schema: dict) -> bool:
        """Check if scraped data matches expected structure"""
        if not data or len(data) == 0:
            self.alert_scraper_failure("Empty data returned")
            return False
        
        # Validate required fields
        for field in schema['required_fields']:
            if field not in data:
                self.alert_scraper_failure(f"Missing field: {field}")
                return False
        
        return True
    
    def alert_scraper_failure(self, reason: str):
        """Alert engineering team when scraper breaks"""
        send_slack_alert(f"Scraper failure: {reason}")
        create_maintenance_ticket(reason)
```

**Data Models:**
```python
class SalesRecord(BaseModel):
    brand_id: str
    sku: str
    date: datetime
    revenue: Decimal
    units_sold: int
    conversion_rate: float
    traffic: int
    source: str  # shopify, amazon, flipkart

class Review(BaseModel):
    review_id: str
    brand_id: str
    product_id: str
    rating: int
    text: str
    date: datetime
    verified_purchase: bool
    source: str
    
class CompetitorSnapshot(BaseModel):
    competitor_id: str
    product_id: str
    price: Decimal
    discount_percentage: float
    rating: float
    review_count: int
    in_stock: bool
    timestamp: datetime
```

### 2. Intelligence Engine

**Purpose:** Analyze data, detect patterns, generate insights

**Sub-Components:**

**a) Anomaly Detection Module**
```python
class AnomalyDetector:
    def detect_sales_anomalies(self, brand_id: str) -> List[Anomaly]:
        """
        - Calculate rolling mean and std dev (30-day window)
        - Flag deviations >2 standard deviations
        - Use seasonal decomposition for trend-aware detection
        """
        sales_data = get_sales_timeseries(brand_id)
        baseline = calculate_baseline(sales_data)
        anomalies = []
        
        for record in sales_data[-7:]:  # Check last 7 days
            if abs(record.revenue - baseline.mean) > 2 * baseline.std:
                anomalies.append(Anomaly(
                    type="sales_drop",
                    severity=calculate_severity(record, baseline),
                    date=record.date,
                    metric="revenue",
                    actual_value=record.revenue,
                    expected_value=baseline.mean
                ))
        
        return anomalies
```

**b) Sentiment Analysis Module**
```python
class SentimentAnalyzer:
    def __init__(self):
        self.aspect_model = pipeline("sentiment-analysis", 
                                     model="nlptown/bert-base-multilingual-uncased-sentiment")
        self.aspect_extractor = load_aspect_extraction_model()
    
    def analyze_reviews(self, reviews: List[Review]) -> ReviewInsights:
        """
        - Extract aspects (packaging, fragrance, texture, delivery, etc.)
        - Assign sentiment to each aspect
        - Track frequency and trend over time
        """
        aspects = {}
        
        for review in reviews:
            extracted_aspects = self.aspect_extractor(review.text)
            
            for aspect in extracted_aspects:
                sentiment = self.aspect_model(aspect.text)[0]
                
                if aspect.name not in aspects:
                    aspects[aspect.name] = []
                
                aspects[aspect.name].append({
                    "sentiment": sentiment["label"],
                    "score": sentiment["score"],
                    "date": review.date,
                    "review_id": review.review_id
                })
        
        return ReviewInsights(
            aspects=aspects,
            trending_complaints=identify_trending_complaints(aspects),
            sentiment_shift=calculate_sentiment_shift(aspects)
        )
```

**c) Correlation Engine**
```python
class CorrelationEngine:
    def find_root_causes(self, anomaly: Anomaly, brand_id: str) -> List[RootCause]:
        """
        - Gather all events in time window (anomaly_date - 14 days to anomaly_date)
        - Calculate correlation coefficients
        - Apply lag analysis (reviews impact sales with 1-2 week delay)
        - Rank by statistical significance and business impact
        """
        time_window = (anomaly.date - timedelta(days=14), anomaly.date)
        
        # Gather potential causes
        review_events = get_review_sentiment_changes(brand_id, time_window)
        competitor_events = get_competitor_changes(brand_id, time_window)
        social_events = get_social_sentiment_changes(brand_id, time_window)
        
        causes = []
        
        # Analyze review impact
        for event in review_events:
            correlation = calculate_lagged_correlation(
                event.sentiment_scores,
                anomaly.sales_data,
                max_lag=14
            )
            
            if correlation.coefficient > 0.5 and correlation.p_value < 0.05:
                causes.append(RootCause(
                    type="review_sentiment",
                    description=f"{event.complaint_increase}% spike in '{event.aspect}' complaints",
                    impact_score=correlation.coefficient,
                    confidence=1 - correlation.p_value,
                    suggested_actions=generate_actions(event)
                ))
        
        # Analyze competitor impact
        for event in competitor_events:
            if event.type == "price_drop":
                impact = estimate_price_elasticity_impact(event, anomaly)
                causes.append(RootCause(
                    type="competitor_pricing",
                    description=f"Competitor {event.competitor_name} reduced price by {event.discount}%",
                    impact_score=impact,
                    confidence=0.7,
                    suggested_actions=["Consider price adjustment", "Run limited-time promotion"]
                ))
        
        # Rank and return top causes
        return sorted(causes, key=lambda x: x.impact_score * x.confidence, reverse=True)[:5]
```

**d) Diagnostic Summary Generator**
```python
class DiagnosticGenerator:
    def __init__(self):
        self.llm = OpenAI(model="gpt-4")
    
    def generate_summary(self, anomaly: Anomaly, root_causes: List[RootCause]) -> str:
        """
        Generate natural language explanation using LLM
        """
        prompt = f"""
        Sales for brand dropped {anomaly.percentage_change}% on {anomaly.date}.
        
        Root causes identified:
        {format_root_causes(root_causes)}
        
        Generate a clear, actionable summary explaining why sales dropped and what actions to take.
        Format: [Main explanation] + [Ranked contributing factors with impact %] + [Recommended actions]
        """
        
        return self.llm.complete(prompt)
```

### 3. API Layer

**Endpoints:**

```python
# Authentication
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh

# Integrations
POST /api/v1/integrations/shopify/connect
POST /api/v1/integrations/amazon/connect
GET /api/v1/integrations/status
DELETE /api/v1/integrations/{integration_id}

# Dashboard Data
GET /api/v1/dashboard/overview
GET /api/v1/dashboard/sales-trend?start_date=X&end_date=Y
GET /api/v1/dashboard/review-insights
GET /api/v1/dashboard/competitor-activity

# Diagnostics
GET /api/v1/diagnostics/latest
GET /api/v1/diagnostics/{anomaly_id}
POST /api/v1/diagnostics/{anomaly_id}/feedback  # User validates accuracy

# Alerts
GET /api/v1/alerts
POST /api/v1/alerts/configure
PUT /api/v1/alerts/{alert_id}/acknowledge

# Reports
GET /api/v1/reports/weekly
POST /api/v1/reports/export  # Generate PDF/CSV
```

**Authentication & Authorization:**
- JWT-based authentication
- Role-based access control (Admin, Analyst, Viewer)
- API key support for programmatic access
- OAuth 2.0 for third-party integrations

### 4. Frontend Architecture

**Pages:**
1. **Dashboard** - Overview with key metrics and latest diagnostic
2. **Sales Analysis** - Detailed sales trends with event annotations
3. **Review Intelligence** - Aspect-based sentiment breakdown
4. **Competitor Tracking** - Price and activity monitoring
5. **Alerts** - Real-time notifications and alert history
6. **Settings** - Integration management, alert configuration

**Key Components:**
```typescript
// Main diagnostic card
<DiagnosticCard 
  anomaly={anomaly}
  rootCauses={rootCauses}
  summary={aiSummary}
  actions={suggestedActions}
/>

// Time-series chart with event markers
<SalesTrendChart 
  data={salesData}
  events={[reviewSpikes, competitorLaunches, socialTrends]}
  anomalies={detectedAnomalies}
/>

// Aspect sentiment breakdown
<AspectSentimentGrid 
  aspects={aspects}
  trendDirection={trends}
  onDrillDown={showDetailedReviews}
/>
```

## Data Flow

### Sales Anomaly Detection Flow (API-Based)
```
1. Celery Beat triggers fetch_shopify_sales every 6 hours
2. ShopifyAdapter fetches sales data via Shopify Admin API
3. Data normalized and stored in TimescaleDB
4. AnomalyDetector runs on new data
5. If anomaly detected:
   a. CorrelationEngine gathers events from past 14 days
   b. Calculates correlations with review sentiment, competitor activity
   c. Ranks root causes by impact
   d. DiagnosticGenerator creates natural language summary
   e. Alert sent to user via configured channels
   f. Dashboard updated with new diagnostic
```

### Review Analysis Flow (Web Scraping)
```
1. Celery Beat triggers scrape_amazon_reviews daily
2. AmazonReviewScraper:
   a. Rotates proxy for each request
   b. Uses headless browser with anti-detection
   c. Handles CAPTCHA if encountered
   d. Scrapes reviews with rate limiting (5-10 sec between requests)
3. Reviews stored in PostgreSQL with raw HTML in S3
4. SentimentAnalyzer processes reviews:
   a. Extract aspects using NER model
   b. Assign sentiment to each aspect
   c. Calculate sentiment trends
5. Results stored in TimescaleDB for time-series analysis
6. If significant sentiment shift detected, trigger correlation analysis
7. ScraperHealthCheck validates data quality
```

### Competitor Monitoring Flow (Web Scraping)
```
1. Celery Beat triggers scrape_competitor_prices daily
2. CompetitorPriceScraper:
   a. Fetches competitor product pages with proxy rotation
   b. Extracts price, discount, rating, stock status
   c. Stores snapshot with timestamp
3. Compare with previous snapshot to detect changes
4. If significant price drop (>10%) or new discount detected:
   a. Trigger correlation analysis with sales data
   b. Generate alert if timing correlates with sales drop
```

## Scalability Considerations

**Horizontal Scaling:**
- Stateless API servers behind load balancer
- Celery workers can scale independently based on queue depth
- Database read replicas for analytics queries

**Data Partitioning:**
- Partition TimescaleDB by brand_id and date
- Use Redis for hot data (last 7 days)
- Archive data older than 1 year to S3

**Caching Strategy:**
- Cache dashboard data for 1 hour
- Cache competitor data for 6 hours
- Invalidate cache on new anomaly detection

**Rate Limiting:**
- API: 1000 requests/hour per user
- Shopify API: Respect 2 req/sec limit with token bucket algorithm
- Amazon SP-API: Implement per-endpoint rate limiting
- Web Scraping: 5-20 second delays between requests, randomized timing
- Implement exponential backoff for retries

**Proxy Management:**
- Residential proxy pool (minimum 100 IPs)
- Rotate proxies per request for scraping
- Monitor proxy health and ban detection
- Fallback to datacenter proxies for non-critical scraping

**Scraping Infrastructure:**
- Dedicated scraping worker pool (separate from API workers)
- Browser instance pooling to reduce overhead
- Distributed scraping across multiple regions
- Scraper version control for quick rollbacks on failures

## Security Design

**Data Protection:**
- Encrypt credentials at rest using AWS KMS
- Use AWS Secrets Manager for API keys
- Encrypt data in transit (TLS 1.3)
- Implement field-level encryption for sensitive data

**Access Control:**
- Multi-factor authentication for admin accounts
- IP whitelisting for API access
- Audit logging for all data access
- Regular security scans and penetration testing

**Compliance:**
- GDPR: Data deletion API, consent management
- SOC 2: Implement required controls, annual audit
- PCI DSS: Not storing payment data, only transaction metadata

## Monitoring & Observability

**Metrics to Track:**
- API latency (p50, p95, p99)
- API integration success rate (Shopify, Amazon SP-API)
- Scraper success rate per target site
- Proxy health and ban rate
- CAPTCHA encounter frequency
- Scraper execution time and data quality
- Anomaly detection accuracy (validated by user feedback)
- Alert false positive rate
- Database query performance
- Celery task queue depth (separate queues for API vs scraping tasks)

**Alerting:**
- Integration failures (immediate)
- Scraper failures - 3 consecutive failures (within 15 min)
- Proxy pool depletion (<20% healthy proxies) (immediate)
- High CAPTCHA rate (>30% of requests) (within 30 min)
- Database connection issues (immediate)
- Anomaly detection pipeline failures (within 15 min)
- High API error rates (>5% over 5 min)

**Logging:**
- Structured JSON logs
- Correlation IDs for request tracing
- Log levels: DEBUG (dev), INFO (prod), ERROR (always)

## MVP Implementation Plan

**Phase 1: Foundation (Weeks 1-4)**
- Set up infrastructure (AWS, databases, CI/CD)
- Implement authentication and user management
- Build Shopify app and API integration adapter
- Set up proxy infrastructure and CAPTCHA solving
- Create basic data models and storage

**Phase 2: Data Collection (Weeks 5-8)**
- Implement Amazon review scraper with anti-detection
- Build competitor price monitoring scraper
- Set up Celery task scheduling (separate queues for API vs scraping)
- Create data normalization pipeline
- Implement scraper health monitoring

**Phase 3: Intelligence (Weeks 9-12)**
- Implement anomaly detection
- Build sentiment analysis module
- Create correlation engine
- Integrate LLM for diagnostic summaries

**Phase 4: Frontend & Polish (Weeks 13-16)**
- Build React dashboard
- Implement alert system
- Create report export functionality
- User testing and bug fixes
- Scraper maintenance and optimization

**Phase 5: Beta Launch (Week 17+)**
- Onboard 5-10 pilot customers
- Monitor scraper reliability and adapt to any blocks
- Gather feedback and iterate
- Monitor system performance
- Prepare for public launch

## Future Technical Enhancements

1. **Real-time Processing:** Move from batch to streaming with Apache Kafka
2. **Advanced ML:** Train custom models on customer data for better accuracy
3. **Predictive Analytics:** LSTM/Prophet models for sales forecasting
4. **Graph Database:** Neo4j for complex relationship analysis between factors
5. **Multi-tenancy:** Optimize for 1000+ brands with tenant isolation
6. **Distributed Scraping:** Scale scraping infrastructure globally with regional workers
7. **AI-Powered Scraper Adaptation:** Use computer vision to auto-adapt to website changes
8. **Blockchain for Data Provenance:** Track data lineage for audit compliance
