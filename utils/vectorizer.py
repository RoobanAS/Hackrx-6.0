import os
import google.generativeai as genai
from langchain_community.vectorstores import FAISS
from langchain_core.embeddings import Embeddings
from langchain_openai import OpenAIEmbeddings


class GeminiEmbeddings(Embeddings):
    def __init__(self, model="models/embedding-001"):
        genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
        self.model = model

    def embed_documents(self, texts):
        return [self._embed(text) for text in texts]

    def embed_query(self, text):
        return self._embed(text)

    def _embed(self, text):
        if not text:
            return [0.0] * 768
        result = genai.embed_content(model=self.model, content=text)
        return result["embedding"]


def build_vector_store(text):
    chunks = [text[i:i + 2000] for i in range(0, len(text), 2000)]
    try:
        embeddings = GeminiEmbeddings()
        vector_store = FAISS.from_texts(chunks, embeddings)
        print("Using Gemini embeddings")
    except Exception as e:
        print("Gemini failed, fallback to OpenAI:", e)
        embeddings = OpenAIEmbeddings(model="text-embedding-3-small", openai_api_key=os.getenv("OPENAI_API_KEY"))
        vector_store = FAISS.from_texts(chunks, embeddings)

    return vector_store
