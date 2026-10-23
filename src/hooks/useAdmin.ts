'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { ContactMessage, Customer, Order, OrderStatus, Product, ProductSales, ShopStats } from '@/types';

export interface StatsData {
  stats: ShopStats;
  topProducts: ProductSales[];
}

export const useAdminStats = (initialData: StatsData) => useQuery({
  queryKey: queryKeys.admin.stats,
  queryFn: () => api.get<StatsData>('/admin/stats'),
  initialData,
});

export const useAdminOrders = (status: OrderStatus | '') => useQuery({
  queryKey: queryKeys.admin.orders(status),
  queryFn: () => api.get<{ orders: Order[] }>(`/admin/orders${status ? `?status=${status}` : ''}`).then((d) => d.orders),
});

export const useAdminProducts = () => useQuery({
  queryKey: queryKeys.admin.products,
  queryFn: () => api.get<{ products: Product[] }>('/products').then((d) => d.products),
});

export const useAdminUsers = () => useQuery({
  queryKey: queryKeys.admin.users,
  queryFn: () => api.get<{ users: Customer[] }>('/admin/users').then((d) => d.users),
});

export const useAdminMessages = () => useQuery({
  queryKey: queryKeys.admin.messages,
  queryFn: () => api.get<{ messages: ContactMessage[] }>('/admin/messages').then((d) => d.messages),
});

// Every admin change can affect the totals, so all admin queries are refreshed afterwards
const useAdminMutation = <V>(mutationFn: (variables: V) => Promise<unknown>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  });
};

export const useSetOrderStatus = () => useAdminMutation(({ id, status }: { id: number; status: OrderStatus }) =>
  api.patch(`/admin/orders/${id}`, { status }));

export const useSaveProduct = () => useAdminMutation(({ id, data }: { id: string; data: Record<string, unknown> }) =>
  (id ? api.put(`/admin/products/${id}`, data) : api.post('/admin/products', data)));

export const useDeleteProduct = () => useAdminMutation((id: number) => api.delete(`/admin/products/${id}`));

export const useMarkMessage = () => useAdminMutation(({ id, isRead }: { id: number; isRead: boolean }) =>
  api.patch(`/admin/messages/${id}`, { isRead }));

export const useDeleteMessage = () => useAdminMutation((id: number) => api.delete(`/admin/messages/${id}`));
