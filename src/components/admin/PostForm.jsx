import { useState, useRef, useEffect } from 'react';
import { 
  Save, X, Image, FileText, Tag, AlignLeft, Upload, Loader2, Trash2, 
  Bold, Italic, Underline, Heading2, Heading3, List, ListOrdered, Link,
  AlignCenter, AlignRight, AlignJustify, Palette, Eye, Code, Eraser, Heading1, Undo, Redo
} from 'lucide-react';

const CATEGORIES = ['Thông báo', 'Tin tức', 'Hướng dẫn', 'Tuyển sinh', 'Sự kiện', 'Học bổng'];

// Helper to convert Markdown to HTML for visual editor contentEditable
function markdownToHtml(markdown) {
  if (!markdown) return '';
  
  // Basic HTML escaping for safety
  let html = markdown
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Convert bold **text** or __text__
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // Convert italic *text* or _text_
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');

  // Convert links [text](url)
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #C8A951; text-decoration: underline;">$1</a>');

  // Convert headers
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

  // Process list blocks and paragraph spacing
  let lines = html.split('\n');
  let inUl = false;
  let inOl = false;
  let processedLines = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inUl) {
        if (inOl) { processedLines.push('</ol>'); inOl = false; }
        processedLines.push('<ul style="list-style-type: disc; padding-left: 20px; margin-bottom: 12px;">');
        inUl = true;
      }
      processedLines.push(`<li>${line.substring(2)}</li>`);
    } else if (/^\d+\.\s/.test(line)) {
      if (!inOl) {
        if (inUl) { processedLines.push('</ul>'); inUl = false; }
        processedLines.push('<ol style="list-style-type: decimal; padding-left: 20px; margin-bottom: 12px;">');
        inOl = true;
      }
      const match = line.match(/^\d+\.\s(.*)/);
      processedLines.push(`<li>${match ? match[1] : line}</li>`);
    } else {
      if (inUl) { processedLines.push('</ul>'); inUl = false; }
      if (inOl) { processedLines.push('</ol>'); inOl = false; }
      
      if (line !== '') {
        if (!line.startsWith('<h') && !line.startsWith('</h') && !line.startsWith('<ul') && !line.startsWith('<ol') && !line.startsWith('<li') && !line.startsWith('<p')) {
          processedLines.push(`<p style="margin-bottom: 8px; line-height: 1.6;">${line}</p>`);
        } else {
          processedLines.push(line);
        }
      } else {
        processedLines.push('<p><br></p>');
      }
    }
  }
  
  if (inUl) processedLines.push('</ul>');
  if (inOl) processedLines.push('</ol>');

  return processedLines.join('\n');
}

