import json
import math

def lambda_handler(event, context):
    """
    AWS Lambda Integration: Serverless Sentiment Computing
    This is the deployment payload that would reside in an AWS Lambda function.
    It takes review text and outputs sentiment scores and themes.
    """
    try:
        review_text = event.get('text', '').lower()
        score = 0.5
        themes = []
        
        # Simulated heavy NLP processing logic...
        if "love" in review_text or "great" in review_text:
            score += 0.4
            themes.append("Positive Quality")
        if "leak" in review_text or "broken" in review_text:
            score -= 0.6
            themes.append("Packaging Issue")
        if "price" in review_text or "expensive" in review_text:
            score -= 0.2
            themes.append("Pricing Context")
            
        score = max(0.0, min(1.0, score))
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'sentiment_score': round(score, 2),
                'themes': ",".join(themes)
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
