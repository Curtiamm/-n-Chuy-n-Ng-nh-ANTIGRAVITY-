import { useState } from 'react';
import { Pencil, Trash2, Plus, Newspaper, Eye, EyeOff, Calendar, User, Tag } from 'lucide-react';
import { PostForm } from './PostForm';

export function PostList({ posts, role, onCreate, onUpdate, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'published' | 'draft'

  const filtered = posts.filter(p => {
    if (filter === 'published') return p.status === 'published';
    if (filter === 'draft') return p.status === 'draft';
    return true;
  });

  const getStatusBadge = (status) => {
    if (status === 'published') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Eye className="w-3 h-3" /> Đã xuất bản
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <EyeOff className="w-3 h-3" /> Bản nháp
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-rise text-white">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/5 p-5 rounded-2xl border border-white/10">
        <div>
          <h1 className="font-playfair text-2xl font-bold text-white flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-[#C8A951]" />
            Quản lý bài viết tin tức
          </h1>
          <p className="font-inter text-xs text-white/50 mt-1">Tạo, chỉnh sửa và quản lý các bài viết thông báo trên trang chủ tuyển sinh.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Filter buttons */}
          <div className="flex bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            {[
              { key: 'all', label: 'Tất cả' },
              { key: 'published', label: 'Xuất bản' },
              { key: 'draft', label: 'Nháp' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 text-[10px] font-bold font-mono transition-all ${
                  filter === f.key
                    ? 'bg-[#C8A951] text-white'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#C8A951] text-white rounded-xl font-inter text-sm font-medium hover:bg-[#967C34] transition-all shadow-lg shadow-[#C8A951]/10"
          >
            <Plus className="w-4 h-4" /> Tạo bài viết
          </button>
        </div>
      </div>

      {showAdd && (
        <PostForm
          onSave={d => { onCreate(d); setShowAdd(false); }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      <div className="space-y-3">
        {filtered.map(p => (
          <div key={p.id}>
            {editingId === p.id ? (
              <PostForm
                post={p}
                onSave={d => { onUpdate(p.id, d); setEditingId(null); }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div className="flex items-start gap-4 px-5 py-4 bg-white/5 rounded-2xl border border-white/10 hover:border-white/20 transition-all group">
                {/* Cover image thumbnail */}
                {p.coverImage && (
                  <div className="w-20 h-14 rounded-xl overflow-hidden border border-white/10 shrink-0 hidden sm:block">
                    <img src={p.coverImage} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-inter text-sm font-semibold text-white truncate">{p.title}</h3>
                      <p className="font-inter text-xs text-white/40 mt-0.5 line-clamp-1">{p.excerpt}</p>
                    </div>
                    {getStatusBadge(p.status)}
                  </div>

                  <div className="flex items-center gap-4 mt-2.5 text-[10px] text-white/35 font-mono">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" /> {p.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" /> {p.author}
                    </span>
                    {p.publishedAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {new Date(p.publishedAt).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditingId(p.id)}
                    className="p-2 text-white/30 hover:text-[#C8A951] hover:bg-white/5 rounded-lg transition-all"
                    title="Chỉnh sửa"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {role === 'admin' && (
                    <button
                      onClick={() => { if (confirm('Xóa bài viết này?')) onDelete(p.id); }}
                      className="p-2 text-white/30 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-all"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-white/30">
            <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-playfair text-lg">Chưa có bài viết nào.</p>
            <p className="font-inter text-xs text-white/20 mt-1">Nhấn "Tạo bài viết" để bắt đầu.</p>
          </div>
        )}
      </div>
    </div>
  );
}
