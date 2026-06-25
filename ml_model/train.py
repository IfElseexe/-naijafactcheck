import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import PassiveAggressiveClassifier, LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import joblib
import re
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

# Download NLTK data
nltk.download('stopwords')
nltk.download('wordnet')
nltk.download('omw-1.4')

print("Creating Nigerian-context fake news dataset...")

fake_samples = [
    "BREAKING: President announces free money for all Nigerians, apply now on this link",
    "EXPOSED: Governor secretly transfers billions to foreign account, insider reveals shocking truth",
    "MIRACLE CURE: Nigerian doctor discovers plant that cures diabetes, cancer and HIV in 3 days",
    "ALERT: New policy says all BVN holders must pay N50,000 or lose their account by Friday",
    "SHOCKING: Popular pastor caught with 200 million naira in his bedroom, photos emerge",
    "URGENT: CBN to ban all ATM withdrawals starting next week, stock up on cash now",
    "JUST IN: Nigerian government to share N500,000 to unemployed youths, register here immediately",
    "BREAKING: Dangote secretly declares bankruptcy, owes banks trillions of naira",
    "EXPOSED: This common food in Nigerian markets causes cancer, doctors are hiding the truth",
    "ALERT: WhatsApp will start charging N2,000 monthly fee from next month, share this warning",
    "SHOCKING REVELATION: Top INEC official confesses election results were manipulated",
    "MIRACLE: Man drinks mixture of lime and pepper, HIV completely cured after 7 days",
    "BREAKING: Federal government to pay N200,000 monthly stipend to all graduates, apply now",
    "EXPOSED: Popular soft drink contains pig blood, Muslim scholars issue urgent warning",
    "ALERT: New law says Nigerians abroad must pay N1 million to keep their citizenship",
    "SHOCKING: Lagos water supply contaminated with dangerous chemical, do not drink tap water",
    "BREAKING: EFCC arrests popular Nollywood actor for internet fraud worth billions",
    "MIRACLE CURE: Boil these leaves and drink, your sugar level will normalize in 24 hours",
    "URGENT WARNING: New SIM card registration policy will disconnect 50 million Nigerians",
    "EXPOSED: This popular cream sold in Nigerian markets bleaches internal organs slowly",
    "BREAKING: Senator caught importing fake COVID vaccines to Nigeria, whistleblower reveals",
    "ALERT: Government to confiscate all land without Certificate of Occupancy next month",
    "SHOCKING: Popular bank in Nigeria about to collapse, withdraw your money immediately",
    "MIRACLE: Blind man regains sight after applying onion juice for 3 days, doctors baffled",
    "BREAKING: NNPC discovers Nigeria has been selling oil at loss for 10 years due to sabotage",
    "EXPOSED: Popular instant noodles brand contains cancer-causing chemical banned in 30 countries",
    "ALERT: New JAMB policy cancels all 2024 results, students must rewrite examination",
    "SHOCKING: Nigerian military officer leaks classified document showing plan against citizens",
    "MIRACLE WEIGHT LOSS: Drink this mixture every morning and lose 10kg in one week guaranteed",
    "BREAKING: Fuel subsidy removal was a lie, Nigeria still paying subsidy secretly says insider",
    "EXPOSED: NIN registration data sold to foreign companies by corrupt officials",
    "ALERT: All Nigerians must revalidate their voters card or it becomes invalid by December",
    "SHOCKING: Popular energy drink causes kidney failure, 200 Nigerians already affected",
    "BREAKING: Prominent Nigerian billionaire dies in secret, family hiding truth from public",
    "MIRACLE: Woman cures fibroid naturally using garlic and ginger, no surgery needed",
    "EXPOSED: Security agencies plan to arrest opposition leaders before next election",
    "ALERT: New tax law requires Nigerians to pay 30% of salary directly to government monthly",
    "SHOCKING: Popular cooking oil sold in Aba and Lagos contains recycled engine oil",
    "BREAKING: University degrees from these 10 Nigerian universities declared invalid internationally",
    "MIRACLE CURE: HIV positive man tests negative after 14 days of drinking this herbal mixture",
    "JUST IN: Naira to become strongest currency in Africa by December after secret deal",
    "EXPOSED: Federal ministry official reveals COVID vaccines contain tracking microchips",
    "ALERT: All cryptocurrency accounts in Nigeria to be frozen by CBN starting Monday",
    "SHOCKING: Popular Nigerian church collecting members organs during night vigils",
    "BREAKING: ASUU strike returns, all universities to close indefinitely from next week",
    "MIRACLE: Deaf mute child speaks for first time after prophet prays, video goes viral",
    "EXPOSED: Immigration officials selling Nigerian passports to foreigners at border posts",
    "ALERT: This phone charging habit causes cancer, medical experts warn Nigerians urgently",
    "SHOCKING: Government plans to introduce new currency and phase out naira secretly",
    "BREAKING: Popular Nigerian musician arrested in Dubai for money laundering worth billions",
]

