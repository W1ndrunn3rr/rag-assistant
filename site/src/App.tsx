import { PDFUploader } from './PDFUploader.tsx'
import { ChatPrompt } from './ChatPrompt.tsx'
import { useState } from 'react';

function App() {

  const [uploading, setUploading] = useState(false);


  return (
    <div className="w-50 mx-auto d-flex flex-column justify-content-center align-items-center mt-4">
      {/* Dodaj napis PDF RAG Assistant */}
      <h1 className="text-center" style={{ fontSize: '45px', fontWeight: 'bold', color: '#2c3e50' }}>
        PDF RAG Assistant
      </h1>

      {/* Komponenty w kolumnie */}
      <div className="d-flex flex-column gap-3 w-100">
        <ChatPrompt uploading={uploading} />
        <PDFUploader setUploading={setUploading} />
      </div>
    </div>
  );
}

export default App
