from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


from schemas import EligibilityRequest, EligibilityResponse
from logic import check_eligibility

app = FastAPI(title="AidFlow Eligibility Agent")

# ADD THIS BLOCK (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # later you can restrict
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/check", response_model=EligibilityResponse)
def check(request: EligibilityRequest):
    return check_eligibility(request)
