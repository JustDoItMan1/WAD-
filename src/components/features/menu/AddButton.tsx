'use client';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/useToast';
import type { MenuItem } from '@/types';

interface AddButtonProps {
  product: Pick<MenuItem, 'product_id' | 'name' | 'price' | 'image_url'>;
  quantity?: number;
  className?: string;
  children?: string;
}

export const AddButton = ({ product, quantity = 1, className = 'btn btn--sm btn--sign', children = 'Add' }: AddButtonProps) => {
  const { cart } = useCart();
  const toast = useToast();

  const add = () => {
    cart.add(product, quantity);
    toast(`Added ${quantity} × ${product.name}`, 'success');
  };

  return (
    <button className={className} type="button" onClick={add} aria-label={children === 'Add' ? `Add ${product.name} to your order` : undefined}>
      {children}
    </button>
  );
};
