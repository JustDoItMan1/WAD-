'use client';
import { useState } from 'react';
import { useAdminOrders, useSetOrderStatus } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/useToast';
import { capitalise, formatDate, formatMoney } from '@/lib/format';
import { ORDER_STATUSES } from '@/constants';
import type { OrderStatus } from '@/types';

export const AdminOrders = () => {
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const { data: orders, error } = useAdminOrders(status);
  const setOrderStatus = useSetOrderStatus();
  const toast = useToast();

  const onStatusChange = (id: number, next: OrderStatus) => setOrderStatus.mutate({ id, status: next }, {
    onSuccess: () => toast(`Order ${id} is now ${next}`),
    onError: (err) => toast(err.message, 'error'),
  });

  return (
    <>
      <div className="section-header">
        <h2>Orders</h2>
        <div>
          <label htmlFor="status-filter">Show</label>{' '}
          <select id="status-filter" value={status} onChange={(event) => setStatus(event.target.value as OrderStatus | '')}>
            <option value="">All orders</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{capitalise(s)}</option>)}
          </select>
        </div>
      </div>
      {error && <p className="alert alert--error">{error.message}</p>}
      <div className="table-wrapper">
        <table>
          <caption className="visually-hidden">Customer orders</caption>
          <thead>
            <tr><th scope="col">No.</th><th scope="col">Customer</th><th scope="col">Items</th><th scope="col">Collect at</th><th scope="col" className="num">Total</th><th scope="col">Status</th></tr>
          </thead>
          <tbody>
            {orders?.length === 0 && <tr><td colSpan={6} className="empty-state">No orders with this status.</td></tr>}
            {orders?.map((order) => (
              <tr key={order.order_id}>
                <td>{order.order_id}</td>
                <td>{order.customer_name}<br /><small>{formatDate(order.created_at)}</small></td>
                <td>
                  {order.items.map((i) => <span key={i.product_id}>{i.quantity} × {i.name}<br /></span>)}
                  {order.notes && <em>“{order.notes}”</em>}
                </td>
                <td>{order.pickup_time}<br /><small>{order.payment_method}</small></td>
                <td className="num">{formatMoney(order.total_amount)}</td>
                <td>
                  <label className="visually-hidden" htmlFor={`status-${order.order_id}`}>Status of order {order.order_id}</label>
                  <select id={`status-${order.order_id}`} value={order.status}
                    onChange={(event) => onStatusChange(order.order_id, event.target.value as OrderStatus)}>
                    {ORDER_STATUSES.map((s) => <option key={s} value={s}>{capitalise(s)}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};
