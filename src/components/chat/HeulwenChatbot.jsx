import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

const QUICK_QUESTIONS = [
  'Ngành nào có điểm chuẩn thấp nhất?',
  'Hồ sơ xét tuyển cần những gì?',
  'Học phí ngành Sư phạm bao nhiêu?',
  'KTX có bao nhiêu chỗ?',
];

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="thinking-dot w-2 h-2 rounded-full bg-[#C8A951]"
          style={{ animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </div>
  );
}

function ChatMessage({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} chat-message`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1A3A6B] to-[#C8A951] flex items-center justify-center shrink-0 mt-1">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      )}
      <div className={`max-w-[78%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`px-4 py-3 rounded-2xl text-sm font-inter leading-relaxed ${
          isUser
            ? 'bg-[#1A3A6B] text-white rounded-tr-sm'
            : 'bg-white border border-[#C8A951]/20 text-[#0A1931] rounded-tl-sm shadow-sm'
        }`}>
          {isUser ? (
            <p>{msg.content}</p>
          ) : (
            <ReactMarkdown
              className="prose prose-sm max-w-none prose-p:my-1 prose-headings:font-playfair prose-strong:text-[#1A3A6B] prose-a:text-[#C8A951]"
            >
              {msg.content}
            </ReactMarkdown>
          )}
        </div>
        <span className="text-[10px] text-gray-400 font-inter px-1">
          {new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

export default function HeulwenChatbot({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Xin chào! Tôi là **Heulwen** — trợ lý AI tư vấn tuyển sinh của Đại học Vinh.\n\nTôi có thể giúp bạn tìm hiểu về ngành học, điểm chuẩn, hồ sơ đăng ký, học phí và học bổng. Bạn muốn hỏi gì?',
      timestamp: new Date().toISOString(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput('');

    const newMsg = { role: 'user', content: userMsg, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, newMsg]);
    setLoading(true);

    try {
      const formattedHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }));
      
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...formattedHistory, newMsg] })
      });

      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.reply, 
        timestamp: new Date().toISOString() 
      }]);
    } catch (error) {
      console.error("Lỗi kết nối:", error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Oops! Đã có lỗi xảy ra. Vui lòng thử lại sau nhé!", 
        timestamp: new Date().toISOString() 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: 'Cuộc trò chuyện mới bắt đầu! Tôi có thể giúp gì cho bạn?',
      timestamp: new Date().toISOString(),
    }]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0A1931]/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full md:w-[420px] z-50 flex flex-col glass-panel shadow-2xl border-l border-[#C8A951]/20"
          >
            <div className="bg-gradient-to-r from-[#1A3A6B] to-[#0A1931] px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#C8A951] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-playfair text-white text-lg font-semibold">Heulwen AI</div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-300 text-xs font-inter">Đang hoạt động</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearChat}
                  className="p-2 text-white/50 hover:text-[#C8A951] transition-colors"
                  title="Cuộc trò chuyện mới"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-white/50 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 bg-[#FCFCFD]">
              {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
              {loading && (
                <div className="flex gap-3 chat-message">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1A3A6B] to-[#C8A951] flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white border border-[#C8A951]/20 rounded-2xl rounded-tl-sm shadow-sm">
                    <ThinkingDots />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            {messages.length <= 1 && (
              <div className="px-4 py-3 bg-[#FCFCFD] border-t border-gray-100">
                <p className="text-xs font-inter text-gray-400 mb-2">Câu hỏi gợi ý:</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_QUESTIONS.map(q => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="text-xs font-inter px-3 py-1.5 border border-[#C8A951]/40 text-[#1A3A6B] rounded-full hover:bg-[#C8A951]/10 hover:border-[#C8A951] transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="px-4 py-4 bg-white border-t border-gray-100 shrink-0">
              <div className="flex items-end gap-3 bg-gray-50 rounded-2xl border border-gray-200 px-4 py-2 focus-within:border-[#C8A951] transition-colors">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Nhập câu hỏi của bạn..."
                  rows={1}
                  className="flex-1 bg-transparent resize-none font-inter text-sm text-[#0A1931] placeholder-gray-400 outline-none py-1"
                  style={{ maxHeight: '120px', overflowY: 'auto' }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  className="w-9 h-9 rounded-xl bg-[#1A3A6B] hover:bg-[#C8A951] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 shrink-0 mb-0.5"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
              <p className="text-center text-[10px] font-inter text-gray-400 mt-2">
                Heulwen AI có thể mắc lỗi. Vui lòng xác minh thông tin quan trọng.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}