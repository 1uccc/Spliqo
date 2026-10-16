import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { lockBodyScroll, unlockBodyScroll } from '../utils/scrollLock';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
  footer = null
}) {
  const contentRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return;

    lockBodyScroll();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCloseRef.current?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      unlockBodyScroll();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalNode = (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 md:p-6 overflow-hidden">
      {/* 1. Backdrop: Smooth dark blur & fade without blocking gestures */}
      <div
        className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm animate-modal-backdrop cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 2. Dialog: Fixed bounded card (max-h 85vh on desktop), Spring Pop, sticky header + sticky footer */}
      <div
        className={`relative bg-white dark:bg-[#18181f] border border-[#dedbd0] dark:border-[#2e2e38] rounded-t-[2rem] sm:rounded-3xl w-full ${maxWidth} max-h-[90dvh] sm:max-h-[85vh] flex flex-col overflow-hidden z-10 animate-modal-pop shadow-2xl text-left`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile Pull Handle Bar */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 bg-[#edebe4] dark:bg-[#1e1e26] shrink-0 select-none">
          <div className="w-10 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
        </div>

        {/* Sticky Header: ALWAYS visible at top, never cut off */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-[#dedbd0] dark:border-[#2e2e38] bg-[#edebe4] dark:bg-[#1e1e26] shrink-0 select-none">
          <div className="min-w-0 flex-1 mr-2">
            {typeof title === 'string' ? (
              <h3 className="text-sm sm:text-base font-bold text-[#18181b] dark:text-white truncate">
                {title}
              </h3>
            ) : (
              title
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white dark:bg-[#282834] flex items-center justify-center text-zinc-500 dark:text-zinc-300 hover:text-[#18181b] dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#323242] shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
            title="Đóng (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body: Natural scroll with custom sleek thin scrollbar */}
        <div
          ref={contentRef}
          data-modal-content="true"
          className="p-4 sm:p-6 overflow-y-auto overflow-x-hidden flex-1 bg-white dark:bg-[#18181f] text-[#18181b] dark:text-zinc-100 custom-scrollbar overscroll-contain"
        >
          {children}
        </div>

        {/* Sticky Footer: ALWAYS visible at bottom, never cut off */}
        {footer && (
          <div className="px-5 sm:px-6 py-3 sm:py-3.5 border-t border-[#dedbd0] dark:border-[#2e2e38] bg-[#edebe4]/95 dark:bg-[#1e1e26]/95 backdrop-blur-sm shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : null;
}
