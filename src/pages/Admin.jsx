import { useState, useEffect } from 'react';
import { 
  FileText, BookOpen, HelpCircle, Info, BarChart3, Users, Newspaper,
  GraduationCap, ShieldCheck, FileUp, RotateCw, TrendingUp, Loader2, Calendar, Mail, AlertTriangle, Eye, CheckCircle2, ChevronRight, Inbox
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useMajors, useMajorMutations } from '@/hooks/useMajors';
import { useFAQs, useFAQMutations } from '@/hooks/useFAQs';
import { usePosts, usePostMutations } from '@/hooks/usePosts';
import { useUsers, useUserMutations } from '@/hooks/useUsers';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { StatCard } from '@/components/admin/StatCard';
import { MajorList } from '@/components/admin/MajorList';
import { FAQList } from '@/components/admin/FAQList';
import { UserList } from '@/components/admin/UserList';
import DocumentsTab from '@/components/admin/DocumentsTab';
import { PostList } from '@/components/admin/PostList';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'admissions', label: 'Hồ sơ nguyện vọng', icon: FileText },
  { id: 'majors', label: 'Ngành học', icon: BookOpen },
  { id: 'faqs', label: 'Câu hỏi thường gặp', icon: HelpCircle },
  { id: 'posts', label: 'Bài viết tin tức', icon: Newspaper },
  { id: 'documents', label: 'Tài liệu AI', icon: FileUp },
  { id: 'users', label: 'Người dùng', icon: Users, adminOnly: true },
];

