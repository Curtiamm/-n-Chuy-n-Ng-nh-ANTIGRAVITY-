import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { localDB } from '@/lib/localDB';
import { 
  Search, X, Sparkles, GraduationCap, Wallet, Award, BookOpen, HelpCircle, ArrowRight, CornerDownLeft, ArrowLeft, Home
} from 'lucide-react';
import { VINH_UNI_MAJORS, VINH_UNI_SCHOLARSHIPS, GENERAL_ENROLL_GUIDELINES } from '@/data/vinhUniData';

const TUITION_DATA = [
  { group: 'Kỹ thuật - Công nghệ', range: '18 – 25 triệu/năm', examples: 'CNTT, Kỹ thuật Điện tử, Xây dựng' },
  { group: 'Sư phạm', range: '0 triệu (Theo NĐ 116)', examples: 'SP Toán, SP Văn, SP Tiếng Anh' },
  { group: 'Kinh tế', range: '16 – 22 triệu/năm', examples: 'Quản trị kinh doanh, Kế toán, Tài chính' },
  { group: 'Y tế - Sức khỏe', range: '22 – 28 triệu/năm', examples: 'Y đa khoa, Dược học, Điều dưỡng' },
  { group: 'Ngoại ngữ', range: '15 – 18 triệu/năm', examples: 'Ngôn ngữ Anh, Ngôn ngữ Trung, Ngôn ngữ Nhật' },
  { group: 'Khoa học xã hội', range: '13 – 16 triệu/năm', examples: 'Luật, Công tác xã hội, Báo chí' },
];

const removeAccents = (str) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};

const SEARCH_CATEGORIES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'major', label: '🎓 Ngành học' },
  { id: 'tuition', label: '💰 Học phí' },
  { id: 'scholarship', label: '🏆 Học bổng' },
  { id: 'admission', label: '📝 Quy chế' },
  { id: 'faq', label: '❓ Hỏi đáp' },
];

const POPULAR_SEARCHES = [
  { term: 'Công nghệ thông tin', type: 'major' },
  { term: 'Học phí sư phạm', type: 'tuition' },
  { term: 'Học bổng thủ khoa', type: 'scholarship' },
  { term: 'Tuyển thẳng', type: 'admission' },
];