# --- REAL NEWS SAMPLES ---
real_samples = [
    "The Central Bank of Nigeria has announced new monetary policy guidelines effective from next quarter",
    "Lagos State government launches infrastructure development plan worth 200 billion naira",
    "INEC confirms voter registration exercise will continue across all 36 states and FCT",
    "Nigerian Senate passes petroleum industry amendment bill after third reading",
    "Dangote Refinery begins commercial operations, expected to reduce fuel imports significantly",
    "Federal government signs memorandum of understanding with World Bank on education funding",
    "Nigeria records 3.2 percent GDP growth in second quarter according to NBS report",
    "CBN raises monetary policy rate to control inflation, commercial banks to adjust lending rates",
    "Lagos-Calabar highway project construction begins following environmental impact assessment",
    "JAMB releases 2024 UTME results, candidates can check scores on official portal",
    "Nigeria and China sign bilateral trade agreement worth 5 billion dollars over five years",
    "Federal government to recruit 10,000 additional teachers for public secondary schools",
    "EFCC secures conviction of former bank executive for N2.4 billion fraud",
    "National grid achieves 5,000 megawatts generation capacity milestone this week",
    "Nigeria's inflation rate drops to 22 percent in April from 24 percent recorded in March",
    "Buhari signs executive order establishing new development finance institution",
    "Lagos state records highest internally generated revenue in Nigerian history at N1.2 trillion",
    "Nigerian Air Force receives new fighter aircraft as part of defence modernisation programme",
    "NNPC signs agreement with international oil companies for deepwater exploration projects",
    "Federal government disburses N15 billion to support small and medium enterprises nationwide",
    "Court sentences former state governor to 10 years imprisonment for corruption charges",
    "Nigeria produces 1.3 million barrels of oil per day in October according to OPEC data",
    "University of Lagos announces commencement of new postgraduate programmes in technology",
    "Nigerian stock exchange records gains as banking sector stocks rally on policy announcement",
    "Health minister announces nationwide distribution of malaria prevention nets to rural communities",
    "Nigeria reaches agreement with IMF on economic reform programme targets for fiscal year",
    "Telecommunications companies invest N500 billion in network infrastructure expansion",
    "Federal road safety corps deploys additional officers for festive season operations nationwide",
    "Nigerian export promotion council records increase in non-oil exports for third consecutive quarter",
    "Edo state government launches digital skills training programme for 50,000 youth",
    "National examination council releases timetable for senior school certificate examination",
    "CBN issues new guidelines on foreign exchange management for commercial banks",
    "Federal government approves construction of 10 new general hospitals across six geopolitical zones",
    "Nigeria Agriculture ministry distributes improved seedlings to 200,000 smallholder farmers",
    "Port Harcourt refinery rehabilitation reaches 60 percent completion according to NNPC update",
    "Federal government increases monthly minimum wage following negotiations with labour unions",
    "Nigeria ranks among top 10 fastest growing economies in Africa according to AfDB report",
    "NAFDAC warns public against consumption of unregistered food products in circulation",
    "Supreme court upholds election tribunal ruling in gubernatorial election petition",
    "Federal government launches N75 billion housing scheme for low income earners in urban areas",
    "Nigerian researchers develop malaria rapid diagnostic test kit approved for clinical use",
    "Customs service records 15 percent increase in revenue collection compared to previous year",
    "Federal ministry of finance releases quarterly budget implementation report to public",
    "Nigeria secures 2 billion dollar loan from African Development Bank for infrastructure projects",
    "INEC chairman addresses press conference on preparations for upcoming governorship elections",
    "Nigerian airlines receive approval to operate additional international routes from aviation authority",
    "Federal government establishes sovereign wealth fund advisory committee with industry experts",
    "National population commission announces preparations for Nigeria census exercise",
    "Nigeria wins arbitration case against international oil company saving 2 billion dollars",
    "Lagos state transport authority deploys 200 new buses to reduce commuter congestion",
]

# Build dataframe
texts = fake_samples + real_samples
labels = ['FAKE'] * len(fake_samples) + ['REAL'] * len(real_samples)

df = pd.DataFrame({'text': texts, 'label': labels})
print(f"Dataset size: {len(df)} articles ({len(fake_samples)} fake, {len(real_samples)} real)")

# --- PREPROCESSING ---
lemmatizer = WordNetLemmatizer()
stop_words = set(stopwords.words('english'))

def preprocess(text):
    text = text.lower()
    text = re.sub(r'http\S+|www\S+', '', text)
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    tokens = text.split()
    tokens = [lemmatizer.lemmatize(t) for t in tokens if t not in stop_words and len(t) > 2]
    return ' '.join(tokens)

print("Preprocessing text...")
df['clean_text'] = df['text'].apply(preprocess)

# --- SPLIT ---
X_train, X_test, y_train, y_test = train_test_split(
    df['clean_text'], df['label'], test_size=0.2, random_state=42, stratify=df['label']
)

# --- VECTORIZE ---
tfidf = TfidfVectorizer(max_features=5000, ngram_range=(1, 2), sublinear_tf=True)
X_train_tfidf = tfidf.fit_transform(X_train)
X_test_tfidf = tfidf.transform(X_test)

# --- TRAIN MODELS ---
print("\nTraining models...")

models = {
    "Passive Aggressive": PassiveAggressiveClassifier(max_iter=1000),
    "Logistic Regression": LogisticRegression(max_iter=1000),
    "Random Forest": RandomForestClassifier(n_estimators=100, random_state=42),
}

best_model = None
best_score = 0
best_name = ""

for name, model in models.items():
    model.fit(X_train_tfidf, y_train)
    preds = model.predict(X_test_tfidf)
    acc = accuracy_score(y_test, preds)
    print(f"\n{name}: {acc*100:.2f}% accuracy")
    print(classification_report(y_test, preds))
    if acc > best_score:
        best_score = acc
        best_model = model
        best_name = name

print(f"\nBest model: {best_name} with {best_score*100:.2f}% accuracy")

# --- SAVE ---
joblib.dump(best_model, '../backend/model.pkl')
joblib.dump(tfidf, '../backend/vectorizer.pkl')
print("\nModel and vectorizer saved to backend folder!")
print("Training complete!")