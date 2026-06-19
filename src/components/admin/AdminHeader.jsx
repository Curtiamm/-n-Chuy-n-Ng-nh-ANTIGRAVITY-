import { Link } from 'react-router-dom';
import { GraduationCap, ArrowLeft, LogOut, Menu } from 'lucide-react';

export function AdminHeader({ user, role, onLogout, onMenuClick }) {
  return (
    <div className="border-b border-white/10 px-4 md:px-6 lg:px-10 py-4 flex items-center justify-between bg-[#0A1931]/80 backdrop-blur-md sticky top-0 z-40">
      <div className="flex items-center gap-3 md:gap-4">
        {/* Hamburger Menu Toggle for Mobile */}
        <button
          type="button"
          onClick={onMenuClick}
          className="p-1.5 text-white/80 hover:text-[#C8A951] rounded-lg md:hidden hover:bg-white/5 transition-all"
          title="Mở menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#C8A951] flex items-center justify-center shrink-0">
          <GraduationCap className="w-4 h-4 md:w-5 md:h-5 text-white" />
        </div>
        <div>
          <div className="font-playfair text-sm md:text-lg font-bold text-white leading-tight">Heulwen Admin</div>
          <div className="font-inter text-[10px] md:text-xs text-white/50 leading-tight">
            {user?.name} · <span className="text-[#C8A951] uppercase font-bold">{role}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 md:gap-4">
        <Link to="/" className="flex items-center gap-1.5 font-inter text-xs md:text-sm text-white/60 hover:text-white transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Về trang chủ</span>
        </Link>
        <button 
          type="button"
          onClick={onLogout} 
          className="flex items-center gap-1.5 font-inter text-xs md:text-sm text-white/60 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Đăng xuất</span>
        </button>
      </div>
    </div>
  );
}
