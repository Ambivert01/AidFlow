import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


from schemas import EligibilityRequest, EligibilityResponse
from logic import check_eligibility

app = FastAPI(title="AidFlow Eligibility Agent")

# ADD THIS BLOCK (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:5000").split(","),  # these agents are internal, server-to-server services - should only ever be called by the backend, never directly by a browser
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/check", response_model=EligibilityResponse)
def check(request: EligibilityRequest):
    return check_eligibility(request)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "eligibility_agent"}
