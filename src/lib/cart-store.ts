// Shopping cart stored in localStorage so it survives page reloads.
// Demonstrates an ES class, private fields, getters and custom events.
import { MAX_QUANTITY } from '@/constants';
import type { CartItem, MenuItem } from '@/types';

const STORAGE_KEY = 'tuckin-cart';
const EMPTY: CartItem[] = [];

class Cart extends EventTarget {
  #items: CartItem[] = EMPTY;

  constructor() {
    super();
    if (typeof window === 'undefined') return;
    this.#load();
    // Keep multiple open tabs in sync
    window.addEventListener('storage', (event) => {
      if (event.key !== STORAGE_KEY) return;
      this.#load();
      this.#notify();
    });
  }

  // The array is replaced on every change, so React can compare snapshots by reference
  get items() {
    return this.#items;
  }

  add({ product_id, name, price, image_url }: Pick<MenuItem, 'product_id' | 'name' | 'price' | 'image_url'>, quantity = 1) {
    const existing = this.#items.find((item) => item.productId === product_id);
    this.#items = existing
      ? this.#items.map((item) => item === existing
        ? { ...item, quantity: Math.min(item.quantity + quantity, MAX_QUANTITY) }
        : item)
      : [...this.#items, { productId: product_id, name, price, image: image_url, quantity }];
    this.#save();
  }

  update(productId: number, quantity: number) {
    if (!(quantity > 0)) return this.remove(productId);
    this.#items = this.#items.map((item) =>
      item.productId === productId ? { ...item, quantity: Math.min(quantity, MAX_QUANTITY) } : item);
    this.#save();
  }

  remove(productId: number) {
    this.#items = this.#items.filter((item) => item.productId !== productId);
    this.#save();
  }

  clear() {
    this.#items = EMPTY;
    this.#save();
  }

  subscribe = (listener: () => void) => {
    this.addEventListener('change', listener);
    return () => this.removeEventListener('change', listener);
  };

  #load() {
    try {
      this.#items = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    } catch {
      this.#items = EMPTY;
    }
  }

  #save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.#items));
    } catch {
      // Storage may be unavailable (private mode); the cart still works for this page
    }
    this.#notify();
  }

  #notify() {
    this.dispatchEvent(new Event('change'));
  }
}

export const cart = new Cart();
export const EMPTY_CART = EMPTY;
