import { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, FileText, Loader2, FileCheck } from 'lucide-react';

export default function DocumentsTab({ role }) {
  const [docs, setDocs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef();

  const token = localStorage.getItem('heulwen_token');
  const authHeader = { Authorization: `Bearer ${token}` };

  const fetchDocs = async () => {
    const res = await fetch('/api/documents', { headers: authHeader });
    if (res.ok) setDocs(await res.json());
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: authHeader,
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Upload thất bại');
      }
      await fetchDocs();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Xóa tài liệu "${name}"?`)) return;
    const res = await fetch(`/api/documents/${id}`, {
      method: 'DELETE',
      headers: authHeader,
    });
    if (res.ok) fetchDocs();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-playfair text-2xl font-bold text-white">Tài liệu AI</h1>
          <p className="font-inter text-sm text-white/50 mt-1">
            Upload tài liệu để chatbot Heulwen học và trả lời chính xác hơn
          </p>
        </div>
        <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-inter font-semibold text-sm cursor-pointer transition-all
          ${uploading ? 'bg-white/20 text-white/50 cursor-not-allowed' : 'bg-[#C8A951] text-white hover:bg-[#b8953f]'}`}>
          {uploading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</>
            : <><Upload className="w-4 h-4" /> Upload tài liệu</>
          }
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            className="hidden"
            disabled={uploading}
            onChange={handleUpload}
          />
        </label>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-500/20 border border-red-400/30 rounded-xl font-inter text-sm text-red-300">
          {error}
        </div>
      )}

      <p className="font-inter text-xs text-white/40 mb-4">
        Hỗ trợ: .pdf, .docx, .txt — Lần đầu upload có thể mất vài giây để xử lý
      </p>

      {docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-2xl border border-white/10">
          <FileText className="w-12 h-12 text-white/20 mb-3" />
          <p className="font-inter text-white/40 text-sm">Chưa có tài liệu nào</p>
          <p className="font-inter text-white/25 text-xs mt-1">Upload PDF, DOCX hoặc TXT để bắt đầu</p>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-4 bg-white/10 rounded-xl px-4 py-3 border border-white/10">
              <FileCheck className="w-5 h-5 text-[#C8A951] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-inter font-medium text-white text-sm truncate">{doc.original_name}</p>
                <p className="font-inter text-xs text-white/40">
                  {doc.chunk_count} đoạn · {new Date(doc.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </p>
              </div>
              {role === 'admin' && (
                <button
                  onClick={() => handleDelete(doc.id, doc.original_name)}
                  className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
