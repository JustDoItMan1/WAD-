import type { OrderStatus } from '@/types';

export const OPENING_TIME = '07:30';
export const CLOSING_TIME = '15:30';
export const FRIDAY_CLOSING_TIME = '14:00';

export const ORDER_STATUSES: OrderStatus[] = ['pending', 'preparing', 'ready', 'collected', 'cancelled'];
export const ACTIVE_STATUSES: OrderStatus[] = ['pending', 'preparing', 'ready'];

export const MAX_QUANTITY = 20;
export const DEFAULT_IMAGE = '/images/menu/default.svg';

// Section ids from db/seed.sql used by the home page price board
export const ROLLS_CATEGORY = 1;
export const COLD_DRINKS_CATEGORY = 4;

export const SORT_OPTIONS = [
  { value: 'menu', label: 'Menu order' },
  { value: 'price-asc', label: 'Cheapest first' },
  { value: 'price-desc', label: 'Most expensive first' },
  { value: 'name', label: 'A to Z' },
];
