"""
Optional OCR fallback.

Standard LinkedIn "Save to PDF" exports contain real selectable text, so
linkedin_scorer.py's PyMuPDF-based extractor is sufficient 99% of the time
and is faster + more accurate than OCR.

Use this fallback ONLY if extract_spans() in linkedin_scorer.py returns an
empty list (which happens if the user uploads a scanned image or a
screenshot printed to PDF instead of a real LinkedIn export).

Requires:
    pip install pytesseract pymupdf pillow
    + the `tesseract` binary installed on the host system
      (apt-get install tesseract-ocr / brew install tesseract)
"""

import pymupdf as fitz
import pytesseract
from PIL import Image
import io


def ocr_pdf_to_text(pdf_path: str, dpi: int = 300) -> str:
    """Rasterize each page and run Tesseract OCR on it."""
    doc = fitz.open(pdf_path)
    full_text = []
    zoom = dpi / 72
    matrix = fitz.Matrix(zoom, zoom)

    for page in doc:
        pix = page.get_pixmap(matrix=matrix)
        img = Image.open(io.BytesIO(pix.tobytes("png")))
        text = pytesseract.image_to_string(img)
        full_text.append(text)

    doc.close()
    return "\n".join(full_text)


def is_pdf_text_extractable(pdf_path: str) -> bool:
    """Quick check: does this PDF have real embedded text at all?"""
    doc = fitz.open(pdf_path)
    has_text = any(page.get_text().strip() for page in doc)
    doc.close()
    return has_text


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python ocr_fallback.py <path_to_pdf>")
        sys.exit(1)

    path = sys.argv[1]
    if is_pdf_text_extractable(path):
        print("This PDF already has extractable text — use linkedin_scorer.py directly, no OCR needed.")
    else:
        print("No embedded text found — running OCR fallback...")
        print(ocr_pdf_to_text(path))
