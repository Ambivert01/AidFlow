from pydantic import BaseModel
from typing import List, Optional


class BeneficiaryLocation(BaseModel):
    ward: str = ""


class BeneficiaryData(BaseModel):
    location: BeneficiaryLocation
    documents: List[str] = []
    pastAidCount: int = 0
    familySize: int = 1
    vulnerabilityScore: float = 0.0  # 0-100
    displacementStatus: str = "UNKNOWN"  # DISPLACED | PARTIAL | STABLE | UNKNOWN


class DisasterData(BaseModel):
    type: str
    affectedWards: List[str] = []
    severity: float = 1.0  # 0-3 scale (1=moderate, 2=severe, 3=catastrophic)


class EligibilityRequest(BaseModel):
    beneficiary: BeneficiaryData
    disaster: DisasterData


class EligibilityResponse(BaseModel):
    eligible: bool
    confidence: float
    signals: dict
    reason: str
    xai_explanation: Optional[dict] = None
