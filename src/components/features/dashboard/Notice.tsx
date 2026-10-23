'use client';
import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/useToast';

interface NoticeProps {
  message: string;
}

// Shows a one-off toast (e.g. "Order 3 sent") and removes the query string so a reload does not repeat it
export const Notice = ({ message }: NoticeProps) => {
  const toast = useToast();
  const shown = useRef(false);
  useEffect(() => {
    if (shown.current) return;
    shown.current = true;
    toast(message, 'success');
    window.history.replaceState(null, '', window.location.pathname);
  }, [message, toast]);
  return null;
};
