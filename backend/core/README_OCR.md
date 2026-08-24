# resume_ocr.py — Setup & Usage

## System dependency (required, not pip-installable)
Tesseract OCR engine must be installed on the machine:

- **Ubuntu/Debian:** `sudo apt install tesseract-ocr poppler-utils`
- **macOS:** `brew install tesseract poppler`
- **Windows:** Install tesseract from
  https://github.com/UB-Mannheim/tesseract/wiki
  and poppler from https://github.com/oschwartz10612/poppler-windows
  Add both to your system PATH.

## Python dependencies
```
pip install -r requirements_ocr.txt
```

## Drop-in location
Copy `resume_ocr.py` into `backend/core/resume_ocr.py` in your SkillSync repo.

## Usage from FastAPI route
```python
from backend.core.resume_ocr import extract_resume_text

@router.post("/recommend/resume-upload")
async def recommend_from_upload(file: UploadFile):
    file_bytes = await file.read()
    result = extract_resume_text(file.filename, file_bytes)

    if result.method == "failed":
        raise HTTPException(400, detail=result.warnings)

    if result.is_low_confidence:
        # surface this to the frontend — don't treat OCR text as ground truth
        ...

    # result.text now feeds into your existing skill extractor /
    # GitHub URL regex, same as the pdfplumber-only path did before
    skills = extract_skills(result.text)
    ...
```

## CLI test
```
python backend/core/resume_ocr.py path/to/resume.pdf
python backend/core/resume_ocr.py path/to/resume_photo.jpg
```

## Behavior summary
- Digital PDF (has real text)  -> pdfplumber only, fast, no OCR run at all
- Scanned PDF (image pages)    -> pdfplumber per-page, OCR fallback only on empty pages
- Photo (jpg/png/etc)          -> OCR only, via pytesseract + Pillow
- Every result includes `is_low_confidence` — check this before trusting
  extracted GitHub URLs / skills as auto-filled without letting the user
  review/edit them first.
