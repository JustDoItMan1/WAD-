'use client';
import { useCallback, useRef, useState, type ReactNode } from 'react';
import { ToastContext, type ToastType } from '@/hooks/useToast';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastProviderProps {
  children: ReactNode;
}

// Short messages that confirm an action, announced politely to screen readers
export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const show = useCallback((message: string, type: ToastType = 'info') => {
    const id = nextId.current++;
    setToasts((list) => [...list, { id, message, type }]);
    setTimeout(() => setToasts((list) => list.filter((toast) => toast.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toasts.map(({ id, message, type }) => (
          <p key={id} className={`toast toast--${type}`}>{message}</p>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
