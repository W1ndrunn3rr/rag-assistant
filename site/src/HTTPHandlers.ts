import FingerprintJS from "@fingerprintjs/fingerprintjs";

async function getBrowserFingerPrint() {
    const fp = await FingerprintJS.load()
    const result = await fp.get();
    return result.visitorId;
}

export async function handleSubmit(message: string) {
    const url = `https://rag-assistant-api-754277840579.europe-central2.run.app/invoke?message=${encodeURIComponent(message)}`;

    try {
        const response = await fetch(url, {
            method: 'POST', // Metoda POST
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            const data = await response.json(); // Parsowanie odpowiedzi jako JSON
            return data;
        } else {
            throw new Error(`Request failed with status ${response.status}`);
        }
    } catch (error) {
        console.error('Error:', error);
        throw error; // Rzucenie błędu, aby można było go obsłużyć w miejscu wywołania funkcji
    }
}

export async function handleFileUpload(file: File) {
    const formData = new FormData();
    formData.append('pdf', file);

    const fingerPrint = await getBrowserFingerPrint();
    const url = `https://rag-assistant-api-754277840579.europe-central2.run.app/upload?fingerPrint=${fingerPrint}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
        });
        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            throw new Error('Upload failed');
        }
    } catch (error) {
        console.error(error);
    }
}