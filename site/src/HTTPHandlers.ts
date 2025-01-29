import FingerprintJS from "@fingerprintjs/fingerprintjs";

type ChatType = {
    user_id: string
    message: string
    response: string
}

async function getBrowserFingerPrint() {
    const fp = await FingerprintJS.load()
    const result = await fp.get();
    return result.visitorId;
}

export async function handleSubmit(message: string) {

    const fingerprint = await getBrowserFingerPrint();
    const url = `https://rag-assistant-api-754277840579.europe-central2.run.app/invoke?message=${encodeURIComponent(message)}&finger_print=${fingerprint}`;

    try {
        const response = await fetch(url, {
            method: 'POST', // Metoda POST
            headers: {
                'Content-Type': 'application/json',
            }
        });
        if (response.ok) {
            return await response.json();
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
    const url = `https://rag-assistant-api-754277840579.europe-central2.run.app/upload?finger_print=${fingerPrint}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
        });
        if (response.ok) {
            return await response.json();
        } else {
            throw new Error('Upload failed');
        }
    } catch (error) {
        console.error(error);
    }
}

export async function saveMessage(message: ChatType) {
    const url = `https://rag-assistant-api-754277840579.europe-central2.run.app/save_message`;

    try {
        const fingerprint = await getBrowserFingerPrint();

        const data = {
            user_id: fingerprint,
            message: message.message,
            response: message.response
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                "Content-Type": 'application/json'
            },
            body: JSON.stringify(data)
        })
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return await response.json()
    } catch (error) {
        console.error("Fetching error: ", error)
    }
}

export async function getChatHistory(): Promise<Array<ChatType> | null> {
    const fingerprint = await getBrowserFingerPrint()
    const url = `https://rag-assistant-api-754277840579.europe-central2.run.app/get_chat_history/${fingerprint}`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                "Content-Type": 'application/json'
            }
        })
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const res = await response.json()

        return await res.history
    }
    catch (error) {
        console.error("Fetching error: ", error)
    }
    return null
}