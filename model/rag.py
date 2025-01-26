from langchain_openai.chat_models.base import BaseChatOpenAI
from langchain_core.prompts import PromptTemplate
from model.vector_store import VectorStore
from typing import TypedDict, List
from langchain_core.messages import BaseMessage
from langgraph.graph import START, StateGraph, END, MessagesState
from langchain_core.documents import Document
from langgraph.checkpoint.memory import MemorySaver


class State(MessagesState):
    question: str
    context: List[Document]
    answer: str


class RAG:
    def __init__(self, api: str, vector_store: VectorStore):
        self.llm = BaseChatOpenAI(
            model="deepseek-chat",
            openai_api_base="https://api.deepseek.com",
            api_key=api,
            max_tokens=1024,
            streaming=True,
        )
        self.template = """
        You are a helpful assistant. You base on context given to you by agent and user question you provide an answer.
        If there is no answer in context, simply say that there is no information about user's question 
        in given documents, but you have information on your own. But always check if there is no information in the context
        at first. If you respond on your own assign link to the source of information for the user.
        
        {context}
        
        Question from user: {question}
        Your answer is only in HTML format like <p> or <h1> tags. If you want to bold something
        use <b> tag. If you want to add a link use <a href="https://example.com">link</a>
        If u want to add a list use <ul> and <li> tags.
        cd G
        Assistant answer:
        """
        self.prompt = PromptTemplate.from_template(self.template)
        self.vector_store = vector_store
        self.memory = MemorySaver()
        self.graph = self.generate_graph()

    def retrieve(self, state: State):
        retrieved_docs = self.vector_store.similarity_search(state["question"], k=2)
        return {"context": retrieved_docs}

    def generate(self, state: State):
        docs_content = "\n\n".join(doc.page_content for doc in state["context"])
        # Convert prompt value to string
        content = self.prompt.invoke(
            {"question": state["question"], "context": docs_content}
        ).to_string()

        # Prepare messages history
        message_history = "".join(msg.content for msg in state.get("messages", []))

        # Invoke LLM with combined content
        response = self.llm.invoke(content + message_history)

        # Return updated state
        return {
            "answer": response.content,
            "messages": state.get("messages", [])
            + [state.get("question")]
            + [response],
        }

    def generate_graph(self):
        graph_builder = StateGraph(State)
        graph_builder.add_node("retrieve", self.retrieve)
        graph_builder.add_node("generate", self.generate)
        graph_builder.add_edge(START, "retrieve")
        graph_builder.add_edge("retrieve", "generate")
        graph_builder.add_edge("generate", END)

        return graph_builder.compile(checkpointer=self.memory)

    def invoke(self, message: str, thread_id: str):
        message = self.graph.invoke(
            {"question": message},
            config={"configurable": {"thread_id": thread_id}},
        )
        print(self.memory.get_tuple(config={"configurable": {"thread_id": thread_id}}))
        return message.get("answer")
