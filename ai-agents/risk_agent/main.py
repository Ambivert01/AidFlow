from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


from schemas import RiskRequest, RiskResponse
from logic import calculate_risk

app = FastAPI(title="AidFlow Risk Scoring Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # later you can restrict
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/evaluate", response_model=RiskResponse)
def evaluate(request: RiskRequest):
    return calculate_risk(request)
