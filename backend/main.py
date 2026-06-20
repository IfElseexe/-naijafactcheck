from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import re
import nltk
import requests
from bs4 import BeautifulSoup
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from duckduckgo_search import DDGS
from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()

# Download NLTK data
nltk.download('stopwords', quiet=True)
nltk.download('wordnet', quiet=True)
nltk.download('omw-1.4', quiet=True)

app = FastAPI()

# Allow React frontend to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model and vectorizer
model = joblib.load("model.pkl")
vectorizer = joblib.load("vectorizer.pkl")

lemmatizer = WordNetLemmatizer()
stop_words = set(stopwords.words('english'))

# --- Input schemas ---
class TextInput(BaseModel):
    text: str

class URLInput(BaseModel):
    url: str

# --- Preprocessing ---
def preprocess(text: str) -> str:
    text = text.lower()
    text = re.sub(r'http\S+|www\S+', '', text)
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    tokens = text.split()
    tokens = [lemmatizer.lemmatize(t) for t in tokens if t not in stop_words and len(t) > 2]
    return ' '.join(tokens)

# --- Classification logic ---
def classify(text: str):
    cleaned = preprocess(text)
    vectorized = vectorizer.transform([cleaned])
    prediction = model.predict(vectorized)[0]
    probability = model.predict_proba(vectorized)[0]
    confidence = round(max(probability) * 100, 2)

    if confidence < 60:
        label = "UNVERIFIABLE"
    else:
        label = prediction

    reasons = []
    if any(word in text.lower() for word in ["miracle", "cure", "shocking", "exposed", "breaking", "alert", "urgent"]):
        reasons.append("Contains sensationalist language commonly associated with fake news")
    if any(word in text.lower() for word in ["apply now", "register here", "click link", "share this"]):
        reasons.append("Contains call-to-action phrases typical of misinformation")
    if any(word in text.lower() for word in ["secret", "hidden", "they don't want you to know", "insider"]):
        reasons.append("Uses conspiratorial framing")
    if len(reasons) == 0:
        if label == "FAKE":
            reasons.append("Text patterns match known fake news writing styles")
        elif label == "REAL":
            reasons.append("Text patterns consistent with credible news reporting")
        else:
            reasons.append("Insufficient confidence to make a definitive classification")

    return {
        "label": label,
        "confidence": confidence,
        "reasons": reasons,
        "original_text": text[:300] + "..." if len(text) > 300 else text
    }

# --- Routes ---
@app.get("/")
def root():
    return {"message": "Fake News Detection API is running"}

@app.post("/classify/text")
def classify_text(data: TextInput):
    if len(data.text.strip()) < 20:
        raise HTTPException(status_code=400, detail="Text too short. Please enter a full news headline or article.")
    return classify(data.text)

@app.post("/classify/url")
def classify_url(data: URLInput):
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(data.url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.content, "html.parser")
        paragraphs = soup.find_all("p")
        text = " ".join([p.get_text() for p in paragraphs[:10]])
        if len(text.strip()) < 20:
            raise HTTPException(status_code=400, detail="Could not extract enough text from the URL.")
        return classify(text)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not fetch URL: {str(e)}")
@app.get("/news/feed")
def get_news_feed():
    try:
        API_KEY = os.getenv("NEWS_API_KEY")
        url = f"https://newsapi.org/v2/everything?q=Nigeria&language=en&pageSize=20&sortBy=publishedAt&apiKey={API_KEY}"
        response = requests.get(url, timeout=10)
        data = response.json()
        print("NewsAPI status:", data.get("status"))
        print("NewsAPI message:", data.get("message", "none"))
        if data.get("status") != "ok":
            raise Exception("API error")
        articles = []
        for a in data.get("articles", []):
            if a.get("title") and a.get("title") != "[Removed]":
                articles.append({
                    "title": a["title"],
                    "description": a.get("description", ""),
                    "url": a.get("url", ""),
                    "source": a.get("source", {}).get("name", "Unknown"),
                    "publishedAt": a.get("publishedAt", ""),
                    "urlToImage": a.get("urlToImage", "")
                })
        return {"articles": articles}
    except Exception as e:
        print("Feed error:", str(e))
        return {"articles": []}
    
@app.post("/classify/verify")
def deep_verify(data: TextInput):
    claim = data.text.strip()
    if len(claim) < 10:
        raise HTTPException(status_code=400, detail="Claim too short.")

    # Step 1: Search the web
    search_results = []
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(claim, max_results=5))
            for r in results:
                search_results.append({
                    "title": r.get("title", ""),
                    "snippet": r.get("body", ""),
                    "url": r.get("href", "")
                })
    except Exception as e:
        search_results = []

    # Step 2: Build context
    search_context = ""
    sources_list = []
    for i, r in enumerate(search_results):
        search_context += f"\nSource {i+1}: {r['title']}\n{r['snippet']}\nURL: {r['url']}\n"
        sources_list.append({"title": r["title"], "url": r["url"]})

    # Step 3: Send to Gemini
    prompt = f"""You are NaijaFactCheck, Nigeria's most trusted AI fact-checker. A user has submitted a news claim for verification.

CLAIM SUBMITTED: "{claim}"

WEB SEARCH RESULTS FOUND:
{search_context if search_context else "No search results found for this claim."}

Your job is to:
1. Carefully analyse the claim against the search results
2. Give a clear verdict: REAL, FAKE, or UNVERIFIABLE
3. Explain your reasoning in a conversational, engaging way — talk directly to the user like a knowledgeable Nigerian fact-checker
4. Mention specific sources and what they say
5. If the claim is fake, explain exactly why and what the truth actually is
6. If real, confirm it with evidence
7. If unverifiable, explain what you found and what is still unclear

IMPORTANT:
- Be conversational, confident and thorough
- Reference actual source names and findings
- Keep response between 150-250 words
- YOUR VERY FIRST LINE must be exactly one of these three options, nothing else:
  VERDICT: REAL
  VERDICT: FAKE  
  VERDICT: UNVERIFIABLE
- Then leave one blank line and start your explanation
- Never put anything before the VERDICT line

Respond now:"""

    # Step 3: Send to Groq (free, no billing)
    try:
        groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        chat_completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant",
        )
        ai_response = chat_completion.choices[0].message.content

        lines = ai_response.strip().split('\n')
        verdict_line = lines[0] if lines else "VERDICT: UNVERIFIABLE"
        explanation = '\n'.join(lines[1:]).strip()

        if "FAKE" in verdict_line:
            verdict = "FAKE"
        elif "REAL" in verdict_line:
            verdict = "REAL"
        else:
            verdict = "UNVERIFIABLE"

        return {
            "verdict": verdict,
            "explanation": explanation,
            "sources": sources_list,
            "claim": claim
        }

    except Exception as e:
        print("Groq error:", str(e))
        return {
            "verdict": "UNVERIFIABLE",
            "explanation": f"Verification error: {str(e)[:200]}",
            "sources": sources_list,
            "claim": claim
        }