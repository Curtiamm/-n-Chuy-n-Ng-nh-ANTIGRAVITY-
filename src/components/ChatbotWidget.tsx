import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, HelpCircle, Loader2, Sparkles, GraduationCap, ArrowDownCircle, Info } from "lucide-react";
import { ChatMessage } from "../types";

interface ChatbotWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  setSelectedMajorForReg: (majorCode: string) => void;
  setActiveTab: (tab: string) => void;
}

export default function ChatbotWidget({ isOpen, onClose, onOpen, setSelectedMajorForReg, setActiveTab }: ChatbotWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-msg",
      role: "model",
      text: "Chào em! Chị là **Trợ lý Tuyển sinh AI Vinh Uni** 🌟. Chị ở đây để hướng dẫn em làm hồ sơ nguyện vọng trực tuyến, giải đáp thắc mắc về điểm chuẩn các năm, các chương trình miễn giảm học phí và tư vấn cơ hội học bổng Đại học Vinh 24/7.\n\nEm đang quan tâm đến ngành học hay quỹ học bổng nào của trường mình thế?",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Suggested Instant questions
  const SUGGESTS = [
    { label: "Điểm chuẩn CNTT năm ngoái?", text: "Cho em hỏi điểm chuẩn ngành Công nghệ thông tin năm ngoái bao nhiêu và có bao nhiêu chỉ tiêu tuyển?" },
    { label: "Học bổng Thủ khoa là gì?", text: "Làm sao em có thể tham gia ứng cử nhận Học bổng Thủ khoa xét tuyển trọn khóa học Đại học Vinh?" },
    { label: "Miễn học phí ngành Sư phạm?", text: "Chính sách miễn học phí và hỗ trợ tiền học sinh hoạt cho khối ngành đào tạo Sư phạm như thế nào?" },
    { label: "Cách nộp học bạ online?", text: "Hướng dẫn em cách điền form đăng ký nguyện vọng trực tuyến và tải học bạ số hóa ngay trên trang web này với." }
  ];

  // Auto Scroll Chat list to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-msg-${Date.now()}`,
      role: "user",
      text: textToSend,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
      // Map chat messages format for API history payload
      const chatHistory = messages.map((m) => ({
        role: m.role,
        text: m.text
      }));

      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend, chatHistory })
      });

      if (!response.ok) {
        throw new Error("Lỗi kết nối Trợ lý Tuyển sinh AI.");
      }

      const result = await response.json();
      
      const botMsg: ChatMessage = {
        id: `bot-msg-${Date.now()}`,
        role: "model",
        text: result.reply,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (e: any) {
      const errorMsg: ChatMessage = {
        id: `err-msg-${Date.now()}`,
        role: "model",
        text: "Chào em! Hiện hòm thư kết nối dữ liệu ban tuyển sinh đang bận xử lý điểm số học kì. Em hãy kiểm tra xem mạng internet có ổn định không hoặc đặt câu hỏi khác giúp chị nhé!",
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Render text containing custom bold formatting or linebreaks elegantly
  const renderMessageText = (txt: string) => {
    return txt.split("\n").map((line, lIdx) => {
      // Very basic formatting for bold marked texts: **word** to <strong>word</strong>
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="text-blue-900 font-bold">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }

      return (
        <p key={lIdx} className="mb-1.5 leading-relaxed font-sans text-xs">
          {parts.length > 0 ? parts : line}
        </p>
      );
    });
  };

  return (
    <>
      {/* 1. Floating round button trigger when closed */}
      {!isOpen && (
        <button
          onClick={onOpen}
          id="btn-chatbot-float-bubble"
          className="fixed bottom-6 right-6 p-4 bg-blue-900 hover:bg-slate-800 text-amber-300 rounded-full shadow-2xl hover:scale-110 transition-all cursor-pointer z-50 animate-bounce flex items-center justify-center border-2 border-amber-400 group"
          title="Mở chatbot tư vấn tuyển sinh Vinh Uni tự động 24/7"
        >
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
          <MessageSquare className="w-6 h-6 text-amber-300" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-32 group-hover:ml-2 transition-all duration-300 whitespace-nowrap text-xs font-bold text-amber-300 font-sans">
            AI Tư vấn tuyển sinh
          </span>
        </button>
      )}

      {/* 2. Embedded chatbot panel when open */}
      {isOpen && (
        <div 
          id="panel-chatbot-chat-window"
          className="fixed bottom-6 right-6 w-11/12 sm:w-96 h-[510px] bg-white rounded-2xl shadow-3xl border border-gray-100 flex flex-col overflow-hidden z-50 animate-fade-in"
        >
          {/* Chat header */}
          <div className="bg-blue-900 text-white p-4 flex justify-between items-center border-b border-gray-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white text-blue-900 rounded-full flex items-center justify-center border-2 border-amber-400">
                <GraduationCap className="w-5 h-5 text-blue-900" />
              </div>
              <div>
                <h4 className="text-xs font-bold tracking-wide uppercase flex items-center gap-1.5 text-amber-300 font-sans">
                  AI Admissions Advisor
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-spin" />
                </h4>
                <p className="text-[10px] text-slate-300 font-sans">Phòng Tuyển Sinh Tự Động Đại Học Vinh</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 px-2.5 text-slate-300 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer text-xs font-bold"
              title="Đóng cửa sổ tư vấn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Messages body listing */}
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-3.5 select-text">
            {messages.map((m) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={m.id}
                  className={`flex ${isUser ? "justify-end" : "justify-start"} items-end gap-1.5`}
                >
                  {!isUser && (
                    <div className="w-6 h-6 bg-blue-900 text-white rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold border border-amber-300">
                      V
                    </div>
                  )}
                  <div
                    className={`p-3 max-w-[82%] rounded-2xl border text-xs leading-relaxed ${
                      isUser
                        ? "bg-blue-900 text-white border-transparent rounded-br-none font-sans"
                        : "bg-white text-gray-800 border-gray-100/55 rounded-bl-none shadow-sm font-sans"
                    }`}
                  >
                    {renderMessageText(m.text)}
                    <span className="block text-[8px] text-right mt-1.5 opacity-40 font-mono">
                      {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Typing activity loader indicator */}
            {loading && (
              <div className="flex justify-start items-center gap-2 text-xs text-gray-400 animate-pulse">
                <div className="w-6 h-6 bg-blue-900 text-white rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                  V
                </div>
                <div className="bg-white p-3 rounded-2xl border border-gray-100 rounded-bl-none shadow-sm flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-900" />
                  <span>Vinh Uni đang truy quét điểm số chuẩn...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Instant click Suggestions list bar */}
          <div className="px-3 py-2 bg-white border-t border-gray-100 overflow-x-auto no-scrollbar flex gap-1.5">
            {SUGGESTS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(s.text)}
                className="text-[10px] bg-slate-50 hover:bg-amber-50 hover:text-amber-800 text-slate-600 border border-slate-200 hover:border-amber-300 rounded-full px-2.5 py-1.5 cursor-pointer whitespace-nowrap transition-all"
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Form dispatch input panel */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className="p-3 bg-slate-50 border-t border-gray-100 flex gap-2"
          >
            <input
              type="text"
              placeholder="Đặt câu hỏi tuyển sinh cho AI..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-hidden focus:border-blue-900"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="p-2.5 bg-blue-900 hover:bg-slate-800 text-amber-300 font-bold rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer disabled:opacity-40"
              title="Gửi câu tư vấn"
            >
              <Send className="w-4 h-4 text-amber-300" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
