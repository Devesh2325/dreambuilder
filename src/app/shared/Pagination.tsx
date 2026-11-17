import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number; // 0-indexed
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageChange: (newPage: number) => void;
  onPageSizeChange?: (newPageSize: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 20,
  pageSizeOptions = [10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,
  className = '',
}) => {
  const [jumpInput, setJumpInput] = useState('');

  // Only hide pagination when there are literally 0 items
  if (totalItems === 0) {
    return null;
  }

  const startItem = totalItems !== undefined ? currentPage * pageSize + 1 : null;
  const endItem = totalItems !== undefined ? Math.min((currentPage + 1) * pageSize, totalItems) : null;

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPage = parseInt(jumpInput.trim(), 10);
    if (!isNaN(targetPage) && targetPage >= 1 && targetPage <= totalPages) {
      onPageChange(targetPage - 1);
      setJumpInput('');
    }
  };

  // Generate page numbers with ellipses
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const delta = 1; // pages before and after current

    const left = Math.max(1, currentPage + 1 - delta);
    const right = Math.min(totalPages, currentPage + 1 + delta);

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= left && i <= right)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  };

  const navButtonClass =
    'p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer';

  return (
    <div
      aria-label="Pagination Navigation"
      className={`sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 ${className}`}
    >
      {/* 1. Item summary */}
      <div className="flex items-center gap-2">
        {totalItems !== undefined && startItem && endItem ? (
          <span>
            Showing <strong className="font-semibold text-slate-900 dark:text-white">{startItem}</strong> to{' '}
            <strong className="font-semibold text-slate-900 dark:text-white">{endItem}</strong> of{' '}
            <strong className="font-semibold text-slate-900 dark:text-white">{totalItems}</strong> items
          </span>
        ) : (
          <span>
            Page <strong className="font-semibold text-slate-900 dark:text-white">{currentPage + 1}</strong> of{' '}
            <strong className="font-semibold text-slate-900 dark:text-white">{totalPages}</strong>
          </span>
        )}

        {/* Page size select */}
        {onPageSizeChange && pageSizeOptions.length > 0 && (
          <div className="flex items-center gap-1.5 ml-3 pl-3 border-l border-slate-200 dark:border-slate-700">
            <span className="text-slate-400">Rows:</span>
            <select
              aria-label="Items per page"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="py-1 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold cursor-pointer focus:ring-1 focus:ring-indigo-500"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / page
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 2. Navigation controls */}
      <div className="flex flex-wrap items-center gap-1.5 ml-auto">
        {/* First & Prev */}
        <button
          type="button"
          onClick={() => onPageChange(0)}
          disabled={currentPage === 0}
          title="First page"
          aria-label="First page"
          className={navButtonClass}
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          title="Previous page"
          aria-label="Previous page"
          className={navButtonClass}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1 mx-1">
          {getPageNumbers().map((p, idx) =>
            typeof p === 'number' ? (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p - 1)}
                aria-label={`Page ${p}`}
                aria-current={currentPage === p - 1 ? 'page' : undefined}
                className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  currentPage === p - 1
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {p}
              </button>
            ) : (
              <span key={`dots-${idx}`} className="px-1 text-slate-400 select-none">
                ...
              </span>
            )
          )}
        </div>

        {/* Next & Last */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          title="Next page"
          aria-label="Next page"
          className={navButtonClass}
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(totalPages - 1)}
          disabled={currentPage >= totalPages - 1}
          title="Last page"
          aria-label="Last page"
          className={navButtonClass}
        >
          <ChevronsRight className="w-4 h-4" />
        </button>

        {/* 3. Jump to page */}
        <form onSubmit={handleJump} className="flex items-center gap-1 ml-2 pl-2 border-l border-slate-200 dark:border-slate-700">
          <span className="text-slate-400">Go to:</span>
          <input
            type="number"
            min={1}
            max={Math.max(1, totalPages)}
            placeholder="#"
            value={jumpInput}
            disabled={totalPages <= 1}
            onChange={(e) => setJumpInput(e.target.value)}
            aria-label="Jump to page"
            className="w-12 h-7 px-1.5 text-center text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={totalPages <= 1 || !jumpInput.trim() || Number(jumpInput) < 1 || Number(jumpInput) > totalPages}
            className="h-7 px-2 text-xs font-bold rounded-lg bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/40 text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            Jump
          </button>
        </form>
      </div>
    </div>
  );
};
