import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import HeulwenChatbot from '../components/chat/HeulwenChatbot';
import ChatFAB from '../components/chat/ChatFAB';
import { ArrowLeft, Download, Calendar, AlertTriangle, FileText, Search, ZoomIn, ZoomOut } from 'lucide-react';

export default function DocumentViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [fontSize, setFontSize] = useState(16); // px
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/documents/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Không thể tải tài liệu');
        return res.json();
      })
      .then(data => {
        setDoc(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const handleZoomIn = () => {
    if (fontSize < 24) setFontSize(prev => prev + 2);
  };

  const handleZoomOut = () => {
    if (fontSize > 12) setFontSize(prev => prev - 2);
  };

  // Helper function to render text with search highlighting
  const renderHighlightedText = (text) => {
    if (!text) return '';
    if (!searchQuery.trim()) {
      return text.split('\n\n').map((paragraph, idx) => (
        <p key={idx} className="mb-5 leading-relaxed text-justify text-[#0A1931]/80">
          {paragraph.split('\n').map((line, lIdx) => (
            <span key={lIdx}>
              {line}
              {lIdx < paragraph.split('\n').length - 1 && <br />}
            </span>
          ))}
        </p>
      ));
    }

    const regex = new RegExp(`(${searchQuery.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')})`, 'gi');
    
    return text.split('\n\n').map((paragraph, idx) => {
      const parts = paragraph.split(regex);
      return (
        <p key={idx} className="mb-5 leading-relaxed text-justify text-[#0A1931]/80">
          {paragraph.split('\n').map((line, lIdx) => {
            const lineParts = line.split(regex);
            return (
              <span key={lIdx}>
                {lineParts.map((part, pIdx) => 
                  regex.test(part) ? (
                    <mark key={pIdx} className="bg-[#C8A951]/30 text-[#0A1931] font-semibold px-0.5 rounded border border-[#C8A951]/40">
                      {part}
                    </mark>
                  ) : (
                    part
                  )
                )}
                {lIdx < paragraph.split('\n').length - 1 && <br />}
              </span>
            );
          })}
        </p>
      );
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const [year, month, day] = dateStr.split('-');
    return `Ngày ${day} tháng ${month} năm ${year}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFCFD]">
      <Navbar onOpenChat={() => setChatOpen(true)} />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#0A1931] to-[#1A3A6B] pt-28 pb-14 px-6 lg:px-10">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-[#C8A951] hover:text-white transition-colors mb-6 font-inter text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>

          {loading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-white/20 w-32 rounded mb-3" />
              <div className="h-8 bg-white/20 w-3/4 rounded mb-4" />
              <div className="h-4 bg-white/20 w-1/2 rounded" />
            </div>
          ) : error ? (
            <div>
              <h1 className="font-playfair text-3xl font-bold text-white mb-2">Đã có lỗi xảy ra</h1>
              <p className="font-inter text-white/70">{error}</p>
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className="font-inter text-xs font-semibold tracking-wider uppercase bg-[#C8A951]/20 text-[#C8A951] border border-[#C8A951]/30 px-3 py-1 rounded-full">
                  Văn bản tuyển sinh
                </span>
                {doc.is_outdated && (
                  <span className="font-inter text-xs font-semibold tracking-wider uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Tài liệu cũ
                  </span>
                )}
              </div>
              <h1 className="font-playfair text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                {doc.original_name}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-white/75 font-inter text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#C8A951]" />
                  <span>Ban hành: {formatDate(doc.issued_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#C8A951]" />
                  <span>{doc.chunk_count} phân mảnh dữ liệu AI</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8">
        {loading ? (
          <div className="space-y-6">
            <div className="h-8 bg-gray-200 rounded animate-pulse w-full" />
            <div className="h-32 bg-gray-200 rounded animate-pulse w-full" />
            <div className="h-64 bg-gray-200 rounded animate-pulse w-full" />
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm p-10">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="font-playfair text-xl font-bold text-[#0A1931] mb-2">Tài liệu không khả dụng</h3>
            <p className="font-inter text-sm text-gray-500 mb-6">
              Không thể tìm thấy tài liệu này trong hệ thống dữ liệu tuyển sinh Vinh Uni.
            </p>
            <button 
              onClick={() => navigate('/')} 
              className="bg-[#0A1931] hover:bg-[#15305B] text-white font-inter text-sm font-semibold px-6 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg"
            >
              Về Trang chủ
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Outdated Warning Alert Banner */}
            {doc.is_outdated && (
              <div className="bg-[#DF8931]/10 border border-[#DF8931]/30 rounded-2xl p-5 flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-[#DF8931] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-playfair text-base font-bold text-[#DF8931] mb-1">
                    Tài liệu tuyển sinh này đã cũ
                  </h4>
                  <p className="font-inter text-sm text-[#DF8931]/80 leading-relaxed">
                    Hệ thống đã nhận diện được tài liệu tuyển sinh mới hơn đã được ban hành. Các nội dung trong tài liệu này có thể đã được sửa đổi hoặc thay thế. Vui lòng tham khảo tài liệu mới nhất hoặc hỏi Trợ lý Tuyển sinh AI để nhận thông tin cập nhật chính xác.
                  </p>
                </div>
              </div>
            )}

            {/* Reading Toolbar Control */}
            <div className="bg-white rounded-2xl border border-gray-200/60 p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search input inside document */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm nội dung trong tài liệu..."
                  className="w-full bg-gray-50 rounded-xl border border-gray-200/80 pl-10 pr-4 py-2 font-inter text-sm text-[#0A1931] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C8A951]/25 focus:border-[#C8A951] transition-all"
                />
              </div>

              {/* Adjust Font size controls & Download */}
              <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                {/* Font control */}
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl border border-gray-200/80 p-1">
                  <button 
                    onClick={handleZoomOut} 
                    disabled={fontSize <= 12}
                    className="p-1.5 hover:bg-white rounded-lg text-gray-500 disabled:opacity-40 transition-colors"
                    title="Thu nhỏ chữ"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="font-inter text-xs font-semibold text-gray-600 px-1.5 select-none min-w-[42px] text-center">
                    {fontSize}px
                  </span>
                  <button 
                    onClick={handleZoomIn} 
                    disabled={fontSize >= 24}
                    className="p-1.5 hover:bg-white rounded-lg text-gray-500 disabled:opacity-40 transition-colors"
                    title="Phóng to chữ"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>

                {/* Direct Download Button */}
                {doc.file_name && (
                  <a
                    href={`/uploads/${doc.file_name}`}
                    download={doc.original_name}
                    className="flex items-center gap-2 bg-[#0A1931] hover:bg-[#15305B] text-white font-inter text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Tải về tệp gốc
                  </a>
                )}
              </div>
            </div>

            {/* Document Content View */}
            <div 
              className="bg-white rounded-3xl border border-gray-200/60 p-8 md:p-12 shadow-sm font-inter text-justify leading-relaxed break-words overflow-hidden"
              style={{ fontSize: `${fontSize}px` }}
            >
              {renderHighlightedText(doc.full_text)}
            </div>
          </div>
        )}
      </main>

      <Footer />
      <HeulwenChatbot isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      <ChatFAB onClick={() => setChatOpen(true)} isOpen={chatOpen} />
    </div>
  );
}
