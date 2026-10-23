'use client';
import { createContext, useContext } from 'react';

export type ToastType = 'info' | 'success' | 'error';
export type ShowToast = (message: string, type?: ToastType) => void;

export const ToastContext = createContext<ShowToast>(() => {});

export const useToast = () => useContext(ToastContext);
