from pydantic import BaseModel
from typing import List, Dict

class Location(BaseModel):
    ward: str
    lat: float
    lng: float

class Beneficiary(BaseModel):
    id: str
    location: Location
    documents: List[str]
    deviceFingerprint: str
    pastAidCount: int

class Disaster(BaseModel):
    type: str
    affectedWards: List[str]
    severity: float

class EligibilityRequest(BaseModel):
    beneficiary: Beneficiary
    disaster: Disaster

class EligibilityResponse(BaseModel):
    eligible: bool
    confidence: float
    signals: Dict
    reason: str
