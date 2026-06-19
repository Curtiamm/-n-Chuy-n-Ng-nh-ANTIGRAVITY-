import { useState } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { FAQForm } from './FAQForm';

export function FAQList({ faqs, role, onCreate, onUpdate, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="font-playfair text-2xl font-bold text-white">Câu hỏi thường gặp</h1>
        <button type="button" onClick={() => setShowAdd(true)} className="flex items-center justify-center gap-2 px-4 py-2 bg-[#C8A951] text-white rounded-xl font-inter text-sm font-medium hover:bg-[#967C34] shrink-0">
          <Plus className="w-4 h-4" /> Thêm câu hỏi
        </button>
      </div>
      {showAdd && <FAQForm onSave={d => { onCreate(d); setShowAdd(false); }} onCancel={() => setShowAdd(false)} />}
      <div className="space-y-2">
        {faqs.map(f => (
          <div key={f.id}>
            {editingId === f.id ? (
              <FAQForm faq={f} onSave={d => { onUpdate(f.id, d); setEditingId(null); }} onCancel={() => setEditingId(null)} />
            ) : (
              <div className="px-4 py-3 bg-white/10 rounded-xl border border-white/10 hover:border-white/20 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-inter text-sm font-medium text-white mb-1">{f.question}</div>
                    <div className="font-inter text-xs text-white/50 line-clamp-2">{f.answer}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-inter text-xs text-[#C8A951] bg-[#C8A951]/10 px-2 py-0.5 rounded-full">{f.category}</span>
                    <button onClick={() => setEditingId(f.id)} className="p-1.5 text-white/40 hover:text-[#C8A951]"><Pencil className="w-4 h-4" /></button>
                    {role === 'admin' && <button onClick={() => onDelete(f.id)} className="p-1.5 text-white/40 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {faqs.length === 0 && <div className="text-center py-12 text-white/40 font-inter text-sm">Chưa có câu hỏi nào. Hãy thêm mới.</div>}
      </div>
    </div>
  );
}
