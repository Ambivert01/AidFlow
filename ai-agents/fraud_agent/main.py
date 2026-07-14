import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from schemas import FraudRequest, FraudResponse
from logic import detect_fraud

app = FastAPI(title="AidFlow Fraud Detection Agent")

# ADD THIS BLOCK (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:5000").split(","),  # these agents are internal, server-to-server services - should only ever be called by the backend, never directly by a browser
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/detect", response_model=FraudResponse)
def detect(request: FraudRequest):
    return detect_fraud(request)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "fraud_agent"}
