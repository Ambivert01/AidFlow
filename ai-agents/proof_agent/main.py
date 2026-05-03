import os
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from schemas import ProofValidationRequest, ProofValidationResponse, HealthResponse
from logic import ProofValidationAgent

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="AidFlow Proof Validation Agent",
    description="AI agent for validating proof submissions",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize validation agent
agent = ProofValidationAgent()


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="OK",
        service="proof-validation-agent",
        timestamp=datetime.now()
    )


@app.post("/validate", response_model=ProofValidationResponse)
async def validate_proof(request: ProofValidationRequest):
    """
    Validate proof submission
    
    This endpoint performs comprehensive validation including:
    - Duplicate detection
    - OCR validation (for receipts/invoices)
    - Metadata validation (location, timestamp)
    - Fraud pattern detection
    """
    try:
        result = await agent.validate(request.dict())
        return ProofValidationResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("AI_PROOF_PORT", 8004))
    uvicorn.run(app, host="0.0.0.0", port=port)
