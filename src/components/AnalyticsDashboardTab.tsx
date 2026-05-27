import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Loader2, TrendingUp, Users, GraduationCap, ShieldCheck, MailWarning, LayoutGrid, RotateCw } from "lucide-react";
import { AnalyticsData } from "../types";

export default function AnalyticsDashboardTab() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchMetrics = async () => {
    setErrorMsg("");
    setLoading(true);
    try {
      const response = await fetch("/api/analytics");
      if (!response.ok) {
        throw new Error("Không thể kết nối máy chủ phân tích dữ liệu tuyển sinh.");
      }
      const raw = await response.json();
      setData(raw);
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    // Poll every 15 seconds to simulate actual live stream dashboard
    const interval = setInterval(fetchMetrics, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-gray-500">
        <Loader2 className="w-10 h-10 animate-spin text-blue-900 mb-2" />
        <p className="text-sm font-medium">Đang tải và đồng bộ báo cáo tuyển sinh thời gian thực...</p>
      </div>
    );
  }

  if (errorMsg && !data) {
    return (
      <div className="bg-red-50 text-red-700 p-5 rounded-2xl border border-red-100 max-w-xl mx-auto text-center space-y-3">
        <h4 className="text-sm font-bold">Lỗi đồng bộ dữ liệu thời gian thực</h4>
        <p className="text-xs">{errorMsg}</p>
        <button
          onClick={fetchMetrics}
          className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 text-xs font-bold transition-all cursor-pointer"
        >
          Thử kết nối lại
        </button>
      </div>
    );
  }

  const summary = data?.summary;
  const charts = data?.charts;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Realtime banner */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-5 rounded-xl border border-gray-100 gap-4">
        <div>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest font-mono">Báo Cáo Tự Động Tuyển Sinh 2026</h3>
          <p className="text-xs text-gray-400 font-sans mt-0.5">
            Dữ liệu tuyển sinh được tổng hợp và biểu diễn liên tục từ cơ sở dữ liệu hồ sơ đăng ký nguyện vọng.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="text-xs font-bold text-emerald-700 font-mono">Live Sync: Đang hoạt động</span>
          <button
            onClick={fetchMetrics}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg hover:text-slate-800 transition-all cursor-pointer"
            title="Tải lại báo cáo"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid Summary metrics Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Card 1 Total registrars */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 hover:border-blue-900/10 transition-all shadow-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Tổng hồ sơ nộp</span>
              <Users className="w-5 h-5 text-blue-900" />
            </div>
            <div>
              <p className="text-2xl font-black text-blue-900 font-mono">{summary.totalRegistrations}</p>
              <span className="text-[10px] text-gray-400 block font-mono">✓ Kích hoạt hồ sơ trực tuyến</span>
            </div>
          </div>

          {/* Card 2 Approved total */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 hover:border-emerald-500/10 transition-all shadow-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Hồ sơ đủ ĐK đỗ</span>
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-600 font-mono">{summary.approvedTotal}</p>
              <span className="text-[10px] text-emerald-500 block font-mono">🎉 Đạt tổng điểm chuẩn</span>
            </div>
          </div>

          {/* Card 3 Pending count */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 hover:border-amber-500/10 transition-all shadow-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Chờ Phê duyệt</span>
              <LayoutGrid className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-black text-amber-500 font-mono">{summary.pendingTotal}</p>
              <span className="text-[10px] text-amber-500 block font-mono">⏳ Đang khảo sát học bạ</span>
            </div>
          </div>

          {/* Card 4 Avg grading scores */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 hover:border-indigo-500/10 transition-all shadow-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Điểm trung bình (30đ)</span>
              <GraduationCap className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-indigo-600 font-mono">{summary.averageScores}đ</p>
              <span className="text-[10px] text-indigo-500 block font-mono">📊 Phản ánh mức học bạ tuyển</span>
            </div>
          </div>

        </div>
      )}

      {/* Charts breakdown Grid */}
      {charts && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Major comparison bar chart */}
          <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-gray-100 shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest font-mono flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-900" />
              So sánh Chỉ tiêu và Lượng nguyện vọng đăng ký
            </h4>
            
            <p className="text-[11px] text-gray-500 font-sans">
              Biểu đồ phân tích thể hiện lượng hồ sơ nguyện vọng (Đã đăng ký) so với Quy mô chỉ tiêu tối đa (Chỉ tiêu) của năm đào tạo tuyển sinh năm 2026.
            </p>

            <div className="h-80 w-full text-xs font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={charts.majorDistribution}
                  margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tickFormatter={(val) => val.length > 10 ? `${val.substring(0, 10)}...` : val} 
                    angle={-15} 
                    textAnchor="end" 
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [value, name === "Số hồ sơ" ? "Số nguyện vọng nộp" : "Chỉ tiêu tuyển sinh"]} 
                    labelStyle={{ fontFamily: "Inter, sans-serif" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "15px" }} />
                  <Bar dataKey="Chỉ tiêu" fill="#e2e8f0" name="Quy mô Chỉ tiêu" />
                  <Bar dataKey="Số hồ sơ" fill="#1e3a8a" name="Hồ sơ nguyện vọng" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Methods ratio donut chart and list */}
          <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-gray-100 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest font-mono">
                Tỷ lệ phương thức tuyển dụng
              </h4>
              <p className="text-[11px] text-gray-500 font-sans mt-0.5">
                Cơ cấu phân bổ lựa chọn phương pháp ứng thí của học bạ, thi quốc gia hay kiểm tra ĐGNL của Đại học Vinh.
              </p>
            </div>

            <div className="h-48 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.methodDistribution}
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {charts.methodDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} học sinh`, "Lượng nộp"]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <span className="block text-[9px] uppercase tracking-wider text-gray-400 font-bold">Tổng NV</span>
                <span className="text-base font-black font-mono text-blue-900">{summary?.totalRegistrations}</span>
              </div>
            </div>

            {/* Explanatory legend table listing */}
            <div className="space-y-2 block">
              {charts.methodDistribution.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-[11px] p-1.5 border-b border-gray-50/50">
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: item.fill }}></span>
                    <span className="text-gray-600 line-clamp-1">{item.name}</span>
                  </div>
                  <strong className="text-gray-900 font-mono">{item.value} bộ ({summary && summary.totalRegistrations > 0 ? ((item.value / summary.totalRegistrations) * 100).toFixed(0) : 0}%)</strong>
                </div>
              ))}
            </div>

          </div>

        </div>
      )}

      {/* Advisory guide badge message */}
      <div className="bg-blue-50/35 border border-blue-100 p-4 rounded-xl flex items-start gap-3 text-xs leading-relaxed text-blue-900">
        <Users className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-blue-900 block">Lời khuyên giám khảo khảo thí dành cho bạn:</strong>
          Các ngành <strong className="text-indigo-950">Công nghệ thông tin</strong> và <strong className="text-indigo-950">Sư phạm Toán học</strong> luôn là những ngành có lượt đăng ký cao và mức chọi căng thẳng nhất hàng năm. Thí sinh đăng ký các ngành này nên ưu tiên nộp đăng ký khối học bạ hoặc điểm thi THPT đợt xét sớm để tối ưu hóa xác suất trúng tuyển trước ngày hết hạn chỉ tiêu!
        </div>
      </div>
    </div>
  );
}