export default function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user, role, logout } = useAuth();

  const { data: majors = [] } = useMajors();
  const { data: faqs = [] } = useFAQs();
  const { data: posts = [] } = usePosts();
  const { data: users = [] } = useUsers(role === 'admin');

  const majorMutations = useMajorMutations();
  const faqMutations = useFAQMutations();
  const postMutations = usePostMutations();
  const { updateRole } = useUserMutations();

  // --- Real-time Analytics States ---
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState("");

  // --- Candidate Registrations States ---
  const [registrations, setRegistrations] = useState([]);
  const [regLoading, setRegLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [tempStatus, setTempStatus] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchAnalytics = async () => {
    setAnalyticsError("");
    try {
      const response = await fetch("/api/analytics");
      if (!response.ok) throw new Error("Không thể kết nối API phân tích.");
      const data = await response.json();
      setAnalyticsData(data);
    } catch (e) {
      setAnalyticsError(e.message);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchRegistrations = async () => {
    setRegLoading(true);
    try {
      const response = await fetch("/api/admission");
      if (!response.ok) throw new Error("Không thể tải danh sách hồ sơ.");
      const data = await response.json();
      setRegistrations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setRegLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchRegistrations();
    const interval = setInterval(fetchAnalytics, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleUpdateStatus = async (studentId) => {
    if (!tempStatus) return;
    setStatusUpdating(true);
    try {
      const resp = await fetch("/api/registrations/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: studentId,
          newStatus: tempStatus
        })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Gặp lỗi cập nhật.");

      setRegistrations(prev => prev.map(s => s.id === studentId ? data.registration : s));
      setSelectedStudent(data.registration);
      setToast({ text: `🎉 Đã cập nhật trạng thái hồ sơ mã ${studentId} thành công và gửi thông báo email!`, type: "success" });
      fetchAnalytics(); // Refresh charts
    } catch (err) {
      setToast({ text: err.message, type: "error" });
    } finally {
      setStatusUpdating(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "approved":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "processing":
        return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      case "accepted":
        return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
      case "action_required":
        return "bg-red-500/10 text-red-400 border border-red-500/20";
      default:
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "approved": return "Đủ ĐK Đỗ";
      case "processing": return "Thẩm Định";
      case "accepted": return "Đã Tiếp Nhận";
      case "action_required": return "Bổ Sung Học Bạ";
      default: return "Chờ Duyệt";
    }
  };

  const visibleTabs = TABS.filter(t => !t.adminOnly || role === 'admin');

  return (
    <div className="min-h-screen admin-bg">
      <AdminHeader user={user} role={role} onLogout={logout} />

      {/* Toast popup */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl border shadow-xl flex items-start gap-3 max-w-md animate-fade-in ${
          toast.type === "success" ? "bg-emerald-950 border-emerald-500/40 text-emerald-200" : "bg-red-950 border-red-500/40 text-red-200"
        }`}>
          <CheckCircle2 className={`w-5 h-5 flex-shrink-0 mt-0.5 ${toast.type === "success" ? "text-emerald-400" : "text-red-400"}`} />
          <div className="flex-1">
            <p className="text-xs font-semibold">{toast.text}</p>
          </div>
          <button onClick={() => setToast(null)} className="text-white/40 hover:text-white font-bold text-xs">×</button>
        </div>
      )}

      <div className="flex">
        <AdminSidebar tabs={visibleTabs} activeTab={activeTab} onSelect={setActiveTab} />

        <div className="flex-1 p-6 lg:p-8 overflow-auto">
          
          {/* STATS OVERVIEW CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Ngành học" value={majors.filter(m => m.is_active).length} icon={BookOpen} color="bg-[#1A3A6B]" />
            <StatCard label="Câu hỏi FAQ" value={faqs.filter(f => f.is_active).length} icon={HelpCircle} color="bg-[#C8A951]" />
            <StatCard label="Người dùng" value={users.length || '—'} icon={Users} color="bg-emerald-700" />
            <StatCard label="Hồ sơ đăng ký" value={registrations.length} icon={FileText} color="bg-purple-700" />
          </div>

          {/* ====================================
              TAB: DASHBOARD WITH LIVE CHARTS
              ==================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fade-rise text-white">
              <div className="flex justify-between items-center bg-white/5 p-5 rounded-2xl border border-white/10">
                <div>
                  <h1 className="font-playfair text-2xl font-bold text-white">Báo cáo tuyển sinh trực tuyến</h1>
                  <p className="font-inter text-xs text-white/50 mt-1">Dữ liệu được cập nhật tự động từ cơ sở dữ liệu hồ sơ đăng ký nguyện vọng.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-bold text-emerald-300 font-mono">Live Sync</span>
                  <button onClick={fetchAnalytics} className="p-2 hover:bg-white/10 rounded-xl transition-all"><RotateCw className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              {analyticsLoading && !analyticsData ? (
                <div className="flex flex-col items-center justify-center py-20 text-white/50">
                  <Loader2 className="w-8 h-8 animate-spin text-[#C8A951] mb-2" />
                  <p className="text-xs font-mono">Đang đồng bộ biểu đồ báo cáo...</p>
                </div>
              ) : analyticsError ? (
                <div className="p-5 bg-red-950/20 border border-red-500/20 rounded-2xl text-center text-red-300">
                  {analyticsError}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Bar Chart compare Registrations and Quotas */}
                  <div className="lg:col-span-8 bg-white/5 p-5 rounded-2xl border border-white/10 space-y-4">
                    <h4 className="text-xs font-bold text-white/80 uppercase tracking-widest font-mono flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#C8A951]" />
                      Chỉ tiêu tuyển sinh và số hồ sơ nộp nguyện vọng
                    </h4>
                    <div className="h-72 w-full text-xs font-mono">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={analyticsData.charts.majorDistribution}
                          margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis 
                            dataKey="name" 
                            stroke="rgba(255,255,255,0.4)"
                            tickFormatter={(val) => val.length > 8 ? `${val.substring(0, 8)}...` : val} 
                            angle={-15} 
                            textAnchor="end" 
                          />
                          <YAxis stroke="rgba(255,255,255,0.4)" />
                          <RechartsTooltip 
                            contentStyle={{ backgroundColor: "#0A1931", borderColor: "rgba(255,255,255,0.15)", color: "#fff" }}
                            formatter={(value, name) => [value, name === "Số hồ sơ" ? "Hồ sơ nguyện vọng" : "Chỉ tiêu"]} 
                          />
                          <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "15px", color: "rgba(255,255,255,0.6)" }} />
                          <Bar dataKey="Chỉ tiêu" fill="rgba(255,255,255,0.1)" name="Tổng chỉ tiêu" />
                          <Bar dataKey="Số hồ sơ" fill="#C8A951" name="Nguyện vọng đã nộp" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Method Pie Chart */}
                  <div className="lg:col-span-4 bg-white/5 p-5 rounded-2xl border border-white/10 space-y-4 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white/80 uppercase tracking-widest font-mono">Tỷ lệ phương thức xét tuyển</h4>
                      <p className="text-[10px] text-white/40 font-inter mt-1">Cơ cấu hồ sơ đăng ký theo từng phương thức của thí sinh.</p>
                    </div>

                    <div className="h-44 w-full relative flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analyticsData.charts.methodDistribution}
                            innerRadius={40}
                            outerRadius={55}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {analyticsData.charts.methodDistribution.map((entry, idx) => (
                              <Cell key={`cell-${idx}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <RechartsTooltip contentStyle={{ backgroundColor: "#0A1931", color: "#fff", borderColor: "rgba(255,255,255,0.15)" }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute text-center">
                        <span className="block text-[8px] uppercase tracking-wider text-white/40 font-bold">Tổng số</span>
                        <span className="text-base font-black font-mono text-white">{analyticsData.summary.totalRegistrations}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {analyticsData.charts.methodDistribution.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[10px] py-1 border-b border-white/5">
                          <div className="flex items-center gap-1.5 font-medium">
                            <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: item.fill }} />
                            <span className="text-white/70 truncate max-w-[130px]">{item.name}</span>
                          </div>
                          <strong className="text-white font-mono">{item.value} ({analyticsData.summary.totalRegistrations > 0 ? ((item.value / analyticsData.summary.totalRegistrations) * 100).toFixed(0) : 0}%)</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ====================================
              TAB: CANDIDATE REGISTRATIONS MANAGEMENT
              ==================================== */}
          {activeTab === 'admissions' && (
            <div className="space-y-6 animate-fade-rise text-white">
              <div className="flex justify-between items-center bg-white/5 p-5 rounded-2xl border border-white/10">
                <div>
                  <h1 className="font-playfair text-2xl font-bold">Quản lý hồ sơ nguyện vọng</h1>
                  <p className="font-inter text-xs text-white/50 mt-1">Duyệt hồ sơ thí sinh nộp trực tuyến và kiểm duyệt giấy tờ minh chứng.</p>
                </div>
                <button onClick={fetchRegistrations} className="p-2 hover:bg-white/10 rounded-xl transition-all"><RotateCw className="w-3.5 h-3.5" /></button>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                
                {/* List Table */}
                <div className="xl:col-span-8 bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-lg">
                  {regLoading && registrations.length === 0 ? (
                    <div className="p-20 text-center text-white/50">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#C8A951] mb-2" />
                      <p className="text-xs">Đang tải hồ sơ đăng ký...</p>
                    </div>
                  ) : registrations.length === 0 ? (
                    <div className="p-20 text-center text-white/30 font-playfair text-lg">Chưa có hồ sơ tuyển sinh nào nộp trực tuyến.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-white/5 border-b border-white/10 text-white/60 font-mono uppercase tracking-wider">
                            <th className="p-4">Mã hồ sơ</th>
                            <th className="p-4">Thí sinh / CCCD</th>
                            <th className="p-4">Ngành / Điểm</th>
                            <th className="p-4">Trạng thái</th>
                            <th className="p-4">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {registrations.map((student) => {
                            const major = majors.find(m => m.code === student.selectedMajor);
                            return (
                              <tr 
                                key={student.id} 
                                className={`border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${selectedStudent?.id === student.id ? 'bg-white/10' : ''}`}
                                onClick={() => { setSelectedStudent(student); setTempStatus(student.status); setSelectedEmail(null); }}
                              >
                                <td className="p-4 font-mono font-bold text-white">{student.id}</td>
                                <td className="p-4">
                                  <div className="font-bold text-white">{student.fullName}</div>
                                  <div className="text-white/40 text-[10px] font-mono mt-0.5">{student.identityCard}</div>
                                </td>
                                <td className="p-4">
                                  <div className="text-white max-w-[150px] truncate">{major?.name || "Chưa chọn"}</div>
                                  <div className="text-[#C8A951] font-mono font-semibold text-[10px] mt-0.5">{student.score} điểm</div>
                                </td>
                                <td className="p-4">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${getStatusStyle(student.status)}`}>
                                    {getStatusText(student.status)}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <button className="p-1.5 hover:bg-white/10 rounded-lg text-[#C8A951]"><ChevronRight className="w-4 h-4" /></button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Candidate details panel */}
                <div className="xl:col-span-4 bg-white/5 rounded-2xl border border-white/10 p-5 space-y-6 shadow-lg self-start">
                  {selectedStudent ? (
                    <div className="space-y-6 animate-fade-in">
                      <div className="flex justify-between items-start border-b border-white/10 pb-4">
                        <div>
                          <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest font-mono">Thông tin chi tiết</span>
                          <h3 className="text-lg font-bold text-white mt-0.5">{selectedStudent.fullName}</h3>
                          <span className="text-[10px] text-white/40 font-mono block">{selectedStudent.id} | {selectedStudent.identityCard}</span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${getStatusStyle(selectedStudent.status)}`}>
                          {getStatusText(selectedStudent.status)}
                        </span>
                      </div>

                      {/* Info cards */}
                      <div className="space-y-3.5 text-xs">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-[10px] text-white/40 block font-mono">Số điện thoại</span>
                            <span className="font-semibold text-white">{selectedStudent.phone}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-white/40 block font-mono">Email nhận tin</span>
                            <span className="font-semibold text-white truncate block">{selectedStudent.email}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] text-white/40 block font-mono">Trường phổ thông tốt nghiệp</span>
                          <span className="font-semibold text-white">{selectedStudent.highschool}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-white/40 block font-mono">Điểm quy đổi & Ngành xét</span>
                          <span className="font-semibold text-[#C8A951] block">{selectedStudent.score} điểm</span>
                        </div>
                      </div>

                      {/* Status changer */}
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                        <label className="block text-[10px] font-bold text-white/60 font-mono uppercase">Thay đổi trạng thái xét tuyển</label>
                        <div className="flex gap-2">
                          <select
                            value={tempStatus}
                            onChange={(e) => setTempStatus(e.target.value)}
                            className="bg-[#0A1931] border border-white/10 rounded-lg p-2 flex-1 text-xs text-white outline-none cursor-pointer"
                          >
                            <option value="pending">⏳ Chờ duyệt hồ sơ</option>
                            <option value="processing">⚙️ Đang thẩm định minh chứng</option>
                            <option value="accepted">✔️ Đã tiếp nhận hồ sơ hợp lệ</option>
                            <option value="approved">🎉 Đủ điều kiện đỗ chính thức</option>
                            <option value="action_required">⚠️ Yêu cầu bổ sung học bạ số</option>
                          </select>
                          <button
                            type="button"
                            disabled={statusUpdating}
                            onClick={() => handleUpdateStatus(selectedStudent.id)}
                            className="px-3 bg-[#C8A951] hover:bg-[#967C34] text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                          >
                            {statusUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Lưu"}
                          </button>
                        </div>
                      </div>

                      {/* Uploaded Documents List */}
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold text-white/40 font-mono uppercase tracking-wider">Học bạ đính kèm ({selectedStudent.documents?.length || 0})</h4>
                        {selectedStudent.documents && selectedStudent.documents.length > 0 ? (
                          <div className="space-y-1.5">
                            {selectedStudent.documents.map((doc, idx) => (
                              <div key={idx} className="bg-white/5 border border-white/10 p-2.5 rounded-xl text-xs flex justify-between items-center gap-2">
                                <span className="font-mono text-white/80 truncate block">{doc.name}</span>
                                <span className="text-[9px] bg-[#C8A951]/20 text-[#C8A951] px-1.5 py-0.5 rounded font-mono shrink-0 uppercase font-bold">{doc.type === "transcript" ? "Học bạ" : "Bằng TN"}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-white/40 italic">Thí sinh chưa bổ sung minh chứng học bạ số.</p>
                        )}
                      </div>

                      {/* Emails History list */}
                      <div className="space-y-3 pt-2 border-t border-white/5">
                        <h4 className="text-[10px] font-bold text-white/40 font-mono uppercase tracking-wider flex items-center gap-1">
                          <Inbox className="w-3.5 h-3.5 text-[#C8A951]" />
                          Lịch sử email đã gửi ({selectedStudent.emailLogs?.length || 0})
                        </h4>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {selectedStudent.emailLogs?.map((log, idx) => (
                            <button
                              key={idx}
                              onClick={() => setSelectedEmail(log)}
                              className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex flex-col gap-1 ${
                                selectedEmail?.sentAt === log.sentAt
                                  ? 'bg-[#C8A951]/10 border-[#C8A951] text-white'
                                  : 'bg-white/5 border-white/5 hover:bg-white/10 text-white/70'
                              }`}
                            >
                              <span className="font-semibold line-clamp-1">{log.subject}</span>
                              <span className="text-[9px] text-white/45 font-mono">{new Date(log.sentAt).toLocaleString("vi-VN")}</span>
                            </button>
                          ))}
                        </div>

                        {selectedEmail && (
                          <div className="bg-[#0A1931] border border-white/15 p-4 rounded-xl space-y-2 animate-fade-in">
                            <div className="flex justify-between items-center border-b border-white/10 pb-1.5 text-[9px] font-mono text-white/40">
                              <span>Xem trước email gửi</span>
                              <button onClick={() => setSelectedEmail(null)} className="text-white hover:text-red-400">Đóng</button>
                            </div>
                            <div 
                              className="font-sans leading-relaxed text-[11px] text-slate-350 max-h-44 overflow-y-auto p-2 bg-[#FCFCFD]/5 rounded-lg border border-white/5 shadow-inner"
                              dangerouslySetInnerHTML={{ __html: selectedEmail.bodyPreview || "" }}
                            />
                          </div>
                        )}
                      </div>

                    </div>
                  ) : (
                    <div className="text-center py-20 text-white/40 font-playfair text-base">
                      Hãy chọn một hồ sơ ở bảng danh sách bên trái để kiểm duyệt và đổi trạng thái.
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* ====================================
              TAB: MAJORS LIST CRUD
              ==================================== */}
          {activeTab === 'majors' && (
            <MajorList
              majors={majors}
              role={role}
              onCreate={d => majorMutations.create.mutate(d)}
              onUpdate={(id, d) => majorMutations.update.mutate({ id, data: d })}
              onDelete={id => majorMutations.remove.mutate(id)}
            />
          )}

          {/* ====================================
              TAB: FAQS LIST CRUD
              ==================================== */}
          {activeTab === 'faqs' && (
            <FAQList
              faqs={faqs}
              role={role}
              onCreate={d => faqMutations.create.mutate(d)}
              onUpdate={(id, d) => faqMutations.update.mutate({ id, data: d })}
              onDelete={id => faqMutations.remove.mutate(id)}
            />
          )}

          {/* ====================================
              TAB: POSTS MANAGEMENT
              ==================================== */}
          {activeTab === 'posts' && (
            <PostList
              posts={posts}
              role={role}
              onCreate={d => postMutations.create.mutate(d)}
              onUpdate={(id, d) => postMutations.update.mutate({ id, data: d })}
              onDelete={id => postMutations.remove.mutate(id)}
            />
          )}

          {/* ====================================
              TAB: DOCUMENTS LIST
              ==================================== */}
          {activeTab === 'documents' && (
            <DocumentsTab role={role} />
          )}

          {/* ====================================
              TAB: USERS ROLE ASSIGNMENT
              ==================================== */}
          {activeTab === 'users' && role === 'admin' && (
            <UserList
              users={users}
              onRoleChange={(id, role) => updateRole.mutate({ id, role })}
            />
          )}
        </div>
      </div>
    </div>
  );
}
