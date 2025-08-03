import google.generativeai as genai
from dotenv import load_dotenv
import os

# Load environment and configure Gemini
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("GOOGLE_API_KEY not found in environment.")
genai.configure(api_key=api_key)

def ask_gemini(context, question):
    """
    Ask Gemini Pro to answer based on retrieved context.
    """
    prompt = f"""
You are an expert in analyzing policy documents.
Answer the question based only on the context provided.
Cite clause or page number if available.
If not found, say "Not specified in the document."

Context:
{context}

Question:
{question}
"""
    response = genai.GenerativeModel("gemini-pro").generate_content(prompt)
    return response.text.strip()
