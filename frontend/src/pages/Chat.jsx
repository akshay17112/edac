import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Chat.css';

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

export default function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => { loadHistory(); }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadHistory = async () => {
    try {
      const res = await api.get('/chat/history');
      const reversed = [...res.data].reverse();
      const formatted = reversed.flatMap(item => [
        { role: 'user', text: item.message, time: item.created_at },
        { role: 'bot',  text: item.response, time: item.created_at },
      ]);
      setMessages(formatted);
    } catch (_) {}
    setHistoryLoaded(true);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setMessages(prev => [...prev, { role: 'user', text, time: new Date().toISOString() }]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chat/message', { message: text });
      setMessages(prev => [...prev, { role: 'bot', text: res.data.response, time: new Date().toISOString() }]);
    } catch (_) {
      setMessages(prev => [...prev, { role: 'bot', text: 'Something went wrong. Please try again.', time: new Date().toISOString(), error: true }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e); }
  };

  const fmt = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="chat-page">
      <aside className="chat-sidebar">
        <div className="sidebar-top">
          <h3>Assistant</h3>
          <div className="sidebar-status">
            <span className="online-dot" />
            Online
          </div>
        </div>

        <div className="sidebar-divider" />

        <div>
          <p className="sidebar-section-label">Signed in as</p>
          <div className="sidebar-user-card">
            <div className="avatar-circle">{user?.name?.[0]?.toUpperCase()}</div>
            <div className="sidebar-user-info">
              <p className="sidebar-user-name">{user?.name}</p>
              <p className="sidebar-user-email">{user?.email}</p>
            </div>
          </div>
        </div>

        <p className="sidebar-footer">
          Messages are saved to your history and visible only to you.
        </p>
      </aside>

      <div className="chat-main">
        <div className="chat-header">
          <div className="chat-header-avatar">🤖</div>
          <div className="chat-header-info">
            <h4>EDAC Assistant</h4>
            <span>Active now</span>
          </div>
        </div>

        <div className="chat-messages" role="log" aria-live="polite" aria-label="Chat messages">
          {!historyLoaded && (
            <div className="chat-empty">
              <div className="chat-empty-icon">⏳</div>
              <p>Loading your chat history…</p>
            </div>
          )}

          {historyLoaded && messages.length === 0 && (
            <div className="chat-empty">
              <div className="chat-empty-icon">💬</div>
              <p>Start a conversation with the EDAC Assistant</p>
              <small>Try: "Hello", "Tell me a joke", or "What can you do?"</small>
            </div>
          )}

          {messages.length > 0 && (
            <div className="date-separator">Today</div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`message-row ${msg.role}`}>
              <div className={`msg-avatar ${msg.role}`}>
                {msg.role === 'bot' ? 'AI' : user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="bubble-wrap">
                <div className={`bubble ${msg.role}${msg.error ? ' error' : ''}`}>
                  <p>{msg.text}</p>
                </div>
                <span className="msg-meta">{fmt(msg.time)}</span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="message-row bot">
              <div className="msg-avatar bot">AI</div>
              <div className="bubble-wrap">
                <div className="bubble bot typing">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <form className="chat-input-bar" onSubmit={sendMessage}>
          <div className="chat-input-inner">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              disabled={loading}
              aria-label="Message input"
              autoComplete="off"
            />
            <button type="submit" className="send-btn" disabled={loading || !input.trim()} aria-label="Send message">
              <SendIcon />
            </button>
          </div>
          <p className="chat-input-hint">Press Enter to send</p>
        </form>
      </div>
    </div>
  );
}
