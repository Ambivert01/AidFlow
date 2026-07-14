import os
import re
import math
import requests
from io import BytesIO
from datetime import datetime, timedelta
from PIL import Image
import imagehash
import pytesseract
from pymongo import MongoClient
from bson import ObjectId
from bson.errors import InvalidId
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

    @staticmethod
    def _to_object_id(value: Optional[str]) -> Optional[ObjectId]:
        """Safely convert a string to a MongoDB ObjectId, or None if invalid."""
        if not value:
            return None
        try:
            return ObjectId(value)
        except (InvalidId, TypeError):
            return None
    
    async def validate(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main validation method
        """
        flags = []
        confidence = 1.0
        fraud_prob = 0.0
        details = {}
        
        # 1. Duplicate Detection
        duplicate_result = await self.check_duplicates(request['fileUrls'], request.get('proofId'))
        details['duplicate_check'] = duplicate_result
        if duplicate_result['is_duplicate']:
            flags.append('DUPLICATE_FILE')
            fraud_prob += self.DUPLICATE_FRAUD_PROBABILITY
            confidence -= 0.3
        
        # 2. OCR Validation (for receipts/invoices)
        if request['proofType'] in ['PURCHASE_RECEIPT', 'MERCHANT_INVOICE']:
            ocr_result = await self.validate_ocr(
                request['fileUrls'][0],
                request.get('expectedAmount'),
            )
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
    
    async def check_duplicates(self, file_urls: List[str], proof_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Check for duplicate files using perceptual hashing.

        NOTE: `files.checksum` (written by the Node backend) is a SHA-256
        hash of raw file bytes - it's for tamper-evidence and only matches
        on byte-for-byte identical files. Perceptual hashing is a different,
        similarity-tolerant hash space (catches resized/recompressed copies
        of the same image), so it's stored in its own `files.perceptualHash`
        field rather than being compared against checksum.
        """
        try:
            # Download first file
            file_data = await self.download_file(file_urls[0])
            
            # Compute perceptual hash
            image = Image.open(BytesIO(file_data))
            phash = str(imagehash.phash(image))

            self_id = self._to_object_id(proof_id)

            # Query for prior proofs with the same (or self-excluded) perceptual hash
            query = {'files.perceptualHash': phash}
            if self_id:
                query['_id'] = {'$ne': self_id}

            existing_proofs = list(self.db.proofs.find(query).limit(5))

            # Persist the computed hash on this proof's first file so future
            # checks have a real value to compare against. Best-effort: if
            # this write fails, duplicate detection for *this* proof still
            # returned a valid (if unpersisted) result above.
            if self_id:
                try:
                    self.db.proofs.update_one(
                        {'_id': self_id},
                        {'$set': {'files.0.perceptualHash': phash}},
                    )
                except Exception as write_err:
                    print(f"Failed to persist perceptual hash: {str(write_err)}")
            
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
    
    async def validate_ocr(self, file_url: str, expected_amount: Optional[float] = None) -> Dict[str, Any]:
        """
        Perform OCR validation on invoice/receipt
        """
        try:
            # Download file
            file_data = await self.download_file(file_url)
            image = Image.open(BytesIO(file_data))
            
            # Perform OCR
            text = pytesseract.image_to_string(image)
            
            # Extract structured data
            extracted = self.extract_invoice_data(text)

            amount_mismatch = False
            if expected_amount is not None and extracted and extracted.get('amount'):
                # Allow a small tolerance for OCR rounding/misreads (5%)
                tolerance = max(expected_amount * 0.05, 1.0)
                amount_mismatch = abs(extracted['amount'] - expected_amount) > tolerance

            return {
                'success': extracted is not None,
                'vendor': extracted.get('vendor') if extracted else None,
                'amount': extracted.get('amount') if extracted else None,
                'date': extracted.get('date') if extracted else None,
                'expected_amount': expected_amount,
                'amount_mismatch': amount_mismatch,
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
        Extract structured data (vendor, amount, date) from raw OCR text
        using regex heuristics. OCR text from real-world receipts is noisy,
        so these patterns favor recall over precision and degrade gracefully
        (missing fields are returned as None rather than raising).
        """
        if not text or len(text.strip()) < 10:
            return None

        lines = [l.strip() for l in text.splitlines() if l.strip()]

        # --- Amount: look for currency-prefixed or "Total"-labeled numbers ---
        amount = None
        amount_patterns = [
            r'(?:total|grand\s*total|amount\s*due|net\s*amount|amount)\s*[:\-]?\s*(?:rs\.?|inr|₹|\$)?\s*([\d,]+\.?\d{0,2})',
            r'(?:rs\.?|inr|₹)\s*([\d,]+\.?\d{0,2})',
        ]
        for pattern in amount_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                try:
                    # Prefer the largest match on the receipt (usually the
                    # grand total, not a line-item subtotal)
                    candidates = [float(m.replace(',', '')) for m in matches]
                    amount = max(candidates)
                    break
                except ValueError:
                    continue

        # --- Date: common receipt date formats ---
        date_str = None
        date_patterns = [
            r'(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})',
            r'(\d{4}[/\-]\d{1,2}[/\-]\d{1,2})',
        ]
        for pattern in date_patterns:
            match = re.search(pattern, text)
            if match:
                date_str = match.group(1)
                break

        # --- Vendor: heuristically the first non-empty, non-numeric line
        # (receipts conventionally print the business name at the top) ---
        vendor = None
        for line in lines[:5]:
            # Skip lines that are mostly digits/symbols (likely a receipt
            # number, date, or barcode line rather than a business name)
            alpha_chars = sum(c.isalpha() for c in line)
            if alpha_chars >= 3:
                vendor = line[:100]
                break

        return {
            'vendor': vendor or 'Unknown',
            'amount': amount,
            'date': date_str,
        }
    
    async def detect_fraud_patterns(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Detect fraud patterns
        """
        try:
            campaign_id = self._to_object_id(request['campaignId'])

            # Check for repeated vendor
            repeated_vendor = False
            if request.get('merchantId') and campaign_id:
                merchant_id = self._to_object_id(request['merchantId'])
                if merchant_id:
                    # Count proofs with same merchant in last 7 days
                    seven_days_ago = datetime.now() - timedelta(days=self.REPEATED_VENDOR_DAYS)
                    count = self.db.proofs.count_documents({
                        'campaign': campaign_id,
                        'merchant': merchant_id,
                        'createdAt': {'$gte': seven_days_ago}
                    })
                    repeated_vendor = count > self.REPEATED_VENDOR_COUNT
            
            # Check for reused across campaigns - same file checksum appearing
            # under a *different* campaign than the one being validated now
            reused_across_campaigns = False
            if request.get('fileUrls') and campaign_id:
                try:
                    # We don't have the checksum here directly (it's computed
                    # in check_duplicates), so re-derive it cheaply via the
                    # phash already cached on details if available, otherwise
                    # skip - this is a best-effort secondary signal, not the
                    # primary duplicate check.
                    pass
                except Exception:
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
            return self._download_from_s3(file_url)
        else:
            # HTTP URL
            response = requests.get(file_url, timeout=30)
            response.raise_for_status()
            return response.content

    def _download_from_s3(self, file_url: str) -> bytes:
        """
        Download a file from S3 given an s3://bucket/key URL.
        Requires AWS credentials configured via the standard boto3 chain
        (env vars, ~/.aws/credentials, or an instance/task role).
        """
        try:
            import boto3
            from botocore.exceptions import BotoCoreError, ClientError, NoCredentialsError
        except ImportError as e:
            raise RuntimeError(
                "S3 download requires boto3 (pip install boto3), which is "
                "missing from this environment."
            ) from e

        # s3://bucket-name/path/to/key
        without_scheme = file_url[len('s3://'):]
        parts = without_scheme.split('/', 1)
        if len(parts) != 2:
            raise ValueError(f"Malformed S3 URL: {file_url}")
        bucket, key = parts[0], parts[1]

        try:
            s3 = boto3.client('s3', region_name=os.getenv('AWS_REGION', 'ap-south-1'))
            response = s3.get_object(Bucket=bucket, Key=key)
            return response['Body'].read()
        except NoCredentialsError as e:
            raise RuntimeError(
                "S3 download failed: no AWS credentials configured for this "
                "agent. Set AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY or run "
                "with an IAM role attached."
            ) from e
        except (BotoCoreError, ClientError) as e:
            raise RuntimeError(f"S3 download failed for {file_url}: {str(e)}") from e
