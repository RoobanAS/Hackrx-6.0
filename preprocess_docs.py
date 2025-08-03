import os
import pickle
from dotenv import load_dotenv
from utils.extractor import extract_text
from utils.vectorizer import build_vector_store

load_dotenv()

DATA_DIR = "data"
SAMPLE_DOCS = [os.path.join(DATA_DIR, f) for f in os.listdir(DATA_DIR) if f.endswith(".pdf")]

def preprocess_all():
    indices = {}
    for doc in SAMPLE_DOCS:
        print(f"Processing {doc}...")
        text = extract_text(doc)
        vector_store = build_vector_store(text)
        indices[os.path.basename(doc)] = vector_store
    with open("faiss_indices.pkl", "wb") as f:
        pickle.dump(indices, f)
    print("Preprocessing complete. Indices saved.")

if __name__ == "__main__":
    preprocess_all()
