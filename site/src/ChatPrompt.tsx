import { useState, useRef, useEffect } from "react";
import { TextField, Button, Box, Grid, useMediaQuery, useTheme, Dialog, DialogTitle, DialogContent, DialogActions, Typography } from "@mui/material";
import { handleSubmit } from "./HTTPHandlers";
import parse from "html-react-parser";

type Message = {
    content: string;
    type: "AI" | "You";
};

export function ChatPrompt({ uploading }: { uploading: boolean }) {
    const [text, setText] = useState("");
    const [conversation, setConversation] = useState<Message[]>([]);
    const [openDialog, setOpenDialog] = useState(true); // Stan do kontrolowania widoczności okienka z instrukcją
    const chatRef = useRef<HTMLDivElement | null>(null);
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

    const addMessage = (newMessage: Message) => {

        const storedConversation = localStorage.getItem("conversation");
        const prevConversation = storedConversation ? JSON.parse(storedConversation) : [];

        const updatedConversation = [...prevConversation, newMessage];

        localStorage.setItem("conversation", JSON.stringify(updatedConversation));

        setConversation(updatedConversation);
    };

    const handleSend = async () => {
        setText("");
        addMessage({ content: text, type: "You" });
        addMessage({ content: await handleSubmit(text), type: "AI" });
    };

    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [conversation]);

    useEffect(() => {

        const storedConversation = localStorage.getItem("conversation");
        if (storedConversation) {
            setConversation(JSON.parse(storedConversation));
        }
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
                        disabled={!uploading || text.length === 0}
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