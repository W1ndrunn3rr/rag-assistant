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
    next_node: str


class RAG:
    def __init__(self, api: str, vector_store: VectorStore):
        self.api = api
        self.llm = BaseChatOpenAI(
            model="deepseek-chat",
            openai_api_base="https://api.deepseek.com",
            api_key=api,
            max_tokens=1024,
            streaming=True,
        )
        self.template = """
            You are an intelligent assistant that processes information from two sources:
            1. Provided context
            2. Your general knowledge

            Follow these steps strictly:

            1. CONTEXT ANALYSIS:
            - First, thoroughly analyze the provided context
            - Look for specific information matching the user's question
            - If exact or related information exists in context, use it as your primary source

            2. RESPONSE DECISION:
            - If context contains relevant information: Use it primarily
            - If context lacks information: 
                a) Clearly state that context doesn't contain the answer
                b) Provide response from your knowledge
                c) Include credible source links when using your knowledge
            - If user talks normal conversation, simply answer as you would in a normal conversation


            3. FORMATTING REQUIREMENTS:
            - Structure your entire response using HTML tags
            - Use semantic HTML for better organization:
                <h1> - For main headings
                <h2> - For subheadings
                <p> - For paragraphs
                <b> - For emphasis
                <ul>/<li> - For lists
                <a href="URL"> - For links
                <blockquote> - For quotes from context
            - Ensure proper tag nesting and closure

            Context:
            {context}
            
            If context is empty, provide a response based on your general knowledge, and don't say "context is empty" or that
            you're switching to general knowledge. Just provide the response.
            
            If context is not empty, provide a response based on the context and your general knowledge.

            User Question: {question}

            Remember:
            - Always prioritize context information
            - Be explicit when switching from context to general knowledge
            - Keep responses clear and well-structured
            - Include source links for non-context information

            Assistant answer:
            """
        self.prompt = PromptTemplate.from_template(self.template)
        self.vector_store = vector_store
        self.memory = MemorySaver()
        self.graph = self.generate_graph()

    def change_vector_store(self, new_vector_store: VectorStore):
        self.vector_store = new_vector_store

    def retrieve(self, state: State):
        retrieved_docs = self.vector_store.similarity_search(state["question"], k=2)
        return {"context": retrieved_docs}

    def generate(self, state: State):
        if state.get("next_node") == "retrieve":
            docs_content = "\n\n".join(doc.page_content for doc in state["context"])
            content = self.prompt.invoke(
                {"question": state["question"], "context": docs_content}
            ).to_string()
        else:
            content = self.prompt.invoke(
                {"question": state["question"], "context": ""}
            ).to_string()

        message_history = "".join(msg.content for msg in state.get("messages", []))

        response = self.llm.invoke(content + message_history)

        # Return updated state
        return {
            "answer": response.content,
            "messages": state.get("messages", [])
            + [state.get("question")]
            + [response],
        }

    def agent_decision(self, state):
        agent_llm = BaseChatOpenAI(
            model="deepseek-chat",
            openai_api_base="https://api.deepseek.com",
            api_key=self.api,
            max_tokens=1024,
        )

        prompt = f"""Analyze the question step by step:
        Question: {state.get("question")}
        
        1. Does the question require specific facts or data?
        2. Is the question about general concepts?
        3. Does the answer require access to additional sources?
        4. Can it be answered based on general knowledge?
        5. Do user explicitly ask for a generated response?
        6. Do user want a response based on retrieved context such as pdfs, documents, docs or etc ?
        7. Do user want a response based on general knowledge? Like what is the capital of France or who is the president of USA?
        8. Is the question about a specific topic ? Like what is Quantization or what is Mitochondria?
        Based on the above analysis, decide: retrieve or generate?
        Answer (one word only):"""

        decision = agent_llm.invoke(prompt).content.lower().strip()
        print(decision)
        return {
            "next_node": (
                decision if decision in {"retrieve", "generate"} else "generate"
            )
        }

    def generate_graph(self):
        graph_builder = StateGraph(State)

        graph_builder.add_node("retrieve", self.retrieve)
        graph_builder.add_node("generate", self.generate)
        graph_builder.add_node("agent_decision", self.agent_decision)

        graph_builder.add_edge(
            START, "agent_decision"
        )  # Graf zaczyna od decyzji agenta
        graph_builder.add_conditional_edges(
            "agent_decision",
            lambda state: state.get("next_node"),
            {
                "retrieve": "retrieve",
                "generate": "generate",
            },
        )
        graph_builder.add_edge(
            "retrieve", "generate"
        )  # Po retrieve przejdź do generate
        graph_builder.add_edge("generate", END)  # Zakończ graf po generate

        return graph_builder.compile(checkpointer=self.memory)

    def invoke(self, message: str, thread_id: str):
        message = self.graph.invoke(
            {"question": message},
            config={"configurable": {"thread_id": thread_id}},
        )
        return message.get("answer")
