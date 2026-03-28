import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { chatWithAssistant } from '../../lib/api';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'ai', content: 'Hi! I am your AI Hiring Assistant. I have read the entire resume database. Ask me to compare candidates or summarize skills!' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    
    const text = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      const res = await chatWithAssistant([...messages, { role: 'user', content: text }]);
      setMessages(prev => [...prev, { role: 'ai', content: res.data.content }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, my neural link to the backend failed. Is the server running?' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed', bottom: 32, right: 32,
            width: 60, height: 60, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-primary), #818CF8)',
            color: 'white', border: 'none',
            boxShadow: '0 10px 25px -5px rgba(99,102,241,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 9999
          }}
        >
          <MessageSquare size={28} />
        </motion.button>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed', bottom: 32, right: 32,
              width: 380, height: 600, maxHeight: '80vh',
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 24,
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              zIndex: 9999
            }}
          >
            {/* Header */}
            <div style={{ padding: '16px 20px', background: 'var(--color-module-1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'white' }}>
                <Bot size={20} />
                <span style={{ fontWeight: 600, letterSpacing: 0.5 }}>Hiring Assistant Copilot</span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {messages.map((m, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ 
                    display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, 
                    color: 'var(--color-text-muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' 
                  }}>
                    {m.role === 'user' ? 'You' : 'AI Assistant'}
                  </div>
                  <div style={{
                    padding: '12px 16px', borderRadius: 16, fontSize: 14, lineHeight: 1.5,
                    background: m.role === 'user' ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
                    color: m.role === 'user' ? 'white' : 'var(--color-text)',
                    borderBottomRightRadius: m.role === 'user' ? 4 : 16,
                    borderBottomLeftRadius: m.role === 'ai' ? 4 : 16,
                    maxWidth: '85%'
                  }}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-primary)' }}>
                  <Loader2 size={16} className="spin" /> <span style={{ fontSize: 13 }}>Analyzing database...</span>
                </div>
              )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} style={{ padding: 16, borderTop: '1px solid var(--color-border)', display: 'flex', gap: 8, background: 'rgba(0,0,0,0.2)' }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask about candidates..."
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: 999, border: '1px solid var(--color-border)',
                  background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 14, outline: 'none'
                }}
              />
              <button 
                type="submit" 
                disabled={!input.trim() || loading}
                style={{
                  width: 44, height: 44, borderRadius: '50%', border: 'none',
                  background: input.trim() ? 'var(--color-primary)' : 'var(--color-border)',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: input.trim() ? 'pointer' : 'default', transition: 'background 0.2s'
                }}
              >
                <Send size={18} style={{ position: 'relative', left: -1, top: 1 }} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
