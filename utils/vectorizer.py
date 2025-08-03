from langchain_community.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter
import google.generativeai as genai
from dotenv import load_dotenv
import os

# Load environment and configure Gemini
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("GOOGLE_API_KEY not found in environment.")
genai.configure(api_key=api_key)

def get_gemini_embeddings(texts):
    """
    Generate embeddings for a list of texts using Gemini embedding model.
    """
    model = "models/embedding-001"
    embeddings = []
    for text in texts:
        result = genai.embed_content(model=model, content=text)
        embeddings.append(result['embedding'])
    return embeddings

class GeminiEmbeddings:
    """Wrapper class for FAISS compatibility"""
    def embed_documents(self, texts):
        return get_gemini_embeddings(texts)

    def embed_query(self, text):
        return get_gemini_embeddings([text])[0]

def build_vector_store(text):
    """
    Split text into chunks and store in FAISS using Gemini embeddings.
    """
    splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=100)
    chunks = splitter.split_text(text)
    vector_store = FAISS.from_texts(chunks, GeminiEmbeddings())
    return vector_store
