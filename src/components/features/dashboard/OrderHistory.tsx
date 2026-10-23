'use client';
import { useState } from 'react';
import Link from 'next/link';
import { StatusTag } from '@/components/ui';
import { useCancelOrder, useMyOrders } from '@/hooks/useMyOrders';
import { useToast } from '@/hooks/useToast';
import { formatDate, formatMoney } from '@/lib/format';
import { ACTIVE_STATUSES } from '@/constants';
import type { Order } from '@/types';

interface OrderHistoryProps {
  initialOrders: Order[];
}

const matches = (order: Order, filter: string) =>
  !filter || (filter === 'active' ? ACTIVE_STATUSES.includes(order.status) : order.status === filter);

export const OrderHistory = ({ initialOrders }: OrderHistoryProps) => {
  const [filter, setFilter] = useState('');
  const { data: orders } = useMyOrders(initialOrders);
  const cancel = useCancelOrder();
  const toast = useToast();
  const visible = orders.filter((order) => matches(order, filter));

  const onCancel = (orderId: number) => {
    if (!window.confirm(`Cancel order ${orderId}?`)) return;
    cancel.mutate(orderId, {
      onSuccess: () => toast(`Order ${orderId} cancelled`),
      onError: (error) => toast(error.message, 'error'),
    });
  };

  return (
    <>
      <div className="section-header">
        <h2 className="visually-hidden">Order history</h2>
        <label htmlFor="order-filter">Show</label>
        <select id="order-filter" value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="">All orders</option>
          <option value="active">Waiting to collect</option>
          <option value="collected">Collected</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <div className="order-list">
        {visible.length === 0 && (
          <p className="empty-state">No orders here. <Link href="/menu">Order from the menu</Link>.</p>
        )}
        {visible.map((order) => (
          <article key={order.order_id} className="order">
            <div className="order__head">
              <h3>Order {order.order_id}</h3>
              <StatusTag status={order.status} />
            </div>
            <p className="order__meta">
              Collect at <strong>{order.pickup_time}</strong>, paying by {order.payment_method}.
              Ordered <time dateTime={order.created_at}>{formatDate(order.created_at)}</time>.
            </p>
            <ul className="order__items" role="list">
              {order.items.map((item) => (
                <li key={item.product_id}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- small local SVG */}
                  <img src={item.image_url} alt="" width={36} height={36} />
                  {item.quantity} × {item.name}
                </li>
              ))}
            </ul>
            {order.notes && <p>Note: {order.notes}</p>}
            <div className="order__foot">
              <span className="order__total">{formatMoney(order.total_amount)}</span>
              {order.status === 'pending' && (
                <button className="btn btn--sm btn--outline" type="button" onClick={() => onCancel(order.order_id)}>
                  Cancel order
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </>
  );
};
