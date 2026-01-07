from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from schemas import FraudRequest, FraudResponse
from logic import detect_fraud

app = FastAPI(title="AidFlow Fraud Detection Agent")

# ADD THIS BLOCK (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # later you can restrict
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/detect", response_model=FraudResponse)
def detect(request: FraudRequest):
    return detect_fraud(request)
