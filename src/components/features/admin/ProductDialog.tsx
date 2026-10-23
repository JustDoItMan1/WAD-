'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Field } from '@/components/ui';
import { useSaveProduct } from '@/hooks/useAdmin';
import { formToObject, useFormValidation } from '@/hooks/useFormValidation';
import { useToast } from '@/hooks/useToast';
import { imageLabel } from '@/lib/format';
import { DEFAULT_IMAGE } from '@/constants';
import type { Category, Product } from '@/types';

interface ProductDialogProps {
  product: Product | null;
  categories: Category[];
  images: string[];
  onClose: () => void;
}

// Data entry form for adding or editing a menu item, shown in a modal <dialog>
export const ProductDialog = ({ product, categories, images, onClose }: ProductDialogProps) => {
  const dialog = useRef<HTMLDialogElement>(null);
  const [image, setImage] = useState(product?.image_url ?? DEFAULT_IMAGE);
  const { errors, validate, formProps } = useFormValidation();
  const save = useSaveProduct();
  const toast = useToast();

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate(event.currentTarget)) return;
    const { productId, ...data } = formToObject(event.currentTarget);
    save.mutate({ id: String(productId), data }, {
      onSuccess: () => {
        toast(`${data.name} saved`, 'success');
        onClose();
      },
    });
  };

  return (
    <dialog ref={dialog} aria-labelledby="dialog-title" onClose={onClose}>
      <form className="form" method="dialog" onSubmit={onSubmit} {...formProps}>
        <h2 id="dialog-title">{product ? `Edit ${product.name}` : 'Add menu item'}</h2>
        <input type="hidden" name="productId" defaultValue={product?.product_id ?? ''} />
        <div className="form-row">
          <Field id="p-name" label="Name" required error={errors['p-name']}>
            <input type="text" id="p-name" name="name" required maxLength={100} placeholder="Cheese russian roll"
              defaultValue={product?.name} autoFocus />
          </Field>
          <Field id="p-category" label="Section" required error={errors['p-category']}>
            <select id="p-category" name="categoryId" required defaultValue={product?.category_id ?? ''}>
              <option value="">Select…</option>
              {categories.map(({ category_id, name }) => <option key={category_id} value={category_id}>{name}</option>)}
            </select>
          </Field>
        </div>
        <Field id="p-description" label="Description" error={errors['p-description']}>
          <textarea id="p-description" name="description" maxLength={1000} rows={3} defaultValue={product?.description ?? ''} />
        </Field>
        <div className="form-row">
          <Field id="p-price" label="Price (N$)" required error={errors['p-price']}>
            <input type="number" id="p-price" name="price" required min={0.5} max={10000} step={0.5} defaultValue={product?.price} />
          </Field>
          <Field id="p-stock" label="In stock" required error={errors['p-stock']}>
            <input type="number" id="p-stock" name="stock" required min={0} max={10000} step={1} defaultValue={product?.stock_quantity} />
          </Field>
        </div>
        <div className="image-picker">
          {/* eslint-disable-next-line @next/next/no-img-element -- small local SVG */}
          <img id="p-image-preview" src={image} alt="" width={80} height={80} />
          <Field id="p-image" label="Picture" error={errors['p-image']}>
            <select id="p-image" name="image" value={image} onChange={(event) => setImage(event.target.value)}>
              {images.map((url) => <option key={url} value={url}>{imageLabel(url)}</option>)}
            </select>
          </Field>
        </div>
        <label className="checkbox">
          <input type="checkbox" id="p-available" name="isAvailable" defaultChecked={product ? Boolean(product.is_available) : true} /> Show on the menu
        </label>
        <p className="alert alert--error" role="alert">{save.error?.message}</p>
        <div className="button-row">
          <button className="btn" type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save item'}</button>
          <button className="btn btn--outline" type="button" onClick={() => dialog.current?.close()}>Cancel</button>
        </div>
      </form>
    </dialog>
  );
};
