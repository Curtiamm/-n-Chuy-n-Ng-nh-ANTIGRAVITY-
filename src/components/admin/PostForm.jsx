import { useState, useRef } from 'react';
import { Save, X, Image, FileText, Tag, AlignLeft, Upload, Loader2, Trash2 } from 'lucide-react';

const CATEGORIES = ['Thông báo', 'Tin tức', 'Hướng dẫn', 'Tuyển sinh', 'Sự kiện', 'Học bổng'];

export function PostForm({ post, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: post?.title || '',
    excerpt: post?.excerpt || '',
    content: post?.content || '',
    category: post?.category || 'Thông báo',
    status: post?.status || 'draft',
    coverImage: post?.coverImage || '',
    author: post?.author || 'Ban Tuyển sinh',
  });

  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      publishedAt: form.status === 'published' ? (post?.publishedAt || new Date().toISOString()) : null,
    });
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh (JPG, PNG, GIF, WebP)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File ảnh quá lớn. Giới hạn tối đa 10MB.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const resp = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Upload thất bại');
      }

      const data = await resp.json();
      setForm(prev => ({ ...prev, coverImage: data.url }));
    } catch (err) {
      alert('Lỗi tải ảnh: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const inputClass = "w-full bg-[#0A1931] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#C8A951]/50 focus:ring-1 focus:ring-[#C8A951]/30 transition-all font-inter";
  const labelClass = "block text-[10px] font-bold text-white/50 uppercase tracking-wider font-mono mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5 mb-4 animate-fade-in">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <h3 className="font-playfair text-lg font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#C8A951]" />
          {post ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
        </h3>
        <button type="button" onClick={onCancel} className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div>
        <label className={labelClass}>Tiêu đề bài viết</label>
        <input
          className={inputClass}
          placeholder="Nhập tiêu đề bài viết..."
          value={form.title}
          onChange={e => setForm({...form, title: e.target.value})}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={labelClass}><Tag className="w-3 h-3 inline mr-1" />Danh mục</label>
          <select
            className={inputClass + ' cursor-pointer'}
            value={form.category}
            onChange={e => setForm({...form, category: e.target.value})}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Trạng thái</label>
          <select
            className={inputClass + ' cursor-pointer'}
            value={form.status}
            onChange={e => setForm({...form, status: e.target.value})}
          >
            <option value="draft">📝 Bản nháp</option>
            <option value="published">✅ Đã xuất bản</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Tác giả</label>
          <input
            className={inputClass}
            placeholder="Ban Tuyển sinh"
            value={form.author}
            onChange={e => setForm({...form, author: e.target.value})}
          />
        </div>
      </div>

      {/* Image Upload Area */}
      <div>
        <label className={labelClass}><Image className="w-3 h-3 inline mr-1" />Ảnh bìa bài viết</label>

        {form.coverImage ? (
          <div className="relative rounded-xl overflow-hidden border border-white/10 h-40 group">
            <img src={form.coverImage} alt="Ảnh bìa" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white text-xs font-semibold hover:bg-white/30 transition-colors flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" /> Đổi ảnh
              </button>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, coverImage: '' }))}
                className="px-3 py-2 bg-red-500/30 backdrop-blur-sm rounded-lg text-white text-xs font-semibold hover:bg-red-500/50 transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Xóa ảnh
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={() => setDragOver(false)}
            className={`relative flex flex-col items-center justify-center h-40 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
              dragOver
                ? 'border-[#C8A951] bg-[#C8A951]/5'
                : 'border-white/15 hover:border-[#C8A951]/40 hover:bg-white/5'
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-[#C8A951] animate-spin" />
                <span className="text-xs text-white/50 font-inter">Đang tải ảnh lên...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-center px-4">
                <div className="w-12 h-12 rounded-xl bg-[#C8A951]/10 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-[#C8A951]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/70 font-inter">
                    Kéo thả ảnh vào đây hoặc <span className="text-[#C8A951] underline">chọn file</span>
                  </p>
                  <p className="text-[10px] text-white/30 font-mono mt-1">JPG, PNG, GIF, WebP · Tối đa 10MB</p>
                </div>
              </div>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
            e.target.value = '';
          }}
        />
      </div>

      <div>
        <label className={labelClass}><AlignLeft className="w-3 h-3 inline mr-1" />Mô tả ngắn (Excerpt)</label>
        <textarea
          className={inputClass + ' resize-none'}
          rows={2}
          placeholder="Viết tóm tắt ngắn gọn cho bài viết..."
          value={form.excerpt}
          onChange={e => setForm({...form, excerpt: e.target.value})}
          required
        />
      </div>

      <div>
        <label className={labelClass}>Nội dung bài viết (Markdown)</label>
        <textarea
          className={inputClass + ' resize-none font-mono text-xs leading-relaxed'}
          rows={10}
          placeholder={"Viết nội dung chi tiết bằng Markdown...\n\n**In đậm**, *in nghiêng*, - danh sách\n1. Danh sách đánh số"}
          value={form.content}
          onChange={e => setForm({...form, content: e.target.value})}
          required
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-5 py-2.5 text-sm font-inter font-medium text-white/60 hover:text-white border border-white/10 rounded-xl hover:bg-white/5 transition-all">
          Hủy bỏ
        </button>
        <button type="submit" disabled={uploading} className="px-5 py-2.5 text-sm font-inter font-semibold text-white bg-[#C8A951] hover:bg-[#967C34] rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-[#C8A951]/10 disabled:opacity-50 disabled:cursor-not-allowed">
          <Save className="w-4 h-4" />
          {post ? 'Cập nhật' : 'Đăng bài'}
        </button>
      </div>
    </form>
  );
}
