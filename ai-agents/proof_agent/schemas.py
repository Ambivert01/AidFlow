from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime


class ProofValidationRequest(BaseModel):
    """Request schema for proof validation"""
    proofId: str
    fileUrls: List[str]
    proofType: str
    campaignId: str
    location: Optional[Dict[str, float]] = None
    capturedAt: Optional[datetime] = None
    campaignLocation: Optional[Dict[str, Any]] = None
    campaignPeriod: Dict[str, datetime]


class ProofValidationResponse(BaseModel):
    """Response schema for proof validation"""
    decision: Literal['VERIFIED', 'REJECTED', 'FLAGGED']
    confidenceScore: float  # 0-1
    fraudProbability: float  # 0-1
    flags: List[str]
    details: Dict[str, Any]


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    timestamp: datetime
