'use client';
import { StatusTag } from '@/components/ui';
import { useAdminUsers } from '@/hooks/useAdmin';
import { formatDate, formatMoney } from '@/lib/format';

export const AdminCustomers = () => {
  const { data: users = [], error } = useAdminUsers();
  return (
    <>
      <h2>Customers</h2>
      {error && <p className="alert alert--error">{error.message}</p>}
      <div className="table-wrapper">
        <table>
          <caption className="visually-hidden">Registered users</caption>
          <thead>
            <tr><th scope="col">Name</th><th scope="col">Email</th><th scope="col">Cellphone</th><th scope="col">Role</th><th scope="col" className="num">Orders</th><th scope="col" className="num">Spent</th><th scope="col">Joined</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.user_id}>
                <td>{u.full_name}</td>
                <td><a href={`mailto:${u.email}`}>{u.email}</a></td>
                <td>{u.phone ?? '—'}</td>
                <td><StatusTag status={u.role} /></td>
                <td className="num">{u.order_count}</td>
                <td className="num">{formatMoney(u.total_spent)}</td>
                <td>{formatDate(u.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};
