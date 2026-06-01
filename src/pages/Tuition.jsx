import { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import HeulwenChatbot from '../components/chat/HeulwenChatbot';
import ChatFAB from '../components/chat/ChatFAB';
import { Wallet, Award, Home, CheckCircle, Sparkles, Info, Calculator, HeartPulse, Building2, ShieldCheck, X } from 'lucide-react';
import { VINH_UNI_SCHOLARSHIPS } from '@/data/vinhUniData';

const TUITION_DATA = [
  { group: 'Kỹ thuật - Công nghệ', range: '18 – 25 triệu/năm', examples: 'CNTT, Kỹ thuật Điện tử, Xây dựng' },
  { group: 'Sư phạm', range: '0 triệu (Theo NĐ 116)', examples: 'SP Toán, SP Văn, SP Tiếng Anh' },
  { group: 'Kinh tế', range: '16 – 22 triệu/năm', examples: 'Quản trị kinh doanh, Kế toán, Tài chính' },
  { group: 'Y tế - Sức khỏe', range: '22 – 28 triệu/năm', examples: 'Y đa khoa, Dược học, Điều dưỡng' },
  { group: 'Ngoại ngữ', range: '15 – 18 triệu/năm', examples: 'Ngôn ngữ Anh, Ngôn ngữ Trung, Ngôn ngữ Nhật' },
  { group: 'Khoa học xã hội', range: '13 – 16 triệu/năm', examples: 'Luật, Công tác xã hội, Báo chí' },
];

const KTX_INFO = [
  { label: 'Phòng 4 người', price: '600.000 đ/tháng', desc: 'Điều hòa, tủ lạnh, bàn học cá nhân' },
  { label: 'Phòng 6 người', price: '450.000 đ/tháng', desc: 'Quạt trần, tủ đồ chung, bàn học' },
  { label: 'Phòng VIP (2 người)', price: '1.200.000 đ/tháng', desc: 'Điều hòa, WC riêng, wifi tốc độ cao' },
];

export default function Tuition() {
  const [chatOpen, setChatOpen] = useState(false);
  const [tab, setTab] = useState('tuition');

  // --- Scholarship Quiz States ---
  const [gpa, setGpa] = useState("");
  const [examScore, setExamScore] = useState("");
  const [priority, setPriority] = useState("none");
  const [matchedScholarships, setMatchedScholarships] = useState(null);
  const [registrationsDone, setRegistrationsDone] = useState({});
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const runCalculator = (e) => {
    e.preventDefault();
    const gpaNum = parseFloat(gpa);
    const examNum = parseFloat(examScore);

    if (isNaN(gpaNum) || gpaNum < 0 || gpaNum > 10) {
      setToast({
        text: "Vui lòng nhập điểm GPA lớp 12 hợp lệ từ 0 đến 10.",
        type: "error"
      });
      return;
    }

    const matches = [];

    // sc-talented
    const p1 = VINH_UNI_SCHOLARSHIPS.find((s) => s.id === "sc-talented");
    if (p1 && (examNum >= 28.5 || priority === "national-prize")) {
      matches.push(p1);
    }

    // sc-top10
    const p2 = VINH_UNI_SCHOLARSHIPS.find((s) => s.id === "sc-top10");
    if (p2 && (priority === "national-prize" || priority === "special-candidate" || examNum >= 28.0)) {
      matches.push(p2);
    }

    // sc-overcoming
    const p3 = VINH_UNI_SCHOLARSHIPS.find((s) => s.id === "sc-overcoming");
    if (p3 && priority === "poor-household" && gpaNum >= 7.0) {
      matches.push(p3);
    }

    // sc-partner
    const p4 = VINH_UNI_SCHOLARSHIPS.find((s) => s.id === "sc-partner");
    if (p4 && gpaNum >= 8.5) {
      matches.push(p4);
    }

    // sc-excellent
    const p5 = VINH_UNI_SCHOLARSHIPS.find((s) => s.id === "sc-excellent");
    if (p5 && gpaNum >= 8.0) {
      matches.push(p5);
    }

    setMatchedScholarships(matches);
  };

  const registerScholarship = (id, name) => {
    setRegistrationsDone((prev) => ({ ...prev, [id]: true }));
    setToast({
      text: `🎉 Đăng ký thành công! Đã ghi nhận hồ sơ ứng tuyển học bổng "${name}". Ban tuyển sinh sẽ thẩm định và phản hồi trong 2 ngày làm việc.`,
      type: "success"
    });
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "talented":
        return <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />;
      case "needs-based":
        return <HeartPulse className="w-5 h-5 text-rose-500 shrink-0" />;
      case "partner":
        return <Building2 className="w-5 h-5 text-blue-500 shrink-0" />;
      default:
        return <Award className="w-5 h-5 text-emerald-500 shrink-0" />;
    }
  };

  const tabs = [
    { id: 'tuition', label: 'Học phí', icon: Wallet },
    { id: 'scholarship', label: 'Học bổng', icon: Award },
    { id: 'ktx', label: 'Ký túc xá', icon: Home },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onOpenChat={() => setChatOpen(true)} />

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl border shadow-xl flex items-start gap-3 max-w-md animate-fade-in ${
          toast.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-950" : "bg-red-50 border-red-200 text-red-950"
        }`}>
          <CheckCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${toast.type === "success" ? "text-emerald-600" : "text-red-600"}`} />
          <div className="flex-1">
            <p className="text-xs font-semibold">{toast.text}</p>
          </div>
          <button onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-600 font-bold text-xs">×</button>
        </div>
      )}

      {/* Hero */}
      <div className="bg-gradient-to-r from-[#0A1931] to-[#1A3A6B] pt-28 pb-16 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          <p className="font-inter text-sm font-medium tracking-widest uppercase text-[#C8A951] mb-3">Chi phí & hỗ trợ</p>
          <h1 className="font-playfair text-4xl md:text-5xl font-bold text-white mb-4">Học phí, Học bổng & KTX</h1>
          <p className="font-inter text-white/65 text-lg max-w-xl">Thông tin chi tiết về chi phí học tập và các chính sách hỗ trợ sinh viên</p>
        </div>
      </div>

      <main className="flex-1 bg-[#FCFCFD]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
          {/* Tabs */}
          <div className="flex gap-2 mb-10 p-1.5 bg-white rounded-2xl border border-gray-100 shadow-sm w-fit">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-inter text-sm font-medium transition-all duration-200 cursor-pointer ${
                  tab === t.id
                    ? 'bg-[#1A3A6B] text-white shadow-md'
                    : 'text-gray-500 hover:text-[#1A3A6B]'
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>

          {/* ====================================
              SUB-TAB 1: TUITION
              ==================================== */}
          {tab === 'tuition' && (
            <div className="animate-fade-rise">
              <h2 className="font-playfair text-3xl font-bold text-[#0A1931] mb-2">Mức học phí theo nhóm ngành</h2>
              <div className="w-12 h-px bg-[#C8A951] mb-3" />
              <p className="font-inter text-gray-500 text-sm mb-8 flex items-center gap-2">
                <Info className="w-4 h-4 text-[#C8A951]" />
                Học phí áp dụng cho năm học 2026–2027, có thể thay đổi theo quy định Nhà nước
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {TUITION_DATA.map((t, i) => (
                  <div key={i} className="p-5 bg-white rounded-2xl border border-gray-100 hover:border-[#C8A951]/30 hover:shadow-md transition-all duration-300">
                    <div className="flex items-start justify-between mb-3">
                      <div className="font-playfair text-base font-semibold text-[#0A1931]">{t.group}</div>
                      <div className="font-inter text-base font-bold text-[#C8A951] text-right shrink-0 ml-4">{t.range}</div>
                    </div>
                    <p className="font-inter text-sm text-gray-500">{t.examples}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-[#1A3A6B]/5 rounded-xl border border-[#1A3A6B]/10">
                <p className="font-inter text-sm text-[#1A3A6B]">
                  <strong>Lưu ý về miễn giảm học phí:</strong> Theo Nghị định 116/2020/NĐ-CP, toàn bộ sinh viên ngành Sư phạm tại Trường Đại học Vinh được hỗ trợ 100% học phí và nhận sinh hoạt phí hàng tháng.
                </p>
              </div>
            </div>
          )}

          {/* ====================================
              SUB-TAB 2: SCHOLARSHIPS WITH MATCHING QUIZ
              ==================================== */}
          {tab === 'scholarship' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-rise">
              
              {/* Interactive Matcher */}
              <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5 h-fit">
                <div className="space-y-1">
                  <h4 className="font-playfair text-lg font-bold text-[#0A1931] flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-[#C8A951]" />
                    Đánh giá học bổng
                  </h4>
                  <p className="font-inter text-xs text-gray-400">
                    Nhập điểm học tập lớp 12 và đối tượng ưu tiên để hệ thống tự động đánh giá học bổng phù hợp.
                  </p>
                </div>

                <form onSubmit={runCalculator} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600 block">Điểm trung bình học tập lớp 12 (GPA)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      required
                      placeholder="Ví dụ: 8.5"
                      value={gpa}
                      onChange={(e) => setGpa(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-sm font-mono font-bold text-[#0A1931]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600 block">Điểm thi 3 môn tổ hợp tốt nghiệp THPT</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="30"
                      required
                      placeholder="Ví dụ: 25.5"
                      value={examScore}
                      onChange={(e) => setExamScore(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-sm font-mono font-bold text-[#0A1931]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600 block">Đối tượng ưu tiên</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-700 outline-none cursor-pointer"
                    >
                      <option value="none">Không thuộc diện ưu tiên dưới đây</option>
                      <option value="national-prize">Đoạt giải HSG Quốc gia / Tỉnh (Nhất, Nhì, Ba)</option>
                      <option value="poor-household">Hộ nghèo, cận nghèo hoặc diện chính sách</option>
                      <option value="special-candidate">Học sinh lớp chuyên của các trường THPT Chuyên</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#1A3A6B] hover:bg-[#C8A951] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex justify-center items-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#C8A951]" />
                    Đánh giá học bổng phù hợp
                  </button>
                </form>

                {matchedScholarships !== null && (
                  <div className="pt-4 border-t border-dashed border-gray-150 space-y-3 animate-fade-in">
                    <h5 className="text-xs font-bold text-[#0A1931]">Quỹ học bổng thích hợp:</h5>
                    {matchedScholarships.length > 0 ? (
                      <div className="space-y-2">
                        {matchedScholarships.map((sch) => (
                          <div key={sch.id} className="bg-emerald-50/50 p-2.5 border border-emerald-100 rounded-xl text-xs flex justify-between items-center gap-2">
                            <div>
                              <strong className="text-emerald-950 block">{sch.name}</strong>
                              <span className="text-[10px] text-emerald-600 font-mono">{sch.value}</span>
                            </div>
                            <button
                              onClick={() => registerScholarship(sch.id, sch.name)}
                              disabled={registrationsDone[sch.id]}
                              className="font-bold text-[10px] text-white bg-[#1A3A6B] hover:bg-[#C8A951] px-2.5 py-1.5 rounded-lg cursor-pointer disabled:bg-slate-100 disabled:text-gray-400 whitespace-nowrap"
                            >
                              {registrationsDone[sch.id] ? "Đã nhận" : "Đăng ký"}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-500 italic">Thành tích hiện tại chưa mở các học bổng đầu vào đặc biệt. Sinh viên có thể phấn đấu nhận học bổng khuyến học trong học kỳ học tập chính thức.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Scholarship List */}
              <div className="lg:col-span-8 space-y-6">
                <h2 className="font-playfair text-2xl font-bold text-[#0A1931]">Chính sách Quỹ Học Bổng 2026</h2>
                <div className="space-y-4">
                  {VINH_UNI_SCHOLARSHIPS.map((s) => {
                    const isApplied = registrationsDone[s.id];
                    return (
                      <div key={s.id} className="bg-white p-5 rounded-2xl border border-gray-100 hover:shadow-md transition-all duration-300 flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(s.category)}
                            <h3 className="font-playfair text-lg font-bold text-[#0A1931]">{s.name}</h3>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-xs font-inter text-gray-600">
                            <div>
                              <span className="block text-[10px] text-gray-400 font-mono uppercase">Trị giá học bổng</span>
                              <strong className="text-[#C8A951]">{s.value}</strong>
                            </div>
                            <div>
                              <span className="block text-[10px] text-gray-400 font-mono uppercase">Số lượng / năm</span>
                              <strong className="text-[#1A3A6B]">{s.slots}</strong>
                            </div>
                          </div>

                          <p className="text-xs text-gray-500 font-inter">{s.description}</p>
                          <div className="p-2.5 bg-slate-50 border border-gray-100 rounded-xl text-[10px] text-gray-600">
                            <strong>Tiêu chí:</strong> {s.criteria}
                          </div>
                        </div>

                        <button
                          onClick={() => registerScholarship(s.id, s.name)}
                          disabled={isApplied}
                          className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all self-end sm:self-center shrink-0 ${
                            isApplied 
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                              : "bg-[#1A3A6B] hover:bg-[#C8A951] text-white"
                          }`}
                        >
                          {isApplied ? "✓ Đã ứng tuyển" : "Ứng tuyển ngay"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* ====================================
              SUB-TAB 3: KTX
              ==================================== */}
          {tab === 'ktx' && (
            <div className="animate-fade-rise">
              <h2 className="font-playfair text-3xl font-bold text-[#0A1931] mb-2">Ký túc xá sinh viên</h2>
              <div className="w-12 h-px bg-[#C8A951] mb-8" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                {KTX_INFO.map((k, i) => (
                  <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-[#C8A951]/30 hover:shadow-md transition-all duration-300 text-center">
                    <Home className="w-10 h-10 text-[#C8A951] mx-auto mb-3" />
                    <div className="font-playfair text-lg font-semibold text-[#0A1931] mb-1">{k.label}</div>
                    <div className="font-inter text-2xl font-bold text-[#1A3A6B] mb-2">{k.price}</div>
                    <p className="font-inter text-sm text-gray-500">{k.desc}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-playfair text-xl font-semibold text-[#0A1931] mb-4">Điều kiện & quy trình đăng ký</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    'Là sinh viên chính quy Đại học Vinh',
                    'Không có hộ khẩu thường trú tại TP. Vinh',
                    'Đăng ký trực tiếp trực tuyến qua Cổng SV',
                    'Ký hợp đồng lưu trú dài hạn theo từng kỳ',
                    'Nộp tiền phòng 1 học kỳ/lần',
                    'Được ưu tiên nếu thuộc hộ nghèo/gia đình chính sách',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[#C8A951] shrink-0" />
                      <span className="font-inter text-sm text-[#0A1931]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* AI Help Banner */}
          <div className="mt-12 bg-gradient-to-r from-[#0A1931] to-[#1A3A6B] rounded-3xl p-8 text-white flex flex-col md:flex-row items-center gap-6 justify-between">
            <div>
              <h3 className="font-playfair text-2xl font-bold mb-2">Cần tư vấn thêm?</h3>
              <p className="font-inter text-white/70">Hỏi Heulwen về học phí, học bổng và ký túc xá ngay lập tức.</p>
            </div>
            <button
              onClick={() => setChatOpen(true)}
              className="shrink-0 flex items-center gap-2 px-6 py-3 bg-[#C8A951] hover:bg-[#967C34] text-white font-semibold font-inter rounded-xl transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4" /> Hỏi AI Heulwen
            </button>
          </div>
        </div>
      </main>

      <Footer />
      <HeulwenChatbot isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      <ChatFAB onClick={() => setChatOpen(true)} isOpen={chatOpen} />
    </div>
  );
}