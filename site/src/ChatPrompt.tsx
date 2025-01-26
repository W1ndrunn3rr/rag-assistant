import { useState, useRef, useEffect } from "react";
import { TextField, Button, Box, Grid, useMediaQuery, useTheme } from "@mui/material";
import { handleSubmit } from "./HTTPHandlers";
import parse from "html-react-parser";

type Message = {
    content: string;
    type: "AI" | "You";
};

export function ChatPrompt({ uploading }: { uploading: boolean }) {
    const [text, setText] = useState("");
    const [conversation, setConversation] = useState<Message[]>([]);
    const chatRef = useRef<HTMLDivElement | null>(null);
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

    const addMessage = (newMessage: Message) => {
        setConversation((prevConversation) => [...prevConversation, newMessage]);
    };

    const handleSend = async () => {
        setText("");
        addMessage({ content: text, type: "You" });
        addMessage({ content: await handleSubmit(text), type: "AI" });
    }

    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [conversation]);

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                p: isSmallScreen ? 2 : 5,
                m: isSmallScreen ? 1 : 3,
                height: "80vh",
            }}
        >
            {/* Chat Container */}
            <Box
                ref={chatRef}
                sx={{
                    flexGrow: 1,
                    mx: isSmallScreen ? 1 : 4,
                    p: isSmallScreen ? 2 : 5,
                    bgcolor: "background.paper",
                    border: "1px solid",
                    borderColor: "divider",
                    overflowY: "auto",
                    scrollBehavior: "smooth",
                    height: "50vh",
                }}
            >
                {conversation.map((msg, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                        <h4>{msg.type}</h4>
                        {parse(msg.content)}
                    </Box>
                ))}
            </Box>

            {/* Input Area */}
            <Grid container spacing={2} sx={{ mt: 2, px: isSmallScreen ? 1 : 5 }}>
                <Grid item xs={9}>
                    <TextField
                        fullWidth
                        multiline
                        rows={1}
                        placeholder="Dear GPT..."
                        variant="outlined"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => {

                            if (e.key == "Enter" && uploading) handleSend()
                        }}
                        sx={{ bgcolor: "background.paper" }}
                    />
                </Grid>
                <Grid item xs={3}>
                    <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        size="large"
                        disabled={!uploading || text.length === 0}
                        onClick={async () => handleSend()
                        }
                        sx={{ height: "100%" }}
                    >
                        Submit
                    </Button>
                </Grid>
            </Grid>
        </Box >
    );
}