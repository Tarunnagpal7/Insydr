import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, X, ChevronDown, Sparkles } from 'lucide-react';
import classNames from 'classnames';

// Simple API helper since we don't want the heavy axios/interceptor setup of the main app
const API_BASE = 'http://127.0.0.1:8000/api/v1';

export default function App({ agentId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load Config
  useEffect(() => {
    fetch(`${API_BASE}/agents/${agentId}/widget-config`)
      .then(res => res.json())
      .then(data => {
        setConfig(data);
        // Initialize default messages or welcome message
        if (data.configuration?.widget_settings?.welcomeMessage) {
             setMessages([{
                 id: "welcome",
                 role: "assistant",
                 content: data.configuration.widget_settings.welcomeMessage
             }]);
        }
      })
      .catch(err => console.error("Insydr Widget Error:", err))
      .finally(() => setLoading(false));
  }, [agentId]);

  // Scroll to bottom
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMsg = { role: 'user', content: input, id: Date.now().toString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
        const res = await fetch(`${API_BASE}/agents/${agentId}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userMsg.content, agent_id: agentId }) // Assuming public chat works without auth if agent is public (TODO: Backend might enforce auth, check later. For now assume open for demo)
            // Wait, standard backend endpoints usually rely on current_user dependency. 
            // We likely need a separate PUBLIC chat endpoint or allow optional auth on the main one for widgets.
            // I'll touch on this in next steps.
        });
        
        if (!res.ok) throw new Error("Failed to send");
        
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.response, id: (Date.now() + 1).toString() }]);
    } catch (err) {
        setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, something went wrong.", id: (Date.now() + 1).toString(), isError: true }]);
    } finally {
        setSending(false);
    }
  };

  if (loading) return null; // Or a loader

  const settings = config?.configuration?.widget_settings || {
      primaryColor: '#EF4444',
      position: 'bottom-right',
      agentName: config?.name || 'Agent',
      showPoweredBy: true
  };

  const getPositionClasses = () => {
      switch(settings.position) {
          case 'bottom-left': return 'bottom-6 left-6';
          case 'top-right': return 'top-6 right-6';
          case 'top-left': return 'top-6 left-6';
          default: return 'bottom-6 right-6';
      }
  };

  // Convert Tailwind classes to inline styles where dynamic colors are used, or rely on inserted style tag
  // Since we use Shadow DOM, we need to inject CSS. We will do that in main entry.

  return (
    <div className={`fixed z-[999999] flex flex-col items-end gap-4 ${getPositionClasses()} font-sans`}>
        {/* Chat Window */}
        <div 
            className={classNames(
                "w-[350px] max-w-[90vw] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right border border-gray-200",
                {
                    'h-[500px] opacity-100 scale-100': isOpen,
                    'h-0 opacity-0 scale-90 pointer-events-none': !isOpen
                }
            )}
        >
             {/* Header */}
             <div className="p-4 text-white flex items-center justify-between shadow-sm" style={{ backgroundColor: settings.primaryColor }}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="font-semibold text-sm leading-tight">{settings.agentName}</p>
                        <div className="flex items-center gap-1.5 opacity-80">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full shadow-[0_0_4px_rgba(74,222,128,0.5)]"></span>
                            <span className="text-xs">Online</span>
                        </div>
                    </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
                    <ChevronDown className="w-6 h-6" />
                </button>
             </div>

             {/* Messages */}
             <div className="flex-1 bg-gray-50 p-4 overflow-y-auto space-y-4">
                 {messages.map((msg) => (
                     <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                         <div 
                            className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm
                                ${msg.role === 'user' 
                                    ? 'text-white rounded-br-none' 
                                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                                }
                            `}
                            style={msg.role === 'user' ? { backgroundColor: settings.primaryColor } : {}}
                        >
                             {msg.content}
                         </div>
                     </div>
                 ))}
                 {sending && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 flex gap-1 shadow-sm">
                             <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                             <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                             <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                        </div>
                    </div>
                 )}
                 <div ref={messagesEndRef} />
             </div>

             {/* Footer */}
             <div className="p-3 bg-white border-t border-gray-100">
                 <form onSubmit={handleSendMessage} className="relative flex items-center">
                     <input 
                        className="w-full bg-gray-100/50 border border-gray-200 text-gray-800 text-sm rounded-full pl-4 pr-10 py-2.5 focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
                        placeholder="Type a message..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                     />
                     <button 
                        type="submit" 
                        disabled={!input.trim()}
                        className="absolute right-1.5 p-1.5 bg-white rounded-full shadow-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 transition-colors"
                        style={{ color: input.trim() ? settings.primaryColor : undefined }}
                     >
                         <Send className="w-4 h-4" />
                     </button>
                 </form>
                 {settings.showPoweredBy && (
                    <a href="https://insydr.ai" target="_blank" className="block text-center mt-2 no-underline hover:opacity-80 transition-opacity">
                        <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
                            <Sparkles className="w-3 h-3" /> Powered by <span className="font-bold text-gray-500">Insydr</span>
                        </p>
                    </a>
                 )}
             </div>
        </div>

        {/* Launcher */}
        <button 
            onClick={() => setIsOpen(!isOpen)}
            className="w-14 h-14 rounded-full shadow-[0_4px_14px_rgba(0,0,0,0.16)] flex items-center justify-center text-white hover:scale-110 transition-transform active:scale-95 z-50"
            style={{ backgroundColor: settings.primaryColor }}
        >
             {isOpen ? <X className="w-7 h-7" /> : <MessageSquare className="w-7 h-7" />}
        </button>
    </div>
  );
}
