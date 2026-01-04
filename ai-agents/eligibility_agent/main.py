from fastapi import FastAPI
from schemas import EligibilityRequest, EligibilityResponse
from logic import check_eligibility

app = FastAPI(title="AidFlow Eligibility Agent")

@app.post("/check", response_model=EligibilityResponse)
def check(request: EligibilityRequest):
    return check_eligibility(request)
