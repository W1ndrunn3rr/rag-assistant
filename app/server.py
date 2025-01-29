import os
from fastapi import FastAPI, File, UploadFile
import uvicorn
import io
from PyPDF2 import PdfReader
from model.rag import RAG
from model.vector_store import VectorStore
from fastapi.middleware.cors import CORSMiddleware
from database.database import Database
from pydantic import BaseModel
from database.database import ChatMessage

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY")
UBER_SECRET_KEY = os.environ.get("UBER_SECRET_KEY")

rag = None
vc = None
database = Database()
app = FastAPI()

origins = ["https://rag-assistant.vercel.app", "http://localhost:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def init():
    global vc, rag
    vc = VectorStore(api_key=OPENAI_API_KEY)
    rag = RAG(api=DEEPSEEK_API_KEY, vector_store=vc)


@app.get("/")
async def root():
    return {"root": "root"}


@app.post("/invoke")
async def invoke(message: str, finger_print: str):
    rag_answer = rag.invoke(message, finger_print)
    return rag_answer


@app.post("/upload")
async def upload_pdf(
    pdf: UploadFile = File(...),
):
    pdf_text: str = ""
    if not pdf.filename.endswith(".pdf"):
        return {"error": "File must be a PDF"}

    pdf_bytes = await pdf.read()
    pdf_file = io.BytesIO(pdf_bytes)

    reader = PdfReader(pdf_file)
    for page in reader.pages:
        pdf_text += page.extract_text()

    vc.make_embedding(pdf_text)
    return {"uploaded": "success"}


@app.post("/save_message")
async def save_message(chat_message: ChatMessage):
    database.add_chat_history(
        chat_message.user_id, chat_message.message, chat_message.response
    )
    return {"status": "Memory saved"}


@app.get("/get_chat_history/{user_id}")
async def get_chat_history(user_id: str):
    chat_history = database.get_chat_history(user_id)
    print(chat_history)
    return {"history": database.get_chat_history(user_id)}


def start():
    uvicorn.run("app.server:app", host="0.0.0.0", port=8000, reload=True)
