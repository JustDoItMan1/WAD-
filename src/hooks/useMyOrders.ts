'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { Order } from '@/types';

// The customer's orders, re-checked every 30 seconds so status changes made at the counter show up
export const useMyOrders = (initialOrders: Order[]) => useQuery({
  queryKey: queryKeys.myOrders,
  queryFn: () => api.get<{ orders: Order[] }>('/orders').then((data) => data.orders),
  initialData: initialOrders,
  refetchInterval: 30_000,
});

export const useCancelOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: number) => api.patch(`/orders/${orderId}/cancel`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.myOrders }),
  });
};
