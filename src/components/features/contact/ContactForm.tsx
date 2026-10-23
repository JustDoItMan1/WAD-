'use client';
import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Field } from '@/components/ui';
import { formToObject, useFormValidation } from '@/hooks/useFormValidation';
import { api } from '@/lib/api-client';

interface ContactFormProps {
  name: string;
  email: string;
}

const SUBJECTS = [
  'An order I placed',
  'Bulk order for an event',
  'Something to add to the menu',
  'A complaint or compliment',
  'Something else',
];

export const ContactForm = ({ name, email }: ContactFormProps) => {
  const [length, setLength] = useState(0);
  const { errors, validate, formProps } = useFormValidation();
  const send = useMutation({ mutationFn: (body: Record<string, unknown>) => api.post('/contact', body) });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!validate(form)) return;
    send.mutate(formToObject(form), {
      onSuccess: () => {
        form.reset();
        setLength(0);
      },
    });
  };

  const statusClass = send.isError ? 'alert alert--error' : send.isSuccess ? 'alert alert--success' : 'alert';

  return (
    <form className="form" method="post" onSubmit={onSubmit} {...formProps}>
      <div className="form-row">
        <Field id="name" label="Name" required error={errors.name}>
          <input type="text" id="name" name="name" required maxLength={100} autoComplete="name" defaultValue={name} />
        </Field>
        <Field id="email" label="Email" required error={errors.email}>
          <input type="email" id="email" name="email" required maxLength={150} autoComplete="email" defaultValue={email} />
        </Field>
      </div>
      <Field id="subject" label="About" required error={errors.subject}>
        <select id="subject" name="subject" required defaultValue="">
          <option value="">Choose one</option>
          {SUBJECTS.map((subject) => <option key={subject}>{subject}</option>)}
        </select>
      </Field>
      <Field id="message" label="Message" required error={errors.message}
        hint={<><output>{length}</output> of 2000 characters</>}>
        <textarea id="message" name="message" required minLength={10} maxLength={2000} rows={6}
          onChange={(event) => setLength(event.target.value.length)} />
      </Field>
      <p className={statusClass} role="status">
        {send.isSuccess && 'Message sent. We reply by email within one school day.'}
        {send.error?.message}
      </p>
      <div>
        <button className="btn" type="submit" disabled={send.isPending}>{send.isPending ? 'Sending…' : 'Send message'}</button>
      </div>
    </form>
  );
};
