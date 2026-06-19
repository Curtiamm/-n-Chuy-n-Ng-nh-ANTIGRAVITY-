import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, RotateCcw, Headphones, MessageCircle, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/lib/AuthContext';

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
  const isUser = msg.role === 'user' || msg.sender === 'user';
  const isSystem = msg.senderName === 'Hệ thống';
  
  if (isSystem) {
    return (
      <div className="flex justify-center my-2 animate-fade-in">
        <span className="text-[10px] font-inter bg-amber-500/10 text-amber-600 px-3 py-1 rounded-full border border-amber-500/20 shadow-sm">
          {msg.content}
        </span>
      </div>
    );
  }

  const displayName = msg.senderName || (isUser ? 'Thí sinh' : 'Heulwen AI');

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} chat-message animate-fade-in`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1A3A6B] to-[#C8A951] flex items-center justify-center shrink-0 mt-1 shadow-sm">
          {msg.sender === 'staff' ? (
            <Headphones className="w-4 h-4 text-white" />
          ) : (
            <Sparkles className="w-4 h-4 text-white" />
          )}
        </div>
      )}
      <div className={`max-w-[78%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {!isUser && (
          <span className="text-[10px] font-semibold text-gray-500 font-inter px-1">
            {displayName}
          </span>
        )}
        <div className={`px-4 py-3 rounded-2xl text-sm font-inter leading-relaxed ${
          isUser
            ? 'bg-[#1A3A6B] text-white rounded-tr-sm'
            : 'bg-white border border-[#C8A951]/20 text-[#0A1931] rounded-tl-sm shadow-sm'
        }`}>
          {isUser || msg.sender === 'staff' ? (
            <p className="whitespace-pre-wrap">{msg.content}</p>
          ) : (
            <ReactMarkdown
              className="prose prose-sm max-w-none prose-p:my-1 prose-headings:font-playfair prose-strong:text-[#1A3A6B]"
              components={{
                a: ({ node, ...props }) => (
                  <a
                    {...props}
                    className="text-[#C8A951] font-semibold underline underline-offset-4 decoration-[#C8A951]/40 hover:text-[#b09340] hover:decoration-[#b09340] transition-colors cursor-pointer"
                    target="_blank"
                    rel="noreferrer"
                  />
                )
              }}
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

export default function HeulwenChatbot({ isOpen, onClose, initialMessage }) {
  const { user } = useAuth();
  
  // AI Chat States
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

  // Live Chat States
  const [liveChatSessionId, setLiveChatSessionId] = useState(null);
  const [liveChatSession, setLiveChatSession] = useState(null);
  const [showConnectForm, setShowConnectForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  // Check existing session on mount
  useEffect(() => {
    const savedSessionId = localStorage.getItem('liveChatSessionId');
    if (savedSessionId) {
      setLiveChatSessionId(savedSessionId);
    }
  }, []);

  // Autofill form if user is logged in
  useEffect(() => {
    if (user) {
      setFormName(user.name || '');
      setFormEmail(user.email || '');
    }
  }, [user]);

  // Polling Live Chat session details
  useEffect(() => {
    if (!liveChatSessionId) {
      setLiveChatSession(null);
      return;
    }

    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/live-chats/${liveChatSessionId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.session) {
            setLiveChatSession(data.session);
          }
        } else if (res.status === 404) {
          // Closed or resolved by admin
          setLiveChatSessionId(null);
          setLiveChatSession(null);
          localStorage.removeItem('liveChatSessionId');
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'Cán bộ tuyển sinh đã kết thúc phiên hỗ trợ trực tuyến. Bạn đang được chuyển về kết nối với trợ lý AI.',
            timestamp: new Date().toISOString()
          }]);
        }
      } catch (err) {
        console.error("Lỗi polling live chat:", err);
      }
    };

    fetchSession();
    const interval = setInterval(fetchSession, 2000);
    return () => clearInterval(interval);
  }, [liveChatSessionId]);

  // Auto Scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, liveChatSession?.messages, loading]);

  const processedInitialMsgRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
      if (initialMessage && processedInitialMsgRef.current !== initialMessage) {
        processedInitialMsgRef.current = initialMessage;
        sendMessage(initialMessage);
      }
    } else {
      processedInitialMsgRef.current = null;
    }
  }, [isOpen, initialMessage]);

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg) return;
    setInput('');

    if (liveChatSessionId) {
      // Send message to Live Chat Queue
      try {
        const response = await fetch(`/api/live-chats/${liveChatSessionId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender: 'user',
            senderName: liveChatSession?.user_name || 'Thí sinh',
            content: userMsg
          })
        });
        if (response.ok) {
          const data = await response.json();
          if (data.session) {
            setLiveChatSession(data.session);
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          if (errData.error) {
            setLiveChatSession(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                messages: [
                  ...prev.messages,
                  {
                    sender: 'system',
                    senderName: 'Hệ thống',
                    content: `⚠️ ${errData.error}`,
                    timestamp: new Date().toISOString()
                  }
                ]
              };
            });
          }
        }
      } catch (err) {
        console.error("Lỗi gửi tin nhắn trực tiếp:", err);
      }
      return;
    }

    // Send message to AI Chatbot
    if (loading) return;
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

      let data;
      try {
        data = await response.json();
      } catch (jsonErr) {
        // Non-JSON response
      }

      if (!response.ok) {
        if (data && data.reply) {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: data.reply, 
            timestamp: new Date().toISOString() 
          }]);
          return;
        }
        throw new Error('Network response was not ok');
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.reply, 
        timestamp: new Date().toISOString() 
      }]);
    } catch (error) {
      console.error("Lỗi kết nối:", error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Oops! Đã có lỗi xảy ra khi gọi trợ lý AI. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau nhé!", 
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

  const startLiveChatConnection = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formName.trim() || !formEmail.trim()) {
      setFormError('Vui lòng điền đầy đủ Họ tên và Email.');
      return;
    }

    setIsSubmittingForm(true);
    try {
      const response = await fetch('/api/live-chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName, email: formEmail })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Không thể tạo phòng chat.');

      setLiveChatSessionId(data.session.id);
      setLiveChatSession(data.session);
      localStorage.setItem('liveChatSessionId', data.session.id);
      setShowConnectForm(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const closeLiveChatSession = () => {
    if (window.confirm("Bạn có chắc chắn muốn thoát phòng hỗ trợ trực tuyến và quay về chat với AI?")) {
      if (liveChatSessionId) {
        // Notify backend of resolving/closing
        fetch(`/api/live-chats/${liveChatSessionId}/resolve`, { method: 'POST' })
          .catch(e => console.error(e));
      }
      setLiveChatSessionId(null);
      setLiveChatSession(null);
      localStorage.removeItem('liveChatSessionId');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Đã đóng live chat. Bạn đang kết nối với Heulwen AI.',
        timestamp: new Date().toISOString()
      }]);
    }
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
            {/* Chat Widget Header */}
            <div className="bg-gradient-to-r from-[#1A3A6B] to-[#0A1931] px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#C8A951] flex items-center justify-center shadow-lg">
                  {liveChatSessionId ? (
                    <Headphones className="w-5 h-5 text-[#0A1931]" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <div className="font-playfair text-white text-lg font-semibold">
                    {liveChatSessionId ? 'Cán bộ Tuyển sinh' : 'Heulwen AI'}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-300 text-xs font-inter">
                      {liveChatSessionId 
                        ? (liveChatSession?.assigned_staff_name 
                          ? `Hỗ trợ: ${liveChatSession.assigned_staff_name}` 
                          : 'Đang kết nối...') 
                        : 'Đang hoạt động'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {liveChatSessionId ? (
                  <button
                    type="button"
                    onClick={closeLiveChatSession}
                    className="p-2 text-red-400 hover:text-red-300 transition-colors"
                    title="Thoát Live Chat"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowConnectForm(true)}
                      className="p-2 text-white/50 hover:text-[#C8A951] transition-colors"
                      title="Gặp Cán bộ tuyển sinh trực tuyến"
                    >
                      <Headphones className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={clearChat}
                      className="p-2 text-white/50 hover:text-[#C8A951] transition-colors"
                      title="Cuộc trò chuyện mới"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-white/50 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Messages Panel */}
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 bg-[#FCFCFD]">
              {liveChatSessionId && liveChatSession ? (
                liveChatSession.messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)
              ) : (
                messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)
              )}
              
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

            {/* Quick Questions (only in AI mode) */}
            {!liveChatSessionId && messages.length <= 1 && !showConnectForm && (
              <div className="px-4 py-3 bg-[#FCFCFD] border-t border-gray-100">
                <p className="text-xs font-inter text-gray-400 mb-2">Câu hỏi gợi ý:</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_QUESTIONS.map(q => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => sendMessage(q)}
                      className="text-xs font-inter px-3 py-1.5 border border-[#C8A951]/40 text-[#1A3A6B] rounded-full hover:bg-[#C8A951]/10 hover:border-[#C8A951] transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input / Messaging bar */}
            <form 
              onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
              className="px-4 py-4 bg-white border-t border-gray-100 shrink-0"
            >
              <div className="flex items-end gap-3 bg-gray-50 rounded-2xl border border-gray-200 px-4 py-2 focus-within:border-[#C8A951] transition-colors">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder={liveChatSessionId ? "Nhắn tin cho cán bộ tuyển sinh..." : "Nhập câu hỏi của bạn..."}
                  rows={1}
                  className="flex-1 bg-transparent resize-none font-inter text-sm text-[#0A1931] placeholder-gray-400 outline-none py-1"
                  style={{ maxHeight: '120px', overflowY: 'auto' }}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="w-9 h-9 rounded-xl bg-[#1A3A6B] hover:bg-[#C8A951] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 shrink-0 mb-0.5 shadow-md"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
              <p className="text-center text-[10px] font-inter text-gray-400 mt-2">
                {liveChatSessionId 
                  ? "Đang kết nối live chat trực tiếp với Cán bộ."
                  : "Heulwen AI có thể mắc lỗi. Vui lòng xác minh thông tin quan trọng."}
              </p>
            </form>

            {/* Form overlay to start Live Chat */}
            <AnimatePresence>
              {showConnectForm && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 30 }}
                  className="absolute inset-0 bg-[#0A1931]/95 backdrop-blur-md z-50 flex flex-col justify-center p-6 text-white"
                >
                  <button 
                    type="button"
                    onClick={() => setShowConnectForm(false)} 
                    className="absolute top-4 right-4 text-white/60 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="text-center mb-6">
                    <Headphones className="w-12 h-12 text-[#C8A951] mx-auto mb-3" />
                    <h3 className="font-playfair text-xl font-bold text-white">Kết Nối Cán Bộ Tuyển Sinh</h3>
                    <p className="text-xs text-white/60 font-inter mt-1.5 max-w-xs mx-auto">
                      Hệ thống sẽ gửi yêu cầu và thông báo đẩy trực tiếp tới điện thoại của các cán bộ tuyển sinh rảnh gần nhất.
                    </p>
                  </div>

                  <form onSubmit={startLiveChatConnection} className="space-y-4">
                    <div>
                      <label className="block text-xs font-inter text-white/75 mb-1.5 font-medium">Họ và tên thí sinh</label>
                      <input 
                        type="text" 
                        value={formName}
                        onChange={e => setFormName(e.target.value)}
                        placeholder="Nguyễn Văn A"
                        required
                        disabled={isSubmittingForm}
                        className="w-full font-inter text-sm bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-[#C8A951] outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-inter text-white/75 mb-1.5 font-medium">Địa chỉ Email</label>
                      <input 
                        type="email" 
                        value={formEmail}
                        onChange={e => setFormEmail(e.target.value)}
                        placeholder="vanya@gmail.com"
                        required
                        disabled={isSubmittingForm}
                        className="w-full font-inter text-sm bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-[#C8A951] outline-none transition-all"
                      />
                    </div>

                    {formError && (
                      <p className="text-xs font-inter text-red-400 text-center font-medium bg-red-950/40 border border-red-500/20 py-2 rounded-lg">
                        ⚠️ {formError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmittingForm}
                      className="w-full font-inter text-sm bg-gradient-to-r from-[#C8A951] to-[#b09340] hover:brightness-110 active:brightness-95 text-[#0A1931] font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmittingForm ? 'Đang gửi yêu cầu kết nối...' : 'Bắt Đầu Chat Trực Tiếp'}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}