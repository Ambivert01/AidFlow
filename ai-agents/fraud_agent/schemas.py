from pydantic import BaseModel
from typing import List

class FraudRequest(BaseModel):
    beneficiaryId: str
    walletId: str
    deviceFingerprint: str
    location: str
    recentTransactions: int
    totalAidReceived: float
    merchantId: str
    timeWindowHours: int

class FraudResponse(BaseModel):
    fraudRisk: str
    riskScore: float
    flags: List[str]
    explanation: str
