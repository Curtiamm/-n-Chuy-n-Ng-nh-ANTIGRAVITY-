import { Link } from 'react-router-dom';
import { GraduationCap, ArrowLeft, LogOut } from 'lucide-react';

export function AdminHeader({ user, role, onLogout }) {
  return (
    <div className="border-b border-white/10 px-6 lg:px-10 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-[#C8A951] flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="font-playfair text-lg font-bold text-white">Heulwen Admin</div>
          <div className="font-inter text-xs text-white/50">
            {user?.name} · <span className="text-[#C8A951] uppercase">{role}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 font-inter text-sm text-white/60 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Về trang chủ
        </Link>
        <button onClick={onLogout} className="flex items-center gap-2 font-inter text-sm text-white/60 hover:text-red-400 transition-colors">
          <LogOut className="w-4 h-4" /> Đăng xuất
        </button>
      </div>
    </div>
  );
}
