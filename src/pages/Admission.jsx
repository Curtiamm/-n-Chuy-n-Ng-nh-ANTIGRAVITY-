import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
  {
    title: 'Tuyển thẳng & Ưu tiên',
    code: 'PT4',
    desc: 'Tuyển thẳng học sinh trường chuyên, đạt giải quốc gia/tỉnh, hoặc kết hợp chứng chỉ quốc tế',
    steps: ['Nộp hồ sơ xét tuyển thẳng trực tuyến hoặc trực tiếp', 'Cung cấp minh chứng (Giải HSG, Chứng chỉ IELTS/VSTEP...)', 'Hội đồng xét duyệt và thẩm định hồ sơ', 'Xác nhận nhập học sớm'],
    icon: '🏆',
  },
];

const TIMELINE = [
  { date: 'T1/2026', title: 'Mở đăng ký xét học bạ đợt 1', status: 'done' },
  { date: 'T3/2026', title: 'Đăng ký xét học bạ đợt 2', status: 'done' },
  { date: 'T5/2026', title: 'Đăng ký thi tốt nghiệp THPT', status: 'done' },
  { date: 'T6/2026', title: 'Thi tốt nghiệp THPT & nộp hồ sơ xét tuyển sớm', status: 'current' },
  { date: 'T7/2026', title: 'Công bố điểm thi & đăng ký nguyện vọng Bộ GD&ĐT', status: 'upcoming' },
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
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const methodParam = queryParams.get('method');
    
    if (methodParam !== null && methodParam !== undefined) {
      const methodIdx = parseInt(methodParam, 10);
      if (!isNaN(methodIdx) && methodIdx >= 0 && methodIdx < 4) {
        setActiveMethod(methodIdx);
      }
    }
  }, [location.search]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onOpenChat={() => setChatOpen(true)} />

      {/* Hero */}
      <div className="bg-gradient-to-r from-[#0A1931] to-[#1A3A6B] pt-28 pb-16 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="font-inter text-sm font-medium tracking-widest uppercase text-[#C8A951] mb-3">Phân hệ tuyển sinh</p>
            <h1 className="font-playfair text-4xl md:text-5xl font-bold text-white mb-4">Quy chế Tuyển sinh 2026</h1>
            <p className="font-inter text-white/65 text-lg max-w-xl">Quy chế, lịch trình chi tiết các phương thức xét tuyển và danh mục hồ sơ chuẩn bị của Đại học Vinh</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 bg-[#FCFCFD]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">

          <div className="space-y-16 animate-fade-rise">
            
            {/* Admission Methods */}
            <div>
              <h2 className="font-playfair text-3xl font-bold text-[#0A1931] mb-2">Phương thức xét tuyển</h2>
              <div className="w-12 h-px bg-[#C8A951] mb-8" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

        </div>
      </main>

      <Footer />
      <HeulwenChatbot isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      <ChatFAB onClick={() => setChatOpen(true)} isOpen={chatOpen} />
    </div>
  );
}