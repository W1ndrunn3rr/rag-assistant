from langchain_openai.embeddings import OpenAIEmbeddings
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_text_splitters import RecursiveCharacterTextSplitter


class VectorStore:
    def __init__(self, api_key: str, user_id : str):
        self.embeddings = OpenAIEmbeddings(
            model="text-embedding-3-small",
            api_key=api_key,
        )
        self.vector_store = InMemoryVectorStore(
            embedding=self.embeddings,
        )
        self.user_id = user_id

    def make_embedding(self, text: str):
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000, chunk_overlap=200, add_start_index=True
        )

        split_texts = splitter.split_text(text)

        self.vector_store.add_texts(split_texts)

    def similarity_search(self, query: str, k: int):
        return self.vector_store.similarity_search(query, k)