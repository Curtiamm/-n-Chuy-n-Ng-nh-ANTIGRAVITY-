import React, { useState, useEffect } from "react";
import { 
  Search, SearchCode, Mail, Loader2, AlertCircle, Sparkles, MapPin, 
  Phone, HelpCircle, CheckCircle2, Inbox, Calendar, FileText, 
  Upload, FileCode, Edit, Check, Settings, MailCheck, Download, Info, AlertTriangle, X
} from "lucide-react";
import { StudentRegistration } from "../types";
import { VINH_UNI_MAJORS } from "../data/vinhUniData";

export default function SearchTab() {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<StudentRegistration[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);

  // States for student document uploads attached to student ID
  const [uploadLoading, setUploadLoading] = useState<string | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<string>("transcript");
  const [customFileName, setCustomFileName] = useState<string>("");

  // States for Admin Sandbox Management Mode
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [tempStatusMap, setTempStatusMap] = useState<Record<string, string>>({});

  // Show a downloadable popup or card for PHP/XAMPP source code
  const [showPHPModal, setShowPHPModal] = useState(false);

  // Custom sandbox notification state matching guidelines
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Auto-dismiss custom toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 8500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!keyword.trim()) return;

    setErrorMsg("");
    setLoading(true);
    setSelectedEmail(null);

    try {
      const response = await fetch("/api/registrations/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim() })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Gặp trục trặc khi tra cứu.");
      }

      setResults(data.results);
      setHasSearched(true);
      
      // Seed initial dropdown select states for admin mode
      const statusMap: Record<string, string> = {};
      data.results.forEach((s: StudentRegistration) => {
        statusMap[s.id] = s.status;
      });
      setTempStatusMap(statusMap);

    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle uploading simulation from student side
  const handleUploadDocument = async (studentId: string) => {
    if (!customFileName.trim()) {
      setToast({
        text: "Vui lòng nhập tên tài liệu minh chứng (Ví dụ: Hoc_Ba_Ky_2_Chinh_Thuc.pdf)",
        type: "error"
      });
      return;
    }

    setUploadLoading(studentId);
    try {
      const resp = await fetch(`/api/registrations/${studentId}/upload-document`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customFileName.trim(),
          type: selectedDocType,
          size: `${(Math.random() * 2 + 1).toFixed(1)} MB`
        })
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || "Không thể nộp học bạ tệp đính kèm.");
      }

      // Update local student model in search results
      setResults(prev => prev.map(s => s.id === studentId ? data.registration : s));
      setCustomFileName("");
      setToast({
        text: "🎉 Minh chứng học thuật đã được tải lên máy chủ tuyển sinh thành công!",
        type: "success"
      });
    } catch (err: any) {
      setToast({ text: err.message, type: "error" });
    } finally {
      setUploadLoading(null);
    }
  };

  // Handle Admin modifying candidate status and auto sending email
  const handleUpdateStatus = async (studentId: string) => {
    const nextStatus = tempStatusMap[studentId];
    if (!nextStatus) return;

    setUpdatingStatusId(studentId);
    try {
      const resp = await fetch("/api/registrations/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: studentId,
          newStatus: nextStatus
        })
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || "Lỗi thay đổi hồ sơ.");
      }

      // Update state
      setResults(prev => prev.map(s => s.id === studentId ? data.registration : s));
      setToast({
        text: `🎉 Cập nhật trạng thái thành công! Đồng thời đã kích hoạt máy chủ tự động gửi hòm thư thông báo kết quả mới nhất về email: ${data.registration.email}.`,
        type: "success"
      });
    } catch (err: any) {
      setToast({ text: err.message, type: "error" });
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Helper to translate status DB values to user-friendly styled labels
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "approved":
        return {
          label: "🎉 ĐỦ ĐIỀU KIỆN TRÚNG TUYỂN",
          bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
          desc: "Chúc mừng em! Hồ sơ đã đủ tiêu chí học lực để trúng tuyển chính thức vào Đại học Vinh. Hãy chuẩn bị các giấy tờ gốc để nhập học theo hướng dẫn dưới email."
        };
      case "processing":
        return {
          label: "⚙️ ĐANG THẨM ĐỊNH CHI TIẾT",
          bg: "bg-blue-50 text-blue-800 border-blue-200",
          desc: "Hồ sơ của em đang được chuyên viên khảo thí so khớp điểm số học tập và tệp minh chứng đính kèm. Kết quả tối ưu sẽ được gửi trực tiếp sớm."
        };
      case "accepted":
        return {
          label: "✔️ TIẾP NHẬN HỒ SƠ THÀNH CÔNG",
          bg: "bg-indigo-50 text-indigo-800 border-indigo-200",
          desc: "Hồ sơ của em đã lưu trữ hợp lệ trên hệ thống dữ liệu điện tử. Hội đồng tuyển sinh đang tiến hành bước kiểm duyệt sơ bộ."
        };
      case "action_required":
        return {
          label: "⚠️ CẦN BỔ SUNG MINH CHỨNG HỌC BẠ",
          bg: "bg-red-50 text-red-800 border-red-200",
          desc: "Hệ thống phát hiện điểm số của em nằm sát mốc an toàn hoặc có thiếu sót trong tệp đính kèm học bạ. Vui lòng cập nhật đính kèm minh chứng học bạ / bằng tốt nghiệp ở bên dưới."
        };
      default:
        return {
          label: "⏳ ĐANG CHỜ PHÊ DUYỆT HỘI ĐỒNG",
          bg: "bg-amber-50 text-amber-800 border-amber-200",
          desc: "Hồ sơ của em đang xếp hàng chờ xem xét duyệt từ khối phòng khảo thí Đại học Vinh. Thông tin thẩm định sẽ gửi trực tiếp đến hòm thư liên kết của em sớm."
        };
    }
  };

  // Export PHP source helper function to download a zip equivalent
  const triggerPHPExport = () => {
    setToast({
      text: "Đang đóng gói file và hướng dẫn chạy PHP trên XAMPP... Tải xuống sẽ khởi động tự động ngay lập tức.",
      type: "info"
    });
    window.open("/php-version/ZIP_XAMPP_VinhUni.zip", "_blank");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto relative">
      {/* Toast Notification HUD */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl border shadow-xl flex items-start gap-3 max-w-md animate-fade-in transition-all ${
          toast.type === "success" 
            ? "bg-emerald-50 border-emerald-200 text-emerald-950" 
            : toast.type === "error"
            ? "bg-red-50 border-red-200 text-red-950"
            : "bg-blue-50 border-blue-200 text-blue-950"
        }`}>
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : toast.type === "error" ? (
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          ) : (
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 space-y-1">
            <h5 className="font-bold text-xs">
              {toast.type === "success" ? "Thông báo thành công" : toast.type === "error" ? "Cảnh báo hệ thống" : "Thông báo thông tin"}
            </h5>
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

      {/* Search Input Box Card */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <h3 className="text-base font-bold text-blue-900 flex justify-center md:justify-start items-center gap-2">
              <SearchCode className="w-5 h-5 text-amber-500 animate-pulse" />
              Tra Cứu Hồ Sơ & Quản Lý Giấy Tờ Số Hóa
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Nhập Họ và Tên thí sinh đầy đủ hoặc số căn cước công dân (CCCD) đã đăng ký trực tuyến trước đây để tra cứu tức thì trạng thái giải quyết và email phản hồi.
            </p>
          </div>

          {/* Special Toggle to Sandbox Admin Panel */}
          <button
            onClick={() => setIsAdminMode(!isAdminMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 self-center ${
              isAdminMode 
                ? "bg-amber-100 text-amber-800 border border-amber-300"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
            }`}
          >
            <Settings className={`w-3.5 h-3.5 ${isAdminMode ? 'animate-spin' : ''}`} />
            {isAdminMode ? "Tắt chế độ Cán Bộ Duyệt" : "Bật chế độ Cán Bộ Tuyển Sinh"}
          </button>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            required
            placeholder="Ví dụ: Nguyễn Văn Hùng hoặc 1871..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="flex-1 px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-900 focus:bg-white text-gray-800"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-900 hover:bg-blue-800 text-amber-300 font-bold text-sm rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Tra Cứu
          </button>
        </form>

        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-medium border border-red-100">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Output result container */}
      {hasSearched && (
        <div className="space-y-6 animate-fade-in">
          {results.length > 0 ? (
            results.map((student) => {
              const statusConf = getStatusConfig(student.status);
              const majorName = VINH_UNI_MAJORS.find((m) => m.code === student.selectedMajor)?.name || "Chưa xác định";

              return (
                <div key={student.id} className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
                  
                  {/* Top Bar Status */}
                  <div className="border-b border-gray-100 p-5 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 font-mono tracking-widest uppercase">Mã Hồ Sơ Tuyển Sinh</span>
                      <h4 className="text-lg font-black text-blue-900 font-mono">{student.id}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className={`px-4 py-1.5 rounded-full border text-xs font-bold ${statusConf.bg}`}>
                        {statusConf.label}
                      </div>
                    </div>
                  </div>

                  {/* Profile contents */}
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-gray-100">
                    <div className="space-y-3.5">
                      <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">Thông Tin Thí Sinh Đăng ký</h5>
                      <div className="space-y-2 text-xs">
                        <p className="text-gray-600"><strong className="text-gray-800 text-sm">Họ và tên:</strong> {student.fullName}</p>
                        <p className="text-gray-600"><strong className="text-gray-800">Căn cước công dân:</strong> {student.identityCard}</p>
                        <p className="text-gray-600"><strong className="text-gray-800">Số điện thoại:</strong> {student.phone}</p>
                        <p className="text-gray-600"><strong className="text-gray-800">Trường phổ thông:</strong> {student.highschool}</p>
                        <p className="text-gray-600"><strong className="text-gray-800">Địa chỉ Email liên kết:</strong> {student.email}</p>
                      </div>
                    </div>

                    <div className="space-y-3.5 md:border-l md:border-gray-100 md:pl-6">
                      <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">Nguyện Vọng Học Thuật</h5>
                      <div className="space-y-2 text-xs">
                        <p className="text-gray-600"><strong className="text-gray-800">Ngành đăng ký:</strong> <span className="text-blue-900 font-bold">{majorName}</span> ({student.selectedMajor})</p>
                        <p className="text-gray-600">
                          <strong className="text-gray-800">Phương thức tuyển:</strong>{" "}
                          <span className="capitalize">
                            {student.method === "academic-record" ? "Xét Học Bạ" : student.method === "thpt" ? "Điểm thi THPT" : student.method === "national-exam" ? "Đánh giá năng lực" : "Tuyển thẳng & Ưu tiên"}
                          </span>
                        </p>
                        <p className="text-gray-600"><strong className="text-gray-800">Điểm số quy đổi:</strong> <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded font-mono font-bold text-xs">{student.score}đ</span></p>
                        <p className="text-[11px] text-gray-400 italic">Hồ sơ nộp ngày: {new Date(student.registeredAt).toLocaleString("vi-VN")}</p>
                      </div>
                    </div>
                  </div>

                  {/* Recommendation notice text */}
                  <div className="p-4 bg-slate-50 text-xs border-b border-gray-100 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-blue-900 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-600 font-medium">{statusConf.desc}</p>
                  </div>

                  {/* ADMIN APPROVAL SANDBOX CONTROLLER */}
                  {isAdminMode && (
                    <div className="p-5 bg-amber-500/5 border-b border-amber-200/55 p-5 space-y-4">
                      <div className="flex items-center gap-2">
                        <Settings className="w-4.5 h-4.5 text-amber-600 animate-spin" />
                        <h5 className="text-xs font-black text-amber-900 uppercase tracking-wider font-mono">
                          Trình Quản Lý Xét Duyệt Tuyển Sinh (Dành cho Cán bộ Vinh Uni)
                        </h5>
                      </div>
                      <p className="text-xs text-amber-800/85">
                        Bạn đang mở công cụ lập lịch hoặc xử lý hồ sơ thí sinh trực tuyến. Thay đổi trạng thái tại đây sẽ <strong>tự động cấu hình và gửi Email thông báo tiến trình</strong> gửi trực tiếp đến thí sinh:
                      </p>

                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="w-full sm:w-auto flex-1">
                          <label className="block text-[10px] font-bold text-amber-700 uppercase mb-1 font-mono">Chọn Trạng Thái Xét Tuyển Mới</label>
                          <select
                            value={tempStatusMap[student.id] || student.status}
                            onChange={(e) => setTempStatusMap({ ...tempStatusMap, [student.id]: e.target.value })}
                            className="bg-white text-xs border border-amber-200 rounded-lg p-2.5 w-full focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 cursor-pointer"
                          >
                            <option value="pending">⏳ Chờ phê duyệt từ phòng khảo thí</option>
                            <option value="processing">⚙️ Đang thẩm định chi tiết tệp minh chứng</option>
                            <option value="accepted">✔️ Tiếp nhận lưu trữ hồ sơ hợp lệ</option>
                            <option value="approved">🎉 Đủ điều kiện trúng tuyển chính thức</option>
                            <option value="action_required">⚠️ Cần bổ sung tài liệu học bạ / bằng tốt nghiệp</option>
                          </select>
                        </div>

                        <button
                          type="button"
                          disabled={updatingStatusId === student.id}
                          onClick={() => handleUpdateStatus(student.id)}
                          className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 self-end"
                        >
                          {updatingStatusId === student.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <MailCheck className="w-3.5 h-3.5" />
                          )}
                          Lưu & Gửi Mail Thông Báo
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STUDENT SELF-SERVICE FILE UPLOAD HUB */}
                  <div className="p-5 border-b border-gray-100 space-y-4">
                    <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <Upload className="w-4 h-4 text-emerald-600" />
                      Hồ Sơ Minh Chứng & Giấy Tờ Học Sinh Đính Kèm
                    </h5>

                    <p className="text-xs text-gray-500">
                      Học sinh sử dụng công cụ sau để bổ sung Học bạ phổ thông, Bằng tốt nghiệp tạm thời, Giấy chứng nhận diện ưu tiên nhằm hoàn thiện hồ sơ ứng tuyển:
                    </p>

                    {/* Alrady uploaded documents list */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 rounded-lg border border-gray-100 space-y-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider block">Các tệp tin hiện tại:</span>
                        {student.documents && student.documents.length > 0 ? (
                          <div className="space-y-1.5">
                            {student.documents.map((doc, dIdx) => (
                              <div key={dIdx} className="bg-white p-2 rounded border border-gray-200 text-xs flex justify-between items-center">
                                <span className="font-medium text-slate-700 flex items-center gap-1.5 truncate">
                                  <FileCode className="w-3.5 h-3.5 text-blue-900" />
                                  {doc.name}
                                </span>
                                <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-mono shrink-0 whitespace-nowrap">
                                  {doc.type === "transcript" ? "Học bạ" : doc.type === "diploma" ? "Bằng TN" : "Tài liệu"}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-gray-400 italic">Chưa có tệp tin học bạ chi tiết nào được đính kèm ngoài thông tin nhập học ban đầu.</p>
                        )}
                      </div>

                      {/* Doc upload panel */}
                      <div className="p-3.5 bg-slate-50 rounded-lg border border-gray-100 space-y-2.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider block">Bổ sung tệp tin mới:</span>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={selectedDocType}
                            onChange={(e) => setSelectedDocType(e.target.value)}
                            className="bg-white border text-[11px] rounded p-1 text-gray-700 focus:outline-none cursor-pointer"
                          >
                            <option value="transcript">Học bạ số năm 12</option>
                            <option value="diploma">Bằng tốt nghiệp tạm thời</option>
                            <option value="other">Tài liệu / Giấy khen ưu tiên</option>
                          </select>

                          <input
                            type="text"
                            placeholder="Tên file (Ví dụ: Hoc_Ba.pdf)"
                            value={customFileName}
                            onChange={(e) => setCustomFileName(e.target.value)}
                            className="bg-white border text-[11px] rounded p-1 px-1.5 text-gray-800 focus:outline-none placeholder-gray-400 font-mono"
                          />
                        </div>

                        <button
                          type="button"
                          disabled={uploadLoading === student.id}
                          onClick={() => handleUploadDocument(student.id)}
                          className="w-full py-1.5 bg-blue-900 hover:bg-blue-800 text-amber-300 font-semibold text-xs rounded transition-colors cursor-pointer flex justify-center items-center gap-1"
                        >
                          {uploadLoading === student.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Upload className="w-3.5 h-3.5 text-amber-300" />
                          )}
                          Tải lên Giấy Tờ Ngay
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Email Sent History list widget (Hòm thư tự động gửi về Email) */}
                  <div className="p-5 space-y-4">
                    <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <Inbox className="w-4 h-4 text-blue-700 animate-pulse" />
                      Lịch Sử Email Gửi Cho Học Sinh ({student.emailLogs?.length || 0})
                    </h5>

                    <p className="text-xs text-gray-500">
                      Lưu trữ toàn bộ thông tin thông báo từ ban tuyển sinh Đại học Vinh gửi đến hòm thư <strong className="text-gray-700">{student.email}</strong>. Click chọn thư để đọc ngay:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      {/* Email list box sidebar */}
                      <div className="md:col-span-5 space-y-2">
                        {student.emailLogs?.map((log, lIdx) => (
                          <button
                            key={lIdx}
                            onClick={() => setSelectedEmail(log)}
                            className={`w-full text-left p-3 rounded-lg border text-xs transition-all cursor-pointer flex flex-col gap-1.5 ${
                              selectedEmail?.sentAt === log.sentAt
                                ? "bg-blue-50 border-blue-300 text-blue-900 ring-2 ring-blue-900/5 font-medium"
                                : "bg-white border-gray-200 hover:bg-slate-50 text-gray-700"
                            }`}
                          >
                            <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono self-start uppercase font-bold">
                              {log.type === "CONFIRMATION" ? "Xác nhận hồ sơ" : log.type === "STATUS_UPDATE" ? "Cập nhật trạng thái" : "Kết quả xét tuyển"}
                            </span>
                            <span className="font-bold line-clamp-1 py-0.5 text-slate-800">{log.subject}</span>
                            <span className="text-[10px] text-gray-400 flex items-center gap-1 font-mono">
                              <Calendar className="w-3 h-3 text-gray-300" />
                              {new Date(log.sentAt).toLocaleString("vi-VN")}
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* Expanded selected email renderer */}
                      <div className="md:col-span-7 bg-white p-5 rounded-lg border border-gray-100 min-h-64 flex flex-col shadow-inner">
                        {selectedEmail ? (
                          <div className="space-y-4 animate-fade-in flex-1 flex flex-col">
                            <div className="border-b border-gray-100 pb-3">
                              <div className="text-[10px] text-gray-400 font-mono"><strong>Tiêu đề:</strong> {selectedEmail.subject}</div>
                              <div className="text-[10px] text-gray-400 font-mono"><strong>Gửi lúc:</strong> {new Date(selectedEmail.sentAt).toLocaleString("vi-VN")}</div>
                            </div>
                            <div 
                              className="font-sans leading-relaxed text-xs text-slate-700 max-h-80 overflow-y-auto flex-1 p-3 bg-slate-50/50 rounded-md border border-slate-100/50"
                              dangerouslySetInnerHTML={{ __html: selectedEmail.bodyPreview || "" }}
                            />
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-gray-400">
                            <Mail className="w-8 h-8 text-slate-300 mb-2 animate-bounce" />
                            <p className="text-xs font-sans">Chọn một mục hòm thư ở danh sách bên trái để đọc email thông báo chi tiết tương ứng.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-slate-50 border border-dashed border-gray-200 p-8 rounded-2xl text-center">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2 animate-pulse" />
              <h4 className="text-sm font-bold text-slate-700">Không tìm thấy thông tin thí sinh khớp</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                Hệ thống chưa tìm thấy hồ sơ có Họ tên hoặc CCCD trùng khớp với <strong className="text-slate-600">"{keyword}"</strong>. Vui lòng kiểm tra lại chính xác lịch sử đăng ký, hoặc sang tab <strong>Đăng ký nguyện vọng</strong> để khởi tạo một hồ sơ mới trực tuyến.
              </p>
            </div>
          )}
        </div>
      )}

      {/* PHP XAMPP LOCAL CO-OPERATION WIDGET */}
      <div className="bg-gradient-to-r from-blue-950 to-slate-900 text-white rounded-2xl p-6 border border-amber-500/20 shadow-lg space-y-4 mt-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-400">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-300 uppercase tracking-wider font-mono">Phiên Bản XAMPP / PHP Offline Cho Website</h4>
            <p className="text-xs text-slate-400">Tải trọn bộ mã nguồn PHP và cơ sở dữ liệu để chạy cục bộ bằng phần mềm XAMPP theo nguyện vọng học tập.</p>
          </div>
        </div>

        <p className="text-xs text-slate-350 leading-relaxed">
          Nếu các em/thầy cô muốn triển khai ứng dụng này hoàn toàn chạy offline trên máy tính cá nhân bằng bộ phần mềm <strong>XAMPP (Apache + PHP)</strong>, hệ thống đã đóng gói sẵn đầy đủ các file PHP tương thích (gồm form đăng ký nguyện vọng, bảng tra cứu hồ sơ nộp, bộ dữ liệu tuyển sinh ngành học, và module chatbot kết nối API Gemini bằng <code>PHP curl_exec</code>).
        </p>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/50 space-y-3.5">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-200 font-sans">Hướng dẫn triển khai nhanh trên localhost:</span>
          </div>
          <ol className="text-xs text-slate-300 space-y-1.5 list-decimal pl-4 leading-relaxed">
            <li>Nhấn nút tải trọn gói ZIP mã nguồn PHP bên dưới về máy tính.</li>
            <li>Giải nén thư mục và copy toàn bộ nội dung tệp tin vào thư mục <code>C:\xampp\htdocs\vinhuni-ts\</code>.</li>
            <li>Mở file <code>chatbot.php</code> và dán khóa API Gemini của bạn vào cấu hình.</li>
            <li>Khởi động Apache trên phần mềm quản lý XAMPP Control Panel.</li>
            <li>Truy cập trên trình duyệt web theo đường dẫn: <code>http://localhost/vinhuni-ts/index.php</code> để chạy offline hoàn chỉnh!</li>
          </ol>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowPHPModal(true)}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            Xem Code PHP Mẫu ( index.php, chatbot.php... )
          </button>

          <button
            onClick={triggerPHPExport}
            className="px-5 py-2.5 bg-transparent border border-slate-600 hover:border-slate-400 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-300" />
            Tải File Cài Đặt XAMPP (.zip)
          </button>
        </div>
      </div>

      {/* PHP PREVIEW MODAL */}
      {showPHPModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-gray-100">
            {/* Header */}
            <div className="bg-blue-900 text-white p-4 flex justify-between items-center border-b border-gray-200">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-amber-300" />
                <h4 className="text-xs font-bold uppercase tracking-wider font-sans text-amber-300">
                  Mã Nguồn PHP Mẫu Cho Website Tuyển Sinh Vinh Uni
                </h4>
              </div>
              <button
                onClick={() => setShowPHPModal(false)}
                className="text-slate-300 hover:text-white font-extrabold text-xs cursor-pointer bg-slate-800 rounded px-2.5 py-1.5"
              >
                Đóng Xem Code
              </button>
            </div>

            {/* Content view with tabs inside code modal */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4 select-all text-xs font-mono bg-slate-950 text-slate-200">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-amber-400 font-bold block mb-1">=== FILE 1: Cấu hình gọi Chatbot AI bằng PHP CURL (chatbot.php) ===</span>
                <p className="text-[11px] text-slate-400 mb-2">Đoạn code gọi trực tiếp Gemini-3.5-flash API bằng PHP mà không cần cài đặt các SDK phức tạp:</p>
                <pre className="p-3 bg-slate-900 rounded-lg max-h-60 overflow-y-auto text-[10.5px] leading-relaxed border border-slate-800 text-emerald-400">
{`<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'Chỉ chấp nhận yêu cầu POST']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$userMessage = $input['message'] ?? '';

if (empty(trim($userMessage))) {
    echo json_encode(['error' => 'Tin nhắn không được để trống']);
    exit;
}

// 1. Khóa API Gemini lấy từ Google AI Studio
$apiKey = "YOUR_GEMINI_API_KEY_HERE"; 

$url = "https://generativelayertables.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=" . $apiKey;

// 2. Nội dung huấn luyện cho chatbot về trường Đại Học Vinh
$systemInstruction = "Bạn là Trợ lý Tuyển sinh AI Vinh Uni của trường Đại Học Vinh (182 Lê Duẩn, TP Vinh). " .
                     "Hãy trả lời thân thiện bằng tiếng Việt. " .
                     "Điểm chuẩn Công nghệ thông tin là 22đ, các ngành Sư phạm được miễn học phí theo NĐ 116.";

$payload = [
    "contents" => [
        [
            "parts" => [
                ["text" => $systemInstruction],
                ["text" => $userMessage]
            ]
        ]
    ],
    "generationConfig" => [
        "temperature" => 0.7
    ]
];

// 3. Thực hiện gọi CURL
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
if (curl_errno($ch)) {
    echo json_encode(['reply' => 'Có lỗi kết nối máy chủ AI: ' . curl_error($ch)]);
    exit;
}
curl_close($ch);

$responseData = json_decode($response, true);
$botReply = $responseData['candidates'][0]['content']['parts'][0]['text'] ?? 'Trợ lý tuyển sinh tuyển sinh Đại học Vinh đang bận.';

echo json_encode(['reply' => $botReply]);
?>`}
                </pre>
              </div>

              <div>
                <span className="text-amber-400 font-bold block mb-1">=== FILE 2: Form đăng ký và Lưu tệp tin JSON bằng PHP (register.php) ===</span>
                <p className="text-[11px] text-slate-400 mb-2">Đoạn code nhận học bạ tải lên, lưu thông tin vào file registrations.json và gửi Mail tự động:</p>
                <pre className="p-3 bg-slate-900 rounded-lg max-h-60 overflow-y-auto text-[10.5px] leading-relaxed border border-slate-800 text-sky-400 font-mono">
{`<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $fullName = $_POST['fullName'] ?? '';
    $email = $_POST['email'] ?? '';
    $phone = $_POST['phone'] ?? '';
    $identityCard = $_POST['identityCard'] ?? '';
    $selectedMajor = $_POST['selectedMajor'] ?? '';
    $score = $_POST['score'] ?? 0;
    
    // Tải lên tệp minh chứng học bạ (Xác thực file tải lên)
    $uploadedFile = "";
    if (isset($_FILES['transcript']) && $_FILES['transcript']['error'] === UPLOAD_ERR_OK) {
        $fileTmpPath = $_FILES['transcript']['tmp_name'];
        $fileName = $_FILES['transcript']['name'];
        $uploadFolder = './uploads/';
        
        if (!is_dir($uploadFolder)) {
            mkdir($uploadFolder, 0777, true);
        }
        
        $destPath = $uploadFolder . time() . '_' . $fileName;
        if (move_uploaded_file($fileTmpPath, $destPath)) {
            $uploadedFile = $destPath;
        }
    }

    // Đọc và lưu trữ cơ sở dữ liệu JSON 
    $dbFile = 'registrations.json';
    $registrations = [];
    if (file_exists($dbFile)) {
        $registrations = json_decode(file_get_contents($dbFile), true) ?: [];
    }

    $id = 'TS26-' . (count($registrations) + 1001);
    $newEntry = [
        'id' => $id,
        'fullName' => $fullName,
        'email' => $email,
        'phone' => $phone,
        'identityCard' => $identityCard,
        'selectedMajor' => $selectedMajor,
        'score' => floatval($score),
        'status' => 'pending',
        'document_path' => $uploadedFile,
        'registeredAt' => date('Y-m-d H:i:s')
    ];

    $registrations[] = $newEntry;
    file_put_contents($dbFile, json_encode($registrations, JSON_PRETTY_PRINT));

    // Tự động gửi Email báo tin
    $to = $email;
    $subject = "Xac nhan hồ so tuyen sinh Truong Dai hoc Vinh - " . $id;
    $message = "Chao ban " . $fullName . ", Chung toi da tiep nhan ho so nganh " . $selectedMajor . " co hoc ba di kem.";
    $headers = "From: tuyensinh@vinhuni.edu.vn\\r\\nContent-Type: text/plain; charset=UTF-8";
    
    @mail($to, $subject, $message, $headers); // Hàm gửi mail tự động trong PHP PHP Mailer

    echo json_encode([
        'success' => true,
        'message' => 'Nộp hồ sơ thành công vào dữ liệu XAMPP!',
        'registration' => $newEntry
    ]);
}
?>`}
                </pre>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-gray-100 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={triggerPHPExport}
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-amber-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Nhận File Nén ZIP Đầy Đủ
              </button>
              <button
                type="button"
                onClick={() => setShowPHPModal(false)}
                className="px-4 py-2 bg-white border text-gray-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Đóng Xem
              </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}
