'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Field } from '@/components/ui';
import { useCart } from '@/hooks/useCart';
import { formToObject, useFormValidation } from '@/hooks/useFormValidation';
import { api } from '@/lib/api-client';
import { formatMoney } from '@/lib/format';
import { CLOSING_TIME, OPENING_TIME } from '@/constants';

interface CheckoutProps {
  loggedIn: boolean;
}

// Suggest the next 15-minute slot at least 20 minutes from now
const suggestPickupTime = () => {
  const now = new Date(Date.now() + 20 * 60 * 1000);
  now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0);
  const time = now.toTimeString().slice(0, 5);
  return time < OPENING_TIME || time > CLOSING_TIME ? OPENING_TIME : time;
};

export const Checkout = ({ loggedIn }: CheckoutProps) => {
  const { items, count, total, cart } = useCart();
  const router = useRouter();
  const { errors, validate, formProps } = useFormValidation();
  const [pickupTime] = useState(suggestPickupTime);

  const placeOrder = useMutation({
    mutationFn: (order: Record<string, unknown>) => api.post<{ orderId: number }>('/orders', order),
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate(event.currentTarget)) return;
    const data = formToObject(event.currentTarget);
    const lines = items.map(({ productId, quantity }) => ({ productId, quantity }));
    placeOrder.mutate({ ...data, items: lines }, {
      onSuccess: ({ orderId }) => {
        cart.clear();
        router.push(`/dashboard?placed=${orderId}&at=${encodeURIComponent(String(data.pickupTime))}`);
      },
    });
  };

  return (
    <aside className="panel" aria-labelledby="checkout-title">
      <h2 id="checkout-title">Send your order</h2>
      <div className="summary-line"><span>Items</span><span>{count}</span></div>
      <div className="summary-line summary-line--total"><span>Total</span><output>{formatMoney(total)}</output></div>

      {!loggedIn ? (
        <p className="alert">
          <Link href="/login?next=/cart">Log in</Link> or <Link href="/register?next=/cart">create an account</Link> to send your order. Your items stay here.
        </p>
      ) : (
        <form className="form" method="post" onSubmit={onSubmit} {...formProps}>
          <Field id="pickupTime" label="Collection time" required error={errors.pickupTime}
            hint="Between 07:30 and 15:30, in 15-minute slots.">
            <input type="time" id="pickupTime" name="pickupTime" min={OPENING_TIME} max={CLOSING_TIME} step={900}
              required defaultValue={pickupTime} suppressHydrationWarning />
          </Field>
          <fieldset>
            <legend>Paying with</legend>
            <label className="checkbox"><input type="radio" name="payment" value="cash" defaultChecked /> Cash</label>
            <label className="checkbox"><input type="radio" name="payment" value="card" /> Card</label>
          </fieldset>
          <Field id="notes" label="Notes for the kitchen" error={errors.notes}>
            <textarea id="notes" name="notes" maxLength={255} rows={3} placeholder="No onions, extra tomato sauce" />
          </Field>
          <p className="alert alert--error" role="alert">{placeOrder.error?.message}</p>
          <button className="btn btn--sign btn--block" type="submit" disabled={items.length === 0 || placeOrder.isPending}>
            {placeOrder.isPending ? 'Sending…' : 'Send order'}
          </button>
        </form>
      )}
    </aside>
  );
};
