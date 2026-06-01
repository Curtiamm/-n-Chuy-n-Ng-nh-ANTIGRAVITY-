import { useState } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { MajorForm } from './MajorForm';

export function MajorList({ majors, role, onCreate, onUpdate, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-playfair text-2xl font-bold text-white">Quản lý ngành học</h1>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-[#C8A951] text-white rounded-xl font-inter text-sm font-medium hover:bg-[#967C34]">
          <Plus className="w-4 h-4" /> Thêm ngành
        </button>
      </div>
      {showAdd && <MajorForm onSave={d => { onCreate(d); setShowAdd(false); }} onCancel={() => setShowAdd(false)} />}
      <div className="space-y-2">
        {majors.map(m => (
          <div key={m.id}>
            {editingId === m.id ? (
              <MajorForm major={m} onSave={d => { onUpdate(m.id, d); setEditingId(null); }} onCancel={() => setEditingId(null)} />
            ) : (
              <div className="flex items-center gap-4 px-4 py-3 bg-white/10 rounded-xl border border-white/10 hover:border-white/20 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="font-inter text-sm font-medium text-white truncate">{m.name}</div>
                  <div className="font-inter text-xs text-white/50">{m.faculty} · {m.category}</div>
                </div>
                <div className="font-inter text-sm text-[#C8A951]">{m.score_2024 ? `${m.score_2024} điểm` : '—'}</div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingId(m.id)} className="p-1.5 text-white/40 hover:text-[#C8A951] transition-colors"><Pencil className="w-4 h-4" /></button>
                  {role === 'admin' && <button onClick={() => onDelete(m.id)} className="p-1.5 text-white/40 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>}
                </div>
              </div>
            )}
          </div>
        ))}
        {majors.length === 0 && <div className="text-center py-12 text-white/40 font-inter text-sm">Chưa có ngành học nào. Hãy thêm mới.</div>}
      </div>
    </div>
  );
}
