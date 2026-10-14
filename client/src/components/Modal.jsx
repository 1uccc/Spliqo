import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg', footer = null }) {
  const contentRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';

      // Forward mouse wheel events from outside/backdrop to modal scrollable content
      const handleWheel = (e) => {
        const allModalContents = document.querySelectorAll('[data-modal-content="true"]');
        const topmost = allModalContents[allModalContents.length - 1];

        if (topmost && topmost === contentRef.current) {
          // If the cursor is outside the inner scrollable container (e.g. on backdrop, header, or outer padding)
          if (!contentRef.current.contains(e.target)) {
            let delta = e.deltaY;
            if (e.deltaMode === 1) {
              delta *= 16;
            } else if (e.deltaMode === 2) {
              delta *= contentRef.current.clientHeight;
            }
            contentRef.current.scrollTop += delta;
          }
        }
      };

      // Close modal on Escape key
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          onClose?.();
        }
      };

      window.addEventListener('wheel', handleWheel, { passive: true });
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('wheel', handleWheel);
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 p-2 sm:p-4 md:p-6 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity cursor-pointer"
        onClick={onClose}
      />

      {/* Modal Dialog (Max-height constrained to viewport, inner scrollable, never cut off) */}
      <div 
        className={`relative bg-white dark:bg-[#18181f] border border-[#dedbd0] dark:border-[#2e2e38] rounded-3xl sm:rounded-[2.25rem] w-full ${maxWidth} max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-3rem)] flex flex-col overflow-hidden z-10 animate-slide-up shadow-2xl text-left`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Sticky / Non-shrinking) */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-[#dedbd0] dark:border-[#2e2e38] bg-[#edebe4] dark:bg-[#1f1f28] shrink-0 select-none">
          <h3 className="text-sm sm:text-base font-bold text-[#18181b] dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white dark:bg-[#282834] flex items-center justify-center text-zinc-500 dark:text-zinc-300 hover:text-[#18181b] dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#323242] shadow-xs transition-all cursor-pointer"
            title="Đóng (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div 
          ref={contentRef}
          data-modal-content="true"
          className="p-4 sm:p-6 overflow-y-auto flex-1 bg-white dark:bg-[#18181f] text-[#18181b] dark:text-zinc-100 overscroll-contain"
        >
          {children}
        </div>

        {/* Optional Footer (Pinned at bottom, non-shrinking) */}
        {footer && (
          <div className="px-5 sm:px-6 py-3.5 border-t border-[#dedbd0] dark:border-[#2e2e38] bg-[#edebe4]/90 dark:bg-[#1f1f28] shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
