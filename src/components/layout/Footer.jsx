import { Link } from 'react-router-dom';
import { GraduationCap, MapPin, Phone, Mail, Facebook } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0A1931] text-white">
      {/* Gold divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#C8A951] to-transparent" />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-[#C8A951] flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-playfair text-2xl font-bold">Heulwen</div>
                <div className="text-xs font-inter text-[#C8A951] tracking-widest uppercase">AI Tư Vấn Tuyển Sinh</div>
              </div>
            </div>
            <p className="font-inter text-white/60 text-sm leading-relaxed max-w-sm">
              Nền tảng tư vấn tuyển sinh thông minh của Đại học Vinh — hỗ trợ thí sinh 24/7 với công nghệ AI tiên tiến.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a href="#" className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:border-[#C8A951] hover:text-[#C8A951] transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-playfair text-lg font-semibold mb-5 text-[#C8A951]">Tra cứu nhanh</h4>
            <ul className="space-y-3">
              {[
                { label: 'Danh sách ngành học', path: '/majors' },
                { label: 'Điểm chuẩn', path: '/majors' },
                { label: 'Thông tin tuyển sinh', path: '/admission' },
                { label: 'Học phí & Học bổng', path: '/tuition' },
                { label: 'Câu hỏi thường gặp', path: '/faq' },
              ].map(link => (
                <li key={link.path}>
                  <Link to={link.path} className="font-inter text-sm text-white/60 hover:text-[#C8A951] transition-colors flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-[#C8A951]" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-playfair text-lg font-semibold mb-5 text-[#C8A951]">Liên hệ</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#C8A951] mt-0.5 shrink-0" />
                <span className="font-inter text-sm text-white/60">182 Lê Duẩn, TP. Vinh, Nghệ An</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#C8A951] shrink-0" />
                <span className="font-inter text-sm text-white/60">0238 3855 452</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#C8A951] shrink-0" />
                <span className="font-inter text-sm text-white/60">tuyensinh@vinhuni.edu.vn</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-inter text-xs text-white/40">
            © 2026 Đại học Vinh · Hệ thống tư vấn AI Heulwen. Bảo lưu mọi quyền.
          </p>
          <p className="font-inter text-xs text-white/40">
            Được phát triển bởi Phòng Đào tạo — Đại học Vinh
          </p>
        </div>
      </div>
    </footer>
  );
}