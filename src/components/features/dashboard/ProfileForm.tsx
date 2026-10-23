'use client';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Field } from '@/components/ui';
import { formToObject, useFormValidation } from '@/hooks/useFormValidation';
import { useToast } from '@/hooks/useToast';
import { api } from '@/lib/api-client';
import type { SessionUser } from '@/types';

interface ProfileFormProps {
  user: SessionUser;
}

export const ProfileForm = ({ user }: ProfileFormProps) => {
  const router = useRouter();
  const toast = useToast();
  const { errors, validate, formProps } = useFormValidation();
  const save = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.put('/auth/me', body),
    onSuccess: () => {
      toast('Details saved', 'success');
      router.refresh();
    },
    onError: (error) => toast(error.message, 'error'),
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validate(event.currentTarget)) save.mutate(formToObject(event.currentTarget));
  };

  return (
    <form className="form auth-card" method="post" onSubmit={onSubmit} {...formProps}>
      <h2 className="visually-hidden">My details</h2>
      <Field id="name" label="Full name" required error={errors.name}>
        <input type="text" id="name" name="name" required minLength={2} maxLength={100} autoComplete="name" defaultValue={user.name} />
      </Field>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input type="email" id="email" name="email" readOnly defaultValue={user.email} />
        <p className="field-hint">To change your email, send us a message on the contact page.</p>
      </div>
      <Field id="phone" label="Cellphone" error={errors.phone}>
        <input type="tel" id="phone" name="phone" pattern="\+?[0-9 ]{7,15}" autoComplete="tel" defaultValue={user.phone ?? ''}
          data-pattern-message="Use 7 to 15 digits, for example 081 234 5678." />
      </Field>
      <div>
        <button className="btn" type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save details'}</button>
      </div>
    </form>
  );
};
