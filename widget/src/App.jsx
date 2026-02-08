import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, X, ChevronDown, Sparkles, AlertCircle } from 'lucide-react';
import classNames from 'classnames';

/**
 * Insydr Chat Widget App
 * 
 * This component handles the chat UI and communicates with the Insydr backend.
 * 
 * Flow:
 * 1. On mount, sends /widget/init request with page data
 * 2. Backend validates domain and returns session_id + config
 * 3. Chat messages are sent to /widget/chat with session_id
 * 4. Events (open, close, feedback) are tracked via /widget/event
 */

export default function App({ agentId, apiBase, pageData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState(null);
  
  // Session and config from backend
  const [sessionId, setSessionId] = useState(null);
  const [config, setConfig] = useState(null);
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize widget on mount
  useEffect(() => {
    initializeWidget();
  }, [agentId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isOpen]);

  // Track widget open/close events
  useEffect(() => {
    if (isInitialized && sessionId) {
      trackEvent(isOpen ? 'widget_open' : 'widget_close');
    }
  }, [isOpen, isInitialized]);

  /**
   * Initialize widget with backend
   * Sends page data and receives session + config
   */
  const initializeWidget = async () => {
    setIsInitializing(true);
    setInitError(null);

    try {
      const response = await fetch(`${apiBase}/widget/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pageData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to initialize widget');
      }

      const data = await response.json();
      
      if (!data.allowed) {
        setInitError(data.error || 'This domain is not authorized to use this widget');
        setIsInitializing(false);
        return;
      }

      setSessionId(data.session_id);
      setConfig(data.widget_settings);
      setIsInitialized(true);

      // Set welcome message
      if (data.widget_settings?.welcomeMessage) {
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: data.widget_settings.welcomeMessage,
        }]);
      }

      console.log('[Insydr] Widget initialized successfully', { sessionId: data.session_id });

    } catch (error) {
      console.error('[Insydr] Initialization error:', error);
      setInitError(error.message || 'Failed to load chat widget');
    } finally {
      setIsInitializing(false);
    }
  };

  /**
   * Send chat message to backend
   */
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending || !sessionId) return;

    const userMsg = { 
      role: 'user', 
      content: input, 
      id: Date.now().toString() 
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const response = await fetch(`${apiBase}/widget/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: agentId,
          session_id: sessionId,
          message: userMsg.content,
          page_url: pageData.page_url,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response, 
        id: data.message_id || (Date.now() + 1).toString() 
      }]);

    } catch (error) {
      console.error('[Insydr] Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Sorry, something went wrong. Please try again.", 
        id: (Date.now() + 1).toString(),
        isError: true 
      }]);
    } finally {
      setSending(false);
    }
  };

  /**
   * Track analytics events
   */
  const trackEvent = async (eventType, eventData = {}) => {
    if (!sessionId) return;

    try {
      await fetch(`${apiBase}/widget/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: agentId,
          session_id: sessionId,
          event_type: eventType,
          event_data: eventData,
        }),
      });
    } catch (error) {
      console.error('[Insydr] Event tracking error:', error);
    }
  };

  // Loading state
  if (isInitializing) {
    return (
      <div className="fixed bottom-6 right-6 z-[999999]">
        <div className="w-14 h-14 rounded-full bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Error state (domain not allowed)
  if (initError) {
    return (
      <div className="fixed bottom-6 right-6 z-[999999]">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center cursor-pointer group" title={initError}>
          <AlertCircle className="w-7 h-7 text-red-500" />
        </div>
      </div>
    );
  }

  // Not initialized
  if (!isInitialized || !config) return null;

  const settings = {
    primaryColor: config.primaryColor || '#EF4444',
    position: config.position || 'bottom-right',
    agentName: config.agentName || 'Support',
    showPoweredBy: config.showPoweredBy !== false,
    theme: config.theme || 'auto',
  };

  const getPositionClasses = () => {
    switch (settings.position) {
      case 'bottom-left': return 'bottom-6 left-6';
      case 'top-right': return 'top-6 right-6';
      case 'top-left': return 'top-6 left-6';
      default: return 'bottom-6 right-6';
    }
  };

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
        <div 
          className="p-4 text-white flex items-center justify-between shadow-sm" 
          style={{ backgroundColor: settings.primaryColor }}
        >
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
          <button 
            onClick={() => setIsOpen(false)} 
            className="text-white/80 hover:text-white transition-colors"
          >
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
                  ${msg.isError ? 'bg-red-50 border-red-200 text-red-600' : ''}
                `}
                style={msg.role === 'user' && !msg.isError ? { backgroundColor: settings.primaryColor } : {}}
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
              disabled={!input.trim() || sending}
              className="absolute right-1.5 p-1.5 bg-white rounded-full shadow-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 transition-colors"
              style={{ color: input.trim() ? settings.primaryColor : undefined }}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          
          {settings.showPoweredBy && (
            <a 
              href="https://insydr.ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block text-center mt-2 no-underline hover:opacity-80 transition-opacity"
            >
              <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3" /> Powered by <span className="font-bold text-gray-500">Insydr</span>
              </p>
            </a>
          )}
        </div>
      </div>

      {/* Launcher Button */}
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
