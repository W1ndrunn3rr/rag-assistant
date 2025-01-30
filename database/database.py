import sqlite3
from pydantic import BaseModel
from typing import List


class ChatMessage(BaseModel):
    user_id: str
    message: str
    response: str


class Database:
    def __init__(self):
        self.connection = sqlite3.connect("database/db.sqlite", check_same_thread=False)
        self.cursor = self.connection.cursor()

        self.connection.execute(
            """
            CREATE TABLE IF NOT EXISTS chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            message TEXT NOT NULL,
            response TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
           """
        )
        self.connection.commit()

    def add_chat_history(self, user_id: str, message: str, response: str) -> None:
        self.cursor.execute(
            """
            INSERT INTO chat_history (user_id, message, response) 
            VALUES (?, ?, ?)
            """,
            (
                user_id,
                message,
                response,
            ),
        )
        self.connection.commit()

    def get_chat_history(self, user_id: str) -> List[ChatMessage]:
        chat_history = []
        self.cursor.execute(
            """
            SELECT * FROM chat_history WHERE user_id = ? ORDER BY timestamp
            """,
            (user_id,),
        )
        history = self.cursor.fetchall()

        history.sort(key=lambda x: x[4])
        for i in range(len(history)):
            chat_history.append(
                ChatMessage(
                    user_id=history[i][1], message=history[i][2], response=history[i][3]
                )
            )

        return chat_history

    def delete_chat_history(self, user_id: str) -> None:
        self.cursor.execute(
            """
            DELETE FROM chat_history WHERE user_id = ?
            """, (user_id,)
        )
        self.connection.commit()