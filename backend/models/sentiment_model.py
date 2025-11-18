from transformers import pipeline
import numpy as np

class SentimentAnalysisModel:
    """Sentiment analysis for market news and social media"""

    def __init__(self):
        self.sentiment_pipeline = None

    def load_model(self):
        """Load pre-trained sentiment analysis model"""
        if self.sentiment_pipeline is None:
            self.sentiment_pipeline = pipeline("sentiment-analysis",
                                             model="cardiffnlp/twitter-roberta-base-sentiment-latest")

    def analyze_text(self, text):
        """Analyze sentiment of text"""
        if self.sentiment_pipeline is None:
            self.load_model()

        result = self.sentiment_pipeline(text)[0]

        # Map to our scale
        label = result['label']
        confidence = result['score']

        if label == 'LABEL_2':  # Positive
            sentiment_score = confidence
        elif label == 'LABEL_0':  # Negative
            sentiment_score = -confidence
        else:  # Neutral
            sentiment_score = 0

        return {
            "sentiment_score": sentiment_score,
            "label": "positive" if sentiment_score > 0.1 else "negative" if sentiment_score < -0.1 else "neutral",
            "confidence": confidence
        }

    def analyze_market_news(self, news_articles):
        """Analyze sentiment of multiple news articles"""
        sentiments = []
        for article in news_articles:
            sentiment = self.analyze_text(article['text'])
            sentiments.append({
                "title": article['title'],
                "sentiment": sentiment,
                "date": article.get('date', 'unknown')
            })

        # Aggregate sentiment
        avg_sentiment = np.mean([s['sentiment']['sentiment_score'] for s in sentiments])

        return {
            "individual_sentiments": sentiments,
            "aggregate_sentiment": avg_sentiment,
            "market_outlook": "bullish" if avg_sentiment > 0.1 else "bearish" if avg_sentiment < -0.1 else "neutral"
        }

if __name__ == "__main__":
    model = SentimentAnalysisModel()

    # Example
    text = "Agricultural prices are expected to rise due to good weather conditions."
    result = model.analyze_text(text)
    print(f"Sentiment analysis: {result}")

    news = [
        {"title": "Good rains boost crop yields", "text": "Recent rains have improved crop conditions significantly."},
        {"title": "Market prices stable", "text": "Commodity prices remain stable this week."}
    ]
    market_sentiment = model.analyze_market_news(news)
    print(f"Market sentiment: {market_sentiment}")</content>
</xai:function_call