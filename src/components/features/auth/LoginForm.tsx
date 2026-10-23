'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Field } from '@/components/ui';
import { ShowPassword } from '@/components/features/auth/ShowPassword';
import { formToObject, useFormValidation } from '@/hooks/useFormValidation';
import { api } from '@/lib/api-client';
import { safeNext } from '@/lib/safe-next';
import type { SessionUser } from '@/types';

interface LoginFormProps {
  next: string | null;
}

export const LoginForm = ({ next }: LoginFormProps) => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const { errors, validate, formProps } = useFormValidation();

  const login = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post<{ user: SessionUser }>('/auth/login', body),
    onSuccess: ({ user }) => {
      router.push(safeNext(next, user.role === 'admin' ? '/admin' : '/dashboard'));
      router.refresh();
    },
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!validate(form)) return;
    login.mutate(formToObject(form), {
      onError: () => {
        form.password.value = '';
        form.password.focus();
      },
    });
  };

  return (
    <form className="form" method="post" onSubmit={onSubmit} {...formProps}>
      <Field id="email" label="Email" error={errors.email}>
        <input type="email" id="email" name="email" autoComplete="username" required />
      </Field>
      <Field id="password" label="Password" error={errors.password}>
        <input type={showPassword ? 'text' : 'password'} id="password" name="password" autoComplete="current-password" required />
      </Field>
      <ShowPassword label="Show password" checked={showPassword} onChange={setShowPassword} />
      <p className="alert alert--error" role="alert">{login.error?.message}</p>
      <button className="btn btn--block" type="submit" disabled={login.isPending}>
        {login.isPending ? 'Logging in…' : 'Log in'}
      </button>
    </form>
  );
};
