'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ProductDialog } from '@/components/features/admin/ProductDialog';
import { useAdminProducts, useDeleteProduct } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/useToast';
import { formatMoney } from '@/lib/format';
import type { Category, Product } from '@/types';

interface AdminProductsProps {
  categories: Category[];
  images: string[];
}

// Product being edited: a product, null for "add new", or undefined when the dialog is closed
type Editing = Product | null | undefined;

export const AdminProducts = ({ categories, images }: AdminProductsProps) => {
  const [term, setTerm] = useState('');
  const [editing, setEditing] = useState<Editing>(undefined);
  const { data: products = [], error } = useAdminProducts();
  const remove = useDeleteProduct();
  const toast = useToast();

  const visible = products.filter(({ name, category }) =>
    `${name} ${category}`.toLowerCase().includes(term.trim().toLowerCase()));

  const onDelete = (product: Product) => {
    if (!window.confirm(`Delete ${product.name} from the menu? This cannot be undone.`)) return;
    remove.mutate(product.product_id, {
      onSuccess: () => toast(`${product.name} deleted`, 'success'),
      onError: (err) => toast(err.message, 'error'),
    });
  };

  return (
    <>
      <div className="section-header">
        <h2>Menu items</h2>
        <div className="actions-cell">
          <label className="visually-hidden" htmlFor="product-search">Search menu items</label>
          <input type="search" id="product-search" placeholder="Search items" value={term} onChange={(event) => setTerm(event.target.value)} />
          <button className="btn" type="button" onClick={() => setEditing(null)}>Add menu item</button>
        </div>
      </div>
      {error && <p className="alert alert--error">{error.message}</p>}
      <div className="table-wrapper">
        <table>
          <caption className="visually-hidden">Menu items</caption>
          <thead>
            <tr><th scope="col">Item</th><th scope="col">Section</th><th scope="col" className="num">Price</th><th scope="col" className="num">In stock</th><th scope="col">On menu</th><th scope="col"><span className="visually-hidden">Actions</span></th></tr>
          </thead>
          <tbody>
            {visible.length === 0 && <tr><td colSpan={6} className="empty-state">No menu items match that search.</td></tr>}
            {visible.map((product) => (
              <tr key={product.product_id}>
                <td className="item-cell">
                  {/* eslint-disable-next-line @next/next/no-img-element -- small local SVG */}
                  <img src={product.image_url} alt="" width={40} height={40} />
                  <Link href={`/menu/${product.product_id}`}>{product.name}</Link>
                </td>
                <td>{product.category}</td>
                <td className="num">{formatMoney(product.price)}</td>
                <td className="num">
                  {product.stock_quantity < 10 ? <span className="low-stock">{product.stock_quantity}</span> : product.stock_quantity}
                </td>
                <td>{product.is_available ? 'Yes' : 'Hidden'}</td>
                <td className="actions-cell">
                  <button className="btn btn--sm" type="button" onClick={() => setEditing(product)}>Edit</button>
                  <button className="btn btn--sm btn--danger" type="button" onClick={() => onDelete(product)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing !== undefined && (
        <ProductDialog product={editing} categories={categories} images={images} onClose={() => setEditing(undefined)} />
      )}
    </>
  );
};
