// import './App.css';
// import Arcade from '@arcadeai/arcadejs';
// import { useState, useEffect, useRef } from 'react';
// import { GoogleGenerativeAI } from "@google/generative-ai";
// import { SYSTEM_INSTRUCTIONS, API_KEY, ARCADE_API_KEY } from './Utilities/instructions';

// const MODELS = [
//   { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash (Stable)" },
//   { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash (Recommended)" },
//   { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Lite (Fastest)" },
//   { id: "gemini-3-flash-preview", label: "Gemini 3 Flash (PhD Logic)" }
// ];

// export default function App() {
//   const [input, setInput] = useState('');
//   const [chat, setChat] = useState<any>(null);
//   const [isOpen, setIsOpen] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const scrollRef = useRef<HTMLDivElement>(null);
//   const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
//   const [messages, setMessages] = useState<{ role: string, text: string }[]>([]);

//   useEffect(() => {
//     (async () => {
//       const geminiTools = await showKitToolDetails();

//       const genAI = new GoogleGenerativeAI(API_KEY);
//       const model = genAI.getGenerativeModel({
//         model: selectedModel,
//         systemInstruction: SYSTEM_INSTRUCTIONS,
//         tools: [{ functionDeclarations: geminiTools }],
//       });

//       setChat(model.startChat({ history: [] }));
//       setMessages(prev => [...prev, { role: 'model', text: `System: Switched to ${selectedModel} with ${geminiTools.length} tools.` }]);
//     })()
//   }, [selectedModel]);

//   const convertToGeminiTools = (arcadeTools: any[]) => {
//     return arcadeTools.map(tool => {
//       // 1. Initialize the JSON Schema structure Gemini expects
//       const properties: Record<string, any> = {};
//       const required: string[] = [];

//       // 2. Map Arcade's parameters array to JSON Schema properties
//       tool.input.parameters.forEach((param: any) => {
//         properties[param.name] = {
//           type: param.value_schema.val_type === 'array' ? 'array' : param.value_schema.val_type,
//           description: param.description,
//         };

//         // Handle arrays if they have an inner type
//         if (param.value_schema.val_type === 'array' && param.value_schema.inner_val_type) {
//           properties[param.name].items = { type: param.value_schema.inner_val_type };
//         }

//         if (param.required) {
//           required.push(param.name);
//         }
//       });

//       return {
//         name: tool.qualified_name.replace(/\./g, '_'),
//         description: tool.description,
//         parameters: {
//           type: "object",
//           properties: properties,
//           required: required.length > 0 ? required : undefined
//         }
//       };
//     });
//   };

//   async function showKitToolDetails() {
//     const client = new Arcade({ apiKey: ARCADE_API_KEY });
//     try {
//       const toolkit = 'gmail';
//       const response = await client.tools.list({ toolkit });

//       const geminiFormattedTools = convertToGeminiTools(response.items);

//       return geminiFormattedTools;
//     } catch (error) {
//       console.error("Error fetching tools:", error);
//       return [];
//     }
//   }

//   useEffect(() => {
//     scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages, loading]);

//   const handleSend = async () => {
//     if (!input.trim() || !chat) return;
//     const text = input;
//     setInput('');
//     setMessages(prev => [...prev, { role: 'user', text }]);
//     setLoading(true);

//     try {
//       let result = await chat.sendMessage(text);
//       let response = result.response;
//       let functionCalls = response.candidates[0].content.parts.filter((p: any) => p.functionCall);

//       while (functionCalls.length > 0) {
//         const toolResults = await Promise.all(functionCalls.map(async (call: any) => {
//           const toolName = call.functionCall.name.replace(/_/g, '.');
//           const args = call.functionCall.args;

//           const arcadeClient = new Arcade({ apiKey: ARCADE_API_KEY });

//           try {
//             const toolResponse = await arcadeClient.tools.execute({
//               tool_name: toolName,
//               input: args,
//               user_id: "abdelrahman.abogabal@origin-me.com",
//             });

