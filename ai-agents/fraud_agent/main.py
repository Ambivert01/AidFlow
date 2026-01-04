from fastapi import FastAPI
from schemas import FraudRequest, FraudResponse
from logic import detect_fraud

app = FastAPI(title="AidFlow Fraud Detection Agent")

@app.post("/detect", response_model=FraudResponse)
def detect(request: FraudRequest):
    return detect_fraud(request)
