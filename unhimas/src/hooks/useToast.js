import { useCallback } from 'react';
import { toast } from '../components/common/Toast';

export function useToast() {
  const showToast = useCallback((message, type, duration) => {
    toast(message, type, duration);
  }, []);

  return { showToast };
}
