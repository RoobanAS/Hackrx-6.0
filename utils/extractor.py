import fitz  # PyMuPDF
from docx import Document

def extract_text(file_path):
    """
    Extracts text from PDF or DOCX file.
    """
    if file_path.endswith(".pdf"):
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text()
        return text

    elif file_path.endswith(".docx"):
        doc = Document(file_path)
        return "\n".join([para.text for para in doc.paragraphs])

    else:
        raise ValueError("Unsupported file format. Use PDF or DOCX.")
