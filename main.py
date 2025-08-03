from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
from utils.extractor import extract_text
from utils.vectorizer import build_vector_store
import os
import requests
import google.generativeai as genai
import json

# Initialize FastAPI app
app = FastAPI()

# Load HackRx token
HACKRX_TOKEN = os.getenv("HACKRX_TOKEN")

# Configure Gemini
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

        # 4. Prepare context for each question
        contexts = []
        for q in data.questions:
            retrieved_docs = vector_store.similarity_search(q, k=2)  # fewer chunks to save tokens
            context = "\n".join([f"Clause: {doc.page_content}" for doc in retrieved_docs])
            contexts.append(f"Question: {q}\nContext:\n{context}\n")

        # 5. Combine all questions in one prompt
        combined_prompt = (
            "You are an expert insurance assistant. Use ONLY the clauses below to answer each question. "
            "Give concise answers and explicitly cite relevant clause numbers for justification. "
            "Respond strictly in valid JSON format: a list of objects, each with 'question' and 'answer' keys.\n\n"
            + "\n\n".join(contexts)
            + "\nReturn only the JSON array, no extra text."
        )

        # 6. Call Gemini (Pro → fallback to Flash)
        try:
            model = genai.GenerativeModel("models/gemini-1.5-pro")
            resp = model.generate_content(combined_prompt)
        except Exception as e:
            if "429" in str(e):  # Quota exceeded → fallback
                model = genai.GenerativeModel("models/gemini-1.5-flash")
                resp = model.generate_content(combined_prompt)
            else:
                raise

        # 7. Clean Gemini output and parse JSON
        clean_output = resp.text.strip()

        # Remove markdown code fences if present
        if clean_output.startswith("```"):
            clean_output = clean_output.strip("`").replace("json", "", 1).strip()

        try:
            answers_json = json.loads(clean_output)

            # Validate structure (list of objects with question+answer)
            if not isinstance(answers_json, list):
                raise ValueError("Output is not a JSON array")

            for item in answers_json:
                if not isinstance(item, dict) or "question" not in item or "answer" not in item:
                    raise ValueError("Invalid JSON format: Missing 'question' or 'answer'")

            return {"answers": answers_json}

        except Exception:
            # If parsing fails, fallback to returning raw text
            return {"answers": resp.text.strip()}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Error: {str(e)}")
