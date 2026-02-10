import './App.css';
import { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SYSTEM_INSTRUCTIONS, API_KEY } from './Utilities/instructions';

const MODELS = [
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash (Recommended)" },
  { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Lite (Fastest)" },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash (Stable)" },
  { id: "gemini-3-flash-preview", label: "Gemini 3 Flash (PhD Logic)" }
];

export default function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: string, text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id); // Default to 1.5 Flash
  const [chat, setChat] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize/Restart chat whenever the selected model changes
  useEffect(() => {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: selectedModel,
      systemInstruction: SYSTEM_INSTRUCTIONS
    });

    // Start a new chat session
    setChat(model.startChat({ history: [] }));

    setMessages(prev => [...prev, { role: 'model', text: `System: Switched to ${selectedModel}` }]);
  }, [selectedModel]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || !chat) return;
    const text = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text }]);
    setLoading(true);

    try {
      const result = await chat.sendMessage(text);
      setMessages(prev => [...prev, { role: 'model', text: result.response.text() }]);
    } catch (err: any) {
      const errorMsg = err.toString().includes("429")
        ? "Quota exceeded! Please switch to Gemini 1.5 Flash."
        : `Error: ${err.message || "Connection failed"}`;

      setMessages(prev => [...prev, { role: 'model', text: errorMsg }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="widget-wrapper">
      <button className="chat-fab" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
        )}
      </button>

      <div className={`chat-popup ${isOpen ? 'open' : ''}`}>
        <div className="chat-header">
          <div className="avatar">TF</div>
          <div className="header-info">
            <h3>TechFlow Support</h3>
            {/* Model Selector Dropdown */}
            <select
              className="model-dropdown"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              {MODELS.map(m => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="message-list">
          {messages.length === 0 && (
            <div className="welcome-msg">
              <p className="welcome-emoji">👋</p>
              <p>I'm your TechFlow assistant. Choose a model above and ask me anything!</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`bubble ${m.role}`}>{m.text}</div>
          ))}
          {loading && (
            <div className="bubble model typing">
              <span className="dot"></span><span className="dot"></span><span className="dot"></span>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        <div className="input-area">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
          />
          <button className="send-btn" onClick={handleSend} disabled={loading}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

