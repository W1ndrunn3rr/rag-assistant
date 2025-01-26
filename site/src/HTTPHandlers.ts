export async function handleSubmit(message: string) {
    const url = `http://localhost:8000/invoke?message=${encodeURIComponent(message)}`;
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
    const url = `http://localhost:8000/upload`;
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