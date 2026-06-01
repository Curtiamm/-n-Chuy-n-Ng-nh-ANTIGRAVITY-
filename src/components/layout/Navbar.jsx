import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, GraduationCap, LogIn, LogOut, User } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const navLinks = [
  { label: 'Trang chủ', path: '/' },
  { label: 'Ngành học', path: '/majors' },
  { label: 'Thông tin tuyển sinh', path: '/admission' },
  { label: 'Học phí & Học bổng', path: '/tuition' },
  { label: 'Hỏi đáp', path: '/faq' },
];

export default function Navbar({ onOpenChat }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout, navigateToLogin } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-[#C8A951]/20">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 md:h-20 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-oxford flex items-center justify-center group-hover:bg-[#C8A951] transition-colors duration-300">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-playfair text-xl font-bold text-oxford">Heulwen</span>
            <span className="block text-[10px] font-inter text-[#967C34] tracking-widest uppercase leading-none">Đại học Vinh</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`font-inter text-sm font-medium transition-colors duration-200 relative group ${
                location.pathname === link.path
                  ? 'text-[#C8A951]'
                  : 'text-oxford hover:text-[#C8A951]'
              }`}
            >
              {link.label}
              <span className={`absolute -bottom-1 left-0 h-px bg-[#C8A951] transition-all duration-300 ${
                location.pathname === link.path ? 'w-full' : 'w-0 group-hover:w-full'
              }`} />
            </Link>
          ))}
        </div>

        {/* Right Actions */}
        <div className="hidden lg:flex items-center gap-4">
          <button
            onClick={onOpenChat}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#C8A951] hover:bg-[#967C34] text-white text-sm font-semibold font-inter rounded-full transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Hỏi AI Heulwen
          </button>
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm font-inter text-oxford/70">
                <User className="w-4 h-4" />
                <span className="max-w-[120px] truncate">{user?.full_name || user?.email}</span>
              </div>
              <button
                onClick={() => logout()}
                className="flex items-center gap-1.5 px-4 py-2 border border-oxford/20 text-oxford/70 hover:text-oxford hover:border-oxford/40 text-sm font-inter rounded-full transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>
            </div>
          ) : (
            <button
              onClick={navigateToLogin}
              className="flex items-center gap-1.5 px-4 py-2 border border-oxford/30 text-oxford hover:bg-oxford hover:text-white text-sm font-inter font-medium rounded-full transition-all duration-200"
            >
              <LogIn className="w-4 h-4" />
              Đăng nhập
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden p-2 text-oxford"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-t border-[#C8A951]/20 px-6 py-6 space-y-4">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMenuOpen(false)}
              className={`block font-inter text-base font-medium py-2 border-b border-gray-100 ${
                location.pathname === link.path ? 'text-[#C8A951]' : 'text-oxford hover:text-[#C8A951]'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={() => { onOpenChat(); setMenuOpen(false); }}
            className="w-full mt-4 px-5 py-3 bg-[#C8A951] text-white font-semibold font-inter rounded-full"
          >
            Hỏi AI Heulwen
          </button>
          {isAuthenticated ? (
            <div className="mt-3 flex items-center justify-between">
              <span className="font-inter text-sm text-oxford/70 flex items-center gap-2">
                <User className="w-4 h-4" />{user?.full_name || user?.email}
              </span>
              <button onClick={() => logout()} className="flex items-center gap-1.5 text-sm font-inter text-red-500 hover:text-red-700">
                <LogOut className="w-4 h-4" /> Đăng xuất
              </button>
            </div>
          ) : (
            <button
              onClick={() => { navigateToLogin(); setMenuOpen(false); }}
              className="w-full mt-2 px-5 py-3 border border-oxford text-oxford font-semibold font-inter rounded-full flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" /> Đăng nhập / Đăng ký
            </button>
          )}
        </div>
      )}
    </nav>
  );
}