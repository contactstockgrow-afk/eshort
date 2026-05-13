import React, { useState, useRef, useEffect } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import { sendChatMessage } from '../services/api';

const QUICK_QUESTIONS = [
  'نماز کا طریقہ بتائیں',
  'وضو کے فرائض کیا ہیں؟',
  'زکوٰۃ کس پر فرض ہے؟',
  'سورۃ الفاتحہ کی تفسیر',
  'حج کے فرائض بتائیں',
  'روزے کے مسائل',
];

function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text = null) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: messageText }]);
    setLoading(true);

    try {
      const response = await sendChatMessage(messageText, sessionId);
      setSessionId(response.session_id);
      setMessages(prev => [...prev, { role: 'assistant', content: response.response }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'معذرت، جواب دینے میں مشکل ہو رہی ہے۔ براہ کرم دوبارہ کوشش کریں۔'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            {/* Welcome */}
            <div className="text-center">
              <div className="w-20 h-20 rounded-full gradient-islamic flex items-center justify-center text-3xl mx-auto mb-4 islamic-border islamic-glow">
                📖
              </div>
              <h2 className="text-xl font-bold text-[#d4a017] font-urdu mb-2">
                اسلامی سوال کریں
              </h2>
              <p className="text-sm text-gray-400 font-urdu leading-relaxed max-w-xs mx-auto">
                قرآن، حدیث اور علمائے دیوبند کی کتابوں سے تفصیلی جواب حاصل کریں
              </p>
            </div>

            {/* Quick Questions */}
            <div className="w-full max-w-sm">
              <p className="text-xs text-gray-500 font-urdu mb-3 text-center">
                جلدی سوال کریں:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {QUICK_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    className="text-xs px-3 py-2 rounded-xl bg-[#1a1a2e] text-gray-300 border border-gray-700 hover:border-[#d4a017]/50 hover:text-[#d4a017] transition-all font-urdu"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'} fade-in`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full gradient-islamic flex items-center justify-center text-sm ml-2 flex-shrink-0 islamic-border">
                    📖
                  </div>
                )}
                <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                  <p className="text-sm font-urdu leading-loose whitespace-pre-line">
                    {msg.content}
                  </p>
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-[#d4a017] flex items-center justify-center text-sm mr-2 flex-shrink-0">
                    👤
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-end fade-in">
                <div className="w-8 h-8 rounded-full gradient-islamic flex items-center justify-center text-sm ml-2 flex-shrink-0 islamic-border">
                  📖
                </div>
                <div className="chat-bubble-ai">
                  <div className="flex gap-1 items-center">
                    <div className="w-2 h-2 bg-[#d4a017] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-[#d4a017] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-[#d4a017] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="px-4 py-3 bg-[#1a1a2e] border-t border-[rgba(212,160,23,0.2)]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="btn-primary p-3 rounded-xl disabled:opacity-50"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: 'scaleX(-1)' }}>
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="اپنا اسلامی سوال یہاں لکھیں..."
            className="flex-1 bg-[#0f0f1a] text-white rounded-xl px-4 py-3 text-sm font-urdu resize-none border border-gray-700 focus:border-[#d4a017]/50 focus:outline-none transition-all"
            rows="1"
            dir="rtl"
          />
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
