'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast viewport */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none"
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-lg border text-xs font-medium shadow-tactile transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${
                isSuccess
                  ? 'bg-paper-50 border-ink-900 text-ink-900'
                  : isError
                  ? 'bg-coral-subtle border-coral text-coral-dark'
                  : 'bg-paper-100 border-ink-800 text-ink-900'
              }`}
            >
              <div className="flex items-center gap-2">
                {isSuccess && <CheckCircle2 className="h-4 w-4 text-emeraldBrand shrink-0" />}
                {isError && <AlertCircle className="h-4 w-4 text-coral shrink-0" />}
                {!isSuccess && !isError && <Info className="h-4 w-4 text-ink-600 shrink-0" />}
                <span>{toast.message}</span>
              </div>
              <button
                type="button"
                aria-label="Dismiss toast"
                onClick={() => removeToast(toast.id)}
                className="text-ink-400 hover:text-ink-900 p-0.5 rounded transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
