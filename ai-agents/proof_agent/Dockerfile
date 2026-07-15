FROM python:3.11-slim

# pytesseract is a wrapper around the tesseract-ocr binary - it must be
# installed as a system package, pip alone is not enough (see requirements.txt
# comment). Without this, OCR degrades gracefully rather than crashing, but
# receipt amount/vendor verification silently won't work.
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8004
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8004"]
