from pydantic import BaseModel

class EligibilityInput(BaseModel):
    eligible: bool
    confidence: float

class FraudInput(BaseModel):
    fraudRisk: str
    riskScore: float

class PolicyInput(BaseModel):
    maxAllowedRisk: float
    minEligibilityConfidence: float

class RiskRequest(BaseModel):
    eligibility: EligibilityInput
    fraud: FraudInput
    policy: PolicyInput

class RiskResponse(BaseModel):
    finalRiskScore: int
    decision: str
    reason: str
