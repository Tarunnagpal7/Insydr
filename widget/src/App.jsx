import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, X, Send, Trash2, ThumbsUp, ThumbsDown, FileText, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// ─── Relative time helper ───
function timeAgo(date) {
  const seconds = Math.floor((Date.now() - date) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ─── Source Citation Badge ───
function SourceBadge({ source, index, onClick }) {
  return (
    <button
      onClick={() => onClick(source)}
      className="insydr-source-badge"
      title={source.title}
    >
      <FileText size={10} />
      <span>{index + 1}. {source.title.length > 25 ? source.title.slice(0, 25) + '…' : source.title}</span>
    </button>
  );
}

// ─── Source Popover ───
function SourcePopover({ source, onClose }) {
  if (!source) return null;
  return (
    <div className="insydr-source-popover">
      <div className="insydr-source-popover-header">
        <FileText size={14} />
        <span>{source.title}</span>
        <button onClick={onClose}><X size={14} /></button>
      </div>
      <div className="insydr-source-popover-body">
        <p>Relevance: {Math.round(source.score * 100)}%</p>
      </div>
    </div>
  );
}

// ─── Typing indicator ───
function TypingIndicator() {
  return (
    <div className="insydr-typing">
      <span></span><span></span><span></span>
    </div>
  );
}

// ─── Message Component ───
function ChatMessage({ msg, config, agentId, sessionId, apiBase, onFeedback }) {
  const [feedback, setFeedback] = useState(null);
  const [activeSource, setActiveSource] = useState(null);

  const handleFeedback = async (type) => {
    if (feedback) return;
    setFeedback(type);
    onFeedback(msg.id, type);
    
    if (msg.messageId) {
      try {
        await fetch(`${apiBase}/widget/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agent_id: agentId,
            session_id: sessionId,
            message_id: msg.messageId,
            feedback_type: type,
          }),
        });
      } catch (e) {
        console.warn('Feedback send failed:', e);
      }
    }
  };

  const isBot = msg.role === 'assistant';
  const isUser = msg.role === 'user';

  return (
    <div className={`insydr-msg ${isUser ? 'insydr-msg-user' : 'insydr-msg-bot'}`}>
      {isBot && config?.avatarUrl && (
        <img src={config.avatarUrl} alt="" className="insydr-avatar" />
      )}
      <div className="insydr-msg-bubble-wrap">
        <div
          className={`insydr-msg-bubble ${isUser ? 'insydr-bubble-user' : 'insydr-bubble-bot'}`}
          style={isUser ? { backgroundColor: config?.primaryColor || '#EF4444' } : {}}
        >
          {isBot ? (
            <div className="insydr-markdown">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          ) : (
            <span>{msg.content}</span>
          )}
        </div>

        {/* Source citations */}
        {isBot && msg.sources && msg.sources.length > 0 && (
          <div className="insydr-sources">
            {msg.sources.map((src, i) => (
              <SourceBadge key={i} source={src} index={i} onClick={setActiveSource} />
            ))}
          </div>
        )}

        {activeSource && (
          <SourcePopover source={activeSource} onClose={() => setActiveSource(null)} />
        )}

        <div className="insydr-msg-meta">
          <span className="insydr-time">{timeAgo(msg.timestamp)}</span>
          {isBot && msg.content && (
            <div className="insydr-feedback-btns">
              <button
                onClick={() => handleFeedback('thumbs_up')}
                className={`insydr-fb-btn ${feedback === 'thumbs_up' ? 'active-up' : ''}`}
                disabled={!!feedback}
                title="Helpful"
              >
                <ThumbsUp size={12} />
              </button>
              <button
                onClick={() => handleFeedback('thumbs_down')}
                className={`insydr-fb-btn ${feedback === 'thumbs_down' ? 'active-down' : ''}`}
                disabled={!!feedback}
                title="Not helpful"
              >
                <ThumbsDown size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ─── Main App ───
export default function App({ agentId, apiBase, apiKey, pageData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [config, setConfig] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [showScrollDown, setShowScrollDown] = useState(false);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const textareaRef = useRef(null);

  // ─── Auto-scroll ───
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!sending) scrollToBottom();
  }, [messages, sending, scrollToBottom]);

  // Detect if user scrolled up
  const handleScroll = () => {
    const el = chatContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setShowScrollDown(!atBottom);
  };

  // ─── Initialize ───
  const initializeWidget = useCallback(async () => {
    if (isInitialized) return;
    try {
      const res = await fetch(`${apiBase}/widget/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: agentId,
          api_key: apiKey,
          page_url: pageData?.url || window.location.href,
          page_title: pageData?.title || document.title,
          referrer: document.referrer,
          language: navigator.language,
        }),
      });
      const data = await res.json();

      if (!data.allowed) {
        setError(data.error || 'Widget not allowed on this domain.');
        return;
      }

      setSessionId(data.session_id);
      setConfig(data.widget_settings);
      setIsInitialized(true);

      // Welcome message
      if (data.widget_settings?.welcomeMessage) {
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: data.widget_settings.welcomeMessage,
          timestamp: Date.now(),
        }]);
      }

      // Auto-open with delay
      const autoDelay = data.widget_settings?.autoOpenDelay;
      if (autoDelay && autoDelay > 0 && !isOpen) {
        setTimeout(() => setIsOpen(true), autoDelay * 1000);
      }
    } catch (e) {
      console.error('Widget init error:', e);
      setError('Failed to connect. Please try again.');
    }
  }, [agentId, apiBase, apiKey, pageData, isInitialized, isOpen]);

  useEffect(() => {
    initializeWidget();
  }, [initializeWidget]);

  // ─── Track open/close ───
  const trackEvent = useCallback(async (eventType, eventData = {}) => {
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
    } catch (e) { /* silent */ }
  }, [agentId, apiBase, sessionId]);

  const toggleWidget = () => {
    const next = !isOpen;
    setIsOpen(next);
    trackEvent(next ? 'widget_open' : 'widget_close');
  };

  // ─── Send message (streaming) ───
  const handleSendMessage = async (e) => {
    e?.preventDefault?.();
    const text = input.trim();
    if (!text || sending || !sessionId) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);
    setIsStreaming(true);

    // Add placeholder bot message
    const botMsgId = `bot-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: botMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      streaming: true,
    }]);

    try {
      const res = await fetch(`${apiBase}/widget/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: agentId,
          session_id: sessionId,
          message: text,
          page_url: window.location.href,
        }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let sources = [];
      let messageId = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          
          if (payload === '[DONE]') continue;
          
          try {
            const data = JSON.parse(payload);
            
            if (data.token) {
              setMessages(prev => prev.map(m =>
                m.id === botMsgId
                  ? { ...m, content: m.content + data.token }
                  : m
              ));
              scrollToBottom();
            }
            
            if (data.sources) {
              sources = data.sources;
            }
            
            if (data.message_id) {
              messageId = data.message_id;
            }
          } catch (parseErr) {
            // Skip malformed JSON
          }
        }
      }

      // Finalize the message
      setMessages(prev => prev.map(m =>
        m.id === botMsgId
          ? { ...m, streaming: false, sources, messageId }
          : m
      ));

    } catch (err) {
      console.error('Stream error:', err);
      setMessages(prev => prev.map(m =>
        m.id === botMsgId
          ? { ...m, content: 'Sorry, something went wrong. Please try again.', streaming: false }
          : m
      ));
    } finally {
      setSending(false);
      setIsStreaming(false);
    }
  };

  // ─── Quick reply ───
  const handleQuickReply = (question) => {
    setInput(question);
    // Send immediately
    const text = question.trim();
    if (!text || sending || !sessionId) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    
    // Trigger send via effect
    setTimeout(() => {
      const fakeEvent = { preventDefault: () => {} };
      // We need to manually trigger the stream since input was set and cleared
      sendStream(text);
    }, 0);
  };

  // Extracted send logic
  const sendStream = async (text) => {
    if (!text || sending || !sessionId) return;
    setSending(true);
    setIsStreaming(true);

    const botMsgId = `bot-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: botMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      streaming: true,
    }]);

    try {
      const res = await fetch(`${apiBase}/widget/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: agentId,
          session_id: sessionId,
          message: text,
          page_url: window.location.href,
        }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let sources = [];
      let messageId = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') continue;
          try {
            const data = JSON.parse(payload);
            if (data.token) {
              setMessages(prev => prev.map(m =>
                m.id === botMsgId ? { ...m, content: m.content + data.token } : m
              ));
              scrollToBottom();
            }
            if (data.sources) sources = data.sources;
            if (data.message_id) messageId = data.message_id;
          } catch { /* skip */ }
        }
      }

      setMessages(prev => prev.map(m =>
        m.id === botMsgId ? { ...m, streaming: false, sources, messageId } : m
      ));
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === botMsgId ? { ...m, content: 'Sorry, something went wrong.', streaming: false } : m
      ));
    } finally {
      setSending(false);
      setIsStreaming(false);
    }
  };

  // ─── Clear chat ───
  const clearChat = () => {
    setMessages(config?.welcomeMessage ? [{
      id: 'welcome',
      role: 'assistant',
      content: config.welcomeMessage,
      timestamp: Date.now(),
    }] : []);
  };

  // ─── Keyboard (Enter/Shift+Enter) ───
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // ─── Auto-resize textarea ───
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 100) + 'px';
    }
  }, [input]);

  // ─── Theme ───
  const resolvedTheme = (() => {
    const t = config?.theme || 'auto';
    if (t === 'auto') {
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return t;
  })();

  // ─── Position ───
  const position = config?.position || 'bottom-right';
  const isLeft = position === 'bottom-left';

  // ─── Primary color ───
  const primaryColor = config?.primaryColor || '#EF4444';
  const accentColor = config?.accentColor || '#3B82F6';
  const borderRadius = config?.borderRadius ?? 16;

  // Don't render if error
  if (error) return null;

  const showSuggestions = config?.suggestedQuestions?.length > 0 && messages.length <= 1;

  return (
    <div
      className={`insydr-widget ${resolvedTheme}`}
      style={{
        '--insydr-primary': primaryColor,
        '--insydr-accent': accentColor,
        '--insydr-radius': `${borderRadius}px`,
        [isLeft ? 'left' : 'right']: '20px',
        bottom: '20px',
        position: 'fixed',
        zIndex: 2147483647,
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* ─── Chat Window ─── */}
      {isOpen && isInitialized && (
        <div className={`insydr-window ${resolvedTheme}`} style={{ borderRadius: `${borderRadius}px`, [isLeft ? 'left' : 'right']: 0 }}>
          {/* Header */}
          <div className="insydr-header" style={{ background: primaryColor }}>
            <div className="insydr-header-left">
              {config?.avatarUrl && (
                <img src={config.avatarUrl} alt="" className="insydr-header-avatar" />
              )}
              <div>
                <div className="insydr-header-name">{config?.agentName || 'Assistant'}</div>
                {config?.subtitle && (
                  <div className="insydr-header-subtitle">{config.subtitle}</div>
                )}
              </div>
            </div>
            <div className="insydr-header-actions">
              <button onClick={clearChat} title="Clear chat" className="insydr-header-btn">
                <Trash2 size={16} />
              </button>
              <button onClick={toggleWidget} title="Close" className="insydr-header-btn">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            className="insydr-messages"
            ref={chatContainerRef}
            onScroll={handleScroll}
          >
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                msg={msg}
                config={config}
                agentId={agentId}
                sessionId={sessionId}
                apiBase={apiBase}
                onFeedback={() => {}}
              />
            ))}

            {/* Streaming typing indicator */}
            {isStreaming && messages[messages.length - 1]?.content === '' && (
              <div className="insydr-msg insydr-msg-bot">
                <div className="insydr-msg-bubble-wrap">
                  <div className="insydr-msg-bubble insydr-bubble-bot">
                    <TypingIndicator />
                  </div>
                </div>
              </div>
            )}



            <div ref={messagesEndRef} />
          </div>

          {/* Scroll-down button */}
          {showScrollDown && (
            <button className="insydr-scroll-down" onClick={scrollToBottom}>
              <ChevronDown size={16} />
            </button>
          )}

          {/* Suggested questions — pinned above input */}
          {showSuggestions && (
            <div className="insydr-suggestions">
              {config.suggestedQuestions.map((q, i) => (
                <button key={i} className="insydr-suggestion-btn" onClick={() => handleQuickReply(q)}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="insydr-input-area">
            <form onSubmit={handleSendMessage} className="insydr-input-form">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={1}
                disabled={sending}
                className="insydr-input"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="insydr-send-btn"
                style={{ backgroundColor: primaryColor }}
              >
                <Send size={16} />
              </button>
            </form>

            {config?.showPoweredBy && (
              <div className="insydr-powered">
                Powered by <a href="https://insydr.ai" target="_blank" rel="noopener noreferrer">Insydr</a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Launcher ─── */}
      <button
        className="insydr-launcher"
        onClick={toggleWidget}
        style={{ backgroundColor: primaryColor }}
      >
        {isOpen ? <X size={24} color="#fff" /> : <MessageSquare size={24} color="#fff" />}
      </button>
    </div>
  );
}
