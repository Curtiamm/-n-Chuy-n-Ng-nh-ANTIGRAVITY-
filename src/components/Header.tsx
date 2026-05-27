import React from "react";
import { GraduationCap, Phone, Mail, MapPin, BarChart3, HelpCircle, FileText, Search, Award } from "lucide-react";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openChatbot: () => void;
}

export default function Header({ activeTab, setActiveTab, openChatbot }: HeaderProps) {
  const navItems = [
    { id: "majors", label: "Ngành Đào Tạo", icon: GraduationCap },
    { id: "register", label: "Đăng Ký Nguyện Vọng", icon: FileText },
    { id: "search", label: "Tra Cứu Hồ Sơ", icon: Search },
    { id: "scholarship", label: "Quỹ Học Bổng", icon: Award },
    { id: "analytics", label: "Báo Cáo Tuyển Sinh", icon: BarChart3 }
  ];

  return (
    <header className="bg-white border-b border-gray-100 shadow-xs sticky top-0 z-40">
      {/* Top Banner Contact Bar */}
      <div className="bg-blue-900 text-slate-100 py-1.5 px-4 text-xs font-sans">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-1.5 md:gap-4 md:px-6">
          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-300">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              182 Lê Duẩn, TP. Vinh, Nghệ An
            </span>
            <span className="hidden sm:inline-flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-amber-500" />
              0238.3855.452
            </span>
            <span className="hidden md:inline-flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-amber-500" />
              tuyensinh@vinhuni.edu.vn
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono uppercase tracking-wider">
              Tuyển sinh 2026
            </span>
            <button
              onClick={openChatbot}
              className="flex items-center gap-1 hover:text-amber-300 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              Hỗ trợ 24/7 (AI Bot)
            </button>
          </div>
        </div>
      </div>

      {/* Main Branding Header */}
      <div className="max-w-7xl mx-auto px-4 py-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => setActiveTab("majors")}>
          <div className="w-12 h-12 bg-blue-900 rounded-full flex items-center justify-center border-2 border-amber-400 shadow-md">
            <GraduationCap className="w-7 h-7 text-amber-300" />
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-sm font-bold font-sans tracking-wide text-blue-900 uppercase">
              Hệ Thống Tuyển Sinh Trực Tuyến
            </h1>
            <h2 className="text-lg font-black tracking-tight font-sans text-amber-500 uppercase">
              Trường Đại Học Vinh
            </h2>
          </div>
        </div>

        {/* Quick Hotline Badge */}
        <div className="hidden lg:flex items-center gap-3 border-l border-gray-100 pl-6">
          <div className="p-2.5 bg-amber-50 rounded-full text-amber-600">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-sans text-gray-400 uppercase tracking-wider">Hotline Tư Vấn</div>
            <div className="text-sm font-bold text-blue-900 font-mono">0238.3855.452</div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-bar */}
      <div className="bg-slate-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-2 md:px-4">
          <nav className="flex items-center overflow-x-auto no-scrollbar justify-start md:justify-center gap-1 shadow-inner py-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-blue-900 text-amber-300 shadow-xs scale-102"
                      : "text-gray-600 hover:text-blue-900 hover:bg-gray-100"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-amber-300 animate-pulse" : "text-gray-400"}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
