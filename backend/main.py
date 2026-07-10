from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import re
import string
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from nltk.tokenize import word_tokenize

# Download NLTK resources (first run pe zaroori)
nltk.download('punkt')
nltk.download('punkt_tab')
nltk.download('stopwords')
nltk.download('wordnet')

# Load model and vectorizer
model = joblib.load('model.pkl')
vectorizer = joblib.load('vectorizer.pkl')

# Initialize FastAPI app
app = FastAPI(title="Sentiment Analysis API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
stop_words = set(stopwords.words('english'))
lemmatizer = WordNetLemmatizer()

def clean_text(text):
    text = str(text).lower()
    text = re.sub(r'http\S+|www\S+|https\S+', '', text)
    text = re.sub(r'@\w+', '', text)
    text = re.sub(r'#', '', text)
    text = re.sub(r'\d+', '', text)
    text = text.translate(str.maketrans('', '', string.punctuation))
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def preprocess_text(text):
    tokens = word_tokenize(text)
    tokens = [word for word in tokens if word not in stop_words]
    tokens = [lemmatizer.lemmatize(word) for word in tokens]
    return ' '.join(tokens)


dir
class TextInput(BaseModel):
    text: str


@app.get("/")
def read_root():
    return {"message": "Sentiment Analysis API is running"}


@app.post("/predict")
def predict_sentiment(input: TextInput):
    if not input.text.strip():
        return {"error": "Text cannot be empty"}

    cleaned = clean_text(input.text)
    processed = preprocess_text(cleaned)

    vectorized = vectorizer.transform([processed])
    prediction = model.predict(vectorized)[0]

    probabilities = model.predict_proba(vectorized)[0]
    confidence = max(probabilities)

    return {
        "text": input.text,
        "prediction": prediction,
        "confidence": round(float(confidence), 3)
    }