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
    language: str = "en"

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
    lang = data.language or "en"

    if len(claim) < 10:
        raise HTTPException(status_code=400, detail="Claim too short.")

    BLOCKED_DOMAINS = ["geilefrauen", "xvideos", "xnxx", "pornhub", "xhamster", ".pics", "redtube", "youporn"]

    import datetime
    today = datetime.date.today().strftime("%B %d %Y")

    def run_search(query):
        results_found = []
        try:
            with DDGS() as ddgs:
                results = list(ddgs.text(query, max_results=10, safesearch="strict"))
                for r in results:
                    url = r.get("href", "").lower()
                    title = r.get("title", "").lower()
                    if any(bad in url or bad in title for bad in BLOCKED_DOMAINS):
                        continue
                    results_found.append({
                        "title": r.get("title", ""),
                        "snippet": r.get("body", ""),
                        "url": r.get("href", "")
                    })
                    if len(results_found) >= 5:
                        break
        except Exception:
            pass
        return results_found

    # Step 1: Search with today's date first
    search_results = run_search(f"{claim} {today}")

    # Step 2: Broader search if first returned less than 2 results
    if len(search_results) < 2:
        search_results = run_search(f"{claim} latest news")

    # Step 3: Broadest fallback
    if len(search_results) < 2:
        search_results = run_search(claim)

    search_context = ""
    sources_list = []
    for i, r in enumerate(search_results):
        search_context += f"\nSource {i+1}: {r['title']}\n{r['snippet']}\nURL: {r['url']}\n"
        sources_list.append({"title": r["title"], "url": r["url"]})

    # Language map
    lang_map = {
        "en": "English",
        "yo": "Yoruba",
        "ig": "Igbo",
        "ha": "Hausa"
    }
    response_language = lang_map.get(lang, "English")

    groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    # STAGE 1: Evidence analysis (always in English internally)
    stage1_prompt = f"""You are a strict fact-checker. Analyse this claim ONLY using the web search results below. Do not use any outside knowledge.

CLAIM: "{claim}"

WEB SEARCH RESULTS:
{search_context if search_context else "No search results found."}

Rules:
- Only use what is explicitly stated in the search results above.
- If search results confirm the claim with specific facts, say so clearly.
- If search results contradict the claim or show no evidence, say so clearly.
- If no relevant results found, state: "No credible evidence found to support this claim."
- Do not invent any facts, dates, names or sources.
- Write your analysis in English only. Keep it under 200 words."""

    try:
        stage1 = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": stage1_prompt}],
            model="llama-3.1-8b-instant",
        )
        deep_analysis = stage1.choices[0].message.content
    except Exception as e:
        return {
            "verdict": "FAKE",
            "explanation": "Verification service temporarily unavailable.",
            "sources": sources_list,
            "claim": claim
        }

    # STAGE 2: Structured verdict in user's language
    stage2_prompt = f"""You are NaijaFactCheck, Nigeria's AI fact-checker. Using ONLY the analysis below, produce a short structured verdict.

ORIGINAL CLAIM: "{claim}"

INTERNAL ANALYSIS (English):
{deep_analysis}

OUTPUT RULES:
1. First line must be EXACTLY one of: VERDICT: REAL    or    VERDICT: FAKE
2. If the analysis found clear confirming evidence → VERDICT: REAL
3. If the analysis found no evidence, contradicting evidence, or said "no credible evidence found" → VERDICT: FAKE
4. After the verdict line, write your structured summary ENTIRELY in {response_language}. Do not mix any other language into the summary.
5. Do not translate the labels VERDICT, SUMMARY, KEY DETAILS, Date, Time, Location, WHY — keep those in English.
6. Do not add anything before the VERDICT line.

FORMAT (write content after each label in {response_language}):

VERDICT: [REAL or FAKE]

SUMMARY: [One sentence — what the claim says and whether it is true or false]

KEY DETAILS:
- Date: [date if found in evidence, else "Not confirmed"]
- Time: [time if found in evidence, else "Not confirmed"]  
- Location: [location if found in evidence, else "Not confirmed"]

WHY:
- [First reason based strictly on evidence]
- [Second reason based strictly on evidence]

Keep total response under 150 words. Be direct and confident."""

    try:
        stage2 = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": stage2_prompt}],
            model="llama-3.1-8b-instant",
        )
        final_response = stage2.choices[0].message.content

        lines = final_response.strip().split('\n')
        verdict_line = lines[0] if lines else "VERDICT: FAKE"
        explanation = '\n'.join(lines[1:]).strip()

        full_text_upper = final_response.upper()
        if "VERDICT: REAL" in full_text_upper and "VERDICT: FAKE" not in full_text_upper:
            verdict = "REAL"
        else:
            verdict = "FAKE"

        return {
            "verdict": verdict,
            "explanation": explanation,
            "sources": sources_list,
            "claim": claim
        }

    except Exception as e:
        print("Stage 2 error:", str(e))
        return {
            "verdict": "FAKE",
            "explanation": "Verification service temporarily unavailable.",
            "sources": sources_list,
            "claim": claim
        }