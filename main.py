from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
from utils.extractor import extract_text
from utils.vectorizer import build_vector_store
import os
import requests
import google.generativeai as genai

# FastAPI app
app = FastAPI()

# Load tokens
HACKRX_TOKEN = os.getenv("HACKRX_TOKEN")
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Request model
class HackRxRequest(BaseModel):
    documents: str
    questions: list[str]


@app.get("/")
def health_check():
    return {"status": "running", "message": "HackRx LLM API with Gemini (Pro+Flash Fallback)"}


@app.post("/hackrx/run")
@app.post("/api/v1/hackrx/run")
async def hackrx_run(data: HackRxRequest, authorization: str = Header(None)):
    # Validate token
    if authorization != f"Bearer {HACKRX_TOKEN}":
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        # 1. Download document
        response = requests.get(data.documents)
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to download document")

        file_path = "temp.pdf"
        with open(file_path, "wb") as f:
            f.write(response.content)

        # 2. Extract text
        text = extract_text(file_path)

        # 3. Build FAISS vector store with Gemini embeddings
        vector_store = build_vector_store(text)

        # 4. Retrieve context for all questions
        contexts = []
        for q in data.questions:
            retrieved_docs = vector_store.similarity_search(q, k=2)  # fewer chunks to save quota
            context = "\n".join([f"Clause: {doc.page_content}" for doc in retrieved_docs])
            contexts.append(f"Question: {q}\nContext:\n{context}\n")

        # 5. Combine questions into one prompt (reduce API calls)
        combined_prompt = (
            "You are an expert insurance assistant. Use ONLY the provided clauses to answer. "
            "Give concise answers and reference clauses clearly.\n\n"
            + "\n\n".join(contexts)
            + "\nProvide answers in JSON list format corresponding to each question."
        )

        # 6. Generate answer with Pro, fallback to Flash if quota exceeded
        try:
            model = genai.GenerativeModel("models/gemini-1.5-pro")
            resp = model.generate_content(combined_prompt)
        except Exception as e:
            if "429" in str(e):  # fallback to Flash
                model = genai.GenerativeModel("models/gemini-1.5-flash")
                resp = model.generate_content(combined_prompt)
            else:
                raise

        return {"answers": resp.text.strip()}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Error: {str(e)}")
