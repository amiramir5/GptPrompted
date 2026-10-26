import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextType {
  toast: (title: string, description?: string, type?: ToastType) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (title: string, description?: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider
      value={{
        toast: addToast,
        success: (title, desc) => addToast(title, desc, 'success'),
        error: (title, desc) => addToast(title, desc, 'error'),
        info: (title, desc) => addToast(title, desc, 'info'),
      }}
    >
      {children}
      <div className="fixed bottom-20 md:bottom-6 left-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-lg border backdrop-blur-md transition-all animate-in slide-in-from-bottom-2 ${
              t.type === 'success'
                ? 'bg-[#10584D]/95 text-white border-[#A9DCD5]/30'
                : t.type === 'error'
                ? 'bg-rose-900/95 text-white border-rose-500/30'
                : 'bg-slate-900/95 text-white border-slate-700/50'
            }`}
          >
            {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-[#A9DCD5] shrink-0 mt-0.5" />}
            {t.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-300 shrink-0 mt-0.5" />}
            {t.type === 'info' && <Info className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />}
            <div className="flex-1">
              <h4 className="font-semibold text-sm leading-tight">{t.title}</h4>
              {t.description && <p className="text-xs text-white/80 mt-1">{t.description}</p>}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
