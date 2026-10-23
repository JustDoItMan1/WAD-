import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from '@/components/features/auth/LoginForm';
import { withNext } from '@/lib/safe-next';

export const metadata: Metadata = {
  title: 'Log in',
  description: 'Log in to order from the Tuck In tuckshop and see your orders.',
};

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

const LoginPage = async ({ searchParams }: LoginPageProps) => {
  const next = (await searchParams).next ?? null;
  return (
    <main id="main">
      <section className="auth-card" aria-labelledby="login-title">
        <h1 id="login-title">Log in</h1>
        <p>No account yet? <Link href={withNext('/register', next)}>Create one</Link>.</p>
        <LoginForm next={next} />
        <details className="demo-accounts">
          <summary>Demo accounts for testing</summary>
          <dl>
            <dt>Customer</dt><dd><kbd>student@tuckin.com</kbd> with password <kbd>Student@123</kbd></dd>
            <dt>Admin</dt><dd><kbd>admin@tuckin.com</kbd> with password <kbd>Admin@123</kbd></dd>
          </dl>
        </details>
      </section>
    </main>
  );
};

export default LoginPage;
