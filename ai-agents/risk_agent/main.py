from fastapi import FastAPI
from schemas import RiskRequest, RiskResponse
from logic import calculate_risk

app = FastAPI(title="AidFlow Risk Scoring Agent")

@app.post("/evaluate", response_model=RiskResponse)
def evaluate(request: RiskRequest):
    return calculate_risk(request)
