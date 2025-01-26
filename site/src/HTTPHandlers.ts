export async function handleSubmit(message: string) {
    const url = `https://rag-assistant-api-754277840579.europe-central2.run.app/invoke?message=${encodeURIComponent(message)}`;
    try {
        const response = await fetch(url, { method: 'POST' });
        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            throw new Error('Something went wrong');
        }
    }
    catch (error) {
        console.error(error);
    }
}

export async function handleFileUpload(file: File) {
    const formData = new FormData();
    formData.append('pdf', file);
    const url = `https://rag-assistant-api-754277840579.europe-central2.run.app/upload`;
    try {
        const response = await fetch(url, { method: 'POST', body: formData });
        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            throw new Error('Something went wrong');
        }
    }
    catch (error) {
        console.error(error);
    }
}