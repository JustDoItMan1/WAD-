import { capitalise } from '@/lib/format';

interface StatusTagProps {
  status: string;
}

export const StatusTag = ({ status }: StatusTagProps) => (
  <span className={`status status--${status}`}>{capitalise(status)}</span>
);