//             return {
//               functionResponse: {
//                 name: call.functionCall.name,
//                 response: { content: toolResponse.output }
//               }
//             };
//           } catch (err: any) {
//             if (err.error?.name === 'tool_authorization_required') {
//               return {
//                 functionResponse: {
//                   name: call.functionCall.name,
//                   response: { error: "AUTH_REQUIRED", url: err.error.authorization_url }
//                 }
//               };
//             }
//             throw err;
//           }
//         }));

//         result = await chat.sendMessage(toolResults);
//         response = result.response;
//         functionCalls = response.candidates[0].content.parts.filter((p: any) => p.functionCall);
//       }

//       const finalModelText = response.text();

//       if (finalModelText.includes("AUTH_REQUIRED")) {
//         setMessages(prev => [...prev, { role: 'model', text: "I need permission to access your Gmail. Please authorize here: [Click to Authorize](URL_HERE)" }]);
//       } else {
//         setMessages(prev => [...prev, { role: 'model', text: finalModelText }]);
//       }

//     } catch (err: any) {
//       setMessages(prev => [...prev, { role: 'model', text: `Error: ${err.message}` }]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
// <div className="widget-wrapper">
//   <button className="chat-fab" onClick={() => setIsOpen(!isOpen)}>
//     {isOpen ? (
//       <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
//     ) : (
//       <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
//     )}
//   </button>

//   <div className={`chat-popup ${isOpen ? 'open' : ''}`}>
//     <div className="chat-header">
//       <div className="avatar">TF</div>
//       <div className="header-info">
//         <h3>TechFlow Support</h3>
//         <select
//           className="model-dropdown"
//           value={selectedModel}
//           onChange={(e) => setSelectedModel(e.target.value)}
//         >
//           {MODELS.map(m => (
//             <option key={m.id} value={m.id}>{m.label}</option>
//           ))}
//         </select>
//       </div>
//     </div>

//     <div className="message-list">
//       {messages.length === 0 && (
//         <div className="welcome-msg">
//           <p className="welcome-emoji">👋</p>
//           <p>I'm your TechFlow assistant. Choose a model above and ask me anything!</p>
//         </div>
//       )}
//       {messages.map((m, i) => (
//         <div key={i} className={`bubble ${m.role}`}>{m.text}</div>
//       ))}
//       {loading && (
//         <div className="bubble model typing">
//           <span className="dot"></span><span className="dot"></span><span className="dot"></span>
//         </div>
//       )}
//       <div ref={scrollRef} />
//     </div>

//     <div className="input-area">
//       <input
//         value={input}
//         onChange={(e) => setInput(e.target.value)}
//         onKeyDown={(e) => e.key === 'Enter' && handleSend()}
//         placeholder="Type your message..."
//       />
//       <button className="send-btn" onClick={handleSend} disabled={loading}>
//         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
//       </button>
//     </div>
//   </div>
// </div>
//   );
// }









import './App.css';
import Arcade from '@arcadeai/arcadejs';
import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SYSTEM_INSTRUCTIONS, API_KEY, ARCADE_API_KEY } from './Utilities/instructions';

