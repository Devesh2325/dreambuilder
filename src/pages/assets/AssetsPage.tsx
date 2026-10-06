import React, { useState } from 'react';
import { storage } from '../../services/storage';
import { Asset } from '../../types/modules';
import { 
  FolderOpen, 
  Upload, 
  Search, 
  Trash2, 
  Copy, 
  Check, 
  Image as ImageIcon, 
  FileCheck,
  Plus
} from 'lucide-react';

export const AssetsPage: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>(() => storage.getAssets());
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New asset upload modal state
  const [isUploading, setIsUploading] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newAlt, setNewAlt] = useState('');

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this asset?')) {
      storage.deleteAsset(id);
      setAssets(storage.getAssets());
    }
  };

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUrl.trim()) return;

    storage.addAsset(
      newName.trim(),
      newUrl.trim(),
      'image',
      350000,
      newAlt.trim() || newName.trim()
    );

    setAssets(storage.getAssets());
    setIsUploading(false);
    setNewName('');
    setNewUrl('');
    setNewAlt('');
  };

  const filtered = assets.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) || 
    a.altText.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 font-sans select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Media & Assets Library</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload, preview, and organize graphics, product screenshots, and icons across your experiences.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsUploading(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Asset</span>
        </button>
      </div>

      {/* Search & Storage Usage */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle p-4 flex items-center justify-between">
        <div className="relative w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search assets by name or alt text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          <span>Storage: <strong>1.4 MB</strong> / 10 GB (Unlimited CDN)</span>
        </div>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {filtered.map((ast) => (
          <div
            key={ast.id}
            className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-subtle hover:shadow-card transition-all flex flex-col group"
          >
            <div className="h-40 bg-slate-100 relative overflow-hidden flex items-center justify-center">
              <img src={ast.url} alt={ast.altText} className="w-full h-full object-cover" />
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-xs text-slate-900 truncate mb-1" title={ast.name}>
                  {ast.name}
                </h4>
                <p className="text-[11px] text-slate-400 truncate mb-3">
                  {(ast.sizeBytes / 1024).toFixed(0)} KB • {ast.type.toUpperCase()}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleCopyUrl(ast.url, ast.id)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  {copiedId === ast.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === ast.id ? 'Copied URL' : 'Copy URL'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(ast.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Asset"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Asset Modal */}
      {isUploading && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Upload Media Asset</h3>
            <form onSubmit={handleAddAsset} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Asset Name</label>
                <input
                  type="text"
                  placeholder="e.g. hero-screenshot.png"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Alt Text (Accessibility)</label>
                <input
                  type="text"
                  placeholder="Description of the image..."
                  value={newAlt}
                  onChange={(e) => setNewAlt(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploading(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm"
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
