import { formatMoney } from '@/lib/format';

interface MoneyProps {
  amount: number;
  className?: string;
}

// <data> keeps the machine-readable value next to the formatted price
export const Money = ({ amount, className }: MoneyProps) => (
  <data className={className} value={amount}>{formatMoney(amount)}</data>
);
