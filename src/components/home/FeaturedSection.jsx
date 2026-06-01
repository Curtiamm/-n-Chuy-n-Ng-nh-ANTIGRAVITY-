import { Link } from 'react-router-dom';
import { BookOpen, FileText, Wallet, Home, ArrowRight, Sparkles } from 'lucide-react';

const features = [
  {
    icon: BookOpen,
    title: 'Ngành học & Điểm chuẩn',
    desc: 'Tra cứu 50+ ngành đào tạo, điểm chuẩn từng năm và tổ hợp môn xét tuyển',
    link: '/majors',
    color: 'from-[#1A3A6B] to-[#2A5298]',
  },
  {
    icon: FileText,
    title: 'Quy trình & Hồ sơ',
    desc: 'Hướng dẫn chi tiết các phương thức xét tuyển, thủ tục nộp hồ sơ',
    link: '/admission',
    color: 'from-[#967C34] to-[#C8A951]',
  },
  {
    icon: Wallet,
    title: 'Học phí & Học bổng',
    desc: 'Thông tin học phí theo ngành, chính sách học bổng và hỗ trợ tài chính',
    link: '/tuition',
    color: 'from-[#1A3A6B] to-[#2A5298]',
  },
  {
    icon: Home,
    title: 'Ký túc xá',
    desc: 'Điều kiện ở, chi phí và thủ tục đăng ký ký túc xá sinh viên',
    link: '/tuition#ktx',
    color: 'from-[#967C34] to-[#C8A951]',
  },
];

export default function FeaturedSection({ onOpenChat }) {
  return (
    <section className="section-padding bg-[#FCFCFD]">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Heading */}
        <div className="text-center mb-16">
          <p className="font-inter text-sm font-medium tracking-widest uppercase text-[#C8A951] mb-3">
            Thông tin tuyển sinh 2026
          </p>
          <h2 className="font-playfair text-4xl md:text-5xl font-bold text-[#0A1931] mb-4">
            Mọi thứ bạn cần biết
          </h2>
          <div className="w-16 h-px bg-[#C8A951] mx-auto" />
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((f, i) => (
            <Link
              key={f.title}
              to={f.link}
              className="stagger-item group relative overflow-hidden rounded-2xl p-6 bg-white border border-gray-100 hover:border-[#C8A951]/40 shadow-sm hover:shadow-xl transition-all duration-500"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <f.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-playfair text-lg font-semibold text-[#0A1931] mb-2">{f.title}</h3>
              <p className="font-inter text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              <div className="mt-4 flex items-center gap-1 text-[#C8A951] text-sm font-medium font-inter opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Xem chi tiết <ArrowRight className="w-4 h-4" />
              </div>
              {/* Gold corner accent */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[#C8A951]/10 to-transparent rounded-bl-2xl" />
            </Link>
          ))}
        </div>

        {/* AI Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0A1931] via-[#1A3A6B] to-[#0A1931] p-8 md:p-12 text-white">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 w-64 h-64 rounded-full bg-[#C8A951] blur-3xl" />
            <div className="absolute bottom-4 left-4 w-40 h-40 rounded-full bg-[#C8A951] blur-2xl" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-[#C8A951]" />
                <span className="font-inter text-sm font-medium text-[#C8A951] tracking-wide uppercase">
                  Heulwen AI
                </span>
              </div>
              <h3 className="font-playfair text-3xl font-bold mb-2">
                Tư vấn thông minh — Tức thì
              </h3>
              <p className="font-inter text-white/70 text-base max-w-lg">
                Đặt bất kỳ câu hỏi nào về tuyển sinh. AI Heulwen sẽ phân tích và tư vấn cá nhân hoá cho bạn trong vài giây.
              </p>
            </div>
            <button
              onClick={onOpenChat}
              className="shrink-0 flex items-center gap-2 px-8 py-4 bg-[#C8A951] hover:bg-[#967C34] text-white font-semibold font-inter rounded-2xl transition-all duration-300 shadow-lg hover:shadow-2xl text-base whitespace-nowrap"
            >
              <Sparkles className="w-5 h-5" />
              Trò chuyện ngay
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}