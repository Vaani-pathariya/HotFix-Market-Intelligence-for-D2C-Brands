# MarketSense AI

MarketSense AI is an AI-driven intelligent diagnostic platform designed for Direct-to-Consumer (D2C) brands. The platform goes beyond basic metric tracking to explain **why** sales fluctuate by directly correlating internal sales data with live external market signals (such as competitor pricing drops, stockouts, and aggregated customer sentiment from reviews).

## Key Features

1. **Dashboard & AI Diagnosis:** Employs **Amazon Bedrock (Claude 3)** to instantly analyze anomalies across your entire catalog, dynamically generating executive summaries that pinpoint root causes directly tied to market events.
2. **Dynamic Simulation Engine:** Uses a robust, realistic data generator connected to **Amazon DynamoDB** to populate your dashboard with structured e-commerce data (sales, trends) and unstructured NLP data (injected reviews and sentiment analysis).
3. **Intelligence & NLP:** Dissects customer reviews securely using **AWS Lambda** serverless computing, assigning normalized semantic scores and flagging high-risk complaint themes such as "Leakage" or "Delayed Delivery".
4. **Competitor Tracking:** Automatically tracks changes in competitor SKUs, integrating **Amazon SageMaker** anomaly detection to pinpoint market opportunities or threats in real-time.
5. **Data Export:** Generate and download fully-formatted reports seamlessly through **Amazon S3** via presigned secure URLs.

## Implementation Architecture (AWS Native)

This codebase is capable of executing entirely locally, but natively integrates with the following AWS Cloud ecosystem. Just insert your credentials in `.env`:

* **Amazon Bedrock**: GenAI reasoning and automatic root-cause explanations on the Dashboard.
* **AWS Lambda**: Sub-millisecond serverless NLP sentiment scoring decoupled from the monolith.
* **Amazon S3**: CSV report generation and temporary presigned URL distribution.
* **Amazon DynamoDB**: Scalable NoSQL table (`MarketSenseReviews`) handling unstructured customer review JSON documents.
* **Amazon SageMaker**: Machine learning inference endpoint to accurately flag percentage anomalies in trailing time-series sales.

## Getting Started

Make sure you have Docker Desktop installed and running.

1. **Create an `.env` file** in the project root containing your AWS configurations (if you want the cloud features active; otherwise, it degrades gracefully to mock data):
```env
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
```

2. **Boot the Backend (Postgres, Redis, Celery, FastAPI)**:
```bash
docker-compose up -d --build
```
*The backend API will be available at http://localhost:8000/api/v1/docs*

3. **Boot the Frontend (React, Vite)**:
```bash
cd frontend
npm install
npm run dev
```

## Evaluation Process

### Why AI is required in your solution
Modern Direct-to-Consumer (D2C) brands suffer from "data fragmentation"—sales data sits in Shopify, while customer sentiment and competitor pricing sit in thousands of unstructured reviews and dynamic Amazon listings. Traditional dashboards can only tell you *what* happened (e.g., "Sales dropped 18%"). **AI is strictly required to bridge this gap to tell you *why* it happened.** Without Generative AI (LLMs) to synthesize disparate data streams and Machine Learning to detect subtle time-series anomalies, human analysts would take days to manually correlate a sales drop with a subtle spike in packaging complaints or competitor pricing shifts.

### How AWS services are used within your architecture
This platform leverages a fully cloud-native, serverless, and highly scalable pipeline built on the AWS ecosystem:
*   **Amazon Bedrock**: Invokes the **Anthropic Claude 3** family (Haiku/Sonnet) to power the Dashboard's "AI Diagnostic Engine". It synthesizes internal sales anomalies, competitor data, and review sentiment to generate human-readable root causes and recommendations.
*   **AWS Lambda**: Offloads heavy, synchronous Natural Language Processing (NLP). As new customer reviews stream in, Lambda analyzes the unstructured text to score sentiment and extract critical complaint themes (e.g., "Leakage", "Delayed Delivery") without blocking the main web server.
*   **Amazon DynamoDB**: Provides millisecond-latency NoSQL storage (`MarketSenseReviews`) specifically designed to handle the high-velocity, flexible-schema nature of unstructured customer review data.
*   **Amazon S3**: Handles robust data export. When users request reports, the system stitches the data, pushes the CSV to an S3 bucket, and instantly generates a secure Presigned URL for the user to download.
*   **Amazon SageMaker**: Powers the numeric anomaly detection. Instead of hard-coded thresholds, a SageMaker inference endpoint evaluates trailing 14-day sales arrays to accurately flag true statistical anomalies in revenue.

### What value the AI layer adds to the user experience
The AI layer transforms MarketSense from a passive tracking tool into an **active operational co-pilot**. 
Instead of forcing brand managers to dig through charts to uncover issues, the AI layer automatically surfaces concise, actionable executive summaries with quantified confidence scores (e.g., "91% Confidence: Competitor X dropped prices by 20%"). This reduces the "time-to-insight" from days to seconds, empowering brands to instantly launch counter-promotions or fix supply chain issues before they irreparably damage revenue.
