import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

function isEnglishFallback() {
  try {
    if (typeof document !== 'undefined' && document.documentElement?.lang === 'en') return true;
    if (typeof localStorage !== 'undefined' && localStorage.getItem('spliqo_language') === 'en') return true;
  } catch {
    // ignore storage access issues
  }
  return false;
}

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Spliqo ErrorBoundary caught error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const isEn = isEnglishFallback();
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#f4f3ec] dark:bg-[#0f0f12] text-[#18181b] dark:text-white">
          <div className="tactile-card p-6 sm:p-8 max-w-md w-full text-center space-y-5 shadow-xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
              <AlertCircle className="w-8 h-8" aria-hidden="true" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                {isEn ? 'Something went wrong loading this page' : 'Đã xảy ra sự cố tải trang'}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                {isEn
                  ? 'An unexpected error occurred. Try reloading the page or returning to your Dashboard.'
                  : 'Ứng dụng gặp lỗi ngoài dự kiến. Bạn có thể thử tải lại trang hoặc quay lại Trang tổng quan.'}
              </p>
            </div>

            {this.state.error?.message && (
              <div className="text-left bg-zinc-100 dark:bg-zinc-900/70 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-zinc-600 dark:text-zinc-400 max-h-24 overflow-y-auto">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="tactile-btn-dark flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isEn ? 'Reload page' : 'Tải lại trang'}</span>
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="tactile-btn-pill flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isEn ? 'Back to Home' : 'Về trang chủ'}</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

