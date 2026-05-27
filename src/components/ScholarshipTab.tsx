import React, { useState, useEffect } from "react";
import { Award, GraduationCap, CheckCircle, Calculator, FileCheck, HelpCircle, ShieldCheck, HeartPulse, Sparkles, Building2, AlertTriangle, X } from "lucide-react";
import { VINH_UNI_SCHOLARSHIPS, Scholarship } from "../data/vinhUniData";

export default function ScholarshipTab() {
  const [gpa, setGpa] = useState<string>("");
  const [examScore, setExamScore] = useState<string>("");
  const [priority, setPriority] = useState("none");
  const [matchedScholarships, setMatchedScholarships] = useState<Scholarship[] | null>(null);
  const [registrationsDone, setRegistrationsDone] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 8500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Form check conditions
  const runCalculator = (e: React.FormEvent) => {
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

    const matches: Scholarship[] = [];

    // 1. Talent standard scholarship
    const p1 = VINH_UNI_SCHOLARSHIPS.find((s) => s.id === "sc-talented");
    if (p1 && (examNum >= 28.5 || priority === "national-prize")) {
      matches.push(p1);
    }

    // 2. Honored top scholarship
    const p2 = VINH_UNI_SCHOLARSHIPS.find((s) => s.id === "sc-top10");
    if (p2 && (priority === "national-prize" || priority === "special-candidate" || examNum >= 28.0)) {
      matches.push(p2);
    }

    // 3. Struggle support
    const p3 = VINH_UNI_SCHOLARSHIPS.find((s) => s.id === "sc-overcoming");
    if (p3 && priority === "poor-household" && gpaNum >= 7.0) {
      matches.push(p3);
    }

    // 4. Partner
    const p4 = VINH_UNI_SCHOLARSHIPS.find((s) => s.id === "sc-partner");
    if (p4 && gpaNum >= 8.5) {
      matches.push(p4);
    }

    // 5. Incentive
    const p5 = VINH_UNI_SCHOLARSHIPS.find((s) => s.id === "sc-excellent");
    if (p5 && gpaNum >= 8.0) {
      matches.push(p5);
    }

    setMatchedScholarships(matches);
  };

  const registerScholarship = (id: string, name: string) => {
    setRegistrationsDone((prev) => ({ ...prev, [id]: true }));
    setToast({
      text: `🎉 Đăng ký thành công! Đã ghi nhận hồ sơ ứng tuyển Học bổng "${name}". Hướng dẫn cụ thể kèm tài liệu sẽ gửi tự động đến Email của em sau khi hoàn thành đăng ký nguyện vọng!`,
      type: "success"
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "talented":
        return <Sparkles className="w-5 h-5 text-amber-500" />;
      case "needs-based":
        return <HeartPulse className="w-5 h-5 text-rose-500" />;
      case "partner":
        return <Building2 className="w-5 h-5 text-blue-500" />;
      default:
        return <Award className="w-5 h-5 text-emerald-500" />;
    }
  };

  return (
    <div className="space-y-8 relative">
      {/* Toast Notification HUD */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl border shadow-xl flex items-start gap-3 max-w-md animate-fade-in transition-all ${
          toast.type === "success" 
            ? "bg-emerald-50 border-emerald-200 text-emerald-950" 
            : "bg-red-50 border-red-200 text-red-950"
        }`}>
          {toast.type === "success" ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 space-y-1">
            <h5 className="font-bold text-xs">{toast.type === "success" ? "Thông báo từ Đại diện tuyển sinh" : "Cảnh báo thông tin"}</h5>
            <p className="text-xs leading-normal font-sans">{toast.text}</p>
          </div>
          <button 
            onClick={() => setToast(null)}
            className="text-gray-400 hover:text-gray-600 font-extrabold focus:outline-none transition-transform hover:scale-110 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {/* Introduction banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10 scale-125">
          <GraduationCap className="w-72 h-72" />
        </div>

        <div className="max-w-2xl space-y-4">
          <span className="text-[10px] bg-amber-500 text-blue-950 font-bold px-3 py-1 rounded-full uppercase tracking-wider font-mono">
            Học bổng nâng cánh ước mơ - Vinh Uni 2026
          </span>
          <h3 className="text-xl md:text-2xl font-black font-sans tracking-tight text-amber-300">
            Ủy Thác Tài Năng - Chắp Cánh Hành Trình Học Hiệu Quả
          </h3>
          <p className="text-xs md:text-sm text-blue-100 leading-relaxed">
            Hội đồng tuyển sinh Trường Đại Học Vinh cam kết chi trả hơn <strong className="text-white">15 tỷ đồng</strong> ngân sách quỹ học bổng trong năm học 2026 cho tân sinh xuất sắc và đồng hành tiếp sức đầy đủ đến mọi hoàn cảnh vượt khó giảng đường.
          </p>
        </div>
      </div>

      {/* Grid of Scholarship Finder & Catalog */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Interactive Eligibility Matcher */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-5 h-fit">
          <div className="space-y-1.5">
            <h4 className="text-sm font-black text-blue-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-amber-500" />
              Công Cụ Kiểm Thử Học Bổng
            </h4>
            <p className="text-[11px] text-gray-500">
              Nhập nhanh năng lực học tập của em dưới đây để hệ thống AI đánh giá những quỹ ưu đãi phù hợp nhận được ngay.
            </p>
          </div>

          <form onSubmit={runCalculator} className="space-y-4">
            {/* GPA */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 block">Điểm trung bình cả năm Lớp 12 (GPA)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                required
                placeholder="Ví dụ: 8.45"
                value={gpa}
                onChange={(e) => setGpa(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-xs font-mono font-bold text-gray-800"
              />
            </div>

            {/* Exam Point */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 block">Điểm tổ hợp 3 môn thi THPT của bạn</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="30"
                required
                placeholder="Ví dụ: 25.5"
                value={examScore}
                onChange={(e) => setExamScore(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-xs font-mono font-bold text-gray-800"
              />
            </div>

            {/* Area/Priority select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 block">Thuộc nhóm đối tượng ưu tiên nào?</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-xs text-gray-700 outline-none cursor-pointer"
              >
                <option value="none">Không thuộc diện ưu tiên dưới đây</option>
                <option value="national-prize">Đoạt giải Học sinh giỏi Quốc gia / Tinh THPT (Nhất, Nhì, Ba)</option>
                <option value="poor-household">Thuộc hộ nghèo, hộ cận nghèo, gia đình thương binh liệt sĩ</option>
                <option value="special-candidate">Học sinh lớp chuyên thuộc các Trường THPT chuyên toàn quốc</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-amber-300 font-bold rounded-lg text-xs shadow-xs hover:shadow-md transition-all cursor-pointer flex justify-center items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              Xác Thực Điều Kiện Học Bổng
            </button>
          </form>

          {/* Calculator matching outcome feedback */}
          {matchedScholarships !== null && (
            <div className="pt-4 border-t border-dashed border-gray-100 space-y-3.5 animate-fade-in">
              <h5 className="text-xs font-extrabold text-gray-700">Kết quả kiểm thử phù hợp:</h5>
              {matchedScholarships.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[11px] text-emerald-700 font-medium">
                    🎉 Tuyệt quá! Em có điều kiện phù hợp nhận được <span className="underline font-bold font-mono">{matchedScholarships.length} quỹ học bổng</span> sau:
                  </p>
                  <div className="space-y-1.5 block">
                    {matchedScholarships.map((sch) => (
                      <div key={sch.id} className="bg-emerald-50/50 p-2 border border-emerald-100 rounded text-[11px] flex justify-between items-center">
                        <div>
                          <strong className="text-emerald-900 block">{sch.name}</strong>
                          <span className="text-[10px] text-emerald-700 font-mono">{sch.value}</span>
                        </div>
                        <button
                          onClick={() => registerScholarship(sch.id, sch.name)}
                          disabled={registrationsDone[sch.id]}
                          className="font-bold text-[10px] text-blue-900 bg-white border border-blue-900/15 hover:bg-amber-100 px-2.5 py-1 rounded cursor-pointer disabled:bg-slate-100 disabled:text-gray-400 disabled:border-transparent whitespace-nowrap"
                        >
                          {registrationsDone[sch.id] ? "Đã Ghi Nhận" : "Đăng ký Nhận"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-gray-500 leading-relaxed italic">
                  Chỉ số học lực của em hiện tại chưa kích hoạt các quỹ học bổng đặc biệt. Tuy nhiên em hoàn toàn có các suất học học bổng học tập tự nhiên theo thành tích rèn luyện ở từng kì học tập nhé!
                </p>
              )}
            </div>
          )}
        </div>

        {/* Scholarships list catalog */}
        <div className="lg:col-span-8 space-y-5">
          <h4 className="text-sm font-bold text-slate-700 uppercase tracking-widest font-mono">Danh mục các Quỹ Học Bổng Chính Thức 2026</h4>

          <div className="space-y-4">
            {VINH_UNI_SCHOLARSHIPS.map((sc) => {
              const isApplied = registrationsDone[sc.id];
              return (
                <div key={sc.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(sc.category)}
                      <h4 className="text-sm font-bold text-blue-900">{sc.name}</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                      <div className="text-gray-600">
                        <span className="block text-[10px] text-gray-400 font-mono uppercase tracking-wide">Trị giá suất học bổng</span>
                        <strong className="text-amber-600 font-bold">{sc.value}</strong>
                      </div>
                      <div className="text-gray-600">
                        <span className="block text-[10px] text-gray-400 font-mono uppercase tracking-wide">Số lượng suất phân chia</span>
                        <strong className="text-blue-900 font-mono">{sc.slots}</strong>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{sc.description}</p>
                    <p className="text-[11px] bg-slate-50 text-slate-600 border border-slate-100 p-2 rounded text-left">
                      <strong className="text-slate-800">Tiêu chuẩn ban đầu:</strong> {sc.criteria}
                    </p>
                  </div>

                  <button
                    onClick={() => registerScholarship(sc.id, sc.name)}
                    disabled={isApplied}
                    className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all self-end md:self-center ${
                      isApplied
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : "bg-blue-900 text-amber-300 hover:bg-slate-800 shadow-xs hover:shadow-md"
                    }`}
                  >
                    {isApplied ? "✓ Đã Đăng Ký Đạt" : "Đăng Ký Đợt Đại học"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
