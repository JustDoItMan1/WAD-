import type { Metadata } from 'next';
import { Tabs } from '@/components/ui';
import { AdminOverview } from '@/components/features/admin/AdminOverview';
import { AdminOrders } from '@/components/features/admin/AdminOrders';
import { AdminProducts } from '@/components/features/admin/AdminProducts';
import { AdminCustomers } from '@/components/features/admin/AdminCustomers';
import { AdminMessages } from '@/components/features/admin/AdminMessages';
import { getStats, listImages } from '@/lib/data/admin';
import { getCategories } from '@/lib/data/products';
import { adminOrRedirect } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Admin',
  description: 'Run the Tuck In tuckshop: orders, menu items, customers and messages.',
};

const AdminPage = async () => {
  await adminOrRedirect();
  return (
    <main id="main">
      <header className="container page-header">
        <h1>Shop admin</h1>
      </header>
      <div className="container dashboard">
        <Tabs label="Admin sections" tabs={[
          { id: 'overview', label: 'Today', content: <AdminOverview initialData={getStats()} /> },
          { id: 'orders', label: 'Orders', content: <AdminOrders /> },
          { id: 'products', label: 'Menu items', content: <AdminProducts categories={getCategories()} images={listImages()} /> },
          { id: 'customers', label: 'Customers', content: <AdminCustomers /> },
          { id: 'messages', label: 'Messages', content: <AdminMessages /> },
        ]} />
      </div>
    </main>
  );
};

export default AdminPage;
