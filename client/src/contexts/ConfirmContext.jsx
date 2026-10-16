import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, AlertTriangle, Info, X } from 'lucide-react';

import { lockBodyScroll, unlockBodyScroll } from '../utils/scrollLock';
import { useLanguage } from './LanguageContext';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const { isEn } = useLanguage();
  const [config, setConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Xác nhận',
    cancelText: 'Hủy bỏ',
    type: 'danger', // 'danger' | 'warning' | 'info'
    icon: null,
  });

  const resolverRef = useRef(null);

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      const defaultTitle = isEn ? 'Confirm Action' : 'Xác nhận thao tác';
      const defaultMessage = isEn ? 'Are you sure you want to proceed with this action?' : 'Bạn có chắc chắn muốn thực hiện thao tác này?';
      const defaultConfirm = options.type === 'danger' || options.type === undefined 
        ? (isEn ? 'Confirm Delete' : 'Xác nhận xóa') 
        : (isEn ? 'Confirm' : 'Xác nhận');
      const defaultCancel = isEn ? 'Cancel' : 'Hủy bỏ';

      setConfig({
        isOpen: true,
        title: options.title || defaultTitle,
        message: options.message || defaultMessage,
        confirmText: options.confirmText || defaultConfirm,
        cancelText: options.cancelText || defaultCancel,
        type: options.type || 'danger',
        icon: options.icon || null,
      });
    });
  }, [isEn]);

  const handleConfirm = useCallback(() => {
    resolverRef.current?.(true);
    resolverRef.current = null;
    setConfig((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleCancel = useCallback(() => {
    resolverRef.current?.(false);
    resolverRef.current = null;
    setConfig((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleCancelRef = useRef(handleCancel);
  useEffect(() => {
    handleCancelRef.current = handleCancel;
  });

  // Keyboard accessibility (Escape key to cancel) & coordinated scroll lock
  useEffect(() => {
    if (!config.isOpen) return;

    lockBodyScroll();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleCancelRef.current?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      unlockBodyScroll();
    };
  }, [config.isOpen]);

  const renderIcon = () => {
    if (config.icon) {
      const CustomIcon = config.icon;
      return <CustomIcon className="w-6 h-6" />;
    }

    if (config.type === 'warning') {
      return <AlertTriangle className="w-6 h-6 text-amber-500" />;
    }
    if (config.type === 'info') {
      return <Info className="w-6 h-6 text-sky-500" />;
    }
    return <Trash2 className="w-6 h-6 text-rose-500" />;
  };

  const modalNode = config.isOpen ? (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 select-none"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={handleCancel}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        className="relative w-full max-w-sm rounded-3xl bg-[#faf9f6] dark:bg-[#181820] border border-[#dedbd0] dark:border-[#2e2e38] shadow-2xl p-6 text-center transform transition-all animate-modal-pop z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleCancel}
          className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon Badge */}
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform shadow-xs ${
            config.type === 'warning'
              ? 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 border border-amber-500/30 ring-4 ring-amber-500/5'
              : config.type === 'info'
              ? 'bg-sky-500/10 dark:bg-sky-500/20 text-sky-500 border border-sky-500/30 ring-4 ring-sky-500/5'
              : 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-500 border border-rose-500/30 ring-4 ring-rose-500/5'
          }`}
        >
          {renderIcon()}
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-black text-[#18181b] dark:text-white tracking-tight leading-snug">
          {config.title}
        </h3>

        {/* Message */}
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 mt-2 leading-relaxed">
          {config.message}
        </p>

        {/* Actions Button Row */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            type="button"
            onClick={handleCancel}
            className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-300 bg-[#edebe4] dark:bg-[#252530] hover:bg-[#e4e1d7] dark:hover:bg-[#2d2d3a] border border-[#dedbd0] dark:border-[#383848] transition-all cursor-pointer active:scale-95"
          >
            {config.cancelText}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            autoFocus
            className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white transition-all cursor-pointer active:scale-95 shadow-md flex items-center justify-center gap-1.5 ${
              config.type === 'warning'
                ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 border border-amber-600/40 shadow-amber-600/20'
                : config.type === 'info'
                ? 'bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] hover:bg-zinc-800 dark:hover:bg-zinc-100 shadow-zinc-900/20'
                : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 border border-rose-600/40 shadow-rose-600/25'
            }`}
          >
            {config.confirmText}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {typeof document !== 'undefined' ? createPortal(modalNode, document.body) : null}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }
  return context.confirm;
}
