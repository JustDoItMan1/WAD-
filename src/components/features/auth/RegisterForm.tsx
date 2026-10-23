'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Field } from '@/components/ui';
import { ShowPassword } from '@/components/features/auth/ShowPassword';
import { formToObject, useFormValidation } from '@/hooks/useFormValidation';
import { api } from '@/lib/api-client';
import { safeNext } from '@/lib/safe-next';

interface RegisterFormProps {
  next: string | null;
}

const STRENGTH = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];

// Scores a password 0–4 using a list of regular-expression rules
const scorePassword = (password: string) => {
  const rules = [/.{8,}/, /[A-Z]/, /[a-z]/, /\d/, /[^A-Za-z0-9]/];
  return Math.max(0, rules.filter((rule) => rule.test(password)).length - 1);
};

// Cross-field rule: both password boxes must match
const passwordsMatch = (form: HTMLFormElement) => {
  const { password, confirmPassword } = form;
  confirmPassword.setCustomValidity(
    confirmPassword.value && confirmPassword.value !== password.value ? 'Passwords do not match.' : ''
  );
};

export const RegisterForm = ({ next }: RegisterFormProps) => {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { errors, validate, formProps } = useFormValidation(passwordsMatch);
  const score = scorePassword(password);
  const passwordType = showPassword ? 'text' : 'password';

  const register = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/auth/register', body),
    onSuccess: () => {
      router.push(safeNext(next, '/dashboard?welcome=1'));
      router.refresh();
    },
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validate(event.currentTarget)) register.mutate(formToObject(event.currentTarget));
  };

  return (
    <form className="form" method="post" onSubmit={onSubmit} {...formProps}>
      <fieldset>
        <legend>About you</legend>
        <Field id="name" label="Full name" required error={errors.name}>
          <input type="text" id="name" name="name" autoComplete="name" required minLength={2} maxLength={100} />
        </Field>
        <Field id="email" label="Email" required error={errors.email}>
          <input type="email" id="email" name="email" autoComplete="email" required maxLength={150} />
        </Field>
        <Field id="phone" label="Cellphone" error={errors.phone} hint="So we can call if there is a problem with your order.">
          <input type="tel" id="phone" name="phone" autoComplete="tel" placeholder="081 234 5678"
            pattern="\+?[0-9 ]{7,15}" data-pattern-message="Use 7 to 15 digits, for example 081 234 5678." />
        </Field>
      </fieldset>

      <fieldset>
        <legend>Password</legend>
        <Field id="password" label="Password" required error={errors.password}
          hint={password ? `Strength: ${STRENGTH[score]}` : 'At least 8 characters with a capital letter, a small letter and a number.'}>
          <input type={passwordType} id="password" name="password" autoComplete="new-password" required minLength={8}
            pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}"
            data-pattern-message="Use at least 8 characters with a capital letter, a small letter and a number."
            value={password} onChange={(event) => setPassword(event.target.value)} />
        </Field>
        <div className="password-meter" data-score={password ? score : 'empty'} aria-hidden="true"><span /></div>
        <Field id="confirmPassword" label="Type it again" required error={errors.confirmPassword}>
          <input type={passwordType} id="confirmPassword" name="confirmPassword" autoComplete="new-password" required
            data-required-message="Type your password a second time." />
        </Field>
        <ShowPassword label="Show passwords" checked={showPassword} onChange={setShowPassword} />
      </fieldset>

      <div className={errors.terms ? 'field has-error' : 'field'}>
        <label className="checkbox" htmlFor="terms">
          <input type="checkbox" id="terms" name="terms" required aria-describedby="terms-error" /> I will collect what I order, or cancel it in time
        </label>
        <p className="field-error" id="terms-error">{errors.terms}</p>
      </div>

      <p className="alert alert--error" role="alert">{register.error?.message}</p>
      <button className="btn btn--block" type="submit" disabled={register.isPending}>
        {register.isPending ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  );
};
