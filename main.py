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


# Health check
@app.get("/")
def health_check():
    return {"status": "running", "message": "HackRx LLM API with Gemini"}


# Main endpoint (supports both formats)
@app.post("/hackrx/run")
@app.post("/api/v1/hackrx/run")
async def hackrx_run(data: HackRxRequest, authorization: str = Header(None)):
    # Token validation
    if authorization != f"Bearer {HACKRX_TOKEN}":
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        # 1. Download PDF
        response = requests.get(data.documents)
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to download document")

        file_path = "temp.pdf"
        with open(file_path, "wb") as f:
            f.write(response.content)

        # 2. Extract text
        text = extract_text(file_path)

        # 3. Build FAISS vector store using Gemini embeddings
        vector_store = build_vector_store(text)

        # 4. Answer each question using retrieved context
        answers = []
        for q in data.questions:
            retrieved_docs = vector_store.similarity_search(q, k=3)
            context = "\n".join([doc.page_content for doc in retrieved_docs])

            model = genai.GenerativeModel("gemini-pro")
            prompt = f"Answer the question based only on the context:\n{context}\n\nQuestion: {q}\nAnswer clearly and concisely."
            resp = model.generate_content(prompt)
            answers.append(resp.text.strip())

        return {"answers": answers}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Error: {str(e)}")
