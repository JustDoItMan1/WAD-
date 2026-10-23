import type { Metadata } from 'next';
import { Tabs } from '@/components/ui';
import { OrderHistory } from '@/components/features/dashboard/OrderHistory';
import { ProfileForm } from '@/components/features/dashboard/ProfileForm';
import { Notice } from '@/components/features/dashboard/Notice';
import { OrderFigures } from '@/components/features/dashboard/OrderFigures';
import { getUserOrders } from '@/lib/data/orders';
import { userOrRedirect } from '@/lib/session';

export const metadata: Metadata = {
  title: 'My orders',
  description: 'Track your Tuck In orders and update your details.',
};

interface DashboardPageProps {
  searchParams: Promise<{ placed?: string; at?: string; welcome?: string }>;
}

const noticeFor = ({ placed, at, welcome }: Awaited<DashboardPageProps['searchParams']>) => {
  if (placed) return `Order ${placed} sent. Collect it at ${at ?? 'your chosen time'}.`;
  if (welcome) return 'Account created. You can order now.';
  return null;
};

const DashboardPage = async ({ searchParams }: DashboardPageProps) => {
  const user = await userOrRedirect('/dashboard');
  const notice = noticeFor(await searchParams);
  const orders = getUserOrders(user.id);
  return (
    <main id="main">
      <header className="container page-header">
        <h1>{user.name.split(' ')[0]}&apos;s orders</h1>
      </header>
      <div className="container dashboard">
        {notice && <Notice message={notice} />}
        <OrderFigures initialOrders={orders} />
        <Tabs label="Account sections" tabs={[
          { id: 'orders', label: 'Orders', content: <OrderHistory initialOrders={orders} /> },
          { id: 'profile', label: 'My details', content: <ProfileForm user={user} /> },
        ]} />
      </div>
    </main>
  );
};

export default DashboardPage;
