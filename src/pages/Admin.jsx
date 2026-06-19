import { useState, useEffect } from 'react';
import { 
  FileText, BookOpen, HelpCircle, Info, BarChart3, Users, Newspaper,
  GraduationCap, ShieldCheck, FileUp, RotateCw, TrendingUp, Loader2, Calendar, Mail, AlertTriangle, Eye, CheckCircle2, ChevronRight, Inbox, MessageSquare, X
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
import LiveChatTab from '@/components/admin/LiveChatTab';
import { PostList } from '@/components/admin/PostList';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'live-chat', label: 'Hỗ trợ trực tuyến', icon: MessageSquare },
  { id: 'majors', label: 'Ngành học', icon: BookOpen },
  { id: 'faqs', label: 'Câu hỏi thường gặp', icon: HelpCircle },
  { id: 'posts', label: 'Bài viết tin tức', icon: Newspaper },
  { id: 'documents', label: 'Tài liệu AI', icon: FileUp },
  { id: 'users', label: 'Người dùng', icon: Users, adminOnly: true },
];

export default function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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

  const [toast, setToast] = useState(null);
  const [waitingChatCount, setWaitingChatCount] = useState(0);

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

  const fetchWaitingChats = async () => {
    try {
      const res = await fetch("/api/live-chats/active");
      if (res.ok) {
        const data = await res.json();
        const waiting = data.filter((s) => s.status === "waiting");
        setWaitingChatCount(waiting.length);
      }
    } catch (e) {
      console.error("Error fetching live chat count in Admin:", e);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchWaitingChats();
    const interval = setInterval(fetchAnalytics, 15000);
    const chatInterval = setInterval(fetchWaitingChats, 5000);
    return () => {
      clearInterval(interval);
      clearInterval(chatInterval);
    };
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const visibleTabs = TABS.filter(t => !t.adminOnly || role === 'admin');

  return (
    <div className="min-h-screen admin-bg">
      <AdminHeader user={user} role={role} onLogout={logout} onMenuClick={() => setIsSidebarOpen(true)} />

      {/* Toast popup */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl border shadow-xl flex items-start gap-3 max-w-md animate-fade-in ${
          toast.type === "success" ? "bg-emerald-950 border-emerald-500/40 text-emerald-200" : "bg-red-950 border-red-500/40 text-red-200"
        }`}>
          <CheckCircle2 className={`w-5 h-5 flex-shrink-0 mt-0.5 ${toast.type === "success" ? "text-emerald-400" : "text-red-400"}`} />
          <div className="flex-1">
            <p className="text-xs font-semibold">{toast.text}</p>
          </div>
          <button type="button" onClick={() => setToast(null)} className="text-white/40 hover:text-white font-bold text-xs">×</button>
        </div>
      )}

      <div className="flex">
        <AdminSidebar 
          tabs={visibleTabs} 
          activeTab={activeTab} 
          onSelect={setActiveTab} 
          badges={{ 'live-chat': waitingChatCount }} 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden">
          
          {/* STATS OVERVIEW CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Ngành học" value={majors.filter(m => m.is_active).length} icon={BookOpen} color="bg-[#1A3A6B]" />
            <StatCard label="Câu hỏi FAQ" value={faqs.filter(f => f.is_active).length} icon={HelpCircle} color="bg-[#C8A951]" />
            <StatCard label="Người dùng" value={users.length || '—'} icon={Users} color="bg-emerald-700" />
            <StatCard label="Bài viết" value={posts.length} icon={Newspaper} color="bg-purple-700" />
          </div>

          {/* ====================================
              TAB: DASHBOARD WITH LIVE CHARTS
              ==================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fade-rise text-white">
              <div className="flex justify-between items-center bg-white/5 p-5 rounded-2xl border border-white/10">
                <div>
                  <h1 className="font-playfair text-2xl font-bold text-white">Báo cáo quản trị hệ thống</h1>
                  <p className="font-inter text-xs text-white/50 mt-1">Dữ liệu được cập nhật tự động từ cơ sở dữ liệu hệ thống Vinh Uni.</p>
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
                      Chỉ tiêu tuyển sinh theo ngành học (Top 10 ngành)
                    </h4>
                    <div className="h-[460px] w-full text-xs font-mono">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={analyticsData.charts.majorDistribution}
                          margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis 
                            dataKey="name" 
                            stroke="rgba(255,255,255,0.4)"
                            tick={{ fontSize: 8.5 }}
                            interval={0}
                            angle={-45}
                            textAnchor="end"
                            height={100}
                          />
                          <YAxis stroke="rgba(255,255,255,0.4)" />
                          <RechartsTooltip 
                            contentStyle={{ backgroundColor: "#0A1931", borderColor: "rgba(255,255,255,0.15)", color: "#fff" }}
                            formatter={(value, name) => [value, "Chỉ tiêu tuyển sinh"]} 
                          />
                          <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "15px", color: "rgba(255,255,255,0.6)" }} />
                          <Bar dataKey="Chỉ tiêu" fill="#C8A951" name="Chỉ tiêu tuyển sinh" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Method Pie Chart */}
                  <div className="lg:col-span-4 bg-white/5 p-5 rounded-2xl border border-white/10 space-y-4 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white/80 uppercase tracking-widest font-mono">Cơ cấu ngành học theo lĩnh vực</h4>
                      <p className="text-[10px] text-white/40 font-inter mt-1">Phần trăm số lượng ngành đào tạo phân chia theo danh mục khoa học.</p>
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
                        <span className="block text-[8px] uppercase tracking-wider text-white/40 font-bold">Tổng số ngành</span>
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
              TAB: LIVE CHAT QUEUE
              ==================================== */}
          {activeTab === 'live-chat' && (
            <LiveChatTab />
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
