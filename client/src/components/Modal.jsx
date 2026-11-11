import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { lockBodyScroll, unlockBodyScroll } from '../utils/scrollLock';
import { useLanguage } from '../contexts/LanguageContext';

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
  footer = null
}) {
  const { t } = useLanguage();
  const titleId = useId();
  const dialogRef = useRef(null);
  const contentRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return;

    const previousFocus = document.activeElement;
    lockBodyScroll();

    const rafId = window.requestAnimationFrame(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      if (!dialog.contains(document.activeElement)) {
        const firstFocusable = dialog.querySelector(FOCUSABLE_SELECTOR);
        if (firstFocusable instanceof HTMLElement) {
          firstFocusable.focus({ preventScroll: true });
        } else {
          dialog.focus({ preventScroll: true });
        }
      }
    });

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current?.();
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = Array.from(dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
          (el) => el instanceof HTMLElement && el.offsetParent !== null
        );
        if (focusables.length === 0) {
          e.preventDefault();
          dialogRef.current.focus();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && (document.activeElement === first || !dialogRef.current.contains(document.activeElement))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', handleKeyDown);
      unlockBodyScroll();
      if (previousFocus instanceof HTMLElement && typeof previousFocus.focus === 'function') {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const closeLabel = t('closeModal', 'Đóng (ESC)');

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
        ref={dialogRef}
        tabIndex={-1}
        className={`relative bg-white dark:bg-[#18181f] border border-[#dedbd0] dark:border-[#2e2e38] rounded-t-[2rem] sm:rounded-3xl w-full ${maxWidth} max-h-[90dvh] sm:max-h-[85vh] flex flex-col overflow-hidden z-10 animate-modal-pop shadow-2xl text-left focus:outline-none`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
      >
        {/* Mobile Pull Handle Bar */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 bg-[#edebe4] dark:bg-[#1e1e26] shrink-0 select-none">
          <div className="w-10 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600" />
        </div>

        {/* Sticky Header: ALWAYS visible at top, never cut off */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-[#dedbd0] dark:border-[#2e2e38] bg-[#edebe4] dark:bg-[#1e1e26] shrink-0 select-none">
          <div className="min-w-0 flex-1 mr-2">
            {typeof title === 'string' ? (
              <h3 id={titleId} className="text-sm sm:text-base font-bold text-[#18181b] dark:text-white truncate">
                {title}
              </h3>
            ) : (
              <div id={titleId}>{title}</div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="w-9 h-9 rounded-full bg-white dark:bg-[#282834] flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-[#18181b] dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#323242] shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
            title={closeLabel}
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
