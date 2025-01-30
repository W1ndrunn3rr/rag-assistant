import { UploadClearButtons } from './UploadClearButtons.tsx'
import { ChatPrompt } from './ChatPrompt.tsx'
import { useState } from 'react';

type UserMessage = {
    content: string;
    type: "AI" | "You";
};
function App() {

  const [uploading, setUploading] = useState(false);
  const [conversation, setConversation] = useState<UserMessage[]>([]);
    return (
    <div className="w-50 mx-auto d-flex flex-column justify-content-center align-items-center mt-4">
      <h1 className="text-center" style={{ fontSize: '45px', fontWeight: 'bold', color: '#2c3e50' }}>
        PDF RAG Assistant
      </h1>


      <div className="d-flex flex-column gap-3 w-100">
        <ChatPrompt uploading={uploading} conversation={conversation} setConversation={setConversation} />
        <UploadClearButtons uploading={uploading} setUploading={setUploading} setConversation={setConversation} />
      </div>
    </div>
  );
}

export default App