export default function SmartSearchModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState('all');
  const inputRef = useRef(null);
  const resultsContainerRef = useRef(null);

  // Fetch majors and FAQs dynamically
  const { data: majors = [] } = useQuery({
    queryKey: ['majors'],
    queryFn: () => localDB.Major.filter({ is_active: true }),
    enabled: isOpen
  });

  const { data: faqs = [] } = useQuery({
    queryKey: ['faqs'],
    queryFn: () => localDB.FAQ.filter({ is_active: true }),
    enabled: isOpen
  });

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
      setActiveCategory('all');
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle global keyboard shortcut (Esc to close, Arrow keys, Enter)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Process search query and build suggestions list
  const getFilteredResults = () => {
    const queryClean = removeAccents(searchQuery.toLowerCase().trim());
    const matches = [];
    const isQueryEmpty = !searchQuery.trim();

    const includeMajors = activeCategory === 'all' || activeCategory === 'major';
    const includeScholarships = activeCategory === 'all' || activeCategory === 'scholarship';
    const includeTuition = activeCategory === 'all' || activeCategory === 'tuition';
    const includeAdmission = activeCategory === 'all' || activeCategory === 'admission';
    const includeFaqs = activeCategory === 'all' || activeCategory === 'faq';

    // 1. Search Majors (with fallback to data source if localDB is empty)
    if (includeMajors) {
      const displayMajors = majors.length > 0 ? majors : VINH_UNI_MAJORS;
      displayMajors.forEach(m => {
        const nameClean = removeAccents(m.name?.toLowerCase() || '');
        const codeClean = removeAccents(m.code?.toLowerCase() || '');
        const descClean = removeAccents(m.description?.toLowerCase() || '');
        
        if (isQueryEmpty || nameClean.includes(queryClean) || codeClean.includes(queryClean) || descClean.includes(queryClean)) {
          matches.push({
            type: 'major',
            category: 'Ngành học',
            title: m.name,
            subtitle: `Mã ngành: ${m.code} · Chỉ tiêu: ${m.quota || m.slots || 100}`,
            icon: GraduationCap,
            data: m
          });
        }
      });
    }

    // 2. Search Scholarships
    if (includeScholarships) {
      VINH_UNI_SCHOLARSHIPS.forEach(s => {
        const nameClean = removeAccents(s.name.toLowerCase());
        const valueClean = removeAccents(s.value.toLowerCase());
        const criteriaClean = removeAccents(s.criteria.toLowerCase());

        if (isQueryEmpty || nameClean.includes(queryClean) || valueClean.includes(queryClean) || criteriaClean.includes(queryClean)) {
          matches.push({
            type: 'scholarship',
            category: 'Học bổng',
            title: s.name,
            subtitle: `Trị giá: ${s.value} · ${s.slots}`,
            icon: Award,
            data: s
          });
        }
      });
    }

    // 3. Search Tuition Data
    if (includeTuition) {
      TUITION_DATA.forEach(t => {
        const groupClean = removeAccents(t.group.toLowerCase());
        const examplesClean = removeAccents(t.examples.toLowerCase());

        if (isQueryEmpty || groupClean.includes(queryClean) || examplesClean.includes(queryClean)) {
          matches.push({
            type: 'tuition',
            category: 'Học phí',
            title: `Học phí nhóm ${t.group}`,
            subtitle: `Mức học phí: ${t.range}`,
            icon: Wallet,
            data: t
          });
        }
      });
    }

    // 4. Search Admission Guidelines
    if (includeAdmission) {
      GENERAL_ENROLL_GUIDELINES.methods.forEach((m, idx) => {
        const nameClean = removeAccents(m.name.toLowerCase());
        const detailsClean = removeAccents(m.details.toLowerCase());

        if (isQueryEmpty || nameClean.includes(queryClean) || detailsClean.includes(queryClean)) {
          matches.push({
            type: 'admission',
            category: 'Quy chế tuyển sinh',
            title: m.name,
            subtitle: m.details,
            icon: BookOpen,
            data: { ...m, index: idx }
          });
        }
      });
    }

    // 5. Search FAQs
    if (includeFaqs) {
      const faqList = faqs.length > 0 ? faqs : [
        { id: '1', question: 'Đại học Vinh có những phương thức xét tuyển nào?', answer: 'Năm 2026, Đại học Vinh xét tuyển bằng 4 phương thức...', category: 'Hồ sơ đăng ký' },
        { id: '2', question: 'Điểm chuẩn năm 2024 của các ngành là bao nhiêu?', answer: 'Điểm chuẩn 2024 dao động từ 18 đến 25 điểm...', category: 'Ngành học' },
        { id: '3', question: 'Học phí ngành Sư phạm có được miễn không?', answer: 'Có. Sinh viên Sư phạm được Nhà nước hỗ trợ...', category: 'Học phí' }
      ];

      faqList.forEach(f => {
        const questionClean = removeAccents(f.question.toLowerCase());
        const answerClean = removeAccents(f.answer.toLowerCase());

        if (isQueryEmpty || questionClean.includes(queryClean) || answerClean.includes(queryClean)) {
          matches.push({
            type: 'faq',
            category: `Hỏi đáp (${f.category})`,
            title: f.question,
            subtitle: f.answer,
            icon: HelpCircle,
            data: f
          });
        }
      });
    }

    // 6. Search KTX (Ký túc xá) Info
    const includeKtx = activeCategory === 'all' || activeCategory === 'tuition';
    if (includeKtx) {
      const ktxList = [
        { label: 'Ký túc xá - Phòng 4 người', price: '600.000 đ/tháng', desc: 'Điều hòa, tủ lạnh, bàn học cá nhân' },
        { label: 'Ký túc xá - Phòng 6 người', price: '450.000 đ/tháng', desc: 'Quạt trần, tủ đồ chung, bàn học' },
        { label: 'Ký túc xá - Phòng VIP (2 người)', price: '1.200.000 đ/tháng', desc: 'Điều hòa, WC riêng, wifi tốc độ cao' },
      ];
      ktxList.forEach(k => {
        const labelClean = removeAccents(k.label.toLowerCase());
        const descClean = removeAccents(k.desc.toLowerCase());

        if (isQueryEmpty || labelClean.includes(queryClean) || descClean.includes(queryClean) || queryClean.includes('ktx') || queryClean.includes('ky tuc xa')) {
          matches.push({
            type: 'ktx',
            category: 'Ký túc xá',
            title: k.label,
            subtitle: `Giá: ${k.price} · ${k.desc}`,
            icon: Home,
            data: k
          });
        }
      });
    }

    if (isQueryEmpty) {
      if (activeCategory === 'all') return [];
      return matches; // Return all items in this category
    }

    return matches.slice(0, 15); // limit query results to top 15 matches
  };

  const results = getFilteredResults();

  // Keyboard navigation for suggestions
  const handleInputKeyDown = (e) => {
    if (results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelectResult(results[selectedIndex]);
    }
  };

  // Auto-scroll selected item into view
  useEffect(() => {
    if (resultsContainerRef.current) {
      const selectedElement = resultsContainerRef.current.querySelector('[data-selected="true"]');
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Navigate to corresponding details page
  const handleSelectResult = (item) => {
    if (!item) return;
    onClose();

    if (item.type === 'major') {
      navigate(`/majors?select=${item.data.code}`);
    } else if (item.type === 'tuition') {
      navigate('/tuition?tab=tuition');
    } else if (item.type === 'scholarship') {
      navigate('/tuition?tab=scholarship');
    } else if (item.type === 'faq') {
      navigate(`/faq?search=${encodeURIComponent(item.data.question)}`);
    } else if (item.type === 'admission') {
      navigate(`/admission?tab=guide&method=${item.data.index}`);
    } else if (item.type === 'ktx') {
      navigate('/tuition?tab=ktx');
    }
  };

  if (!isOpen) return null;

  const activeResult = results[selectedIndex];

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-center items-start md:items-center bg-[#0A1931]/60 backdrop-blur-md animate-fade-in p-0 md:p-4" onClick={onClose}>
      <div 
        className="bg-white border-none md:border md:border-white/20 shadow-2xl rounded-none md:rounded-3xl w-full max-w-4xl h-full md:h-[80vh] max-h-full md:max-h-[80vh] overflow-hidden flex flex-col md:grid md:grid-cols-12 glassmorphism animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Left Search Pane (List of matches) */}
        <div className="flex flex-col h-full min-h-0 md:col-span-7 border-r border-gray-100">
          {/* Input Bar */}
          <div className="p-4 pt-[calc(env(safe-area-inset-top,0px)+1rem)] md:pt-4 border-b border-gray-100 flex items-center gap-3 bg-white">
            <button 
              onClick={onClose}
              className="block md:hidden p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full cursor-pointer shrink-0"
              title="Quay lại"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Search className="hidden md:block w-5 h-5 text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Tìm ngành học, học phí, học bổng, quy chế..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleInputKeyDown}
              className="flex-1 bg-transparent font-inter text-sm outline-none text-[#0A1931]"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 border rounded-lg bg-gray-50 text-[10px] text-gray-400 font-mono">
              <span>ESC</span>
            </div>
          </div>

          {/* Category Tab Bar */}
          <div className="flex gap-1.5 px-4 py-2 bg-slate-50/50 border-b border-gray-100 overflow-x-auto no-scrollbar scroll-smooth">
            {SEARCH_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setSelectedIndex(0);
                }}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold font-inter transition-all whitespace-nowrap cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-[#1A3A6B] text-white shadow-xs'
                    : 'bg-white hover:bg-gray-100 text-gray-500 border border-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Results Area */}
          <div ref={resultsContainerRef} className="flex-1 overflow-y-auto p-3 space-y-4">
            {searchQuery.trim() === '' && activeCategory === 'all' ? (
              /* Guides / Popular Searches when query is empty */
              <div className="p-4 space-y-5">
                <div>
                  <h4 className="font-playfair text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Tìm kiếm phổ biến</h4>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_SEARCHES.map(p => (
                      <button
                        key={p.term}
                        onClick={() => {
                          setSearchQuery(p.term);
                          inputRef.current?.focus();
                        }}
                        className="px-3.5 py-2 bg-slate-50 hover:bg-[#C8A951]/10 border border-gray-150 hover:border-[#C8A951]/40 rounded-xl text-xs font-inter font-medium text-[#0A1931] hover:text-[#967C34] transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Search className="w-3 h-3 text-gray-400" />
                        {p.term}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-gray-100">
                  <h5 className="font-playfair text-xs font-bold text-[#0A1931] mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#C8A951] animate-pulse" />
                    Mẹo tra cứu thông minh
                  </h5>
                  <ul className="text-xs text-gray-500 font-inter space-y-2 leading-relaxed">
                    <li>· Nhập tên ngành hoặc mã ngành để xem điểm chuẩn (ví dụ: <strong className="text-[#0A1931]">CNTT</strong> hoặc <strong className="text-[#0A1931]">7480201</strong>).</li>
                    <li>· Nhập <strong className="text-[#0A1931]">học phí</strong> hoặc <strong className="text-[#0A1931]">học bổng</strong> để biết chính sách chi phí và các suất tài trợ.</li>
                    <li>· Nhập <strong className="text-[#0A1931]">tuyển thẳng</strong> hoặc <strong className="text-[#0A1931]">học bạ</strong> để đọc nhanh quy chế hồ sơ.</li>
                    <li>· Sử dụng phím mũi tên <strong className="text-[#0A1931]">↑ ↓</strong> để duyệt nhanh kết quả và nhấn <strong className="text-[#0A1931]">Enter</strong> để truy cập.</li>
                  </ul>
                </div>
              </div>
            ) : results.length === 0 ? (
              /* No results */
              <div className="py-12 text-center text-gray-400 space-y-2">
                <HelpCircle className="w-10 h-10 text-gray-300 mx-auto animate-bounce" />
                <h4 className="font-playfair text-sm font-bold text-slate-700">Không tìm thấy thông tin phù hợp</h4>
                <p className="font-inter text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                  Thử tìm kiếm với từ khóa khác như "CNTT", "sư phạm", "học phí" hoặc hỏi trực tiếp AI counselor Heulwen.
                </p>
              </div>
            ) : (
              /* Suggestions List */
              <div className="space-y-1.5">
                {results.map((item, idx) => {
                  const Icon = item.icon;
                  const isSelected = selectedIndex === idx;

                  return (
                    <button
                      key={`${item.type}-${idx}`}
                      type="button"
                      data-selected={isSelected}
                      onClick={() => handleSelectResult(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 border cursor-pointer ${
                        isSelected 
                          ? 'bg-[#0A1931]/5 border-[#C8A951]/60 shadow-xs' 
                          : 'bg-white border-transparent hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-[#C8A951] text-white' : 'bg-slate-50 text-gray-400'
                      }`}>
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider font-mono block mb-0.5">{item.category}</span>
                        <h5 className={`text-xs md:text-sm font-bold truncate leading-snug ${isSelected ? 'text-[#1A3A6B]' : 'text-[#0A1931]'}`}>
                          {item.title}
                        </h5>
                        <p className="text-xs text-gray-400 font-inter truncate leading-normal mt-0.5">{item.subtitle}</p>
                      </div>
                      <div className={`self-center shrink-0 transition-transform ${isSelected ? 'translate-x-1 opacity-100' : 'opacity-0'}`}>
                        <ArrowRight className="w-4 h-4 text-[#C8A951]" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Preview Pane (Split-pane detail summary on desktop) */}
        <div className="hidden md:flex md:col-span-5 h-full min-h-0 flex-col bg-slate-50/50 p-6 overflow-y-auto">
          {activeResult ? (
            <div className="space-y-5 animate-fade-in flex flex-col justify-between h-full">
              <div className="space-y-4">
                <span className="inline-block px-2.5 py-1 bg-[#C8A951]/10 text-[#967C34] text-[10px] font-bold rounded-lg uppercase tracking-wider font-mono">
                  {activeResult.category}
                </span>
                
                <h3 className="font-playfair text-lg font-bold text-[#0A1931] leading-snug">
                  {activeResult.title}
                </h3>
                
                <div className="w-8 h-0.5 bg-[#C8A951]" />

                {/* Major Preview Details */}
                {activeResult.type === 'major' && (
                  <div className="space-y-4 font-inter text-xs text-gray-600 leading-relaxed">
                    <p>{activeResult.data.description}</p>
                    <div className="bg-white p-3 rounded-xl border border-gray-150 space-y-2">
                      <div className="flex justify-between">
                        <span>Chỉ tiêu tuyển:</span>
                        <strong className="text-[#0A1931]">{activeResult.data.quota || activeResult.data.slots} chỉ tiêu</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Điểm chuẩn 2024:</span>
                        <strong className="text-[#0A1931] font-mono">{activeResult.data.score_2024 || activeResult.data.exemptScore2024} đ</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Học phí dự kiến:</span>
                        <strong className="text-[#C8A951]">{activeResult.data.tuition_per_year || activeResult.data.tuition > 0 ? `${activeResult.data.tuition_per_year || activeResult.data.tuition}M/năm` : 'Miễn phí'}</strong>
                      </div>
                    </div>
                    {activeResult.data.jobOpportunities && (
                      <div className="space-y-1">
                        <span className="font-semibold text-[#0A1931] block">Cơ hội nghề nghiệp:</span>
                        <p className="line-clamp-2 italic text-gray-400">
                          {activeResult.data.jobOpportunities.join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Scholarship Preview Details */}
                {activeResult.type === 'scholarship' && (
                  <div className="space-y-4 font-inter text-xs text-gray-600 leading-relaxed">
                    <p>{activeResult.data.description}</p>
                    <div className="bg-white p-3 rounded-xl border border-gray-150 space-y-2">
                      <div className="flex justify-between">
                        <span>Trị giá:</span>
                        <strong className="text-emerald-600 font-bold">{activeResult.data.value}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Số lượng:</span>
                        <strong className="text-[#0A1931]">{activeResult.data.slots}</strong>
                      </div>
                    </div>
                    <div className="p-2.5 bg-amber-500/5 border border-amber-500/10 rounded-xl text-amber-900">
                      <strong>Tiêu chí xét duyệt:</strong> {activeResult.data.criteria}
                    </div>
                  </div>
                )}

                {/* Tuition Preview Details */}
                {activeResult.type === 'tuition' && (
                  <div className="space-y-4 font-inter text-xs text-gray-600 leading-relaxed">
                    <div className="bg-white p-3 rounded-xl border border-gray-150 space-y-2">
                      <div className="flex justify-between">
                        <span>Mức học phí:</span>
                        <strong className="text-[#C8A951] font-bold">{activeResult.data.range}</strong>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="font-semibold text-[#0A1931] block">Các ngành học tiêu biểu:</span>
                      <p className="italic text-gray-400">{activeResult.data.examples}</p>
                    </div>
                  </div>
                )}

                {/* Admission Guideline Preview Details */}
                {activeResult.type === 'admission' && (
                  <div className="space-y-4 font-inter text-xs text-gray-600 leading-relaxed">
                    <p>{activeResult.data.details}</p>
                    <div className="p-3 bg-[#0A1931]/5 border rounded-xl text-[#0A1931]">
                      Click để xem hướng dẫn quy trình đăng ký xét tuyển chi tiết cho phương thức này.
                    </div>
                  </div>
                )}

                {/* FAQ Preview Details */}
                {activeResult.type === 'faq' && (
                  <div className="space-y-3 font-inter text-xs text-gray-600 leading-relaxed">
                    <span className="font-semibold text-[#0A1931] block">Câu trả lời:</span>
                    <p className="p-3 bg-white border rounded-xl text-gray-500 line-clamp-6 leading-relaxed">
                      {activeResult.data.answer}
                    </p>
                  </div>
                )}

                {/* KTX Preview Details */}
                {activeResult.type === 'ktx' && (
                  <div className="space-y-4 font-inter text-xs text-gray-600 leading-relaxed">
                    <div className="bg-white p-3 rounded-xl border border-gray-150 space-y-2">
                      <div className="flex justify-between">
                        <span>Giá phòng:</span>
                        <strong className="text-[#1A3A6B] font-bold">{activeResult.data.price}</strong>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="font-semibold text-[#0A1931] block">Tiện nghi:</span>
                      <p className="italic text-gray-400">{activeResult.data.desc}</p>
                    </div>
                    <div className="p-3 bg-[#C8A951]/5 border rounded-xl text-[#967C34]">
                      Thí sinh đăng ký lưu trú ký túc xá trực tiếp trên Cổng thông tin Sinh viên sau khi hoàn thành nhập học.
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200 mt-auto flex items-center justify-between text-[11px] font-medium text-gray-400">
                <span className="flex items-center gap-1">
                  Nhấn <span className="px-1 border rounded bg-white text-gray-600 font-mono text-[9px]">Enter</span> để mở trang
                </span>
                <span className="flex items-center gap-0.5 text-[#C8A951]">
                  Đi đến mục <CornerDownLeft className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 p-4 space-y-2">
              <GraduationCap className="w-10 h-10 text-gray-200 animate-pulse" />
              <h5 className="font-playfair text-xs font-bold text-slate-500 uppercase">Xem trước thông tin</h5>
              <p className="font-inter text-[11px] text-gray-400 max-w-[180px] leading-relaxed">
                Di chuyển chuột hoặc dùng phím mũi tên để xem nhanh nội dung chi tiết.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
