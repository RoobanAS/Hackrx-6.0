import fitz  # PyMuPDF

def extract_text(file_path):
    """
    Extract text from PDF using PyMuPDF.
    """
    text = ""
    with fitz.open(file_path) as doc:
        for page in doc:
            text += page.get_text("text")
    return text
