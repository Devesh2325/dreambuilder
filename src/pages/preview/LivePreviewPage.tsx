import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { storage } from '../../services/storage';
import { DocumentModel } from '../../types/document';
import { CanvasNodeRenderer } from '../../editor/canvas/CanvasNodeRenderer';
import { 
  ArrowLeft, 
  RotateCcw, 
  Monitor, 
  Tablet, 
  Smartphone, 
  CheckCircle,
  ExternalLink
} from 'lucide-react';

export const LivePreviewPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<DocumentModel | null>(null);
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (documentId) {
      const doc = storage.getDocument(documentId);
      if (doc) setDocument(doc);
    }
  }, [documentId, key]);

  if (!document) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500 font-sans">
        <h3 className="text-sm font-semibold mb-2">Experience Not Found</h3>
        <button
          type="button"
          onClick={() => navigate('/projects')}
          className="text-xs text-indigo-600 font-semibold hover:underline"
        >
          Return to Projects
        </button>
      </div>
    );
  }

  const deviceWidths = {
    desktop: 'w-full max-w-6xl',
    tablet: 'w-[768px]',
    mobile: 'w-[375px]',
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Preview Bar */}
      <div className="h-12 bg-slate-900 text-white px-4 flex items-center justify-between z-50 text-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/editor/${document.id}`)}
            className="flex items-center gap-1.5 text-slate-300 hover:text-white font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Editor</span>
          </button>
          <div className="h-4 w-px bg-slate-700" />
          <span className="font-semibold text-white">{document.title}</span>
          <span className="bg-indigo-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded">
            Live Preview Mode
          </span>
        </div>

        {/* Device Switcher & Replay */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
            <button
              type="button"
              onClick={() => setDevice('desktop')}
              className={`p-1.5 rounded ${device === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDevice('tablet')}
              className={`p-1.5 rounded ${device === 'tablet' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDevice('mobile')}
              className={`p-1.5 rounded ${device === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setKey(k => k + 1)}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Experience</span>
          </button>
        </div>
      </div>

      {/* Main Preview Canvas */}
      <div className="flex-1 flex flex-col items-center p-8 overflow-auto">
        <div
          className={`${deviceWidths[device]} bg-white min-h-[700px] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative transition-all duration-200`}
        >
          <div className="w-full h-full p-6">
            <CanvasNodeRenderer node={document.rootNode} />
          </div>
        </div>
      </div>
    </div>
  );
};
