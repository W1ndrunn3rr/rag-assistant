import React, {useEffect, useState} from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import UploadIcon from '@mui/icons-material/Upload';
import {DeleteRounded} from "@mui/icons-material";
import { handleFileUpload, deleteChatHistory } from './HTTPHandlers.ts';
import {CircularProgress, Dialog, DialogActions, DialogTitle} from "@mui/material";
import {Message} from "ai";

export function UploadClearButtons({uploading, setUploading, setConversation}: {
    uploading: (boolean),
    setUploading: (uploading: boolean) => void,
    setConversation?: (value: (((prevState: Message[]) => Message[]) | Message[])) => void
}) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const [openDialog, setOpenDialog] = useState(false);
    const [buttonClicked, setButtonClicked] = useState(false)

    const handleUpload = async (file: File) => {
        setUploading(false);
        try {
            const data = await handleFileUpload(file);
            if (data)
                setUploading(true);

        } catch (error) {
            console.error(error);
            setUploading(false);
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        setButtonClicked(true)
        if (file && file.type === "application/pdf") {
            setSelectedFile(file);
            await handleUpload(file);
        } else {
            alert("Please upload a valid PDF file.");
        }
    };

    useEffect(() => {
        if (uploading && buttonClicked)
            setButtonClicked(false)
    }, [uploading, buttonClicked])

    const handleDeleteHistory = () => {
        setOpenDialog(true)
    }

    const deleteHistory = async () => {
            setOpenDialog(false)
            await deleteChatHistory();
            setConversation!( () => [])

            alert("History has been deleted")}


    return (
        <div>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, marginBottom: 5 }}>
            {buttonClicked && (
                <Box >
                    <CircularProgress />

                </Box>
            )}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>Are you sure ?</DialogTitle>
                <DialogActions>
                    <Button
                    onClick={deleteHistory}
                    >Confirm</Button>
                </DialogActions>
            </Dialog>

            <Button
                variant="contained"
                component="label"
                startIcon={<UploadIcon />} // Optional: Add an icon,
                sx={{
                    backgroundColor: "#1976d2",
                    color: "white",
                    "&:hover": { backgroundColor: "#115293" },
                }}
            >
                Upload PDF
                <input
                    type="file"
                    hidden
                    accept="application/pdf"
                    onChange={handleFileChange}
                />
            </Button>
         <Button
                variant="contained"
                component="label"
                startIcon={<DeleteRounded />} // Optional: Add an icon,
                sx={{
                    backgroundColor: "#e43611",
                    color: "white",
                    "&:hover": { backgroundColor: "#115293" },
                }}
                onClick={handleDeleteHistory}
            >
                Clear Chat History
            </Button>

            {/* Display Selected File Name */}
               {selectedFile && (
                <Typography variant="body1" sx={{ mt: 1 }}>
                    Selected File: {selectedFile.name}
                </Typography>
            )}
        </Box>
    </div>


    );
}