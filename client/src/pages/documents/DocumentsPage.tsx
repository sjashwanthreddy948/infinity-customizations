import React, { useState, useEffect } from 'react';
import { FolderLock, UploadCloud, FileText, Download, Paperclip, Check, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { useWebSocket } from '../../context/WebSocketContext.js';

export const DocumentsPage: React.FC = () => {
  const { token, user, business } = useAuth();
  const { success, error } = useToast();
  const { refreshTrigger } = useWebSocket();

  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Receipt');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchDocs = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/documents', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setDocs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [token, refreshTrigger]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      error('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title || file.name);
      formData.append('category', category);

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      success('Document uploaded successfully!', file.name);
      setFile(null);
      setTitle('');
      fetchDocs();
    } catch (err: any) {
      error(err.message || 'Error uploading document');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Documents & Receipts Vault
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Isolated business file repository ({business?.id?.slice(0, 8)}/...)
          </p>
        </div>
      </div>

      {/* Upload Box */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Upload Business Document or Receipt</h3>
        <form onSubmit={handleUpload} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Title / Description</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Studio Lease Agreement or Server Bill"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
            >
              <option value="Receipt">Expense Receipt</option>
              <option value="Contract">Client Contract / NDA</option>
              <option value="Tax">Tax / GST Document</option>
              <option value="Bank">Bank Confirmation</option>
              <option value="General">General Document</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">File (PDF, PNG, JPG)</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-950/50 dark:file:text-brand-300"
            />
          </div>

          <button
            type="submit"
            disabled={isUploading || !file}
            className="w-full py-2 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md shadow-brand-600/20 disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : 'Upload File'}
          </button>
        </form>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 p-8 text-center text-xs text-slate-400">Loading vault documents...</div>
        ) : docs.length === 0 ? (
          <div className="col-span-3 p-12 text-center text-xs text-slate-400 bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            No documents in vault yet. Upload receipts and contracts above.
          </div>
        ) : (
          docs.map((doc: any) => (
            <div
              key={doc.id}
              className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400">
                    {doc.category}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate" title={doc.title}>
                  {doc.title}
                </h4>
                <p className="text-xs text-slate-500 truncate mt-0.5">{doc.file_name}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-400">
                  By {doc.uploaded_by_name} • {new Date(doc.created_at).toLocaleDateString()}
                </span>
                <a
                  href={doc.file_path}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:underline font-semibold text-xs"
                >
                  <Eye className="w-3.5 h-3.5" /> View
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
