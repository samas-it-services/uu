import { createContext, FC, ReactNode, useCallback, useContext, useState } from 'react';
import { Toaster } from '@/components/ui/Toaster';
import { ToastProps } from '@/components/ui/Toast';

type ToastInput = Omit<ToastProps, 'id' | 'onClose'>;

interface ToastContextValue {
  toast: (input: ToastInput) => void;
  success: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Omit<ToastProps, 'onClose'>[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((input: ToastInput) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...input, id }]);
  }, []);

  const toast = useCallback((input: ToastInput) => {
    addToast(input);
  }, [addToast]);

  const success = useCallback((title: string, description?: string) => {
    addToast({ title, description, variant: 'success' });
  }, [addToast]);

  const warning = useCallback((title: string, description?: string) => {
    addToast({ title, description, variant: 'warning' });
  }, [addToast]);

  const error = useCallback((title: string, description?: string) => {
    addToast({ title, description, variant: 'destructive' });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toast, success, warning, error }}>
      {children}
      <Toaster toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
