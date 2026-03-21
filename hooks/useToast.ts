import { useState, useCallback } from 'react';
import type { ToastMessage, ToastType } from '@/components/ui/Toast';

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((msg: string) => addToast('success', msg), [addToast]);
  const error   = useCallback((msg: string) => addToast('error',   msg), [addToast]);

  return { toasts, removeToast, success, error };
}
