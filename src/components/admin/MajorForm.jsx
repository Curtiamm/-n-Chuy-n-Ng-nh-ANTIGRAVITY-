import { useState } from 'react';
import { Save, X } from 'lucide-react';

const CATEGORIES = ['Kỹ thuật - Công nghệ', 'Sư phạm', 'Kinh tế', 'Y tế - Sức khỏe', 'Khoa học xã hội', 'Ngoại ngữ', 'Nghệ thuật', 'Nông lâm ngư'];

export function MajorForm({ major, onSave, onCancel }) {
  const [data, setData] = useState(major || { name: '', faculty: '', category: 'Kỹ thuật - Công nghệ', admission_groups: '', code: '', is_active: true });
  const upd = (k, v) => setData(d => ({ ...d, [k]: v }));

  return (
    <div className="bg-white/10 rounded-2xl p-5 border border-white/20 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { key: 'name', label: 'Tên ngành', type: 'text' },
          { key: 'faculty', label: 'Khoa', type: 'text' },
          { key: 'code', label: 'Mã ngành', type: 'text' },
          { key: 'admission_groups', label: 'Tổ hợp xét tuyển', type: 'text' },
          { key: 'score_2023', label: 'Điểm chuẩn 2023', type: 'number' },
          { key: 'score_2024', label: 'Điểm chuẩn 2024', type: 'number' },
          { key: 'quota', label: 'Chỉ tiêu', type: 'number' },
          { key: 'tuition_per_year', label: 'Học phí/năm (triệu)', type: 'number' },
        ].map(f => (
          <div key={f.key}>
            <label className="font-inter text-xs text-white/60 mb-1 block">{f.label}</label>
            <input
              type={f.type}
              value={data[f.key] || ''}
              onChange={e => upd(f.key, f.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white font-inter text-sm outline-none focus:border-[#C8A951] placeholder-white/30"
            />
          </div>
        ))}
        <div className="md:col-span-2">
          <label className="font-inter text-xs text-white/60 mb-1 block">Nhóm ngành</label>
          <select value={data.category} onChange={e => upd('category', e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white font-inter text-sm outline-none focus:border-[#C8A951]">
            {CATEGORIES.map(c => <option key={c} value={c} className="text-black">{c}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="font-inter text-xs text-white/60 mb-1 block">Mô tả ngành</label>
          <textarea value={data.description || ''} onChange={e => upd('description', e.target.value)} rows={2} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white font-inter text-sm outline-none focus:border-[#C8A951] resize-none placeholder-white/30" />
        </div>
      </div>
      <div className="flex gap-3 mt-4">
        <button onClick={() => onSave(data)} className="flex items-center gap-2 px-4 py-2 bg-[#C8A951] text-white rounded-lg font-inter text-sm font-medium hover:bg-[#967C34] transition-colors">
          <Save className="w-4 h-4" /> Lưu
        </button>
        <button onClick={onCancel} className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg font-inter text-sm hover:bg-white/20 transition-colors">
          <X className="w-4 h-4" /> Huỷ
        </button>
      </div>
    </div>
  );
}
