from fastapi import FastAPI, Request, HTTPException
from pydantic import BaseModel
import os, pickle
from dotenv import load_dotenv
from utils.downloader import download_document
from utils.extractor import extract_text
from utils.vectorizer import build_vector_store
from utils.qa_engine import ask_gemini

# Load environment
load_dotenv()
HACKRX_TOKEN = os.getenv("HACKRX_TOKEN")

# Load prebuilt indices (if any)
try:
    with open("faiss_indices.pkl", "rb") as f:
        PRELOADED_INDICES = pickle.load(f)
except:
    PRELOADED_INDICES = {}

# FastAPI app
app = FastAPI()

class HackRxRequest(BaseModel):
    documents: str
    questions: list[str]

@app.post("/hackrx/run")
async def hackrx_run(request: Request, data: HackRxRequest):
    # Auth check
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer ") or auth_header.split(" ")[1] != HACKRX_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Get vector store (prebuilt or build on-demand)
    doc_name = os.path.basename(data.documents)
    if doc_name in PRELOADED_INDICES:
        vector_store = PRELOADED_INDICES[doc_name]
    else:
        file_path = download_document(data.documents)
        text = extract_text(file_path)
        vector_store = build_vector_store(text)

    # Answer questions
    answers = []
    for q in data.questions:
        retrieved_docs = vector_store.similarity_search(q, k=3)
        context = "\n".join([doc.page_content for doc in retrieved_docs])
        answer = ask_gemini(context, q)
        answers.append(answer)

    return {"answers": answers}
