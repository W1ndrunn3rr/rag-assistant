from dotenv import load_dotenv
import os
from fastapi import FastAPI, File, UploadFile
import uvicorn
import io
from PyPDF2 import PdfReader
from model.rag import RAG
from model.vector_store import VectorStore


OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")

rag = None
vc = None
app = FastAPI()


@app.on_event("startup")
def init():
    global vc, rag
    load_dotenv()
    print(DEEPSEEK_API_KEY)
    vc = VectorStore(api_key=OPENAI_API_KEY)
    rag = RAG(api=DEEPSEEK_API_KEY, vector_store=vc)


@app.get("/")
async def root():
    return {"root": "root"}


@app.post("/invoke")
async def invoke(message: str):
    rag_answer = rag.invoke(message, "123")
    return rag_answer


@app.post("/upload")
async def upload_pdf(pdf: UploadFile = File(...)):
    pdf_text: str = ""
    if not pdf.filename.endswith(".pdf"):
        return {"error": "File must be a PDF"}

    pdf_bytes = await pdf.read()
    pdf_file = io.BytesIO(pdf_bytes)

    reader = PdfReader(pdf_file)
    for page in reader.pages:
        pdf_text += page.extract_text()

    vc.make_embedding(pdf_text)

    return {"uploaded": True}


def start():
    uvicorn.run("app.server:app", host="0.0.0.0", port=8000, reload=True)
