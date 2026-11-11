import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const isEn = typeof document !== 'undefined' && document.documentElement?.lang === 'en';

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container (persistent live region for assistive announcements) */}
      <div
        aria-live="polite"
        aria-relevant="additions text"
        className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4"
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';

          return (
            <div
              key={toast.id}
              role={isError ? 'alert' : 'status'}
              aria-live={isError ? 'assertive' : 'polite'}
              aria-atomic="true"
              className={`pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md transition-all animate-fade-in ${
                isSuccess
                  ? 'bg-emerald-900/90 text-white border-emerald-700 shadow-emerald-950/20'
                  : isError
                  ? 'bg-rose-900/90 text-white border-rose-700 shadow-rose-950/20'
                  : isWarning
                  ? 'bg-amber-900/90 text-white border-amber-700 shadow-amber-950/20'
                  : 'bg-slate-900/90 text-white border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" aria-hidden="true" />}
                {isError && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" aria-hidden="true" />}
                {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" aria-hidden="true" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-sky-400 shrink-0" aria-hidden="true" />}
                <p className="text-sm font-medium leading-tight">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-white/75 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                aria-label={isEn ? 'Close' : 'Đóng'}
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
