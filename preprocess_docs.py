from utils.extractor import extract_text
from utils.vectorizer import build_vector_store
import os

DATA_FOLDER = "data"

def preprocess_all():
    for file_name in os.listdir(DATA_FOLDER):
        if file_name.endswith(".pdf"):
            file_path = os.path.join(DATA_FOLDER, file_name)
            print(f"Processing {file_path}...")
            text = extract_text(file_path)
            build_vector_store(text)

if __name__ == "__main__":
    preprocess_all()
