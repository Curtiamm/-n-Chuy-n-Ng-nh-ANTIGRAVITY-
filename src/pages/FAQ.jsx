import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { localDB } from '@/lib/localDB';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import HeulwenChatbot from '../components/chat/HeulwenChatbot';
import ChatFAB from '../components/chat/ChatFAB';
import { ChevronDown, Sparkles, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const CATEGORY_COLORS = {
  'Ngành học': 'bg-blue-100 text-blue-700',
  'Hồ sơ đăng ký': 'bg-amber-100 text-amber-700',
  'Học phí': 'bg-green-100 text-green-700',
  'Học bổng': 'bg-purple-100 text-purple-700',
  'Ký túc xá': 'bg-pink-100 text-pink-700',
  'Khác': 'bg-gray-100 text-gray-600',
};

function FAQItem({ faq }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border rounded-xl overflow-hidden transition-all duration-300 bg-white ${open ? 'border-[#C8A951]/50 shadow-md' : 'border-gray-100 hover:border-[#C8A951]/20'}`}>
      <button
        className="w-full flex items-center justify-between px-6 py-4 text-left gap-4"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className={`text-xs font-inter font-semibold px-2 py-0.5 rounded-full shrink-0 ${CATEGORY_COLORS[faq.category] || CATEGORY_COLORS['Khác']}`}>
            {faq.category}
          </span>
          <span className="font-inter text-sm md:text-base font-medium text-[#0A1931]">{faq.question}</span>
        </div>
        <ChevronDown className={`w-5 h-5 text-[#C8A951] shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5 border-t border-gray-50">
              <p className="font-inter text-sm text-gray-600 leading-relaxed pt-4">{faq.answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const FALLBACK_FAQS = [
  { id: '1', question: 'Đại học Vinh có những phương thức xét tuyển nào?', answer: 'Năm 2026, Đại học Vinh xét tuyển bằng 3 phương thức chính: (1) Xét điểm thi tốt nghiệp THPT, (2) Xét học bạ THPT, (3) Xét điểm thi Đánh giá năng lực của ĐHQG Hà Nội/TP.HCM.', category: 'Hồ sơ đăng ký' },
  { id: '2', question: 'Điểm chuẩn năm 2024 của các ngành là bao nhiêu?', answer: 'Điểm chuẩn 2024 dao động từ 18 đến 25 điểm tuỳ ngành. Các ngành Y tế, Kỹ thuật, Kinh tế thường có điểm chuẩn cao hơn (22-25 điểm). Các ngành Sư phạm và Khoa học xã hội thường từ 18-22 điểm.', category: 'Ngành học' },
  { id: '3', question: 'Học phí ngành Sư phạm có được miễn không?', answer: 'Có. Sinh viên Sư phạm được Nhà nước hỗ trợ học phí theo Nghị định 116/2020/NĐ-CP. Sau khi tốt nghiệp, nếu không công tác trong ngành giáo dục 2 năm trở lên, sẽ phải hoàn trả lại kinh phí hỗ trợ.', category: 'Học phí' },
  { id: '4', question: 'Làm thế nào để đăng ký ký túc xá?', answer: 'Sinh viên đăng ký KTX qua Cổng thông tin sinh viên tại sv.vinhuni.edu.vn. Điều kiện: là SV chính quy, không có nhà riêng tại TP. Vinh. Đặt cọc 1 tháng khi nhận phòng. Hợp đồng ký theo từng học kỳ.', category: 'Ký túc xá' },
  { id: '5', question: 'Học bổng tân sinh viên cần điểm xét tuyển bao nhiêu?', answer: 'Học bổng 100% học phí năm đầu: điểm xét tuyển ≥ 27 điểm. Học bổng 50% học phí: điểm xét tuyển ≥ 25 điểm. Học bổng áp dụng cho năm học đầu tiên, các năm tiếp theo dựa trên kết quả học tập.', category: 'Học bổng' },
  { id: '6', question: 'Hồ sơ nhập học cần những giấy tờ gì?', answer: 'Hồ sơ nhập học gồm: Giấy khai sinh (bản sao công chứng), Học bạ THPT (bản sao công chứng), Bằng tốt nghiệp THPT hoặc giấy chứng nhận, Ảnh thẻ 3x4 (6 ảnh), CMND/CCCD (bản sao công chứng), Giấy chứng nhận ưu tiên (nếu có).', category: 'Hồ sơ đăng ký' },
];

export default function FAQPage() {
  const [chatOpen, setChatOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Tất cả');

  const { data: faqs = [] } = useQuery({
    queryKey: ['faqs'],
    queryFn: () => localDB.FAQ.filter({ is_active: true }),
  });

  const displayFaqs = faqs.length > 0 ? faqs : FALLBACK_FAQS;

  const categories = ['Tất cả', ...Object.keys(CATEGORY_COLORS)];

  const filtered = displayFaqs.filter(f => {
    const matchSearch = !search || f.question.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'Tất cả' || f.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onOpenChat={() => setChatOpen(true)} />

      {/* Hero */}
      <div className="bg-gradient-to-r from-[#0A1931] to-[#1A3A6B] pt-28 pb-16 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          <p className="font-inter text-sm font-medium tracking-widest uppercase text-[#C8A951] mb-3">Hỗ trợ thí sinh</p>
          <h1 className="font-playfair text-4xl md:text-5xl font-bold text-white mb-4">Câu hỏi thường gặp</h1>
          <p className="font-inter text-white/65 text-lg max-w-xl">Giải đáp các thắc mắc phổ biến về tuyển sinh Đại học Vinh 2026</p>
        </div>
      </div>

      <main className="flex-1 bg-[#FCFCFD]">
        <div className="max-w-4xl mx-auto px-6 lg:px-10 py-12">
          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3 focus-within:border-[#C8A951] transition-colors">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm kiếm câu hỏi..."
                className="flex-1 bg-transparent font-inter text-sm outline-none"
              />
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-4 py-1.5 rounded-full font-inter text-xs font-medium transition-all duration-200 ${
                  category === c
                    ? 'bg-[#1A3A6B] text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-[#C8A951]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* FAQ List */}
          <div className="space-y-3 mb-12">
            {filtered.map(faq => (
              <FAQItem key={faq.id} faq={faq} />
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-16">
                <p className="font-playfair text-xl text-gray-400 mb-2">Không tìm thấy câu hỏi</p>
                <p className="font-inter text-sm text-gray-400">Hãy hỏi trực tiếp AI Heulwen để được giải đáp</p>
              </div>
            )}
          </div>

          {/* Ask AI */}
          <div className="bg-gradient-to-r from-[#0A1931] to-[#1A3A6B] rounded-3xl p-8 text-white text-center">
            <Sparkles className="w-10 h-10 text-[#C8A951] mx-auto mb-4" />
            <h3 className="font-playfair text-2xl font-bold mb-2">Không tìm thấy câu trả lời?</h3>
            <p className="font-inter text-white/70 mb-5">Hỏi AI Heulwen — trợ lý tư vấn thông minh sẵn sàng giải đáp mọi thắc mắc của bạn.</p>
            <button
              onClick={() => setChatOpen(true)}
              className="px-8 py-3 bg-[#C8A951] hover:bg-[#967C34] text-white font-semibold font-inter rounded-xl transition-colors inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Trò chuyện với Heulwen
            </button>
          </div>
        </div>
      </main>

      <Footer />
      <HeulwenChatbot isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      <ChatFAB onClick={() => setChatOpen(true)} isOpen={chatOpen} />
    </div>
  );
}