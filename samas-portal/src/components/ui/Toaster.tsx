import { FC } from 'react';
import { Toast, ToastProps } from './Toast';

interface ToasterProps {
  toasts: Omit<ToastProps, 'onClose'>[];
  onClose: (id: string) => void;
}

export const Toaster: FC<ToasterProps> = ({ toasts, onClose }) => {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex flex-col items-end justify-start gap-2 p-4 sm:p-6">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
};
