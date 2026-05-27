import React, { useState } from "react";
import Header from "./components/Header";
import MajorsTab from "./components/MajorsTab";
import RegisterTab from "./components/RegisterTab";
import SearchTab from "./components/SearchTab";
import ScholarshipTab from "./components/ScholarshipTab";
import AnalyticsDashboardTab from "./components/AnalyticsDashboardTab";
import ChatbotWidget from "./components/ChatbotWidget";
import { Info, HelpCircle, GraduationCap, Clock, Award, ShieldCheck, Mail } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState("majors");
  const [selectedMajorCode, setSelectedMajorCode] = useState("");
  const [chatbotOpen, setChatbotOpen] = useState(false);

  // When student clicks "Đăng ký" on any specific major card
  const handleSelectMajorForRegistration = (majorCode: string) => {
    setSelectedMajorCode(majorCode);
    setActiveTab("register");
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  // When online registration is completed successfully
  const handleRegistrySuccess = (newStudent: any) => {
    // We can auto-redirect them to the Search results tab to read their simulated emails!
    // But since they can search or inspect, let's keep them on Register success message.
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 flex flex-col font-sans antialiased selection:bg-amber-100 selection:text-amber-900">
      
      {/* 1. Admissions Header & Top Nav Swapper */}
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        openChatbot={() => setChatbotOpen(true)} 
      />

      {/* 2. Main Page Body Container */}
      <main className="max-w-7xl mx-auto px-4 py-8 md:px-6 flex-1 w-full space-y-8">
        
        {/* Urgent Admissions Updates Ticker Alert */}
        <div className="bg-amber-500/10 border border-amber-500/25 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <span className="bg-amber-500 text-blue-950 font-black px-2 py-0.5 rounded font-mono uppercase tracking-wider animate-pulse flex-shrink-0">
              Lưu Ý Khẩn
            </span>
            <p className="text-amber-800 leading-normal">
              Trực thuộc Hội đồng tuyển sinh: Đợt xét tuyển học bạ đợt 1 năm 2026 sẽ chính thức kết thúc thời gian nhận đăng kí hồ sơ giấy tờ trực tiếp vào lúc <strong>17:00 ngày 15/07/2026</strong>. Thí sinh ưu tiên nộp nguyện vọng trực tuyến sớm để ban giám khảo khớp điều kiện ưu đãi nhanh chóng.
            </p>
          </div>
          <button
            onClick={() => setActiveTab("register")}
            className="text-xs font-bold text-amber-900 underline hover:text-amber-700 whitespace-nowrap self-end sm:self-center cursor-pointer"
          >
            Đăng ký ngay đợt sớm &gt;
          </button>
        </div>

        {/* 3. Conditional Tab view routers */}
        <div className="transition-all duration-300">
          {activeTab === "majors" && (
            <div className="space-y-6">
              {/* Educational info highlight banner before cards */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-blue-50 text-blue-900 rounded-xl">
                    <Clock className="w-6 h-6 text-blue-900" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">Đào Tạo Đa Kỳ</h4>
                    <span className="text-sm font-bold text-blue-950">3 - 4 Năm tối ưu lộ trình học</span>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 md:border-x md:border-gray-100 md:px-6">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">Chính sách ưu tiên</h4>
                    <span className="text-sm font-bold text-blue-950">Miễn học phí cho sư phạm (NĐ 116)</span>
                  </div>
                </div>

                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">Xét Tuyển Tuyệt Đối</h4>
                    <span className="text-sm font-bold text-blue-950">Giải ngân học bổng tự động 24/7</span>
                  </div>
                </div>
              </div>

              <MajorsTab onSelectMajorForReg={handleSelectMajorForRegistration} />
            </div>
          )}

          {activeTab === "register" && (
            <RegisterTab 
              selectedMajorCode={selectedMajorCode} 
              onRegistrySuccess={handleRegistrySuccess} 
            />
          )}

          {activeTab === "search" && <SearchTab />}

          {activeTab === "scholarship" && <ScholarshipTab />}

          {activeTab === "analytics" && <AnalyticsDashboardTab />}
        </div>
      </main>

      {/* 4. Global Floating Automated AI Counselor Chatbot */}
      <ChatbotWidget
        isOpen={chatbotOpen}
        onClose={() => setChatbotOpen(false)}
        onOpen={() => setChatbotOpen(true)}
        setSelectedMajorForReg={handleSelectMajorForRegistration}
        setActiveTab={setActiveTab}
      />

      {/* 5. Clean Institutional Footer */}
      <footer className="bg-slate-900 text-slate-350 py-10 px-4 mt-12 border-t-2 border-amber-500 font-sans">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 md:px-6 text-sm">
          
          {/* Col 1 School Description */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-amber-500/50">
                <GraduationCap className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">HỘI ĐỒNG TUYỂN SINH CHÍNH THỨC</h4>
                <h5 className="font-bold text-amber-400">TRƯỜNG ĐẠI HỌC VINH</h5>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-normal">
              Trường Đại học Vinh là cơ sở giáo dục đại học đa ngành, đa lĩnh vực, trọng điểm quốc gia, trung tâm đào tạo nhân lực trình độ cao, chất lượng cao định hướng ứng dụng và đóng góp to lớn cho sự nghiệp phát triển kinh tế vùng Bắc Trung Bộ và cả nước.
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              © 2026 Vinh University Admission, Inc. Powered by Gemini-3.5-flash LLM model.
            </p>
          </div>

          {/* Col 2 Quick links tabs */}
          <div className="md:col-span-3 space-y-3.5">
            <h5 className="font-bold text-white text-xs uppercase tracking-wider font-mono">Phân Hệ Tuyển Sinh</h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={() => setActiveTab("majors")} className="hover:text-amber-300 transition-colors cursor-pointer text-left">
                  → Tra cứu danh mục các ngành học
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab("register")} className="hover:text-amber-300 transition-colors cursor-pointer text-left">
                  → Nộp hồ sơ nguyện vọng trực tuyến đợt sớm
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab("search")} className="hover:text-amber-300 transition-colors cursor-pointer text-left">
                  → Tra cứu kết quả và lịch sử Email nhận tin
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab("scholarship")} className="hover:text-amber-300 transition-colors cursor-pointer text-left">
                  → Trắc nghiệm và ứng tuyển Quỹ Học bổng
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3 Contacts details */}
          <div className="md:col-span-4 space-y-3.5">
            <h5 className="font-bold text-white text-xs uppercase tracking-wider font-mono">Liên Hệ Ban Tuyển Sinh</h5>
            <div className="space-y-2 text-xs text-slate-400">
              <p className="flex items-start gap-1.5 leading-normal">
                <span className="text-amber-400">📍</span>
                Số 182, đường Lê Duẩn, thành phố Vinh, tỉnh Nghệ An, Việt Nam.
              </p>
              <p className="flex items-center gap-1.5">
                <span className="text-amber-400">📞</span>
                Hotline trực ban tuyển sinh: 0238.3855.452
              </p>
              <p className="flex items-center gap-1.5">
                <span className="text-amber-400">✉️</span>
                Hòm thư điện tử: tuyensinh@vinhuni.edu.vn
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
