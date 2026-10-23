import type { MenuFilters, OrderStatus } from '@/types';

export const queryKeys = {
  products: (filters: MenuFilters) => ['products', filters] as const,
  myOrders: ['orders', 'mine'] as const,
  admin: {
    stats: ['admin', 'stats'] as const,
    orders: (status: OrderStatus | '') => ['admin', 'orders', status] as const,
    products: ['admin', 'products'] as const,
    users: ['admin', 'users'] as const,
    messages: ['admin', 'messages'] as const,
  },
};
