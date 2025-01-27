import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import UploadIcon from '@mui/icons-material/Upload';
import { handleFileUpload } from './HTTPHandlers.ts';
import { CircularProgress } from "@mui/material";

export function PDFUploader({ uploading, setUploading }: { uploading: (boolean), setUploading: (uploading: boolean) => void }) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        setButtonClicked(true)
        if (file && file.type === "application/pdf") {
            setSelectedFile(file);
            handleUpload(file);
        } else {
            alert("Please upload a valid PDF file.");
        }
    };

    useEffect(() => {
        if (uploading && buttonClicked)
            setButtonClicked(false)
    })



    return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, marginBottom: 5 }}>
            {buttonClicked && (
                <Box >
                    <CircularProgress />

                </Box>
            )}
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
            {/* Display Selected File Name */}
            {selectedFile && (
                <Typography variant="body1" sx={{ mt: 1 }}>
                    Selected File: {selectedFile.name}
                </Typography>
            )}

        </Box>
    );
}