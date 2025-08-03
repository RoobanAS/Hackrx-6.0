from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
from utils.extractor import extract_text
from utils.vectorizer import build_vector_store
import os
import requests
import google.generativeai as genai

# FastAPI app
app = FastAPI()

# Load HackRx token
HACKRX_TOKEN = os.getenv("HACKRX_TOKEN")

# Configure Gemini
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Request model
class HackRxRequest(BaseModel):
    documents: str
    questions: list[str]


# Health check endpoint
@app.get("/")
def health_check():
    return {"status": "running", "message": "HackRx LLM API with Gemini 1.5 Pro"}


# Main endpoint (supports both /hackrx/run and /api/v1/hackrx/run)
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

        # 2. Extract text from PDF
        text = extract_text(file_path)

        # 3. Build FAISS vector store with Gemini embeddings
        vector_store = build_vector_store(text)

        # 4. Answer questions
        answers = []
        for q in data.questions:
            # Retrieve top 3 relevant chunks
            retrieved_docs = vector_store.similarity_search(q, k=3)
            context = "\n\n".join([f"Clause: {doc.page_content}" for doc in retrieved_docs])

            # Use Gemini 1.5 Pro for answering
            model = genai.GenerativeModel("models/gemini-1.5-pro")

            # Prompt with clause referencing
            prompt = (
                f"You are an expert insurance policy assistant. "
                f"Use only the clauses below to answer. "
                f"Provide a concise answer and cite relevant clause(s) for justification.\n\n"
                f"Context:\n{context}\n\n"
                f"Question: {q}\n\n"
                f"Answer (with clause reference):"
            )

            resp = model.generate_content(prompt)
            answers.append(resp.text.strip())

        return {"answers": answers}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Error: {str(e)}")
