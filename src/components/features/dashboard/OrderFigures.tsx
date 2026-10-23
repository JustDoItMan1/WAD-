'use client';
import { useMyOrders } from '@/hooks/useMyOrders';
import { formatMoney } from '@/lib/format';
import { ACTIVE_STATUSES } from '@/constants';
import type { Order } from '@/types';

interface OrderFiguresProps {
  initialOrders: Order[];
}

export const OrderFigures = ({ initialOrders }: OrderFiguresProps) => {
  const { data: orders } = useMyOrders(initialOrders);
  const spent = orders.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + o.total_amount, 0);
  return (
    <dl className="figures" aria-label="Your order totals">
      <div><dt>Orders</dt><dd>{orders.length}</dd></div>
      <div><dt>Waiting to collect</dt><dd>{orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length}</dd></div>
      <div><dt>Spent</dt><dd>{formatMoney(spent)}</dd></div>
    </dl>
  );
};
