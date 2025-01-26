import { PDFUploader } from './PDFUploader.tsx'
import { ChatPrompt } from './ChatPrompt.tsx'
import { useState } from 'react';

function App() {

  const [uploading, setUploading] = useState(false);


  return (
    <div className="w-50 mx-auto justify-content-center align-items-center">
      <ChatPrompt uploading={uploading} />
      <PDFUploader setUploading={setUploading} />
    </div>)

}

export default App
