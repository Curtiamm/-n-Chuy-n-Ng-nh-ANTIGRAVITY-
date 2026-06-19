import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, GraduationCap, LogIn, LogOut, User, Search, Settings } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import SmartSearchModal from './SmartSearchModal';

const navLinks = [
  { label: 'Trang chủ', path: '/' },
  { label: 'Ngành học', path: '/majors' },
  { label: 'Gợi ý ngành', path: '/recommendation' },
  { label: 'Tuyển sinh', path: '/admission' },
  { label: 'Học phí & Học bổng', path: '/tuition' },
  { label: 'Hỏi đáp', path: '/faq' },
];

export default function Navbar({ onOpenChat }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout, navigateToLogin } = useAuth();

  useEffect(() => {
    setAvatarError(false);
  }, [user]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Keyboard shortcut Ctrl + K / Cmd + K to open search modal
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    const handleOpenSearchEvent = () => {
      setSearchOpen(true);
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    window.addEventListener('open-global-search', handleOpenSearchEvent);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('open-global-search', handleOpenSearchEvent);
    };
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
        <div className="hidden lg:flex items-center lg:gap-3 xl:gap-6">
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
        <div className="hidden lg:flex items-center lg:gap-2.5 xl:gap-4">
          {/* Global Search Button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center justify-center gap-2 p-2 xl:px-3 xl:py-1.5 border border-oxford/20 hover:border-[#C8A951]/40 hover:bg-[#C8A951]/5 text-oxford/60 hover:text-[#967C34] rounded-full transition-all duration-300 font-inter text-xs font-medium cursor-pointer"
            title="Tìm kiếm thông tin (Ctrl + K)"
          >
            <Search className="w-4 h-4 xl:w-3.5 xl:h-3.5" />
            <span className="hidden xl:inline">Tìm kiếm...</span>
            <kbd className="hidden xl:inline-block px-1 border rounded bg-slate-50 text-[9px] font-mono text-gray-400">Ctrl K</kbd>
          </button>

          <button
            onClick={onOpenChat}
            className="flex items-center gap-1.5 lg:px-4 lg:py-2 xl:px-5 xl:py-2.5 bg-[#C8A951] hover:bg-[#967C34] text-white text-xs lg:text-xs xl:text-sm font-semibold font-inter rounded-full transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Hỏi AI Heulwen
          </button>
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1 hover:bg-[#C8A951]/10 rounded-full border border-oxford/10 transition-all duration-300 cursor-pointer"
                title={user?.full_name || user?.email}
              >
                {user?.picture && !avatarError ? (
                  <img 
                    src={user.picture} 
                    alt="Avatar" 
                    onError={() => setAvatarError(true)} 
                    className="w-8 h-8 rounded-full object-cover border border-oxford/10" 
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#0A1931] text-white flex items-center justify-center text-xs font-bold uppercase">
                    {user?.full_name ? user.full_name.charAt(0) : <User className="w-4 h-4" />}
                  </div>
                )}
              </button>
              
              {/* Dropdown Menu */}
              {profileDropdownOpen && (
                <>
                  {/* Backdrop overlay to close the dropdown when clicking outside */}
                  <div className="fixed inset-0 z-45" onClick={() => setProfileDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-[#C8A951]/20 shadow-xl py-2 z-50 animate-scale-up font-inter">
                    <div className="px-4 py-2.5 border-b border-gray-100">
                      <p className="text-[10px] text-gray-400 font-medium">Đăng nhập với</p>
                      <p className="text-xs font-bold text-[#0A1931] truncate">{user?.full_name || 'Người dùng'}</p>
                      <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
                    </div>
                    
                    {/* Admin portal shortcut if they are admin or staff */}
                    {(user?.role === 'admin' || user?.role === 'staff') && (
                      <Link
                        to="/admin"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#0A1931] hover:bg-slate-50 transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5 text-gray-400" />
                        Trang quản lý
                      </Link>
                    )}
                    
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        logout();
                      }}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-red-500" />
                      Đăng xuất
                    </button>
                  </div>
                </>
              )}
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

        {/* Mobile Actions */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 text-oxford hover:text-[#C8A951] transition-colors cursor-pointer"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-oxford"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
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
            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-inter text-sm text-oxford/70 flex items-center gap-2">
                  <User className="w-4 h-4" />{user?.full_name || user?.email}
                </span>
                <button onClick={() => logout()} className="flex items-center gap-1.5 text-sm font-inter text-red-500 hover:text-red-700 cursor-pointer">
                  <LogOut className="w-4 h-4" /> Đăng xuất
                </button>
              </div>
              {(user?.role === 'admin' || user?.role === 'staff') && (
                <Link
                  to="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 border border-oxford/20 text-oxford text-sm font-semibold font-inter rounded-full"
                >
                  <Settings className="w-4 h-4" /> Trang quản lý
                </Link>
              )}
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

      {/* Global Autocomplete Search Modal */}
      <SmartSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </nav>
  );
}