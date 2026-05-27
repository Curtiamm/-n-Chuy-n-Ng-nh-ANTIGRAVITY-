import React, { useState, useMemo } from "react";
import { Search, GraduationCap, ArrowUpDown, Download, CircleCheck, AlertCircle, BookOpen, Clock, FileBadge, Info } from "lucide-react";
import { VINH_UNI_MAJORS, MajorInfo } from "../data/vinhUniData";

interface MajorsTabProps {
  onSelectMajorForReg: (majorCode: string) => void;
}

export default function MajorsTab({ onSelectMajorForReg }: MajorsTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [minScore, setMinScore] = useState<number>(15);
  const [expandedMajor, setExpandedMajor] = useState<string | null>(null);

  // Group options
  const groups = [
    { id: "all", label: "Tất cả ngành học" },
    { id: "Sư phạm & Giáo dục", label: "Sư phạm & Giáo dục 🍎" },
    { id: "Công nghệ & Kỹ thuật", label: "Công nghệ & Kỹ thuật 💻" },
    { id: "Kinh tế & Quản lý", label: "Kinh tế & Quản lý 📈" },
    { id: "Xã hội & Nhân văn", label: "Luật & Xã hội ⚖️" }
  ];

  // Filtering logic
  const filteredMajors = useMemo(() => {
    return VINH_UNI_MAJORS.filter((major) => {
      const matchesSearch =
        major.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        major.code.includes(searchTerm);
      const matchesGroup = selectedGroup === "all" || major.group === selectedGroup;
      // Show majors where points averages are within acceptable range
      const matchesScore = major.exemptScore2025 >= minScore - 2;

      return matchesSearch && matchesGroup && matchesScore;
    });
  }, [searchTerm, selectedGroup, minScore]);

  // Client-side Brochure Exporter (Tải xuống chi tiết ngành học)
  const downloadBrochure = (major: MajorInfo) => {
    const textContent = `
=========================================
      TRƯỜNG ĐẠI HỌC VINH (VINH UNIVERSITY)
      THÔNG TIN TUYỂN SINH CHI TIẾT NGÀNH HỌC
=========================================

1. THÔNG TIN CHUNG:
- Tên Ngành Đào Tạo: ${major.name}
- Mã Ngành Tuyển Sinh: ${major.code}
- Nhóm Ngành Đào Tạo: ${major.group}
- Văn Bằng Tốt Nghiệp: ${major.degree}
- Thời Gian Đào Tạo: ${major.duration} năm
- Học Phí Ước Tính: ${major.tuition} Triệu VNĐ/năm học

2. CHỈ TIÊU & ĐIỂM CHUẨN XÉT TUYỂN:
- Chỉ Tiêu Tuyển Sinh 2026: ${major.slots} học sinh
- Điểm Chuẩn THPT 2024: ${major.exemptScore2024} điểm
- Điểm Chuẩn THPT 2025: ${major.exemptScore2025} điểm
- Điểm Chuẩn Học Bạ 2025: ${major.transcriptScore2025} điểm
- Tổ Hợp Môn Xét Tuyển: ${major.subjectGroups.join(", ")}

3. MÔ TẢ CHƯƠNG TRÌNH:
- ${major.description}

4. CƠ HỘI NGHỀ NGHIỆP SAU KHI TỐT NGHIỆP:
${major.jobOpportunities.map((job, index) => `${index + 1}. ${job}`).join("\n")}

=========================================
* Đăng ký nguyện vọng trực tuyến hôm nay ngay trên website tuyển sinh Đại Học Vinh 
để nhận kết quả xét tuyển nhanh chóng và hỗ trợ học bổng tự động 24/7!
* Địa chỉ: 182 đường Lê Duẩn, thành phố Vinh, tỉnh Nghệ An.
* Tư vấn Hotline: 0238 3855 452
=========================================
`;

    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `VinhUni_ThongTin_Nganh_${major.code}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Search & Intelligence Filtering Grid */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-blue-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-500 animate-pulse" />
          Tra Cứu Cơ Sở Dữ Liệu Ngành Đào Tạo & Học Phí
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Text Search representation */}
          <div className="md:col-span-4 relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Nhập tên ngành, mã ngành..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:border-blue-900 focus:bg-white text-gray-800 transition-all placeholder:text-gray-400"
            />
          </div>

          {/* Group Tab Quick Buttons */}
          <div className="md:col-span-5 flex items-center overflow-x-auto gap-2 no-scrollbar">
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:border-blue-900 focus:bg-white cursor-pointer"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          {/* Points Filter slider */}
          <div className="md:col-span-3 bg-slate-50 px-4 py-1.5 rounded-lg border border-gray-100 flex flex-col justify-center">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">
              Điểm của bạn ({minScore}đ)
            </label>
            <div className="flex items-center gap-2 mt-0.5">
              <input
                type="range"
                min="15"
                max="30"
                step="0.5"
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="w-full accent-blue-900 cursor-pointer h-1 bg-gray-200 rounded-lg"
              />
              <span className="text-xs font-bold font-mono text-blue-900">{minScore}đ</span>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-gray-400">
          * Đã lọc ra các ngành học có điểm thi THPT hoặc điểm học bạ phù hợp sát với năng lực thực tế học tập tầm{" "}
          <strong className="text-gray-600">{(minScore - 2).toFixed(1)} điểm trở lên</strong>.
        </p>
      </div>

      {/* Database Catalog Output */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredMajors.map((major) => {
          const isExpanded = expandedMajor === major.code;
          const tuitionNotice = major.tuition.includes("0") 
            ? "Mở rộng ưu đãi theo Nghị định 116" 
            : `Uớc tính: ~${major.tuition} triệu VNĐ/năm`;

          return (
            <div
              key={major.code}
              id={`major-card-${major.code}`}
              className={`bg-white rounded-xl border transition-all duration-300 flex flex-col ${
                isExpanded ? "border-amber-400 ring-4 ring-amber-400/5 shadow-md" : "border-gray-100 hover:border-blue-900/30 hover:shadow-xs"
              }`}
            >
              {/* Header Box */}
              <div className="p-5 flex-1 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-mono font-bold px-2.5 py-1 rounded-sm uppercase tracking-wide">
                    {major.group}
                  </span>
                  <span className="text-xs bg-amber-500/10 text-amber-600 font-mono font-bold px-2.5 py-1 rounded border border-amber-500/10">
                    Mã: {major.code}
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-blue-900 hover:text-amber-500 cursor-pointer" onClick={() => setExpandedMajor(isExpanded ? null : major.code)}>
                    {major.name}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {major.description}
                  </p>
                </div>

                {/* Score Indicators badges */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-gray-100/50">
                  <div className="text-center">
                    <span className="block text-[9px] text-gray-400 uppercase tracking-widest font-sans">THPT 2025</span>
                    <strong className="text-xs font-mono text-blue-900">{major.exemptScore2025}đ</strong>
                  </div>
                  <div className="text-center border-x border-gray-200">
                    <span className="block text-[9px] text-gray-400 uppercase tracking-widest font-sans">Học bạ 2025</span>
                    <strong className="text-xs font-mono text-emerald-600">{major.transcriptScore2025}đ</strong>
                  </div>
                  <div className="text-center">
                    <span className="block text-[9px] text-gray-400 uppercase tracking-widest font-sans">Chỉ tiêu '26</span>
                    <strong className="text-xs font-mono text-amber-600">{major.slots}</strong>
                  </div>
                </div>

                {/* Expanded Details section */}
                {isExpanded && (
                  <div className="pt-3 border-t border-dashed border-gray-100 space-y-3 animate-fade-in">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Cơ hội công việc làm rộng mở:</span>
                      <ul className="list-disc pl-4 mt-1 text-xs text-gray-600 space-y-1">
                        {major.jobOpportunities.map((op, idx) => (
                          <li key={idx}>{op}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-blue-50/50 p-2 rounded border border-blue-100/30 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-blue-800" />
                        <div>
                          <span className="block text-[9px] text-gray-400">Thời gian học</span>
                          <strong className="text-[11px] text-blue-900">{major.duration} học kỳ ({major.duration} năm)</strong>
                        </div>
                      </div>
                      <div className="bg-emerald-50/50 p-2 rounded border border-emerald-100/30 flex items-center gap-2">
                        <FileBadge className="w-3.5 h-3.5 text-emerald-800" />
                        <div>
                          <span className="block text-[9px] text-emerald-400">Văn bằng tốt nghiệp</span>
                          <strong className="text-[11px] text-emerald-900">{major.degree}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="bg-amber-50 p-2.5 rounded border border-amber-200/40 text-xs">
                      <span className="block text-[9px] text-amber-700 font-bold uppercase">Học phí niên khóa 2026:</span>
                      <strong className="text-amber-800 font-sans">{tuitionNotice}</strong>
                    </div>

                    <div className="flex flex-wrap gap-1 items-center">
                      <span className="text-[10px] text-gray-400 font-bold">Khối xét tuyển:</span>
                      {major.subjectGroups.map((gp) => (
                        <span key={gp} className="bg-slate-100 text-slate-700 font-mono text-[10px] font-extrabold px-1.5 py-0.5 rounded">
                          {gp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Operations Bar at card footer */}
              <div className="bg-slate-50/70 border-t border-gray-100 p-4 rounded-b-xl flex gap-2 justify-between items-center">
                <button
                  onClick={() => setExpandedMajor(isExpanded ? null : major.code)}
                  className="text-xs text-blue-900 hover:text-amber-500 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5" />
                  {isExpanded ? "Thu gọn thông tin" : "Xem chi tiết Ngành"}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => downloadBrochure(major)}
                    title="Tải tờ gấp PDF thông tin chi tiết ngành học"
                    className="p-2 bg-slate-200 hover:bg-slate-300 text-gray-600 rounded-lg hover:text-gray-800 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onSelectMajorForReg(major.code)}
                    className="px-3.5 py-1.5 bg-blue-900 text-white rounded-lg hover:bg-blue-800 font-medium text-xs shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    Đăng Ký NV
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredMajors.length === 0 && (
          <div className="col-span-full bg-slate-50 text-center py-10 px-4 rounded-2xl border border-dashed border-gray-200">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2 animate-bounce" />
            <h5 className="text-sm font-bold text-slate-700">Không tìm thấy thông tin ngành phù hợp</h5>
            <p className="text-xs text-slate-400 mt-1">
              Hãy thử thay đổi từ khóa, hạ điều kiện điểm số của bạn để khám phá các nguyện vọng khác nhé.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
