import React, { useState, useEffect } from "react";
import { VINH_UNI_MAJORS, GENERAL_ENROLL_GUIDELINES } from "../data/vinhUniData";
import { FileBadge, Send, FileCode, CheckCircle, Upload, HelpCircle, Loader2, Mail, ShieldAlert } from "lucide-react";

interface RegisterTabProps {
  selectedMajorCode: string;
  onRegistrySuccess: (newRegistration: any) => void;
}

export default function RegisterTab({ selectedMajorCode, onRegistrySuccess }: RegisterTabProps) {
  // Form values
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [identityCard, setIdentityCard] = useState("");
  const [highschool, setHighschool] = useState("");
  const [selectedMajor, setSelectedMajor] = useState(VINH_UNI_MAJORS[0].code);
  const [method, setMethod] = useState("academic-record");
  const [score, setScore] = useState<string>("");
  
  // File upload state representation
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>(null);

  // Status & loading
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successData, setSuccessData] = useState<any | null>(null);

  // Sync selected major from external quick navigation click
  useEffect(() => {
    if (selectedMajorCode) {
      const match = VINH_UNI_MAJORS.find((m) => m.code === selectedMajorCode);
      if (match) setSelectedMajor(match.code);
    }
  }, [selectedMajorCode]);

  // Find info about currently active major selection for real-time validation feedback
  const activeMajorInfo = VINH_UNI_MAJORS.find((m) => m.code === selectedMajor);

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const fileSizeKB = Math.round(file.size / 1024);
      setUploadedFile({
        name: file.name,
        size: fileSizeKB > 1024 ? `${(fileSizeKB / 1024).toFixed(1)} MB` : `${fileSizeKB} KB`
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileSizeKB = Math.round(file.size / 1024);
      setUploadedFile({
        name: file.name,
        size: fileSizeKB > 1024 ? `${(fileSizeKB / 1024).toFixed(1)} MB` : `${fileSizeKB} KB`
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    // Basic Validation
    if (!fullName || !email || !phone || !identityCard || !score) {
      setErrorMsg("Vui lòng nhập đầy đủ toàn bộ các trường thông tin thí sinh chính xác.");
      setLoading(false);
      return;
    }

    const numericScore = parseFloat(score);
    if (isNaN(numericScore) || numericScore < 0 || (method !== "national-exam" && numericScore > 30) || (method === "national-exam" && numericScore > 1200)) {
      setErrorMsg(
        method === "national-exam"
          ? "Với ĐGNL, điểm số tối đa là 1200 điểm."
          : "Điểm tổ hợp xét tuyển phải nằm trên thang từ 0 đến 30."
      );
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/registrations/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          identityCard,
          highschool,
          selectedMajor,
          method,
          score: numericScore
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Gặp sự cố kết nối máy chủ đào tạo.");
      }

      setSuccessData(result.registration);
      onRegistrySuccess(result.registration);

      // Scroll to registry card top view
      window.scrollTo({ top: 300, behavior: "smooth" });
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset form states to allow another registry
  const resetForm = () => {
    setFullName("");
    setEmail("");
    setPhone("");
    setIdentityCard("");
    setHighschool("");
    setScore("");
    setUploadedFile(null);
    setSuccessData(null);
    setErrorMsg("");
  };

  if (successData) {
    const primaryLog = successData.emailLogs?.[0];
    const secondaryLog = successData.emailLogs?.[1];

    return (
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-emerald-100 shadow-sm space-y-6 max-w-3xl mx-auto animate-fade-in">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle className="w-10 h-10 animate-pulse" />
          </div>
          <h3 className="text-xl font-bold font-sans text-emerald-800">Gửi Hồ Sơ Nguyện Vọng Trực Tuyến Thành Công!</h3>
          <p className="text-sm text-gray-500 max-w-lg mx-auto">
            Hồ sơ tuyển sinh của học sinh <strong className="text-gray-800">{successData.fullName}</strong> đã được lưu vào hệ thống trực tuyến Đại học Vinh với mã số chính thức: <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-mono font-bold text-sm">{successData.id}</span>.
          </p>
        </div>

        {/* Realtime Email confirmation preview widget */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3 justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest font-mono">Bản Tin Email Mã Hóa Tự Động Gửi Đi</h4>
            </div>
            <span className="text-[10px] bg-slate-800 text-emerald-400 px-2 py-0.5 rounded font-mono">
              Status: Hòm thư đã nhận (100% Gửi Thật)
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Hệ thống đã tự động soạn tin và thông báo trực tiếp đến địa chỉ email:{" "}
            <strong className="text-emerald-400 font-mono underline">{successData.email}</strong>. Trực quan hóa cấu trúc thư nhận được:
          </p>

          <div className="bg-white text-slate-800 text-xs p-5 rounded-lg max-h-96 overflow-y-auto space-y-4 shadow-inner border border-gray-100">
            {/* Header info */}
            <div className="border-b border-gray-100 pb-2.5">
              <div className="text-[10px] text-gray-500"><strong>From:</strong> Hội đồng tuyển sinh THPT & ĐH Vinh (tuyensinh@vinhuni.edu.vn)</div>
              <div className="text-[10px] text-gray-500"><strong>To:</strong> {successData.fullName} ({successData.email})</div>
              <div className="text-[11px] font-bold text-blue-900 mt-1"><strong>Subj:</strong> {primaryLog?.subject}</div>
            </div>

            {/* Email Body template direct preview */}
            <div 
              className="font-sans leading-relaxed text-gray-700" 
              dangerouslySetInnerHTML={{ __html: primaryLog?.bodyPreview || "" }} 
            />

            {/* If secondary admission outcome email was dispatched immediately */}
            {secondaryLog && (
              <div className="border-t border-dashed border-gray-300 pt-4 mt-6 space-y-4">
                <div className="border-b border-gray-100 pb-2.5">
                  <div className="text-[10px] text-gray-500"><strong>From:</strong> Hội đồng tuyển sinh THPT & ĐH Vinh (tuyensinh@vinhuni.edu.vn)</div>
                  <div className="text-[10px] text-gray-500"><strong>To:</strong> {successData.fullName} ({successData.email})</div>
                  <div className="text-[11px] font-bold text-blue-900 mt-1"><strong>Subj:</strong> {secondaryLog.subject}</div>
                </div>
                <div 
                  className="font-sans leading-relaxed text-gray-700" 
                  dangerouslySetInnerHTML={{ __html: secondaryLog.bodyPreview || "" }} 
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={resetForm}
            className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            Đăng ký thêm hồ sơ mới
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto">
      {/* Form Registration column */}
      <form onSubmit={handleSubmit} className="lg:col-span-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6">
        <div>
          <h3 className="text-base font-bold text-blue-900 flex items-center gap-2">
            <FileBadge className="w-5 h-5 text-amber-500" />
            Đơn Đăng Ký Nguyện Vọng Đại Học Vinh Trực Tuyến
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Vui lòng cung cấp chính xác các thông tin học thuật theo giấy tờ cá nhân để ban giám khảo kịp duyệt.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-xs border border-red-100 flex items-center gap-2 animate-pulse">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Candidate Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600 block">Họ và Tên Thí Sinh <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              placeholder="Nguyễn Văn A"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:border-blue-900 focus:bg-white text-gray-800"
            />
          </div>

          {/* Identity Card Number / CCCD */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600 block">Số CCCD / CMND <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              placeholder="Nhập 9 hoặc 12 chữ số"
              value={identityCard}
              onChange={(e) => setIdentityCard(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:border-blue-900 focus:bg-white text-gray-800"
            />
          </div>

          {/* Candidate Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600 block">Hòm Thư Email Nhận Tin <span className="text-red-500">*</span></label>
            <input
              type="email"
              required
              placeholder="hocsinh@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:border-blue-900 focus:bg-white text-gray-800"
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600 block">Số Điện Thoại Liên Lại <span className="text-red-500">*</span></label>
            <input
              type="tel"
              required
              placeholder="Ví dụ: 0912..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:border-blue-900 focus:bg-white text-gray-800"
            />
          </div>

          {/* High School Info */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-bold text-gray-600 block">Tên Trường THPT Phổ Thông</label>
            <input
              type="text"
              placeholder="THPT Chuyên Phan Bội Châu, Nghệ An"
              value={highschool}
              onChange={(e) => setHighschool(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:border-blue-900 focus:bg-white text-gray-800"
            />
          </div>
        </div>

        {/* Academics Selection fields */}
        <div className="border-t border-dashed border-gray-100 pt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Major choices */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 block">Ngành Đăng Ký Đạt <span className="text-red-500">*</span></label>
              <select
                value={selectedMajor}
                onChange={(e) => setSelectedMajor(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-blue-900 focus:bg-white cursor-pointer"
              >
                {VINH_UNI_MAJORS.map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.name} ({m.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Registry Methods */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 block">Phương Thức Xét Tuyển <span className="text-red-500">*</span></label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-blue-900 focus:bg-white cursor-pointer"
              >
                {GENERAL_ENROLL_GUIDELINES.methods.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
            {/* Point scores */}
            <div className="sm:col-span-5 space-y-1.5">
              <label className="text-xs font-bold text-gray-600 block">
                Tổng điểm Quy đổi ({method === "national-exam" ? "Thang 1200" : "Thang 30"}) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.05"
                required
                placeholder={method === "national-exam" ? "Ví dụ: 850" : "Ví dụ: 25.4"}
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:border-blue-900 focus:bg-white text-gray-800 font-mono font-bold"
              />
            </div>

            {/* Quick eligibility visual validation tracker */}
            {activeMajorInfo && score && (
              <div className="sm:col-span-7 bg-slate-50 p-2.5 rounded-lg border border-gray-100/50 flex items-center gap-2 text-xs">
                {Number(score) >= (method === "academic-record" ? activeMajorInfo.transcriptScore2025 : activeMajorInfo.exemptScore2025) ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <span className="text-emerald-700 font-medium">
                      Ước lượng: <strong>Đủ điều kiện đỗ</strong> so với mốc năm ngoái ({method === "academic-record" ? activeMajorInfo.transcriptScore2025 : activeMajorInfo.exemptScore2025}đ)!
                    </span>
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                    <span className="text-amber-700 font-medium">
                      Ước lượng: Điểm của bạn đang sát nút mốc ứng tuyển tối thiểu. Nên nộp sớm!
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Drag and Drop Highschool Record Upload Document (Photo / Transcript) */}
        <div className="border-t border-dashed border-gray-100 pt-5 space-y-2">
          <label className="text-xs font-bold text-gray-600 block">Đính kèm Ảnh Học Bạ / Chứng Chỉ Sửa Bản Số Hóa</label>
          
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
              dragActive ? "border-amber-400 bg-amber-50/25" : "border-gray-200 bg-slate-50/50 hover:bg-slate-50"
            }`}
          >
            <input
              type="file"
              id="registry-file-file-upload"
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,application/pdf"
            />
            <label htmlFor="registry-file-file-upload" className="cursor-pointer space-y-2 block">
              <Upload className="w-8 h-8 text-gray-400 mx-auto animate-bounce" />
              <div className="text-xs text-gray-600 font-medium font-sans">
                Kéo thả tệp minh chứng học bạ vào đây hoặc <span className="text-blue-900 underline font-bold">chọn từ thiết bị của bạn</span>
              </div>
              <p className="text-[10px] text-gray-400">
                Chấp nhận file ảnh chụp THPT, học bạ, chứng chỉ ngoại ngữ (PDF, JPG, PNG tối đa 5MB)
              </p>
            </label>
          </div>

          {uploadedFile && (
            <div className="bg-blue-50/50 border border-blue-100/50 p-2.5 rounded-lg flex justify-between items-center text-xs animate-fade-in">
              <span className="text-blue-800 font-medium font-sans flex items-center gap-1.5 select-all">
                <FileCode className="w-4 h-4 text-blue-600" />
                {uploadedFile.name} ({uploadedFile.size})
              </span>
              <button
                type="button"
                onClick={() => setUploadedFile(null)}
                className="text-red-500 hover:text-red-700 font-bold transition-transform hover:scale-125 cursor-pointer text-sm"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* Submit action button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-900 hover:bg-blue-800 text-amber-300 font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:scale-101 flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-amber-300" />
                Đang xử lý hồ sơ và kích hoạt gửi thư tự động...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-amber-300" />
                Gửi Đăng Ký & Nhận Thông Báo Email Tự Động
              </>
            )}
          </button>
        </div>
      </form>

      {/* Guide widget sidebar column */}
      <div className="lg:col-span-4 space-y-5">
        <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-200/40 space-y-3.5">
          <h4 className="text-sm font-bold text-amber-800 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-amber-600" />
            Hướng dẫn nộp hồ sơ trực tuyến
          </h4>
          <ul className="text-xs text-amber-900/80 space-y-2.5 list-decimal pl-4">
            <li>
              Học sinh cần ghi rõ điểm trung bình 3 môn thi THPT thuộc khối đăng ký, hoặc điểm trung bình học bạ.
            </li>
            <li>
              Hãy đảm bảo tên hòm thư <strong>Email</strong> chính xác vì hệ thống tự động hóa sẽ gửi kết quả phản hồi trúng tuyển qua email đó lập tức.
            </li>
            <li>
              Sau khi xác nhận nộp thành công, bạn sẽ nhận được thông báo phân tích chúc mừng trực tiếp kèm mã tra cứu.
            </li>
            <li>
              Có thể bổ sung hoặc cập nhật hồ sơ thông qua chat trực tuyển AI Counselor hoặc liên hệ bộ phận hỗ trợ kỹ thuật.
            </li>
          </ul>
        </div>

        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/50 space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest font-mono">Thông tin phân bổ chỉ tiêu</h4>
          {activeMajorInfo && (
            <div className="space-y-4">
              <div className="bg-white p-3 rounded-lg border border-slate-100 flex justify-between items-center">
                <span className="text-xs text-slate-500 font-medium">Ngành đăng ký:</span>
                <strong className="text-xs text-blue-900 text-right">{activeMajorInfo.name}</strong>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white p-2.5 rounded border border-slate-100 text-center">
                  <span className="block text-[10px] text-slate-400">Chỉ tiêu tổng</span>
                  <strong className="text-sm font-mono text-amber-600">{activeMajorInfo.slots}</strong>
                </div>
                <div className="bg-white p-2.5 rounded border border-slate-100 text-center">
                  <span className="block text-[10px] text-slate-400">Khoảng điểm 2025</span>
                  <strong className="text-sm font-mono text-blue-900">{activeMajorInfo.exemptScore2025}đ</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
