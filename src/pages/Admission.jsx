import { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import HeulwenChatbot from '../components/chat/HeulwenChatbot';
import ChatFAB from '../components/chat/ChatFAB';
import { 
  FileText, Calendar, CheckCircle, ArrowRight, Sparkles, Upload, 
  Send, Loader2, Search, AlertCircle, Info, Mail, Clock, HelpCircle, FileCode, Inbox
} from 'lucide-react';
import { VINH_UNI_MAJORS, GENERAL_ENROLL_GUIDELINES } from '@/data/vinhUniData';

const ADMISSION_METHODS = [
  {
    title: 'Xét điểm thi THPT',
    code: 'PT1',
    desc: 'Sử dụng điểm thi tốt nghiệp THPT năm 2026 để xét tuyển',
    steps: ['Đăng ký dự thi THPT', 'Nộp hồ sơ đăng ký nguyện vọng qua hệ thống cổng quốc gia', 'Chờ kết quả xét tuyển', 'Xác nhận nhập học'],
    icon: '📝',
  },
  {
    title: 'Xét học bạ THPT',
    code: 'PT2',
    desc: 'Xét tuyển dựa trên kết quả học tập tại THPT (lớp 10, 11, 12)',
    steps: ['Chuẩn bị học bạ THPT có công chứng', 'Nộp hồ sơ trực tuyến trước 15/07/2026', 'Nộp học bạ bản gốc xác nhận', 'Xác nhận nhập học'],
    icon: '📚',
  },
  {
    title: 'Xét điểm thi ĐGNL',
    code: 'PT3',
    desc: 'Xét điểm thi Đánh giá năng lực của ĐHQG Hà Nội hoặc TP.HCM',
    steps: ['Đăng ký và tham dự kỳ thi ĐGNL', 'Nộp hồ sơ đăng ký vào trường', 'Chờ kết quả xét tuyển', 'Xác nhận nhập học'],
    icon: '🎯',
  },
];

const TIMELINE = [
  { date: 'T1/2026', title: 'Mở đăng ký xét học bạ đợt 1', status: 'done' },
  { date: 'T3/2026', title: 'Đăng ký xét học bạ đợt 2', status: 'done' },
  { date: 'T5/2026', title: 'Thi tốt nghiệp THPT', status: 'current' },
  { date: 'T7/2026', title: 'Công bộ điểm thi & mở đăng ký nguyện vọng', status: 'upcoming' },
  { date: 'T8/2026', title: 'Xét tuyển và công bố kết quả', status: 'upcoming' },
  { date: 'T9/2026', title: 'Nhập học chính thức', status: 'upcoming' },
];

const DOCUMENTS = [
  'Giấy khai sinh bản sao có công chứng',
  'Học bạ THPT bản chính hoặc bản sao có công chứng',
  'Bằng tốt nghiệp THPT hoặc giấy chứng nhận tốt nghiệp',
  'Ảnh thẻ 3x4 (6 ảnh)',
  'CMND/CCCD bản sao có công chứng',
  'Giấy chứng nhận ưu tiên (nếu có)',
  'Phiếu đăng ký xét tuyển',
];

export default function Admission() {
  const [chatOpen, setChatOpen] = useState(false);
  const [activeMethod, setActiveMethod] = useState(0);
  const [subTab, setSubTab] = useState('guide'); // 'guide' | 'register' | 'search'

  // --- Registration states ---
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [identityCard, setIdentityCard] = useState("");
  const [highschool, setHighschool] = useState("");
  const [selectedMajor, setSelectedMajor] = useState(VINH_UNI_MAJORS[0].code);
  const [method, setMethod] = useState("academic-record");
  const [score, setScore] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState(null);

  // --- Search states ---
  const [keyword, setKeyword] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  
  // Document uploads
  const [uploadLoading, setUploadLoading] = useState(null);
  const [selectedDocType, setSelectedDocType] = useState("transcript");
  const [customFileName, setCustomFileName] = useState("");
  const [toast, setToast] = useState(null);

  const activeMajorInfo = VINH_UNI_MAJORS.find((m) => m.code === selectedMajor);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Handle submit registration
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError("");
    setRegLoading(true);

    if (!fullName || !email || !phone || !identityCard || !score) {
      setRegError("Vui lòng điền đầy đủ các trường thông tin bắt buộc.");
      setRegLoading(false);
      return;
    }

    const numericScore = parseFloat(score);
    if (isNaN(numericScore) || numericScore < 0 || (method !== "national-exam" && numericScore > 30) || (method === "national-exam" && numericScore > 1200)) {
      setRegError(
        method === "national-exam"
          ? "Với ĐGNL, điểm số tối đa là 1200 điểm."
          : "Điểm tổ hợp xét tuyển phải nằm trên thang từ 0 đến 30."
      );
      setRegLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/registrations/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          identityCard,
          highschool,
          selectedMajor,
          method,
          score: numericScore
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Gặp sự cố khi gửi hồ sơ.");
      }

      setRegSuccess(result.registration);
      // Automatically add it to local storage to simulate candidate login
      localStorage.setItem("candidate_identity", identityCard);
    } catch (err) {
      setRegError(err.message);
    } finally {
      setRegLoading(false);
    }
  };

  // Handle search registrations
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!keyword.trim()) return;

    setSearchError("");
    setSearchLoading(true);
    setSelectedEmail(null);

    try {
      const response = await fetch("/api/registrations/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim() })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Gặp trục trặc khi tra cứu.");
      }

      setSearchResults(data.results);
      setHasSearched(true);
    } catch (err) {
      setSearchError(err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle uploading documents
  const handleUploadDoc = async (studentId) => {
    if (!customFileName.trim()) {
      setToast({ text: "Vui lòng nhập tên tài liệu minh chứng", type: "error" });
      return;
    }

    setUploadLoading(studentId);
    try {
      const resp = await fetch(`/api/registrations/${studentId}/upload-document`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customFileName.trim(),
          type: selectedDocType,
          size: `${(Math.random() * 2 + 1).toFixed(1)} MB`
        })
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || "Không thể tải lên tệp.");
      }

      setSearchResults(prev => prev.map(s => s.id === studentId ? data.registration : s));
      setCustomFileName("");
      setToast({ text: "🎉 Minh chứng học bạ đã được tải lên thành công!", type: "success" });
    } catch (err) {
      setToast({ text: err.message, type: "error" });
    } finally {
      setUploadLoading(null);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case "approved":
        return {
          label: "🎉 ĐỦ ĐIỀU KIỆN TRÚNG TUYỂN",
          bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
          desc: "Chúc mừng em! Hồ sơ đã đủ tiêu chí để trúng tuyển vào Đại học Vinh. Hãy chuẩn bị các giấy tờ bản cứng để nhập học theo hướng dẫn trong hòm thư."
        };
      case "processing":
        return {
          label: "⚙️ ĐANG THẨM ĐỊNH MINH CHỨNG",
          bg: "bg-blue-50 text-blue-800 border-blue-200",
          desc: "Hồ sơ của em đang được chuyên viên khảo thí so khớp điểm số học tập và tệp minh chứng đính kèm. Kết quả sẽ được cập nhật sớm."
        };
      case "accepted":
        return {
          label: "✔️ TIẾP NHẬN HỒ SƠ THÀNH CÔNG",
          bg: "bg-indigo-50 text-indigo-800 border-indigo-200",
          desc: "Hồ sơ của em đã lưu trữ hợp lệ trên hệ thống dữ liệu điện tử của Vinh Uni. Hội đồng tuyển sinh đang kiểm duyệt sơ bộ."
        };
      case "action_required":
        return {
          label: "⚠️ CẦN BỔ SUNG MINH CHỨNG HỌC BẠ",
          bg: "bg-red-50 text-red-800 border-red-200",
          desc: "Điểm số của em nằm sát mốc xét tuyển hoặc có thiếu sót trong tệp đính kèm. Vui lòng cập nhật hình ảnh học bạ lớp 12 ở mục đính kèm bên dưới."
        };
      default:
        return {
          label: "⏳ ĐANG CHỜ PHÊ DUYỆT HỘI ĐỒNG",
          bg: "bg-amber-50 text-amber-800 border-amber-200",
          desc: "Hồ sơ của em đang trong hàng chờ xem xét duyệt từ phòng khảo thí Đại học Vinh."
        };
    }
  };

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setPhone("");
    setIdentityCard("");
    setHighschool("");
    setScore("");
    setRegSuccess(null);
    setRegError("");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onOpenChat={() => setChatOpen(true)} />

      {/* Hero */}
      <div className="bg-gradient-to-r from-[#0A1931] to-[#1A3A6B] pt-28 pb-16 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="font-inter text-sm font-medium tracking-widest uppercase text-[#C8A951] mb-3">Phân hệ tuyển sinh</p>
            <h1 className="font-playfair text-4xl md:text-5xl font-bold text-white mb-4">Tuyển sinh trực tuyến 2026</h1>
            <p className="font-inter text-white/65 text-lg max-w-xl">Đăng ký hồ sơ nguyện vọng, theo dõi kết quả trúng tuyển và tư vấn tự động</p>
          </div>
          
          {/* Sub-tab Pill Toggles */}
          <div className="flex bg-[#0A1931]/60 p-1.5 rounded-2xl border border-white/10 shrink-0 self-start md:self-center gap-1.5">
            <button
              onClick={() => setSubTab('guide')}
              className={`px-4 py-2 text-xs font-inter font-semibold rounded-xl transition-all ${subTab === 'guide' ? 'bg-[#C8A951] text-white' : 'text-white/60 hover:text-white'}`}
            >
              Quy chế & Lịch trình
            </button>
            <button
              onClick={() => setSubTab('register')}
              className={`px-4 py-2 text-xs font-inter font-semibold rounded-xl transition-all ${subTab === 'register' ? 'bg-[#C8A951] text-white' : 'text-white/60 hover:text-white'}`}
            >
              Đăng ký nguyện vọng
            </button>
            <button
              onClick={() => setSubTab('search')}
              className={`px-4 py-2 text-xs font-inter font-semibold rounded-xl transition-all ${subTab === 'search' ? 'bg-[#C8A951] text-white' : 'text-white/60 hover:text-white'}`}
            >
              Tra cứu & Email
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 bg-[#FCFCFD]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">

          {/* Toast Messages */}
          {toast && (
            <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl border shadow-xl flex items-start gap-3 max-w-md animate-fade-in ${
              toast.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-950" : "bg-red-50 border-red-200 text-red-950"
            }`}>
              <Info className={`w-5 h-5 flex-shrink-0 mt-0.5 ${toast.type === "success" ? "text-emerald-600" : "text-red-600"}`} />
              <div className="flex-1">
                <p className="text-xs font-semibold">{toast.text}</p>
              </div>
              <button onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-600 font-bold text-xs">×</button>
            </div>
          )}

          {/* ====================================
              SUB-TAB 1: GUIDE & RULES
              ==================================== */}
          {subTab === 'guide' && (
            <div className="space-y-16 animate-fade-rise">
              
              {/* Admission Methods */}
              <div>
                <h2 className="font-playfair text-3xl font-bold text-[#0A1931] mb-2">Phương thức xét tuyển</h2>
                <div className="w-12 h-px bg-[#C8A951] mb-8" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {ADMISSION_METHODS.map((m, i) => (
                    <button
                      key={m.code}
                      onClick={() => setActiveMethod(i)}
                      className={`text-left p-5 rounded-2xl border-2 transition-all duration-300 ${
                        activeMethod === i
                          ? 'border-[#C8A951] bg-white shadow-lg'
                          : 'border-gray-100 bg-white hover:border-[#C8A951]/40'
                      }`}
                    >
                      <div className="text-3xl mb-3">{m.icon}</div>
                      <div className="font-inter text-xs font-semibold text-[#C8A951] mb-1 uppercase tracking-wider">{m.code}</div>
                      <div className="font-playfair text-lg font-semibold text-[#0A1931] mb-2">{m.title}</div>
                      <p className="font-inter text-sm text-gray-500">{m.desc}</p>
                    </button>
                  ))}
                </div>

                {/* Steps for selected method */}
                <div className="bg-white rounded-2xl border border-[#C8A951]/20 p-6 shadow-sm">
                  <h3 className="font-playfair text-xl font-semibold text-[#0A1931] mb-4">
                    Quy trình xét duyệt — {ADMISSION_METHODS[activeMethod].title}
                  </h3>
                  <div className="flex flex-col md:flex-row gap-4">
                    {ADMISSION_METHODS[activeMethod].steps.map((step, i) => (
                      <div key={i} className="flex-1 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1A3A6B] text-white font-inter text-sm font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-inter text-sm text-[#0A1931] leading-relaxed">{step}</p>
                          {i < ADMISSION_METHODS[activeMethod].steps.length - 1 && (
                            <ArrowRight className="w-4 h-4 text-[#C8A951] mt-2 hidden md:block" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h2 className="font-playfair text-3xl font-bold text-[#0A1931] mb-2">Lịch trình tuyển sinh 2026</h2>
                <div className="w-12 h-px bg-[#C8A951] mb-8" />
                <div className="relative">
                  <div className="absolute left-5 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[#C8A951] via-[#C8A951]/50 to-transparent" />
                  <div className="space-y-6">
                    {TIMELINE.map((t, i) => (
                      <div key={i} className={`relative flex items-start gap-6 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} pl-14 md:pl-0`}>
                        <div className={`flex-1 ${i % 2 === 0 ? 'md:text-right md:pr-8' : 'md:pl-8'}`}>
                          <div className={`inline-block px-4 py-3 rounded-xl border transition-all ${
                            t.status === 'current'
                              ? 'bg-[#C8A951] text-white border-[#C8A951] shadow-md'
                              : t.status === 'done'
                              ? 'bg-white border-gray-200 text-gray-400'
                              : 'bg-white border-gray-100 text-[#0A1931]'
                          }`}>
                            <div className="font-inter text-xs font-semibold mb-0.5 opacity-75">{t.date}</div>
                            <div className="font-inter text-sm font-medium">{t.title}</div>
                          </div>
                        </div>
                        <div className={`absolute left-3 md:left-1/2 w-5 h-5 rounded-full border-2 flex items-center justify-center -translate-x-1/2 top-3 ${
                          t.status === 'current' ? 'bg-[#C8A951] border-[#C8A951]' :
                          t.status === 'done' ? 'bg-green-500 border-green-500' :
                          'bg-white border-gray-300'
                        }`}>
                          {t.status === 'done' && <CheckCircle className="w-3 h-3 text-white" />}
                          {t.status === 'current' && <span className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <div className="flex-1 hidden md:block" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h2 className="font-playfair text-3xl font-bold text-[#0A1931] mb-2">Hồ sơ cần chuẩn bị</h2>
                <div className="w-12 h-px bg-[#C8A951] mb-8" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {DOCUMENTS.map((doc, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-[#C8A951]/30 transition-colors">
                      <div className="w-7 h-7 rounded-full bg-[#1A3A6B]/10 flex items-center justify-center shrink-0">
                        <FileText className="w-3.5 h-3.5 text-[#1A3A6B]" />
                      </div>
                      <span className="font-inter text-sm text-[#0A1931]">{doc}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ====================================
              SUB-TAB 2: ONLINE APPLICATION FORM
              ==================================== */}
          {subTab === 'register' && (
            <div className="max-w-4xl mx-auto animate-fade-rise">
              {regSuccess ? (
                <div className="bg-white p-6 md:p-8 rounded-2xl border border-emerald-100 shadow-lg space-y-6">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                      <CheckCircle className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold font-playfair text-emerald-800">Gửi hồ sơ trực tuyến thành công!</h3>
                    <p className="text-sm font-inter text-gray-500">
                      Hồ sơ của thí sinh <strong className="text-slate-800">{regSuccess.fullName}</strong> đã được lưu trữ hợp lệ trên hệ thống dữ liệu.
                    </p>
                    <div className="inline-block bg-slate-50 border border-gray-150 px-4 py-2 rounded-xl text-xs font-mono font-bold text-slate-700">
                      Mã hồ sơ: {regSuccess.id} | Số CCCD: {regSuccess.identityCard}
                    </div>
                  </div>

                  {/* Mail Log visualizer */}
                  <div className="bg-[#0A1931] p-5 rounded-2xl border border-white/10 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <span className="text-xs font-bold font-inter text-white/80">Hòm thư điện tử (Hệ thống giả lập gửi thật)</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">Đã chuyển đi</span>
                    </div>
                    <p className="text-xs text-slate-350 font-inter">
                      Ban tuyển sinh Đại học Vinh đã gửi email xác nhận hồ sơ tự động tới địa chỉ: <strong className="text-[#C8A951] font-mono">{regSuccess.email}</strong>.
                    </p>
                    <div className="bg-white p-5 rounded-xl border border-gray-200 text-slate-800 text-xs font-sans space-y-4 max-h-80 overflow-y-auto shadow-inner">
                      <div className="border-b border-gray-100 pb-2">
                        <p className="text-[10px] text-gray-400"><strong>Người gửi:</strong> tuyensinh@vinhuni.edu.vn</p>
                        <p className="text-[10px] text-gray-400"><strong>Người nhận:</strong> {regSuccess.email}</p>
                        <p className="text-xs font-semibold text-[#1A3A6B] mt-1"><strong>Tiêu đề:</strong> {regSuccess.emailLogs?.[0]?.subject}</p>
                      </div>
                      <div dangerouslySetInnerHTML={{ __html: regSuccess.emailLogs?.[0]?.bodyPreview || "" }} />
                    </div>
                  </div>

                  <div className="flex justify-center gap-3">
                    <button
                      onClick={resetForm}
                      className="px-5 py-2.5 bg-[#1A3A6B] hover:bg-[#C8A951] text-white text-xs font-bold font-inter rounded-xl transition-all shadow-sm"
                    >
                      Nộp thêm hồ sơ khác
                    </button>
                    <button
                      onClick={() => { setKeyword(regSuccess.identityCard); setSubTab('search'); setTimeout(() => handleSearch(), 200); }}
                      className="px-5 py-2.5 bg-white border border-[#1A3A6B] text-[#1A3A6B] text-xs font-bold font-inter rounded-xl transition-all"
                    >
                      Xem trạng thái chi tiết
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Form */}
                  <form onSubmit={handleRegister} className="lg:col-span-8 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                    <div>
                      <h3 className="font-playfair text-xl font-bold text-[#0A1931]">Đăng ký nguyện vọng trực tuyến</h3>
                      <p className="font-inter text-xs text-gray-400 mt-1">Vui lòng điền thông tin chính xác theo thẻ CCCD và Học bạ THPT của thí sinh.</p>
                    </div>

                    {regError && (
                      <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-inter">
                        {regError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-600">Họ và tên thí sinh <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          required
                          placeholder="Nguyễn Văn A"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-[#C8A951] outline-none text-[#0A1931]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-600">Số CCCD / CMND <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          required
                          placeholder="9 hoặc 12 chữ số"
                          value={identityCard}
                          onChange={(e) => setIdentityCard(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-[#C8A951] outline-none text-[#0A1931]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-600">Địa chỉ Email liên hệ <span className="text-red-500">*</span></label>
                        <input
                          type="email"
                          required
                          placeholder="thi_sinh@gmail.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-[#C8A951] outline-none text-[#0A1931]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-600">Số điện thoại liên lạc <span className="text-red-500">*</span></label>
                        <input
                          type="tel"
                          required
                          placeholder="Ví dụ: 0912..."
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-[#C8A951] outline-none text-[#0A1931]"
                        />
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs font-semibold text-gray-600">Trường THPT tốt nghiệp</label>
                        <input
                          type="text"
                          placeholder="THPT Chuyên Phan Bội Châu, Nghệ An"
                          value={highschool}
                          onChange={(e) => setHighschool(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-[#C8A951] outline-none text-[#0A1931]"
                        />
                      </div>
                    </div>

                    <div className="border-t border-dashed border-gray-150 pt-5 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-gray-600">Ngành đăng ký xét tuyển <span className="text-red-500">*</span></label>
                          <select
                            value={selectedMajor}
                            onChange={(e) => setSelectedMajor(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm text-[#0A1931] focus:bg-white focus:border-[#C8A951] outline-none cursor-pointer"
                          >
                            {VINH_UNI_MAJORS.map((m) => (
                              <option key={m.code} value={m.code}>{m.name} ({m.code})</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-gray-600">Phương thức xét tuyển <span className="text-red-500">*</span></label>
                          <select
                            value={method}
                            onChange={(e) => setMethod(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm text-[#0A1931] focus:bg-white focus:border-[#C8A951] outline-none cursor-pointer"
                          >
                            {GENERAL_ENROLL_GUIDELINES.methods.map((m) => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                        <div className="sm:col-span-5 space-y-1.5">
                          <label className="text-xs font-semibold text-gray-600">
                            Tổng điểm Quy đổi ({method === "national-exam" ? "Thang 1200" : "Thang 30"}) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            step="0.05"
                            required
                            placeholder={method === "national-exam" ? "Ví dụ: 820" : "Ví dụ: 25.4"}
                            value={score}
                            onChange={(e) => setScore(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm font-mono font-bold text-[#0A1931] focus:bg-white focus:border-[#C8A951] outline-none"
                          />
                        </div>

                        {activeMajorInfo && score && (
                          <div className="sm:col-span-7 bg-[#FCFCFD] p-3 rounded-xl border border-gray-200 text-xs flex items-center gap-2">
                            {Number(score) >= (method === "academic-record" ? activeMajorInfo.transcriptScore2025 : activeMajorInfo.exemptScore2025) ? (
                              <>
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                                <span className="text-emerald-700 font-semibold leading-normal">
                                  Ước lượng: <strong>Đủ điều kiện đỗ</strong> so với mốc năm ngoái ({method === "academic-record" ? activeMajorInfo.transcriptScore2025 : activeMajorInfo.exemptScore2025}đ)!
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                                <span className="text-amber-700 font-semibold leading-normal">
                                  Ước lượng: Điểm nằm sát ngưỡng chuẩn. Khuyên nộp đợt 1 sớm!
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={regLoading}
                      className="w-full py-3.5 px-6 bg-[#1A3A6B] hover:bg-[#C8A951] text-white font-bold text-sm rounded-xl transition-all shadow-md flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {regLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Đang khởi tạo hồ sơ xét tuyển...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 text-[#C8A951]" />
                          Nộp đơn xét tuyển & Nhận thư tự động
                        </>
                      )}
                    </button>
                  </form>

                  {/* Right Guidelines */}
                  <div className="lg:col-span-4 space-y-6">
                    <div className="bg-[#1A3A6B]/5 p-5 rounded-3xl border border-[#1A3A6B]/10 space-y-3">
                      <h4 className="font-playfair text-base font-bold text-[#1A3A6B] flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-[#C8A951]" />
                        Hướng dẫn đăng ký
                      </h4>
                      <ol className="text-xs text-gray-600 space-y-2.5 pl-4 list-decimal leading-relaxed">
                        <li>Cần điền đầy đủ và kiểm tra kỹ số <strong>Căn cước công dân</strong> để sử dụng cho phân hệ tra cứu sau này.</li>
                        <li>Địa chỉ <strong>Email</strong> phải nhập chính xác, hòm thư sẽ tự động nhận kết quả và khuyến nghị sơ bộ trong 5 giây.</li>
                        <li>Điểm xét tuyển quy đổi bao gồm điểm 3 môn tổ hợp cộng điểm khu vực ưu tiên (nếu có).</li>
                      </ol>
                    </div>

                    {activeMajorInfo && (
                      <div className="bg-white p-5 rounded-3xl border border-gray-150 space-y-4">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">Thông số ngành học lựa chọn</h4>
                        <div className="space-y-3">
                          <div className="bg-slate-50 p-3 rounded-xl flex justify-between items-center text-xs">
                            <span className="text-gray-500 font-medium">Ngành học:</span>
                            <span className="font-bold text-[#0A1931]">{activeMajorInfo.name}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="bg-slate-50 p-2 rounded-xl">
                              <span className="block text-[10px] text-gray-400">Chỉ tiêu</span>
                              <strong className="text-xs font-mono text-[#C8A951]">{activeMajorInfo.slots} SV</strong>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-xl">
                              <span className="block text-[10px] text-gray-400">Điểm chuẩn 2025</span>
                              <strong className="text-xs font-mono text-[#1A3A6B]">{activeMajorInfo.exemptScore2025}đ</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ====================================
              SUB-TAB 3: SEARCH APPLICATION STATUS & EMAIL HISTORY
              ==================================== */}
          {subTab === 'search' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-rise">
              {/* Search card */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <div>
                  <h3 className="font-playfair text-xl font-bold text-[#0A1931] flex items-center gap-2">
                    <Search className="w-5 h-5 text-[#C8A951]" />
                    Tra cứu tiến độ hồ sơ & Nhận thư giả lập
                  </h3>
                  <p className="font-inter text-xs text-gray-500 mt-1">
                    Nhập Họ tên hoặc số CCCD/CMND thí sinh đã đăng ký nguyện vọng trực tuyến trước đó để kiểm tra trạng thái và lịch sử gửi thư từ Vinh Uni.
                  </p>
                </div>

                <form onSubmit={handleSearch} className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Văn Hùng hoặc số CCCD..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-[#C8A951] outline-none text-[#0A1931]"
                  />
                  <button
                    type="submit"
                    disabled={searchLoading}
                    className="px-6 py-2.5 bg-[#1A3A6B] hover:bg-[#C8A951] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {searchLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    Tra cứu
                  </button>
                </form>

                {searchError && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl">
                    {searchError}
                  </div>
                )}
              </div>

              {/* Search results mapping */}
              {hasSearched && (
                <div className="space-y-6">
                  {searchResults.length > 0 ? (
                    searchResults.map((student) => {
                      const statusConf = getStatusConfig(student.status);
                      const majorName = VINH_UNI_MAJORS.find((m) => m.code === student.selectedMajor)?.name || "Chưa xác định";

                      return (
                        <div key={student.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in">
                          {/* Status Header */}
                          <div className="border-b border-gray-100 p-5 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div>
                              <span className="text-[10px] font-bold text-gray-400 font-mono tracking-widest uppercase">Mã số hồ sơ</span>
                              <h4 className="text-lg font-extrabold text-[#1A3A6B] font-mono">{student.id}</h4>
                            </div>
                            <span className={`px-4 py-1.5 rounded-full border text-xs font-bold ${statusConf.bg}`}>
                              {statusConf.label}
                            </span>
                          </div>

                          {/* Profile Fields */}
                          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-gray-100">
                            <div className="space-y-3">
                              <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">Thông tin cá nhân</h5>
                              <div className="space-y-2 text-xs font-inter text-gray-600">
                                <p><strong className="text-[#0A1931]">Họ và tên:</strong> {student.fullName}</p>
                                <p><strong className="text-[#0A1931]">CCCD/CMND:</strong> {student.identityCard}</p>
                                <p><strong className="text-[#0A1931]">Số điện thoại:</strong> {student.phone}</p>
                                <p><strong className="text-[#0A1931]">Trường THPT:</strong> {student.highschool}</p>
                                <p><strong className="text-[#0A1931]">Hòm thư Email:</strong> {student.email}</p>
                              </div>
                            </div>

                            <div className="space-y-3 md:border-l md:border-gray-100 md:pl-6">
                              <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">Nguyện vọng đăng ký</h5>
                              <div className="space-y-2 text-xs font-inter text-gray-600">
                                <p><strong className="text-[#0A1931]">Ngành học:</strong> <span className="text-[#1A3A6B] font-bold">{majorName}</span> ({student.selectedMajor})</p>
                                <p><strong className="text-[#0A1931]">Phương thức xét:</strong> {student.method === "academic-record" ? "Xét Học Bạ" : student.method === "thpt" ? "Điểm thi THPT" : "ĐGNL"}</p>
                                <p><strong className="text-[#0A1931]">Điểm số quy đổi:</strong> <span className="bg-[#C8A951]/20 text-[#967C34] px-2 py-0.5 rounded font-mono font-bold">{student.score}đ</span></p>
                                <p className="text-[10px] text-gray-400 italic">Thời điểm nộp: {new Date(student.registeredAt).toLocaleString("vi-VN")}</p>
                              </div>
                            </div>
                          </div>

                          {/* Advice Notice */}
                          <div className="p-4 bg-[#1A3A6B]/5 border-b border-gray-100 flex items-start gap-2 text-xs text-gray-600">
                            <Info className="w-4 h-4 text-[#1A3A6B] shrink-0 mt-0.5" />
                            <p>{statusConf.desc}</p>
                          </div>

                          {/* Supplementary Upload */}
                          <div className="p-5 border-b border-gray-100 space-y-4">
                            <h5 className="text-xs font-bold text-[#0A1931] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                              <Upload className="w-4 h-4 text-emerald-600" />
                              Bổ sung học bạ / minh chứng học tập số hóa
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="p-3.5 bg-slate-50 rounded-xl border border-gray-150 space-y-2">
                                <span className="text-[9px] uppercase font-bold text-gray-400 block font-mono">Giấy tờ đính kèm hiện tại:</span>
                                {student.documents && student.documents.length > 0 ? (
                                  <div className="space-y-1.5">
                                    {student.documents.map((doc, dIdx) => (
                                      <div key={dIdx} className="bg-white p-2 rounded-lg border border-gray-200 text-xs flex justify-between items-center">
                                        <span className="font-medium text-slate-700 flex items-center gap-1 truncate font-mono">
                                          <FileCode className="w-3.5 h-3.5 text-[#1A3A6B]" />
                                          {doc.name}
                                        </span>
                                        <span className="text-[9px] bg-[#C8A951]/20 text-[#967C34] px-1.5 py-0.5 rounded uppercase font-bold">{doc.type === "transcript" ? "Học bạ" : "Bằng TN"}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-gray-400 italic">Chưa đính kèm tài liệu học bạ số hóa bổ sung nào.</p>
                                )}
                              </div>

                              <div className="p-3.5 bg-slate-50 rounded-xl border border-gray-150 space-y-2.5">
                                <span className="text-[9px] uppercase font-bold text-gray-400 block font-mono">Đính kèm minh chứng mới:</span>
                                <div className="grid grid-cols-2 gap-2">
                                  <select
                                    value={selectedDocType}
                                    onChange={(e) => setSelectedDocType(e.target.value)}
                                    className="bg-white border text-[11px] rounded p-1 text-gray-700 outline-none cursor-pointer"
                                  >
                                    <option value="transcript">Học bạ lớp 12</option>
                                    <option value="diploma">Bằng tốt nghiệp tạm thời</option>
                                    <option value="other">Diện ưu tiên khác</option>
                                  </select>
                                  <input
                                    type="text"
                                    placeholder="Tên file..."
                                    value={customFileName}
                                    onChange={(e) => setCustomFileName(e.target.value)}
                                    className="bg-white border text-[11px] rounded p-1 px-1.5 outline-none font-mono text-gray-800"
                                  />
                                </div>
                                <button
                                  type="button"
                                  disabled={uploadLoading === student.id}
                                  onClick={() => handleUploadDoc(student.id)}
                                  className="w-full py-1.5 bg-[#1A3A6B] hover:bg-[#C8A951] text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer flex justify-center items-center gap-1"
                                >
                                  {uploadLoading === student.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Upload className="w-3 h-3" />
                                  )}
                                  Tải lên tài liệu
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Email Sent Logs */}
                          <div className="p-5 space-y-4">
                            <h5 className="text-xs font-bold text-[#0A1931] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                              <Inbox className="w-4 h-4 text-[#1A3A6B]" />
                              Lịch sử hòm thư tuyển sinh báo tin ({student.emailLogs?.length || 0})
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                              {/* Sidebar lists */}
                              <div className="md:col-span-5 space-y-1.5">
                                {student.emailLogs?.map((log, lIdx) => (
                                  <button
                                    key={lIdx}
                                    onClick={() => setSelectedEmail(log)}
                                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all cursor-pointer flex flex-col gap-1 ${
                                      selectedEmail?.sentAt === log.sentAt
                                        ? "bg-[#1A3A6B]/10 border-[#1A3A6B] text-[#1A3A6B] font-semibold"
                                        : "bg-white border-gray-200 hover:bg-slate-50 text-gray-700"
                                    }`}
                                  >
                                    <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono uppercase font-bold self-start">{log.type === "CONFIRMATION" ? "Xác nhận hồ sơ" : "Kết quả xét tuyển"}</span>
                                    <span className="font-bold line-clamp-1 py-0.5">{log.subject}</span>
                                    <span className="text-[10px] text-gray-400 font-mono">{new Date(log.sentAt).toLocaleString("vi-VN")}</span>
                                  </button>
                                ))}
                              </div>

                              {/* Reader */}
                              <div className="md:col-span-7 bg-[#FCFCFD] p-5 rounded-2xl border border-gray-200/50 min-h-60 flex flex-col shadow-inner">
                                {selectedEmail ? (
                                  <div className="space-y-3 flex-1 flex flex-col animate-fade-in">
                                    <div className="border-b border-gray-100 pb-2 text-[10px] font-mono text-gray-400">
                                      <p><strong>Tiêu đề:</strong> {selectedEmail.subject}</p>
                                      <p><strong>Gửi ngày:</strong> {new Date(selectedEmail.sentAt).toLocaleString("vi-VN")}</p>
                                    </div>
                                    <div 
                                      className="font-sans leading-relaxed text-xs text-slate-700 max-h-64 overflow-y-auto flex-1 p-3 bg-white rounded-lg border border-gray-100 shadow-sm"
                                      dangerouslySetInnerHTML={{ __html: selectedEmail.bodyPreview || "" }}
                                    />
                                  </div>
                                ) : (
                                  <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 p-4">
                                    <Mail className="w-8 h-8 text-gray-300 mb-2 animate-bounce" />
                                    <p className="text-xs">Vui lòng chọn một Email ở cột bên trái để hiển thị chi tiết bức thư.</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                        </div>
                      );
                    })
                  ) : (
                    <div className="bg-white border-2 border-dashed border-gray-200 p-12 rounded-3xl text-center">
                      <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2 animate-pulse" />
                      <h4 className="font-playfair text-lg font-bold text-slate-700">Không tìm thấy hồ sơ nào khớp</h4>
                      <p className="font-inter text-xs text-gray-400 max-w-md mx-auto mt-1">
                        Hệ thống chưa tìm thấy hồ sơ nào trùng khớp với từ khóa <strong className="text-slate-600">"{keyword}"</strong>. Vui lòng kiểm tra lại họ tên hoặc CCCD, hoặc chuyển qua tab **Đăng ký nguyện vọng** để tạo hồ sơ mới.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      <Footer />
      <HeulwenChatbot isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      <ChatFAB onClick={() => setChatOpen(true)} isOpen={chatOpen} />
    </div>
  );
}