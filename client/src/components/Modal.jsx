import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg', footer = null }) {
  const contentRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      // Close modal on Escape key
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          onClose?.();
        }
      };

      // Forward mouse wheel events from outside/backdrop to modal scrollable content
      const handleWheel = (e) => {
        const allModalContents = document.querySelectorAll('[data-modal-content="true"]');
        const topmost = allModalContents[allModalContents.length - 1];

        if (topmost && topmost === contentRef.current) {
          if (!contentRef.current.contains(e.target)) {
            let delta = e.deltaY;
            if (e.deltaMode === 1) delta *= 16;
            else if (e.deltaMode === 2) delta *= contentRef.current.clientHeight;
            contentRef.current.scrollTop += delta;
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('wheel', handleWheel, { passive: true });

      return () => {
        document.body.style.overflow = originalOverflow || 'unset';
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('wheel', handleWheel);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalNode = (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center sm:items-center sm:p-4 overflow-hidden">
      {/* Full-bleed Backdrop covering top header & bottom nav completely */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog: Mobile Bottom-Sheet (slide up) & Desktop Centered Dialog */}
      <div 
        className={`relative bg-white dark:bg-[#18181f] border border-[#dedbd0] dark:border-[#2e2e38] rounded-t-[2rem] sm:rounded-3xl w-full ${maxWidth} max-h-[92dvh] sm:max-h-[calc(100dvh-3rem)] flex flex-col overflow-hidden z-10 animate-slide-up shadow-2xl text-left`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile Pull Handle Indicator */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 bg-[#edebe4] dark:bg-[#1f1f28] shrink-0 select-none">
          <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
        </div>

        {/* Header (Sticky / Non-shrinking / Never pushed out of screen) */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3 sm:py-3.5 border-b border-[#dedbd0] dark:border-[#2e2e38] bg-[#edebe4] dark:bg-[#1f1f28] shrink-0 select-none">
          <div className="text-sm sm:text-base font-bold text-[#18181b] dark:text-white min-w-0 flex-1 mr-2 truncate">
            {title}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white dark:bg-[#282834] flex items-center justify-center text-zinc-500 dark:text-zinc-300 hover:text-[#18181b] dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#323242] shadow-xs transition-all cursor-pointer shrink-0"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content (Scrollable with overscroll-contain) */}
        <div 
          ref={contentRef}
          data-modal-content="true"
          className="p-4 sm:p-6 overflow-y-auto flex-1 bg-white dark:bg-[#18181f] text-[#18181b] dark:text-zinc-100 overscroll-contain"
        >
          {children}
        </div>

        {/* Optional Footer (Sticky at bottom, safe-area padded for mobile home bar) */}
        {footer && (
          <div className="px-5 sm:px-6 py-3 sm:py-3.5 border-t border-[#dedbd0] dark:border-[#2e2e38] bg-[#edebe4]/95 dark:bg-[#1f1f28]/95 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : null;
}
