import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { localDB } from '@/lib/localDB';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import HeulwenChatbot from '../components/chat/HeulwenChatbot';
import ChatFAB from '../components/chat/ChatFAB';
import MajorRow from '../components/majors/MajorRow';
import { Search, Filter, ChevronDown } from 'lucide-react';

const CATEGORIES = ['Tất cả', 'Kỹ thuật - Công nghệ', 'Sư phạm', 'Kinh tế', 'Y tế - Sức khỏe', 'Khoa học xã hội', 'Ngoại ngữ', 'Nghệ thuật', 'Nông lâm ngư'];

export default function Majors() {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInitialMsg, setChatInitialMsg] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Tất cả');
  const [sortBy, setSortBy] = useState('name');

  const { data: majors = [], isLoading } = useQuery({
    queryKey: ['majors'],
    queryFn: () => localDB.Major.filter({ is_active: true }),
  });

  const openChatAbout = (majorName) => {
    setChatInitialMsg(`Cho tôi biết chi tiết về ngành ${majorName}?`);
    setChatOpen(true);
  };

  const filtered = majors
    .filter(m => {
      const matchSearch = !search || m.name?.toLowerCase().includes(search.toLowerCase()) || m.faculty?.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === 'Tất cả' || m.category === category;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      if (sortBy === 'score') return (b.score_2024 || 0) - (a.score_2024 || 0);
      if (sortBy === 'quota') return (b.quota || 0) - (a.quota || 0);
      return (a.name || '').localeCompare(b.name || '', 'vi');
    });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onOpenChat={() => setChatOpen(true)} />

      {/* Hero */}
      <div className="bg-gradient-to-r from-[#0A1931] to-[#1A3A6B] pt-28 pb-16 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          <p className="font-inter text-sm font-medium tracking-widest uppercase text-[#C8A951] mb-3">
            Danh mục ngành học
          </p>
          <h1 className="font-playfair text-4xl md:text-5xl font-bold text-white mb-4">
            Khám phá ngành học
          </h1>
          <p className="font-inter text-white/65 text-lg max-w-xl">
            {majors.length > 0 ? `${majors.length} ngành đào tạo` : '50+ ngành đào tạo'} tại Đại học Vinh — tìm ngành phù hợp với bạn
          </p>
        </div>
      </div>

      <main className="flex-1 bg-[#FCFCFD]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3 focus-within:border-[#C8A951] transition-colors">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm kiếm tên ngành, khoa..."
                className="flex-1 bg-transparent font-inter text-sm text-[#0A1931] placeholder-gray-400 outline-none"
              />
            </div>
            <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3 min-w-48">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="flex-1 bg-transparent font-inter text-sm text-[#0A1931] outline-none cursor-pointer"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3 min-w-44">
              <ChevronDown className="w-4 h-4 text-gray-400" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="flex-1 bg-transparent font-inter text-sm text-[#0A1931] outline-none cursor-pointer"
              >
                <option value="name">Tên ngành</option>
                <option value="score">Điểm chuẩn cao nhất</option>
                <option value="quota">Chỉ tiêu nhiều nhất</option>
              </select>
            </div>
          </div>

          {/* Majors Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-playfair text-xl text-gray-400 mb-2">Không tìm thấy ngành học</p>
              <p className="font-inter text-sm text-gray-400">Hãy thử điều chỉnh bộ lọc hoặc hỏi AI Heulwen</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filtered.map(major => (
                <MajorRow key={major.id} major={major} onAskAI={openChatAbout} />
              ))}
            </div>
          )}

          <p className="font-inter text-sm text-gray-400 mt-8 text-center">
            Hiển thị {filtered.length} / {majors.length} ngành học
          </p>
        </div>
      </main>

      <Footer />
      <HeulwenChatbot isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      <ChatFAB onClick={() => setChatOpen(true)} isOpen={chatOpen} />
    </div>
  );
}