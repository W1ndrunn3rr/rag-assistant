import { useState, useRef, useEffect, useCallback } from "react";
import { TextField, Button, Box, Grid, useMediaQuery, useTheme, Dialog, DialogTitle, DialogContent, DialogActions, Typography, CircularProgress } from "@mui/material";
import { handleSubmit, getChatHistory, saveMessage } from "./HTTPHandlers";
import parse from "html-react-parser";
type Message = {
    content: string;
    type: "AI" | "You";
};

export function ChatPrompt({ uploading, conversation, setConversation }: {
    uploading: boolean,
    conversation: Array<Message>,
    setConversation?: (value: ((prevState: Message[]) => Message[]) | Message[]) => void
}) {
    const [text, setText] = useState("");
    const [openDialog, setOpenDialog] = useState(true);
    const chatRef = useRef<HTMLDivElement | null>(null);
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
    const [isLoading, setIsLoading] = useState(false);

    const addMessage = useCallback((message: Message) => {
        setConversation!((prevMessages) => [...prevMessages, message]);
    }, [setConversation]);

    const handleSend = async () => {
        setText("");
        addMessage({ content: text, type: "You" });
        setIsLoading(true);
        try {
            const aiMessage = await handleSubmit(text);
            if (aiMessage) {
                addMessage({ content: aiMessage, type: "AI" });
                await saveMessage({ "user_id": "1", "message": text, "response": aiMessage })
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [conversation]);

    useEffect(() => {
        let isMounted = true;
        const getHistory = async () => {
            try {

                const history = await getChatHistory()


                if (isMounted && Array.isArray(history)) {
                    history?.map((user_input) => {
                        addMessage({ content: user_input.message, type: "You" })
                        addMessage({ content: user_input.response, type: "AI" })
                    })
                }
            } catch (error) {
                console.error("Error: ", error)
            }

        }
        getHistory()
        return () => {
            isMounted = false;
        };
    }, []);


    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                p: isSmallScreen ? 2 : 5,
                m: isSmallScreen ? 1 : 0,
                height: "80vh",
            }}
        >
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>Welcome to PDF RAG Assistant!</DialogTitle>
                <DialogContent>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Here’s how to use this app:
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        1. <strong>Upload a PDF</strong> using the uploader below.
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        2. <strong>Ask questions</strong> about the content of the PDF in the chat.
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        3. The AI will analyze the PDF and provide answers based on its content.
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        4. You can also type general questions, and the AI will respond accordingly.
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        5. Enjoy exploring the power of AI! 🚀
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Try not to upload huge PDFS ( more than 5mb ), because it will take a lot of time to convert it :)
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)} color="primary">
                        Got it!
                    </Button>
                </DialogActions>
            </Dialog>

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
                {
                    conversation.map((msg, index) => (
                        <Box key={index} sx={{ mb: 2 }}>
                            <h4>{msg.type}</h4>
                            {parse(msg.content)}
                        </Box>
                    ))
                }
                {
                    isLoading ? <CircularProgress /> : null
                }
            </Box>

            {/* Input Area */}
            <Grid container spacing={2} sx={{ mt: 2, px: isSmallScreen ? 1 : 5 }}>
                <Grid item xs={9}>
                    <TextField
                        fullWidth
                        multiline
                        rows={1}
                        placeholder="Ask a question..."
                        variant="outlined"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key == "Enter" && uploading) handleSend();
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
                        disabled={!uploading || text.length === 0 || isLoading}
                        onClick={handleSend}
                        sx={{ height: "100%" }}
                    >
                        Submit
                    </Button>

                </Grid>
            </Grid>
        </Box>
    );
}