import os
import math
import requests
from io import BytesIO
from datetime import datetime, timedelta
from PIL import Image
import imagehash
import pytesseract
from pymongo import MongoClient
from typing import Dict, List, Any, Optional


class ProofValidationAgent:
    """AI agent for proof validation"""
    
    def __init__(self):
        # MongoDB connection for duplicate detection and fraud pattern analysis
        mongo_uri = os.getenv('MONGO_URI', 'mongodb://127.0.0.1:27017/aidflow')
        self.mongo_client = MongoClient(mongo_uri)
        self.db = self.mongo_client.get_database()
        
        # Thresholds
        self.VERIFIED_CONFIDENCE = 0.8
        self.VERIFIED_FRAUD_MAX = 0.3
        self.REJECTED_FRAUD_MIN = 0.6
        self.DUPLICATE_FRAUD_PROBABILITY = 0.7
        self.REPEATED_VENDOR_COUNT = 5
        self.REPEATED_VENDOR_DAYS = 7
        self.LOCATION_MISMATCH_KM = 50
        self.OCR_CONFIDENCE_PENALTY = 0.2
        self.FRAUD_FLAG_THRESHOLD = 2
        self.FRAUD_FLAG_PROBABILITY = 0.6
    
    async def validate(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main validation method
        """
        flags = []
        confidence = 1.0
        fraud_prob = 0.0
        details = {}
        
        # 1. Duplicate Detection
        duplicate_result = await self.check_duplicates(request['fileUrls'])
        details['duplicate_check'] = duplicate_result
        if duplicate_result['is_duplicate']:
            flags.append('DUPLICATE_FILE')
            fraud_prob += self.DUPLICATE_FRAUD_PROBABILITY
            confidence -= 0.3
        
        # 2. OCR Validation (for receipts/invoices)
        if request['proofType'] in ['PURCHASE_RECEIPT', 'MERCHANT_INVOICE']:
            ocr_result = await self.validate_ocr(request['fileUrls'][0])
            details['ocr_result'] = ocr_result
            if not ocr_result['success']:
                flags.append('OCR_FAILED')
                confidence -= self.OCR_CONFIDENCE_PENALTY
            elif ocr_result.get('amount_mismatch'):
                flags.append('AMOUNT_MISMATCH')
                fraud_prob += 0.4
        
        # 3. Metadata Validation
        if request.get('location') and request.get('campaignLocation'):
            distance = self.calculate_distance(
                request['location'],
                request['campaignLocation']
            )
            details['distance_km'] = distance
            if distance > self.LOCATION_MISMATCH_KM:
                flags.append('LOCATION_MISMATCH')
                fraud_prob += 0.3
        
        if request.get('capturedAt'):
            captured_at = request['capturedAt']
            if isinstance(captured_at, str):
                captured_at = datetime.fromisoformat(captured_at.replace('Z', '+00:00'))
            
            if captured_at > datetime.now():
                flags.append('INVALID_TIMESTAMP')
                fraud_prob += 0.5
            elif not self.is_within_campaign_period(
                captured_at,
                request['campaignPeriod']
            ):
                flags.append('TIMESTAMP_OUT_OF_RANGE')
                fraud_prob += 0.2
        
        # 4. Fraud Pattern Detection
        pattern_result = await self.detect_fraud_patterns(request)
        details['pattern_result'] = pattern_result
        if pattern_result.get('repeated_vendor'):
            flags.append('REPEATED_VENDOR')
            fraud_prob += 0.2
        if pattern_result.get('reused_across_campaigns'):
            flags.append('REUSED_ACROSS_CAMPAIGNS')
            fraud_prob += 0.4
        
        # 5. Make decision
        if confidence > self.VERIFIED_CONFIDENCE and fraud_prob < self.VERIFIED_FRAUD_MAX:
            decision = 'VERIFIED'
        elif fraud_prob > self.REJECTED_FRAUD_MIN:
            decision = 'REJECTED'
        else:
            decision = 'FLAGGED'
        
        return {
            'decision': decision,
            'confidenceScore': max(0, min(1, confidence)),
            'fraudProbability': max(0, min(1, fraud_prob)),
            'flags': flags,
            'details': details
        }
    
    async def check_duplicates(self, file_urls: List[str]) -> Dict[str, Any]:
        """
        Check for duplicate files using perceptual hashing
        """
        try:
            # Download first file
            file_data = await self.download_file(file_urls[0])
            
            # Compute perceptual hash
            image = Image.open(BytesIO(file_data))
            phash = str(imagehash.phash(image))
            
            # Query database for similar hashes
            # In a real implementation, this would query MongoDB for similar hashes
            # For now, we'll do a simple exact match
            existing_proofs = list(self.db.proofs.find({
                'files.checksum': phash
            }).limit(5))
            
            return {
                'is_duplicate': len(existing_proofs) > 0,
                'original_proof_ids': [str(p['_id']) for p in existing_proofs],
                'hash': phash
            }
        except Exception as e:
            print(f"Duplicate check error: {str(e)}")
            return {
                'is_duplicate': False,
                'original_proof_ids': [],
                'hash': None,
                'error': str(e)
            }
    
    async def validate_ocr(self, file_url: str) -> Dict[str, Any]:
        """
        Perform OCR validation on invoice/receipt
        """
        try:
            # Download file
            file_data = await self.download_file(file_url)
            image = Image.open(BytesIO(file_data))
            
            # Perform OCR
            text = pytesseract.image_to_string(image)
            
            # Extract structured data (simplified)
            extracted = self.extract_invoice_data(text)
            
            return {
                'success': extracted is not None,
                'vendor': extracted.get('vendor') if extracted else None,
                'amount': extracted.get('amount') if extracted else None,
                'date': extracted.get('date') if extracted else None,
                'amount_mismatch': False,  # Would compare with transaction amount
                'text': text[:500]  # First 500 chars
            }
        except Exception as e:
            print(f"OCR validation error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def extract_invoice_data(self, text: str) -> Optional[Dict[str, Any]]:
        """
        Extract structured data from OCR text (simplified)
        """
        if not text or len(text) < 10:
            return None
        
        # Simplified extraction - in production, use regex or NLP
        return {
            'vendor': 'Unknown',
            'amount': 0.0,
            'date': None
        }
    
    async def detect_fraud_patterns(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Detect fraud patterns
        """
        try:
            campaign_id = request['campaignId']
            
            # Check for repeated vendor
            repeated_vendor = False
            if request.get('merchantId'):
                # Count proofs with same merchant in last 7 days
                seven_days_ago = datetime.now() - timedelta(days=self.REPEATED_VENDOR_DAYS)
                count = self.db.proofs.count_documents({
                    'campaign': campaign_id,
                    'merchant': request['merchantId'],
                    'createdAt': {'$gte': seven_days_ago}
                })
                repeated_vendor = count > self.REPEATED_VENDOR_COUNT
            
            # Check for reused across campaigns
            reused_across_campaigns = False
            if request.get('fileUrls'):
                # This would check if same file hash appears in multiple campaigns
                # Simplified for now
                reused_across_campaigns = False
            
            return {
                'repeated_vendor': repeated_vendor,
                'reused_across_campaigns': reused_across_campaigns
            }
        except Exception as e:
            print(f"Fraud pattern detection error: {str(e)}")
            return {
                'repeated_vendor': False,
                'reused_across_campaigns': False,
                'error': str(e)
            }
    
    def calculate_distance(self, loc1: Dict[str, float], loc2: Dict[str, float]) -> float:
        """
        Calculate distance between two coordinates using Haversine formula
        Returns distance in kilometers
        """
        lat1 = loc1.get('lat', 0)
        lng1 = loc1.get('lng', 0)
        lat2 = loc2.get('lat', 0)
        lng2 = loc2.get('lng', 0)
        
        # Haversine formula
        R = 6371  # Earth's radius in km
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lng = math.radians(lng2 - lng1)
        
        a = (math.sin(delta_lat / 2) ** 2 +
             math.cos(lat1_rad) * math.cos(lat2_rad) *
             math.sin(delta_lng / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        distance = R * c
        return distance
    
    def is_within_campaign_period(self, timestamp: datetime, campaign_period: Dict[str, Any]) -> bool:
        """
        Check if timestamp is within campaign period
        """
        start_date = campaign_period.get('startDate')
        end_date = campaign_period.get('endDate')
        
        if isinstance(start_date, str):
            start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        if isinstance(end_date, str):
            end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        
        return start_date <= timestamp <= end_date
    
    async def download_file(self, file_url: str) -> bytes:
        """
        Download file from URL
        """
        # Handle local file URLs
        if file_url.startswith('/uploads/'):
            # Local file - read from filesystem
            file_path = os.path.join('../backend', file_url.lstrip('/'))
            with open(file_path, 'rb') as f:
                return f.read()
        elif file_url.startswith('s3://'):
            # S3 file - would use boto3 in production
            raise NotImplementedError('S3 download not implemented')
        else:
            # HTTP URL
            response = requests.get(file_url, timeout=30)
            response.raise_for_status()
            return response.content
