import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, MessageSquare, TrendingUp, Clock, Users, GraduationCap, Download, Info, Banknote, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const categoryBadge = {
  'Sư phạm': { label: 'SƯ PHẠM & GIÁO DỤC', color: 'bg-blue-600' },
  'Kỹ thuật - Công nghệ': { label: 'KỸ THUẬT & CÔNG NGHỆ', color: 'bg-indigo-600' },
  'Kinh tế': { label: 'KINH TẾ & QUẢN LÝ', color: 'bg-amber-600' },
  'Khoa học xã hội': { label: 'XÃ HỘI & NHÂN VĂN', color: 'bg-teal-600' },
  'Y tế - Sức khỏe': { label: 'Y TẾ & SỨC KHỎE', color: 'bg-red-600' },
  'Ngoại ngữ': { label: 'NGOẠI NGỮ', color: 'bg-purple-600' },
  'Nghệ thuật': { label: 'NGHỆ THUẬT', color: 'bg-pink-600' },
  'Nông lâm ngư': { label: 'NÔNG LÂM NGƯ', color: 'bg-green-600' },
};

export default function MajorRow({ major, onAskAI, isSelected }) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (isSelected) {
      setExpanded(true);
    }
  }, [isSelected]);

  const badge = categoryBadge[major.category] || { label: major.category?.toUpperCase(), color: 'bg-gray-600' };

  const scoreDiff = major.score_2024 && major.score_2023
    ? (major.score_2024 - major.score_2023).toFixed(1)
    : null;

  const careerList = major.career_prospects
    ? major.career_prospects.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div 
      id={`major-${major.code}`}
      className={`border rounded-2xl overflow-hidden transition-all duration-500 bg-white ${
        isSelected 
          ? 'border-[#C8A951] ring-2 ring-[#C8A951]/30 shadow-xl scale-[1.01]' 
          : expanded 
          ? 'border-[#1A3A6B]/30 shadow-lg' 
          : 'border-gray-200 hover:border-[#C8A951]/40 hover:shadow-md'
      }`}
    >
      {/* Card Header */}
      <div className="px-6 pt-5 pb-4">
        {/* Top row: badge + code */}
        <div className="flex items-center justify-between mb-3">
          <span className={`inline-block px-3 py-1 rounded text-[10px] font-bold text-white tracking-wider ${badge.color}`}>
            {badge.label}
          </span>
          <span className="font-inter text-sm font-semibold text-[#1A3A6B]">
            Mã: <span className="text-[#C8A951]">{major.code || '—'}</span>
          </span>
        </div>

        {/* Major name + description */}
        <h3 className="font-playfair text-xl font-bold text-[#0A1931] mb-1.5">{major.name}</h3>
        {major.description && (
          <p className="font-inter text-sm text-gray-500 leading-relaxed line-clamp-2">{major.description}</p>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-0 mt-4 border border-gray-100 rounded-xl overflow-hidden">
          <div className="flex flex-col items-center py-3 border-r border-gray-100">
            <span className="font-inter text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">THPT 2025</span>
            <span className="font-inter text-lg font-bold text-[#1A3A6B]">
              {major.score_2024 ? `${major.score_2024}đ` : '—'}
            </span>
          </div>
          <div className="flex flex-col items-center py-3 border-r border-gray-100">
            <span className="font-inter text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">HỌC BẠ 2025</span>
            <span className="font-inter text-lg font-bold text-emerald-600">
              {major.score_2023 ? `${major.score_2023}đ` : '—'}
            </span>
          </div>
          <div className="flex flex-col items-center py-3">
            <span className="font-inter text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">CHỈ TIÊU '26</span>
            <span className="font-inter text-lg font-bold text-[#0A1931]">
              {major.quota || '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5 border-t border-gray-100 pt-5">
              {/* Career Prospects */}
              {careerList.length > 0 && (
                <div className="mb-5">
                  <h4 className="font-inter text-sm font-bold text-[#0A1931] uppercase tracking-wide mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#C8A951]" />
                    Cơ hội công việc làm rộng mở
                  </h4>
                  <ul className="space-y-1.5">
                    {careerList.map((career, i) => (
                      <li key={i} className="font-inter text-sm text-gray-600 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1A3A6B] mt-1.5 shrink-0" />
                        {career}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Duration + Degree row */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="flex items-center gap-3 p-3.5 bg-[#F7F8FA] rounded-xl border border-gray-100">
                  <Clock className="w-5 h-5 text-[#C8A951] shrink-0" />
                  <div>
                    <div className="font-inter text-[10px] text-gray-400 uppercase tracking-wider">Thời gian học</div>
                    <div className="font-inter text-sm font-bold text-[#0A1931]">
                      {major.duration_years ? `${major.duration_years * 2} học kỳ (${major.duration_years} năm)` : '—'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3.5 bg-[#F7F8FA] rounded-xl border border-gray-100">
                  <GraduationCap className="w-5 h-5 text-[#C8A951] shrink-0" />
                  <div>
                    <div className="font-inter text-[10px] text-gray-400 uppercase tracking-wider">Văn bằng tốt nghiệp</div>
                    <div className="font-inter text-sm font-bold text-[#0A1931]">
                      {major.category === 'Kỹ thuật - Công nghệ' ? 'Kỹ sư / Cử nhân' : 'Cử nhân'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tuition Fee */}
              <div className="mb-5 p-4 bg-gradient-to-r from-[#FFF9E6] to-[#FFF4CC] rounded-xl border border-[#C8A951]/20">
                <div className="flex items-center gap-2 mb-1">
                  <Banknote className="w-4 h-4 text-[#C8A951]" />
                  <span className="font-inter text-[10px] text-[#967C34] uppercase tracking-wider font-bold">
                    Học phí niên khóa 2026:
                  </span>
                </div>
                <div className="font-inter text-base font-bold text-[#1A3A6B]">
                  {major.tuition_per_year === 0
                    ? '🎓 Miễn học phí (Nghị định 116 — Ngành Sư phạm)'
                    : major.tuition_per_year
                      ? `Ước tính: ~${major.tuition_per_year} triệu VNĐ/năm`
                      : 'Liên hệ Phòng Đào tạo'}
                </div>
              </div>

              {/* Admission Groups */}
              {major.admission_groups && (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-inter text-sm font-semibold text-[#0A1931]">Khối xét tuyển:</span>
                  {major.admission_groups.split(',').map((g, i) => (
                    <span key={i} className="px-3 py-1.5 bg-[#F0F2F7] rounded-lg font-inter text-sm font-bold text-[#1A3A6B] border border-[#1A3A6B]/10">
                      {g.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Actions */}
      <div className="flex items-center justify-between px-6 py-3.5 border-t border-gray-100 bg-[#FCFCFD]">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 font-inter text-sm font-medium text-[#1A3A6B] hover:text-[#C8A951] transition-colors"
        >
          {expanded ? (
            <>
              <Info className="w-4 h-4" />
              Thu gọn thông tin
            </>
          ) : (
            <>
              <Info className="w-4 h-4" />
              Xem chi tiết Ngành
            </>
          )}
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onAskAI(major.name)}
            title="Hỏi AI về ngành này"
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:border-[#C8A951] hover:text-[#C8A951] transition-all"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          <Link
            to="/admission"
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1A3A6B] hover:bg-[#C8A951] text-white font-inter text-sm font-semibold rounded-xl transition-all duration-200 shadow-md shadow-[#1A3A6B]/15 hover:shadow-[#C8A951]/20"
          >
            Đăng Ký NV
          </Link>
        </div>
      </div>
    </div>
  );
}