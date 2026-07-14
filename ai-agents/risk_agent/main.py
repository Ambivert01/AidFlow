import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


from schemas import RiskRequest, RiskResponse
from logic import calculate_risk

app = FastAPI(title="AidFlow Risk Scoring Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:5000").split(","),  # these agents are internal, server-to-server services - should only ever be called by the backend, never directly by a browser
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/evaluate", response_model=RiskResponse)
def evaluate(request: RiskRequest):
    return calculate_risk(request)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "risk_agent"}
