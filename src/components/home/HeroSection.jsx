import { useState } from 'react';
import { Search, ArrowRight, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HeroSection({ onOpenChat }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) onOpenChat();
  };

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1562774053-701939374585?w=1920&q=80"
          alt="Đại học Vinh - khuôn viên trường"
          className="w-full h-full object-cover object-center"
        />
        <div className="hero-overlay absolute inset-0" />
      </div>

      {/* Gold thread vertical line */}
      <div className="absolute left-10 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#C8A951]/40 to-transparent hidden lg:block" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 pt-28 pb-20">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 border border-[#C8A951]/50 rounded-full mb-8 backdrop-blur-sm bg-white/5">
            <span className="w-2 h-2 rounded-full bg-[#C8A951] animate-pulse" />
            <span className="text-[#C8A951] font-inter text-xs font-medium tracking-wider uppercase">
              Tuyển sinh 2026 — AI Tư vấn 24/7
            </span>
          </div>

          {/* Heading */}
          <h1 className="font-playfair text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
            Hành trình
            <span className="block text-[#C8A951] italic">tri thức</span>
            bắt đầu từ đây
          </h1>

          <p className="font-inter text-white/75 text-lg md:text-xl leading-relaxed mb-10 max-w-xl">
            Khám phá hơn <strong className="text-white">50 ngành học</strong> tại Đại học Vinh. Nhận tư vấn tuyển sinh cá nhân hoá ngay từ AI Heulwen.
          </p>

          {/* Search / Chat Trigger */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-xl">
            <div 
              onClick={() => window.dispatchEvent(new CustomEvent('open-global-search'))}
              className="flex-1 flex items-center gap-3 bg-white/95 backdrop-blur-md rounded-2xl px-4 py-3.5 sm:px-5 sm:py-4 shadow-2xl border border-white/20 cursor-pointer"
            >
              <Search className="w-5 h-5 text-[#1A3A6B] shrink-0" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Tìm ngành học, học phí, học bổng, quy chế..."
                className="flex-1 bg-transparent font-inter text-[#0A1931] placeholder-gray-400 outline-none text-sm pointer-events-none"
                readOnly
              />
              <span className="text-xs font-inter text-[#C8A951] font-medium hidden sm:block">AI</span>
            </div>
            <button
              type="button"
              onClick={onOpenChat}
              className="px-6 py-3.5 sm:py-4 bg-[#C8A951] hover:bg-[#967C34] text-white font-semibold font-inter rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap shadow-lg hover:shadow-xl"
            >
              Hỏi ngay
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Stats */}
          <div className="mt-16 flex flex-wrap gap-10">
            {[
              { num: '50+', label: 'Ngành đào tạo' },
              { num: '30,000+', label: 'Sinh viên' },
              { num: '60+', label: 'Năm thành lập' },
              { num: '24/7', label: 'AI hỗ trợ' },
            ].map(stat => (
              <div key={stat.label} className="border-l-2 border-[#C8A951] pl-4">
                <div className="font-playfair text-3xl font-bold text-white">{stat.num}</div>
                <div className="font-inter text-sm text-white/60 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-white/50">
        <span className="text-xs font-inter tracking-widest uppercase">Khám phá</span>
        <ChevronDown className="w-5 h-5 animate-bounce" />
      </div>
    </section>
  );
}