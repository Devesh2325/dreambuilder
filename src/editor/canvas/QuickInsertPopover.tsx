import React, { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import { createNodeFromType, createMultiColumnNode } from '../utils/dragDropUtils';
import { 
  Plus, 
  Type, 
  Heading as HeadingIcon, 
  MousePointerClick, 
  LayoutGrid, 
  Image as ImageIcon, 
  HelpCircle, 
  Sparkles, 
  Columns, 
  MessageSquare,
  X
} from 'lucide-react';

interface Props {
  parentId: string;
  targetIndex: number;
}

const QUICK_BLOCKS = [
  { type: 'Heading', name: 'Heading', icon: HeadingIcon, desc: 'Large title text' },
  { type: 'Text', name: 'Paragraph', icon: Type, desc: 'Body copy text' },
  { type: 'Button', name: 'Button CTA', icon: MousePointerClick, desc: 'Action trigger' },
  { type: 'Card', name: 'Card Container', icon: LayoutGrid, desc: 'Bordered card' },
  { type: 'Columns2', name: '2 Columns', icon: Columns, desc: '50/50 flex split', isCols: 2 },
  { type: 'Columns3', name: '3 Columns', icon: Columns, desc: '1/3 flex grid', isCols: 3 },
  { type: 'Image', name: 'Image', icon: ImageIcon, desc: 'Media block' },
  { type: 'FaqWidget', name: 'FAQ Accordion', icon: HelpCircle, desc: 'Expandable QA' },
  { type: 'Banner', name: 'Announcement', icon: Sparkles, desc: 'Alert banner' },
];

export const QuickInsertPopover: React.FC<Props> = ({ parentId, targetIndex }) => {
  const { insertNode, isPreviewMode } = useEditorStore();
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (isPreviewMode) return null;

  const handleSelect = (item: typeof QUICK_BLOCKS[0]) => {
    if (item.isCols) {
      const flexNode = createMultiColumnNode(item.isCols);
      insertNode(parentId, flexNode, targetIndex);
    } else {
      const newNode = createNodeFromType(item.type);
      if (newNode) {
        insertNode(parentId, newNode, targetIndex);
      }
    }
    setIsOpen(false);
  };

  return (
    <div className="relative w-full py-1 group/quick flex items-center justify-center select-none z-20">
      {/* Subtle In-between Insertion Line on Hover */}
      <div className={`w-full h-0.5 transition-all duration-150 ${
        isOpen 
          ? 'bg-indigo-500' 
          : 'bg-transparent group-hover/quick:bg-indigo-400/60 dark:group-hover/quick:bg-indigo-500/50'
      }`} />

      {/* Centered '+' Trigger Pill */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`absolute z-30 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md transition-all duration-150 ${
          isOpen
            ? 'bg-indigo-600 text-white scale-105 ring-2 ring-indigo-300 dark:ring-indigo-700'
            : 'opacity-0 group-hover/quick:opacity-100 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-200 dark:border-indigo-800'
        }`}
        title="Quick Insert Block Here"
      >
        <Plus className="w-3 h-3" />
        <span>Insert</span>
      </button>

      {/* Quick Insert Popover Menu */}
      {isOpen && (
        <div
          ref={popoverRef}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-6 z-50 w-72 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-150 font-sans"
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Quick Add Block
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-0.5">
            {QUICK_BLOCKS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="flex items-start gap-2 p-2 rounded-xl text-left hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800/80 transition-colors group"
                >
                  <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-600 group-hover:text-white text-slate-500 dark:text-slate-400 shrink-0 transition-colors">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-bold block truncate leading-tight">
                      {item.name}
                    </span>
                    <span className="text-[9px] text-slate-400 block truncate leading-tight mt-0.5">
                      {item.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
