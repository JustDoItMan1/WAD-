// Shapes of the rows the database and API return

export type Role = 'customer' | 'admin';
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'collected' | 'cancelled';
export type PaymentMethod = 'cash' | 'card';

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
}

export interface Category {
  category_id: number;
  name: string;
  description: string | null;
  product_count: number;
}

export interface Product {
  product_id: number;
  category_id: number;
  name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  image_url: string;
  is_available: number;
  created_at: string;
  category: string;
}

export type MenuItem = Pick<
  Product,
  'product_id' | 'name' | 'description' | 'price' | 'stock_quantity' | 'image_url' | 'is_available'
>;

export interface OrderItem {
  product_id: number;
  quantity: number;
  unit_price: number;
  name: string;
  image_url: string;
}

export interface Order {
  order_id: number;
  user_id: number;
  customer_name: string;
  customer_email: string;
  status: OrderStatus;
  pickup_time: string;
  payment_method: PaymentMethod;
  notes: string | null;
  total_amount: number;
  created_at: string;
  item_count: number;
  items: OrderItem[];
}

export interface ShopStats {
  customers: number;
  orders: number;
  open_orders: number;
  revenue: number;
  low_stock: number;
  unread_messages: number;
}

export interface ProductSales {
  product_id: number;
  name: string;
  category: string;
  units_sold: number;
  revenue: number;
}

export interface Customer {
  user_id: number;
  full_name: string;
  email: string;
  phone: string | null;
  role: Role;
  created_at: string;
  order_count: number;
  total_spent: number;
}

export interface ContactMessage {
  message_id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: number;
  created_at: string;
}

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export interface MenuFilters {
  q: string;
  category: string;
  sort: string;
  available: boolean;
}
