import { useState } from 'react';
import { Save, X } from 'lucide-react';

const CATS = ['Ngành học', 'Hồ sơ đăng ký', 'Học phí', 'Học bổng', 'Ký túc xá', 'Khác'];

export function FAQForm({ faq, onSave, onCancel }) {
  const [data, setData] = useState(faq || { question: '', answer: '', category: 'Ngành học', is_active: true });

  return (
    <div className="bg-white/10 rounded-2xl p-5 border border-white/20 mb-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="font-inter text-xs text-white/60 mb-1 block">Câu hỏi</label>
          <input type="text" value={data.question} onChange={e => setData(d => ({ ...d, question: e.target.value }))} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white font-inter text-sm outline-none focus:border-[#C8A951]" />
        </div>
        <div>
          <label className="font-inter text-xs text-white/60 mb-1 block">Câu trả lời</label>
          <textarea value={data.answer} onChange={e => setData(d => ({ ...d, answer: e.target.value }))} rows={3} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white font-inter text-sm outline-none focus:border-[#C8A951] resize-none" />
        </div>
        <div>
          <label className="font-inter text-xs text-white/60 mb-1 block">Danh mục</label>
          <select value={data.category} onChange={e => setData(d => ({ ...d, category: e.target.value }))} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white font-inter text-sm outline-none focus:border-[#C8A951]">
            {CATS.map(c => <option key={c} value={c} className="text-black">{c}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-3 mt-4">
        <button onClick={() => onSave(data)} className="flex items-center gap-2 px-4 py-2 bg-[#C8A951] text-white rounded-lg font-inter text-sm font-medium hover:bg-[#967C34]"><Save className="w-4 h-4" /> Lưu</button>
        <button onClick={onCancel} className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg font-inter text-sm hover:bg-white/20"><X className="w-4 h-4" /> Huỷ</button>
      </div>
    </div>
  );
}
