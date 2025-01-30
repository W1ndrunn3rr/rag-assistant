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
from typing import List

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY")
UBER_SECRET_KEY = os.environ.get("UBER_SECRET_KEY")


rag = None
vector_store : List[VectorStore] = []
database = Database()
app = FastAPI()

def find_user_vector_db(fingerprint: str) -> VectorStore | None:
    for store in vector_store:
        if store.user_id == fingerprint:
            return store
    return None


origins = [
    "https://rag-assistant.vercel.app",
    "http://localhost:5173",
    "localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def init():
    global rag
    vc = VectorStore(api_key=DEEPSEEK_API_KEY, user_id="1")
    rag = RAG(api=DEEPSEEK_API_KEY,vector_store=vc)

@app.get("/")
async def root():
    return {"root": "root"}


@app.post("/invoke")
async def invoke(message: str, finger_print: str):
    if (store := find_user_vector_db(finger_print)) is not None:
            rag.change_vector_store(store)
            rag_answer = rag.invoke(message, finger_print)
            return rag_answer
    else:
        new_vector_store = VectorStore(api_key=OPENAI_API_KEY, user_id=finger_print)
        vector_store.append(new_vector_store)
        rag.change_vector_store(new_vector_store)
        rag_answer = rag.invoke(message, finger_print)
        return rag_answer
@app.post("/upload")
async def upload_pdf(
    finger_print: str,
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

    if (store := find_user_vector_db(finger_print)) is not None:
        store.make_embedding(pdf_text)
    else :
        new_vector_store = VectorStore(api_key=OPENAI_API_KEY, user_id=finger_print)
        vector_store.append(new_vector_store)
        new_vector_store.make_embedding(pdf_text)
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

@app.delete("/delete_chat_history/{finger_print}")
async def delete_chat_history(finger_print : str):
    database.delete_chat_history(finger_print)


def start():
    uvicorn.run("app.server:app", host="0.0.0.0", port=8000, reload=True)
