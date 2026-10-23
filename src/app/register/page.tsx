import type { Metadata } from 'next';
import Link from 'next/link';
import { RegisterForm } from '@/components/features/auth/RegisterForm';
import { withNext } from '@/lib/safe-next';

export const metadata: Metadata = {
  title: 'Create an account',
  description: 'Create a Tuck In account to order from the tuckshop.',
};

interface RegisterPageProps {
  searchParams: Promise<{ next?: string }>;
}

const RegisterPage = async ({ searchParams }: RegisterPageProps) => {
  const next = (await searchParams).next ?? null;
  return (
    <main id="main">
      <section className="auth-card" aria-labelledby="register-title">
        <h1 id="register-title">Create an account</h1>
        <p>Already have one? <Link href={withNext('/login', next)}>Log in</Link>.</p>
        <RegisterForm next={next} />
      </section>
    </main>
  );
};

export default RegisterPage;