const MODELS = [
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash (Stable)" },
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash (Recommended)" },
  { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Lite (Fastest)" },
  { id: "gemini-3-flash-preview", label: "Gemini 3 Flash (PhD Logic)" }
];

export default function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: string, text: string, type?: 'status' }[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [chat, setChat] = useState<any>(null);
  const [currentToolkit, setCurrentToolkit] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const convertToGeminiTools = useCallback((arcadeTools: any[]) => {
    return arcadeTools.map(tool => {
      const properties: Record<string, any> = {};
      const required: string[] = [];

      tool.input.parameters.forEach((param: any) => {
        properties[param.name] = {
          type: param.value_schema.val_type === 'array' ? 'array' : (param.value_schema.val_type || 'string'),
          description: param.description,
        };
        if (param.value_schema.val_type === 'array' && param.value_schema.inner_val_type) {
          properties[param.name].items = { type: param.value_schema.inner_val_type };
        }
        if (param.required) required.push(param.name);
      });

      return {
        name: tool.qualified_name.replace(/\./g, '_'),
        description: tool.description,
        parameters: { type: "object", properties, required: required.length > 0 ? required : undefined }
      };
    });
  }, []);

  const startSession = async (tools: any[] = [], history: any[] = []) => {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: selectedModel,
      systemInstruction: SYSTEM_INSTRUCTIONS,
      tools: tools.length > 0 ? [{ functionDeclarations: tools }] : undefined,
    });
    return model.startChat({ history });
  };

  useEffect(() => {
    (async () => {
      const initialChat = await startSession();
      setChat(initialChat);
      setMessages([{ role: 'model', text: "Ready. Tools will load contextually.", type: 'status' }]);
    })();
  }, [selectedModel]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- 3. THE HANDLER (The "Brain") ---
  const handleSend = async () => {
    if (!input.trim() || !chat || loading) return;

    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      let activeChat = chat;
      let authUrl: string | null = null;

      const isEmail = /email|gmail|mail|inbox/i.test(userText);
      const isSlack = /task|slack|ticket|assign/i.test(userText);
      const targetToolkit = isEmail ? 'gmail' : isSlack ? 'Slack' : null;

      if (targetToolkit && targetToolkit !== currentToolkit) {
        setMessages(prev => [...prev, { role: 'model', text: `Loading ${targetToolkit} integration...`, type: 'status' }]);

        const client = new Arcade({ apiKey: ARCADE_API_KEY });
        const response = await client.tools.list({ toolkit: targetToolkit });
        const geminiTools = convertToGeminiTools(response.items);

        const history = messages
          .filter(m => m.type !== 'status')
          .map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
          }));

        activeChat = await startSession(geminiTools, history);
        setChat(activeChat);
        setCurrentToolkit(targetToolkit);
      }

      let result = await activeChat.sendMessage(userText);
      let response = result.response;
      let functionCalls = response.candidates[0].content.parts.filter((p: any) => p.functionCall);

      while (functionCalls.length > 0) {
        const toolResults = await Promise.all(functionCalls.map(async (call: any) => {
          const toolName = call.functionCall.name.replace(/_/g, '.');
          const arcadeClient = new Arcade({ apiKey: ARCADE_API_KEY });

          try {
            const toolResponse = await arcadeClient.tools.execute({
              tool_name: toolName,
              input: call.functionCall.args,
              user_id: "abdelrahman.abogabal@origin-me.com",
            });
            return { functionResponse: { name: call.functionCall.name, response: { content: toolResponse.output } } };
          } catch (err: any) {
            if (err.error?.name === 'tool_authorization_required' || err.message?.includes('authorization')) {

              console.log("🔐 Auth needed for:", call.functionCall.name);

              const arcadeClient = new Arcade({ apiKey: ARCADE_API_KEY });
              const authResponse = await arcadeClient.tools.authorize({
                tool_name: call.functionCall.name.replace(/_/g, '.'),
                user_id: "abdelrahman.abogabal@origin-me.com",
              });

              if (authResponse.url) {
                authUrl = authResponse.url;
              }

              return {
                functionResponse: {
                  name: call.functionCall.name,
                  response: { error: "AUTH_REQUIRED" }
                }
              };
            }

            return { functionResponse: { name: call.functionCall.name, response: { error: err.message } } };
          }
        }));

        result = await activeChat.sendMessage(toolResults);

        response = result.response;
        const candidate = response.candidates?.[0];

        if (!candidate || !candidate.content || !candidate.content.parts) {
          const reason = candidate?.finishReason || "UNKNOWN";
          console.warn("Response Blocked. Reason:", reason);

          setMessages(prev => [...prev, {
            role: 'model',
            text: `⚠️ I couldn't process that. (Reason: ${reason}). Please try a clearer message.`
          }]);
          setLoading(false);
          return;
        }

        functionCalls = candidate.content.parts.filter((p) => p.functionCall);

        // response = result.response;
        // functionCalls = response.candidates[0].content.parts.filter((p: any) => p.functionCall);
      }

      const finalMsg = response.text();
      if (authUrl) {
        setMessages(prev => [...prev, {
          role: 'model',
          text: `🔐 **Action Required:** I need access to your ${currentToolkit}. [Click here to authorize](${authUrl}) then say "Done" to retry.`
        }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', text: finalMsg }]);
      }

    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'model', text: `❌ Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessageContent = (text: string) => {
    const linkRegex = /\[(.*?)\]\((.*?)\)/g;
    const parts = text.split(linkRegex);

    if (parts.length === 1) return text;

    const elements = [];
    for (let i = 0; i < parts.length; i += 3) {
      elements.push(parts[i]);
      if (parts[i + 1]) {
        elements.push(
          <a key={i} href={parts[i + 2]} target="_blank" rel="noreferrer" className="auth-button-link">
            {parts[i + 1]}
          </a>
        );
      }
    }
    return elements;
  };

  return (
    <div className="chat-wrapper">
      <header className="chat-nav">
        <div className="status-indicator">
          <span className={`dot ${currentToolkit ? 'active' : ''}`} />
          {currentToolkit ? `Linked: ${currentToolkit}` : 'Searching for context...'}
        </div>
      </header>

      <div className="message-container">
        {messages.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.role} ${m.type || ''}`}>
            {renderMessageContent(m.text)}
          </div>
        ))}
        {loading && <div className="chat-bubble model typing-loader">...</div>}
        <div ref={scrollRef} />
      </div>

      <div className="chat-input-row">
        <input
          placeholder="Ask me to send an email or check tasks..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading}>Send</button>
      </div>
    </div>

    // <div className="widget-wrapper">
    //   <button className="chat-fab" onClick={() => setIsOpen(!isOpen)}>
    //     {isOpen ? (
    //       <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
    //     ) : (
    //       <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
    //     )}
    //   </button>

    //   <div className={`chat-popup ${isOpen ? 'open' : ''}`}>
    //     <div className="chat-header">
    //       <div className="avatar">TF</div>
    //       <div className="header-info">
    //         <h3>TechFlow Support</h3>
    //         <select
    //           className="model-dropdown"
    //           value={selectedModel}
    //           onChange={(e) => setSelectedModel(e.target.value)}
    //         >
    //           {MODELS.map(m => (
    //             <option key={m.id} value={m.id}>{m.label}</option>
    //           ))}
    //         </select>
    //       </div>
    //     </div>

    //     <div className="message-list">
    //       {messages.length === 0 && (
    //         <div className="welcome-msg">
    //           <p className="welcome-emoji">👋</p>
    //           <p>I'm your TechFlow assistant. Choose a model above and ask me anything!</p>
    //         </div>
    //       )}
    //       {messages.map((m, i) => (
    //         <div key={i} className={`chat-bubble ${m.role} ${m.type || ''}`}>
    //           {renderMessageContent(m.text)}
    //         </div>
    //       ))}
    //       {loading && (
    //         <div className="bubble model typing">
    //           <span className="dot"></span><span className="dot"></span><span className="dot"></span>
    //         </div>
    //       )}
    //       <div ref={scrollRef} />
    //     </div>

    //     <div className="input-area">
    //       <input
    //         value={input}
    //         onChange={(e) => setInput(e.target.value)}
    //         onKeyDown={(e) => e.key === 'Enter' && handleSend()}
    //         placeholder="Type your message..."
    //       />
    //       <button className="send-btn" onClick={handleSend} disabled={loading}>
    //         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
    //       </button>
    //     </div>
    //   </div>
    // </div>
  );
}