// Helper to convert HTML from visual editor to Markdown for database storage
function htmlToMarkdown(html) {
  if (!html) return '';

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  let markdown = '';

  function serialize(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const nodeName = node.nodeName.toLowerCase();
    let childrenContent = '';

    for (let child of node.childNodes) {
      childrenContent += serialize(child);
    }

    switch (nodeName) {
      case 'p':
        return childrenContent.trim() ? `\n\n${childrenContent.trim()}\n\n` : '';
      case 'div':
        if (node.innerHTML === '<br>' || node.innerHTML === '') {
          return '\n';
        }
        return childrenContent.trim() ? `\n${childrenContent.trim()}\n` : '';
      case 'strong':
      case 'b':
        return childrenContent.trim() ? `**${childrenContent}**` : childrenContent;
      case 'em':
      case 'i':
        return childrenContent.trim() ? `*${childrenContent}*` : childrenContent;
      case 'h1':
        return `\n\n# ${childrenContent.trim()}\n\n`;
      case 'h2':
        return `\n\n## ${childrenContent.trim()}\n\n`;
      case 'h3':
        return `\n\n### ${childrenContent.trim()}\n\n`;
      case 'ul':
        let ulContent = '';
        for (let childNode of node.childNodes) {
          if (childNode.nodeType === Node.ELEMENT_NODE && childNode.nodeName.toLowerCase() === 'li') {
            ulContent += `\n- ${serialize(childNode).trim()}`;
          }
        }
        return `\n${ulContent}\n`;
      case 'ol':
        let olContent = '';
        let index = 1;
        for (let childNode of node.childNodes) {
          if (childNode.nodeType === Node.ELEMENT_NODE && childNode.nodeName.toLowerCase() === 'li') {
            olContent += `\n${index++}. ${serialize(childNode).trim()}`;
          }
        }
        return `\n${olContent}\n`;
      case 'li':
        return childrenContent;
      case 'a':
        let href = node.getAttribute('href') || '#';
        return `[${childrenContent}](${href})`;
      case 'br':
        return '\n';
      default:
        return childrenContent;
    }
  }

  for (let child of tempDiv.childNodes) {
    markdown += serialize(child);
  }

  return markdown
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\n\s+\n/g, '\n\n')
    .trim();
}

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

  const [editorMode, setEditorMode] = useState('visual'); // 'visual' | 'markdown'
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const visualEditorRef = useRef(null);
  const savedRangeRef = useRef(null);

  // Helper to save selection range inside contentEditable
  const saveRange = () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      // Verify selection is within our editor
      if (visualEditorRef.current && visualEditorRef.current.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range;
      }
    }
  };

  // Helper to restore selection range back to contentEditable
  const restoreRange = () => {
    if (savedRangeRef.current) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(savedRangeRef.current);
    }
  };

  // Sync content to contentEditable on mount or when post changes
  useEffect(() => {
    if (editorMode === 'visual' && visualEditorRef.current) {
      visualEditorRef.current.innerHTML = markdownToHtml(form.content);
    }
  }, [post]);

  const handleVisualChange = () => {
    if (visualEditorRef.current) {
      const html = visualEditorRef.current.innerHTML;
      const md = htmlToMarkdown(html);
      setForm(prev => ({ ...prev, content: md }));
    }
  };

  const switchToVisual = () => {
    if (editorMode === 'visual') return;
    setEditorMode('visual');
    setTimeout(() => {
      if (visualEditorRef.current) {
        visualEditorRef.current.innerHTML = markdownToHtml(form.content);
      }
    }, 50);
  };

  const switchToMarkdown = () => {
    if (editorMode === 'markdown') return;
    if (visualEditorRef.current) {
      const html = visualEditorRef.current.innerHTML;
      const md = htmlToMarkdown(html);
      setForm(prev => ({ ...prev, content: md }));
    }
    setEditorMode('markdown');
  };

  const runCommand = (command, arg = null) => {
    if (editorMode !== 'visual') return;
    if (visualEditorRef.current) {
      visualEditorRef.current.focus();
    }
    restoreRange();
    document.execCommand(command, false, arg);
    saveRange();
    handleVisualChange();
  };

  const insertLink = () => {
    saveRange();
    const url = prompt('Nhập liên kết (URL):', 'https://');
    if (url) {
      if (visualEditorRef.current) {
        visualEditorRef.current.focus();
      }
      restoreRange();
      document.execCommand('createLink', false, url);
      saveRange();
      handleVisualChange();
    }
  };

  const insertFormat = (type) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let replacement = '';
    let cursorOffset = 0;

    switch (type) {
      case 'bold':
        replacement = `**${selectedText || 'chữ_in_đậm'}**`;
        cursorOffset = selectedText ? 0 : 2;
        break;
      case 'italic':
        replacement = `*${selectedText || 'chữ_in_nghiêng'}*`;
        cursorOffset = selectedText ? 0 : 1;
        break;
      case 'h2':
        replacement = `\n## ${selectedText || 'Tiêu đề nhóm'}\n`;
        cursorOffset = selectedText ? 0 : 0;
        break;
      case 'h3':
        replacement = `\n### ${selectedText || 'Tiêu đề phụ'}\n`;
        cursorOffset = selectedText ? 0 : 0;
        break;
      case 'ul':
        replacement = `\n- ${selectedText || 'Mục danh sách'}`;
        break;
      case 'ol':
        replacement = `\n1. ${selectedText || 'Mục danh sách'}`;
        break;
      case 'link':
        replacement = `[${selectedText || 'Tên liên kết'}](https://vinhuni.edu.vn)`;
        cursorOffset = selectedText ? 0 : 1;
        break;
      default:
        return;
    }

    const newContent = text.substring(0, start) + replacement + text.substring(end);
    setForm(prev => ({ ...prev, content: newContent }));

    // Refocus and place cursor
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + replacement.length - cursorOffset;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let finalContent = form.content;
    if (editorMode === 'visual' && visualEditorRef.current) {
      finalContent = htmlToMarkdown(visualEditorRef.current.innerHTML);
    }
    onSave({
      ...form,
      content: finalContent,
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
        <div className="flex justify-between items-center mb-1.5">
          <label className={labelClass}>Nội dung bài viết</label>
          <div className="flex bg-[#0A1931]/60 p-0.5 rounded-lg border border-white/10 text-xs">
            <button
              type="button"
              onClick={switchToVisual}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${editorMode === 'visual' ? 'bg-[#C8A951] text-white font-semibold shadow-sm' : 'text-white/60 hover:text-white'}`}
            >
              <FileText className="w-3.5 h-3.5" />
              Soạn thảo Word
            </button>
            <button
              type="button"
              onClick={switchToMarkdown}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${editorMode === 'markdown' ? 'bg-[#C8A951] text-white font-semibold shadow-sm' : 'text-white/60 hover:text-white'}`}
            >
              <Code className="w-3.5 h-3.5" />
              Mã Markdown
            </button>
          </div>
        </div>

        <div className="border border-white/10 rounded-xl overflow-hidden bg-[#0A1931] flex flex-col">
          {editorMode === 'visual' ? (
            <>
              {/* Word Style Toolbar */}
              <div className="flex flex-wrap items-center gap-1 px-3 py-2 bg-white/5 border-b border-white/10 select-none">
                {/* Undo / Redo */}
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => runCommand('undo')}
                  title="Hoàn tác (Ctrl+Z)"
                  className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  <Undo className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => runCommand('redo')}
                  title="Làm lại (Ctrl+Y)"
                  className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  <Redo className="w-4 h-4" />
                </button>
                
                <div className="w-px h-5 bg-white/10 mx-1" />

                {/* Heading dropdown */}
                <select
                  onChange={(e) => runCommand('formatBlock', e.target.value)}
                  defaultValue="<p>"
                  className="bg-[#0A1931] text-white/80 border border-white/10 rounded px-2 py-1 text-xs focus:outline-none cursor-pointer"
                >
                  <option value="<p>">Văn bản thường</option>
                  <option value="<h1>">Tiêu đề lớn 1</option>
                  <option value="<h2>">Tiêu đề lớn 2</option>
                  <option value="<h3>">Tiêu đề phụ 3</option>
                </select>

                <div className="w-px h-5 bg-white/10 mx-1" />

                {/* Bold, Italic, Underline */}
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => runCommand('bold')}
                  title="Bôi đậm (Ctrl+B)"
                  className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => runCommand('italic')}
                  title="In nghiêng (Ctrl+I)"
                  className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => runCommand('underline')}
                  title="Gạch chân (Ctrl+U)"
                  className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  <Underline className="w-4 h-4" />
                </button>

                <div className="w-px h-5 bg-white/10 mx-1" />

                {/* Alignment */}
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => runCommand('justifyLeft')}
                  title="Căn lề trái"
                  className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => runCommand('justifyCenter')}
                  title="Căn giữa"
                  className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  <AlignCenter className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => runCommand('justifyRight')}
                  title="Căn lề phải"
                  className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  <AlignRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => runCommand('justifyFull')}
                  title="Căn đều 2 bên"
                  className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  <AlignJustify className="w-4 h-4" />
                </button>

                <div className="w-px h-5 bg-white/10 mx-1" />

                {/* Color Palette */}
                <div className="relative group flex items-center">
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    title="Chọn màu chữ"
                    className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Palette className="w-4 h-4" />
                  </button>
                  <div className="absolute top-full left-0 mt-1 hidden group-hover:flex bg-[#0A1931] border border-white/15 rounded-xl p-2 shadow-xl z-20 gap-1.5">
                    {[
                      { hex: '#FFFFFF', label: 'Trắng' },
                      { hex: '#C8A951', label: 'Vàng Gold' },
                      { hex: '#94A3B8', label: 'Xám nhạt' },
                      { hex: '#EF4444', label: 'Đỏ' },
                      { hex: '#3B82F6', label: 'Xanh dương' },
                      { hex: '#10B981', label: 'Xanh lá' },
                    ].map(item => (
                      <button
                        key={item.hex}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => runCommand('foreColor', item.hex)}
                        title={item.label}
                        className="w-5 h-5 rounded-full border border-white/20 hover:scale-110 transition-transform cursor-pointer"
                        style={{ backgroundColor: item.hex }}
                      />
                    ))}
                  </div>
                </div>

                <div className="w-px h-5 bg-white/10 mx-1" />

                {/* Lists */}
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => runCommand('insertUnorderedList')}
                  title="Danh sách dấu chấm"
                  className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => runCommand('insertOrderedList')}
                  title="Danh sách đánh số"
                  className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  <ListOrdered className="w-4 h-4" />
                </button>

                <div className="w-px h-5 bg-white/10 mx-1" />

                {/* Link & Eraser */}
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={insertLink}
                  title="Chèn liên kết URL"
                  className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  <Link className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => runCommand('removeFormat')}
                  title="Xóa định dạng"
                  className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  <Eraser className="w-4 h-4" />
                </button>
              </div>

              {/* Rich-Text contentEditable container */}
              <div 
                ref={visualEditorRef}
                contentEditable
                onInput={handleVisualChange}
                onBlur={() => {
                  saveRange();
                  handleVisualChange();
                }}
                onMouseUp={saveRange}
                onKeyUp={saveRange}
                className="w-full bg-[#081528] px-5 py-4 text-sm text-white placeholder:text-white/30 focus:outline-none min-h-[300px] overflow-y-auto max-h-[500px] leading-relaxed font-inter select-text"
                style={{ outline: 'none' }}
                placeholder="Nhập nội dung bài viết giống như soạn thảo văn bản Word..."
              />
            </>
          ) : (
            <>
              {/* Original Toolbar for Raw Markdown */}
              <div className="flex items-center gap-1 px-3 py-2 bg-white/5 border-b border-white/10 select-none">
                <button
                  type="button"
                  onClick={() => insertFormat('bold')}
                  title="Bôi đậm"
                  className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormat('italic')}
                  title="In nghiêng"
                  className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-white/10 mx-1" />
                <button
                  type="button"
                  onClick={() => insertFormat('h2')}
                  title="Tiêu đề lớn (H2)"
                  className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  <Heading2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormat('h3')}
                  title="Tiêu đề nhỏ (H3)"
                  className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  <Heading3 className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-white/10 mx-1" />
                <button
                  type="button"
                  onClick={() => insertFormat('ul')}
                  title="Danh sách dấu chấm"
                  className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormat('ol')}
                  title="Danh sách số"
                  className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  <ListOrdered className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-white/10 mx-1" />
                <button
                  type="button"
                  onClick={() => insertFormat('link')}
                  title="Thêm liên kết"
                  className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  <Link className="w-4 h-4" />
                </button>
              </div>
              
              <textarea
                ref={textareaRef}
                className="w-full bg-transparent border-0 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-0 resize-none font-mono text-xs leading-relaxed min-h-[300px]"
                rows={10}
                placeholder={"Viết nội dung chi tiết bằng mã Markdown..."}
                value={form.content}
                onChange={e => setForm({...form, content: e.target.value})}
                required
              />
            </>
          )}
        </div>
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
