import { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, FileText, Loader2, FileCheck, Eye } from 'lucide-react';

export default function DocumentsTab({ role }) {
  const [docs, setDocs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [outdatedDoc, setOutdatedDoc] = useState(null);
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
    setOutdatedDoc(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: authHeader,
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || data.detail || 'Upload thất bại');
      }
      
      if (data.is_outdated) {
        setOutdatedDoc(data);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-playfair text-2xl font-bold text-white">Tài liệu AI</h1>
          <p className="font-inter text-sm text-white/50 mt-1">
            Upload tài liệu để chatbot Heulwen học và trả lời chính xác hơn
          </p>
        </div>
        <label className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-inter font-semibold text-sm cursor-pointer transition-all shrink-0
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

      {outdatedDoc && (
        <div className="mb-4 px-4 py-3 bg-amber-500/20 border border-amber-400/30 rounded-xl font-inter text-sm text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>
              <strong>Lưu ý:</strong> Tài liệu <strong>"{outdatedDoc.original_name}"</strong> được xác định ban hành ngày <strong>{outdatedDoc.issued_at}</strong>, cũ hơn tài liệu mới nhất hiện có trong hệ thống.
            </span>
          </div>
          <button onClick={() => setOutdatedDoc(null)} className="text-amber-200 hover:text-white font-bold text-xs shrink-0 ml-2">×</button>
        </div>
      )}

      <p className="font-inter text-xs text-white/40 mb-4">
        Hỗ trợ: .pdf, .docx, .txt — Lần đầu upload có thể mất vài giây để xử lý và vector hóa
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
            <div key={doc.id} className={`flex items-center gap-4 bg-white/10 rounded-xl px-4 py-3 border transition-colors ${doc.is_outdated ? 'border-amber-500/20 bg-amber-500/5' : 'border-white/10'}`}>
              <FileCheck className={`w-5 h-5 shrink-0 ${doc.is_outdated ? 'text-amber-400' : 'text-[#C8A951]'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-inter font-medium text-white text-sm truncate">{doc.original_name}</p>
                  {doc.is_outdated && (
                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] px-2.5 py-0.5 rounded-full font-bold font-mono">
                      ⚠️ Tài liệu cũ
                    </span>
                  )}
                </div>
                <p className="font-inter text-xs text-white/40 mt-1">
                  {doc.chunk_count} đoạn · Ngày ban hành: {doc.issued_at ? new Date(doc.issued_at).toLocaleDateString('vi-VN') : 'N/A'} (Tải lên: {new Date(doc.created_at).toLocaleDateString('vi-VN')})
                </p>
              </div>
              <div className="flex items-center gap-1">
                <a
                  href={`/document/${doc.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-lg text-white/40 hover:text-[#C8A951] hover:bg-white/5 transition-colors"
                  title="Xem trực tuyến"
                >
                  <Eye className="w-4.5 h-4.5" />
                </a>
                {role === 'admin' && (
                  <button
                    onClick={() => handleDelete(doc.id, doc.original_name)}
                    className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    title="Xóa tài liệu"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
