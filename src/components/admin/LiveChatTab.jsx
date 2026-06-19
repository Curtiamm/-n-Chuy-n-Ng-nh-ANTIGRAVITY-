import { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, User, Clock, Check, Send, Inbox, AlertTriangle, ArrowLeft, Headphones, Loader2 
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

// Helper to synthesize a premium chime notification sound offline
const playNotificationSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Tone 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    gain1.gain.setValueAtTime(0.1, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.3);

    // Tone 2 (offset)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(783.99, ctx.currentTime + 0.15); // G5
    gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start();
    osc2.stop(ctx.currentTime + 0.55);
  } catch (e) {
    console.warn("Lỗi phát âm thanh thông báo:", e);
  }
};

export default function LiveChatTab() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  
  // Mobile responsiveness helper
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat'
  
  const [inputText, setInputText] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const [resolveLoading, setResolveLoading] = useState(false);
  const [errorToast, setErrorToast] = useState(null);

  const prevWaitingCountRef = useRef(0);
  const chatEndRef = useRef(null);

  // Fetch active sessions from server
  const fetchActiveSessions = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await fetch('/api/live-chats/active');
      if (!res.ok) throw new Error("Không thể tải danh sách cuộc trò chuyện.");
      const data = await res.json();
      
      // Concurrency check for notifications sound
      const waitingSessions = data.filter(s => s.status === 'waiting');
      if (waitingSessions.length > prevWaitingCountRef.current) {
        // Only ring if we are already loaded (not on initial mount)
        if (prevWaitingCountRef.current > 0 || isSilent) {
          playNotificationSound();
        }
      }
      prevWaitingCountRef.current = waitingSessions.length;

      setSessions(data);
    } catch (err) {
      console.error(err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  // Initial load & Polling every 2s
  useEffect(() => {
    fetchActiveSessions();
    const interval = setInterval(() => {
      fetchActiveSessions(true);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom on new message
  const selectedSession = sessions.find(s => s.id === selectedSessionId);
  useEffect(() => {
    if (selectedSession) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedSession?.messages?.length, selectedSessionId]);

  // Handle toast timers
  useEffect(() => {
    if (errorToast) {
      const timer = setTimeout(() => setErrorToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorToast]);

  // Handle claim chat session (Concurrency Locking)
  const handleClaim = async (sessionId) => {
    setClaimLoading(true);
    setErrorToast(null);
    try {
      const res = await fetch(`/api/live-chats/${sessionId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: user?.id || 'staff_unknown',
          staffName: user?.name || 'Cán bộ hỗ trợ'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        // Concurrency lock conflict (409)
        throw new Error(data.error || "Gặp lỗi khi tiếp nhận phòng chat.");
      }

      await fetchActiveSessions(true);
      setMobileView('chat');
    } catch (err) {
      setErrorToast(err.message);
    } finally {
      setClaimLoading(false);
    }
  };

  // Handle resolve/close chat session
  const handleResolve = async (sessionId) => {
    if (!window.confirm("Bạn có chắc chắn muốn đóng và đánh dấu hoàn thành cuộc trò chuyện này?")) return;
    setResolveLoading(true);
    try {
      const res = await fetch(`/api/live-chats/${sessionId}/resolve`, { method: 'POST' });
      if (!res.ok) throw new Error("Gặp lỗi khi đóng cuộc trò chuyện.");
      
      setSelectedSessionId(null);
      setMobileView('list');
      await fetchActiveSessions(true);
    } catch (err) {
      setErrorToast(err.message);
    } finally {
      setResolveLoading(false);
    }
  };

  // Handle send reply message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedSessionId) return;

    const textToSend = inputText.trim();
    setInputText('');

    try {
      const res = await fetch(`/api/live-chats/${selectedSessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'staff',
          senderName: user?.name || 'Cán bộ hỗ trợ',
          content: textToSend
        })
      });
      if (!res.ok) throw new Error("Không thể gửi tin nhắn.");
      
      // Update local state immediately for snappy UX
      const data = await res.json();
      setSessions(prev => prev.map(s => s.id === selectedSessionId ? data.session : s));
    } catch (err) {
      setErrorToast(err.message);
    }
  };

  const waitingChats = sessions.filter(s => s.status === 'waiting');
  const myChats = sessions.filter(s => s.status === 'active' && s.assigned_staff_id === user?.id);
  const otherChats = sessions.filter(s => s.status === 'active' && s.assigned_staff_id !== user?.id);

  return (
    <div className="relative min-h-[600px] flex flex-col md:flex-row glass-panel rounded-3xl overflow-hidden border border-white/10 text-white font-inter">
      {/* Toast Alert Popup */}
      {errorToast && (
        <div className="absolute top-4 right-4 z-50 p-4 bg-red-950/90 border border-red-500/40 text-red-200 rounded-2xl shadow-2xl flex items-start gap-3 max-w-sm animate-fade-in">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-semibold">{errorToast}</p>
          </div>
          <button type="button" onClick={() => setErrorToast(null)} className="text-white/40 hover:text-white font-bold text-xs">×</button>
        </div>
      )}

      {/* LEFT SIDEBAR: SESSION QUEUES */}
      <div className={`w-full md:w-80 shrink-0 border-r border-white/10 flex flex-col bg-white/5 ${
        mobileView === 'chat' ? 'hidden md:flex' : 'flex'
      }`}>
        <div className="p-4 border-b border-white/10 bg-[#0A1931]/60">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#C8A951]" />
            <h2 className="font-playfair font-bold text-lg text-white">Live Chat Queue</h2>
          </div>
          <p className="text-[10px] text-white/50 mt-1 font-inter">Hệ thống hỗ trợ thí sinh trực tiếp</p>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          
          {/* 1. WAITING QUEUE */}
          <div>
            <div className="flex items-center justify-between px-2 mb-1.5">
              <span className="text-xs font-semibold text-amber-400 tracking-wider">CHỜ TIẾP NHẬN</span>
              <span className="bg-amber-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                {waitingChats.length}
              </span>
            </div>
            {waitingChats.length === 0 ? (
              <p className="text-xs text-white/30 italic px-2 py-1">Không có cuộc gọi chờ nào.</p>
            ) : (
              <div className="space-y-1">
                {waitingChats.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSelectedSessionId(s.id);
                      setMobileView('chat');
                    }}
                    className={`w-full flex flex-col text-left p-3 rounded-xl border transition-all ${
                      selectedSessionId === s.id 
                        ? 'bg-[#C8A951]/20 border-[#C8A951]' 
                        : 'bg-amber-500/5 border-amber-500/10 hover:bg-amber-500/10'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-semibold text-amber-200 truncate max-w-[130px]">{s.user_name}</span>
                      <span className="text-[9px] text-amber-400 font-mono flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> {new Date(s.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <span className="text-[10px] text-white/40 truncate w-full mt-1">{s.messages[s.messages.length - 1]?.content}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. MY ACTIVE CHATS */}
          <div>
            <div className="flex items-center justify-between px-2 mb-1.5">
              <span className="text-xs font-semibold text-emerald-400 tracking-wider">CỦA TÔI ĐANG XỬ LÝ</span>
              <span className="bg-emerald-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {myChats.length}
              </span>
            </div>
            {myChats.length === 0 ? (
              <p className="text-xs text-white/30 italic px-2 py-1">Bạn chưa nhận hỗ trợ cuộc nào.</p>
            ) : (
              <div className="space-y-1">
                {myChats.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSelectedSessionId(s.id);
                      setMobileView('chat');
                    }}
                    className={`w-full flex flex-col text-left p-3 rounded-xl border transition-all ${
                      selectedSessionId === s.id 
                        ? 'bg-[#C8A951] text-black border-[#C8A951]' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-semibold truncate max-w-[150px]">{s.user_name}</span>
                      <span className={`text-[9px] font-mono ${selectedSessionId === s.id ? 'text-black/60' : 'text-white/40'}`}>
                        {new Date(s.updated_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <span className={`text-[10px] truncate w-full mt-1 ${selectedSessionId === s.id ? 'text-black/70' : 'text-white/40'}`}>
                      {s.messages[s.messages.length - 1]?.content}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3. OTHER STAFF CHATS */}
          {otherChats.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-2 mb-1.5">
                <span className="text-xs font-semibold text-white/40 tracking-wider">CÁN BỘ KHÁC ĐANG CHAT</span>
              </div>
              <div className="space-y-1">
                {otherChats.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSelectedSessionId(s.id);
                      setMobileView('chat');
                    }}
                    className={`w-full flex flex-col text-left p-3 rounded-xl border transition-all ${
                      selectedSessionId === s.id 
                        ? 'bg-white/10 border-white/20' 
                        : 'bg-white/5 border-white/5 opacity-60 hover:opacity-100 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-semibold truncate max-w-[130px]">{s.user_name}</span>
                      <span className="text-[8px] bg-white/10 text-white/70 px-1.5 py-0.5 rounded">
                        {s.assigned_staff_name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDEBAR: MESSAGE WINDOW */}
      <div className={`flex-1 flex flex-col bg-[#0A1931]/60 ${
        mobileView === 'list' ? 'hidden md:flex' : 'flex'
      }`}>
        {selectedSession ? (
          <>
            {/* Header chat session */}
            <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={() => setMobileView('list')} 
                  className="p-1.5 hover:bg-white/10 rounded-lg md:hidden transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-9 h-9 rounded-full bg-[#C8A951] text-[#0A1931] flex items-center justify-center font-bold">
                  {selectedSession.user_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{selectedSession.user_name}</h3>
                  <p className="text-[10px] text-white/40">{selectedSession.user_email}</p>
                </div>
              </div>

              {selectedSession.assigned_staff_id === user?.id ? (
                <button
                  type="button"
                  onClick={() => handleResolve(selectedSession.id)}
                  disabled={resolveLoading}
                  className="px-3 py-1.5 border border-red-500/40 text-red-400 hover:bg-red-500/10 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                >
                  {resolveLoading ? 'Đang đóng...' : 'Hoàn thành hỗ trợ'}
                </button>
              ) : null}
            </div>

            {/* Chat Body */}
            {selectedSession.status === 'waiting' ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <Headphones className="w-12 h-12 text-amber-400 animate-bounce mb-3" />
                <h4 className="font-semibold text-base">Thí sinh đang trong hàng chờ hỗ trợ</h4>
                <p className="text-xs text-white/50 mt-1 max-w-sm">
                  Chưa có cán bộ nào claim tiếp nhận cuộc trò chuyện này. Hãy tiếp nhận để trực tiếp trao đổi với thí sinh.
                </p>
                <button
                  type="button"
                  onClick={() => handleClaim(selectedSession.id)}
                  disabled={claimLoading}
                  className="mt-5 px-6 py-3 bg-[#C8A951] hover:brightness-110 active:scale-98 text-[#0A1931] font-bold rounded-xl text-sm shadow-lg shadow-[#C8A951]/20 transition-all flex items-center gap-2"
                >
                  {claimLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Tiếp Nhận Hỗ Trợ
                </button>
              </div>
            ) : selectedSession.assigned_staff_id !== user?.id ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-white/60">
                <AlertTriangle className="w-10 h-10 text-white/40 mb-3" />
                <h4 className="font-semibold text-sm">Cuộc trò chuyện đã bị khóa</h4>
                <p className="text-xs text-white/40 mt-1 max-w-xs">
                  Cán bộ <strong>{selectedSession.assigned_staff_name}</strong> đang trực tiếp hỗ trợ phiên chat này. Bạn chỉ có thể xem nội dung (chế độ Read-only).
                </p>
                
                {/* Read-only historical messages */}
                <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-4 mt-6 overflow-y-auto max-h-56 text-left space-y-2.5">
                  {selectedSession.messages.map((msg, i) => (
                    <div key={i} className="text-[11px] leading-relaxed">
                      <strong className="text-[#C8A951]">{msg.senderName}:</strong> <span className="opacity-80">{msg.content}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* ACTIVE MESSAGING CHAT WINDOW */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0A1931]/30">
                  {selectedSession.messages.map((msg, i) => {
                    const isStaff = msg.sender === 'staff';
                    const isSystem = msg.senderName === 'Hệ thống';
                    
                    if (isSystem) {
                      return (
                        <div key={i} className="flex justify-center my-2">
                          <span className="text-[9px] font-mono bg-amber-500/10 text-amber-300 px-3 py-1 rounded-full border border-amber-500/20">
                            {msg.content}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div key={i} className={`flex gap-3.5 ${isStaff ? 'flex-row-reverse' : 'flex-row'} items-end`}>
                        <div className={`max-w-[75%] flex flex-col gap-0.5 ${isStaff ? 'items-end' : 'items-start'}`}>
                          <span className="text-[9px] text-white/30 px-1 font-inter">
                            {msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed font-inter whitespace-pre-wrap ${
                            isStaff 
                              ? 'bg-[#C8A951] text-[#0A1931] rounded-tr-none font-medium' 
                              : 'bg-white/10 text-white rounded-tl-none border border-white/5 shadow-sm'
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>

                {/* Input Text Form */}
                <form onSubmit={handleSendMessage} className="p-4 bg-white/5 border-t border-white/10 shrink-0">
                  <div className="flex items-center gap-3 bg-[#0A1931]/60 rounded-2xl border border-white/10 px-4 py-2 focus-within:border-[#C8A951] transition-all">
                    <input
                      type="text"
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      placeholder="Nhập tin nhắn phản hồi thí sinh..."
                      className="flex-1 bg-transparent text-white font-inter text-sm outline-none py-1.5 placeholder-white/30"
                    />
                    <button
                      type="submit"
                      disabled={!inputText.trim()}
                      className="w-9 h-9 rounded-xl bg-[#C8A951] hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all shrink-0 shadow-lg"
                    >
                      <Send className="w-4 h-4 text-[#0A1931]" />
                    </button>
                  </div>
                </form>
              </>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-white/30 select-none">
            <Inbox className="w-14 h-14 text-white/10 mb-3" />
            <p className="font-playfair font-bold text-sm">Chưa Chọn Cuộc Trò Chuyện</p>
            <p className="text-[10px] text-white/20 mt-1">Chọn một phòng chat ở danh sách bên trái để phản hồi.</p>
          </div>
        )}
      </div>
    </div>
  );
}
