'use client';
import { useAdminStats, type StatsData } from '@/hooks/useAdmin';
import { formatMoney } from '@/lib/format';

interface AdminOverviewProps {
  initialData: StatsData;
}

export const AdminOverview = ({ initialData }: AdminOverviewProps) => {
  const { data: { stats, topProducts } } = useAdminStats(initialData);
  const figures: [string, string | number][] = [
    ['Takings', formatMoney(stats.revenue)],
    ['Orders to make', stats.open_orders],
    ['All orders', stats.orders],
    ['Customers', stats.customers],
    ['Items running low', stats.low_stock],
    ['Unread messages', stats.unread_messages],
  ];

  return (
    <div className="dashboard">
      <h2 className="visually-hidden">Shop totals</h2>
      <dl className="figures">
        {figures.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl>
      <div className="table-wrapper">
        <table>
          <caption>Best sellers</caption>
          <thead>
            <tr><th scope="col">Item</th><th scope="col">Section</th><th scope="col" className="num">Sold</th><th scope="col" className="num">Takings</th></tr>
          </thead>
          <tbody>
            {topProducts.map((p) => (
              <tr key={p.product_id}>
                <td>{p.name}</td><td>{p.category}</td><td className="num">{p.units_sold}</td><td className="num">{formatMoney(p.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
