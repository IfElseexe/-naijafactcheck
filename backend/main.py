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
    BLOCKED_DOMAINS = ["geilefrauen", "xvideos", "xnxx", "pornhub", "xhamster", ".pics", "redtube", "youporn"]

    search_results = []
    try:
        with DDGS() as ddgs:
            search_query = f"{claim} Nigeria news"
            results = list(ddgs.text(search_query, max_results=10, safesearch="strict"))
            for r in results:
                url = r.get("href", "").lower()
                title = r.get("title", "").lower()
                if any(bad in url or bad in title for bad in BLOCKED_DOMAINS):
                    continue
                search_results.append({
                    "title": r.get("title", ""),
                    "snippet": r.get("body", ""),
                    "url": r.get("href", "")
                })
                if len(search_results) >= 5:
                    break
    except Exception:
        search_results = []

    search_context = ""
    sources_list = []
    for i, r in enumerate(search_results):
        search_context += f"\nSource {i+1}: {r['title']}\n{r['snippet']}\nURL: {r['url']}\n"
        sources_list.append({"title": r["title"], "url": r["url"]})

    groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

  # STAGE 1: Deep reasoning (internal only, not shown to user)
    stage1_prompt = f"""You are a rigorous professional fact-checker. Analyse this claim STRICTLY against the web search results below. Do not use outside knowledge or assumptions — only what is in the search results.

CLAIM: "{claim}"

WEB SEARCH RESULTS:
{search_context if search_context else "No search results found."}

Rules:
- If the search results do NOT explicitly confirm the claim, treat it as FALSE/unconfirmed.
- If the search results show the subject of the claim doing something that contradicts the claim (e.g. attending an event, making public statements, being alive and active), the claim is FALSE.
- Never invent or assume a source said something it did not say. Only reference what is literally present in the search results above.
- If search results are empty or irrelevant, state clearly that there is no evidence supporting the claim.

Write a detailed, evidence-only analysis covering: what the claim states, what the search results actually show (quote specifics), any dates/times/locations mentioned, and whether the evidence supports or contradicts the claim."""

    try:
        stage1 = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": stage1_prompt}],
            model="llama-3.1-8b-instant",
        )
        deep_analysis = stage1.choices[0].message.content
    except Exception as e:
        print("Stage 1 error:", str(e))
        return {
            "verdict": "FAKE",
            "explanation": f"Verification error: {str(e)[:200]}",
            "sources": sources_list,
            "claim": claim
        }

    # STAGE 2: Force binary verdict + structured summary
    stage2_prompt = f"""You are NaijaFactCheck, Nigeria's AI fact-checker. Below is a strict evidence-based analysis of a news claim. Convert it into a SHORT, DECISIVE, STRUCTURED summary for the end user.

ORIGINAL CLAIM: "{claim}"

EVIDENCE-BASED ANALYSIS:
{deep_analysis}

STRICT RULES:
1. You MUST choose either REAL or FAKE based ONLY on what the analysis above actually found.
2. If the analysis says there is no confirming evidence, or the evidence contradicts the claim, or the claim describes something dramatic (death, disaster, scandal) with no credible confirming source — the verdict MUST be FAKE.
3. Only mark REAL if the analysis clearly cites real, specific, named sources that directly confirm the claim happened.
4. NEVER invent sources, dates or facts that are not explicitly present in the analysis above.
5. The words "unverifiable", "unclear", "uncertain", or "unconfirmed" must NEVER appear anywhere in your response, including the verdict line. You must commit fully to either REAL or FAKE.
6. If you cannot find clear confirming evidence, that automatically means FAKE — state it confidently as FAKE, not as "unverifiable."

YOUR VERY FIRST LINE must be exactly: VERDICT: REAL or VERDICT: FAKE

Then a blank line, then a structured summary in this EXACT format:

SUMMARY: [One short, punchy sentence stating what the claim is and whether it's true or false]

KEY DETAILS:
- Date: [date of the claimed event if explicitly found in evidence, or "Not confirmed"]
- Time: [time if explicitly found, or "Not confirmed"]
- Location: [location if explicitly found, or "Not confirmed"]

WHY: [2-3 short sentences explaining exactly why this is real or fake, referencing only what the evidence actually showed]

LANGUAGE RULE: Write your entire response in the SAME language as the ORIGINAL CLAIM (English, Yoruba, Igbo, or Hausa). Keep the labels "VERDICT", "SUMMARY", "KEY DETAILS", "Date", "Time", "Location", "WHY" in English always, but the content after them should be in the claim's language.

Keep the whole thing under 120 words total. Be direct and confident."""
    try:
        stage2 = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": stage2_prompt}],
            model="llama-3.1-8b-instant",
        )
        final_response = stage2.choices[0].message.content

        lines = final_response.strip().split('\n')
        verdict_line = lines[0] if lines else "VERDICT: FAKE"
        explanation = '\n'.join(lines[1:]).strip()

        # Force binary verdict no matter what the AI outputs
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
            "explanation": f"Verification error: {str(e)[:200]}",
            "sources": sources_list,
            "claim": claim
        }