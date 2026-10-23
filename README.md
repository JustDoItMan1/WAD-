# Tuck In: Tuckshop Ordering System

Well designed website, no spaghetti.

A responsive web application for a school or campus tuckshop. Customers browse and search the menu, order ahead and track their orders. Administrators manage orders, products, customers and messages.

Built with **Next.js 16** (App Router, TypeScript, React 19), **TanStack Query** for client-side data, plain CSS, and a **SQL database** (SQLite, built into Node).

## Running it

Requires **Node.js 22.13 or newer**. The SQLite database is built into Node, so there is nothing else to install.

```bash
npm install
npm run dev          # development server at http://localhost:4000
npm run build        # production build
npm start            # run the production build at http://localhost:4000
npm run db:reset     # delete the database; it is rebuilt from the SQL scripts on the next start
npm run lint         # ESLint
npm run typecheck    # TypeScript
```

On first start the app runs `db/schema.sql` and `db/seed.sql` to create `db/tuckshop.db` automatically.

### Demo accounts

| Role          | Email                | Password      |
| ------------- | -------------------- | ------------- |
| Customer      | student@tuckin.com   | Student@123   |
| Administrator | admin@tuckin.com     | Admin@123     |

## Pages

| Requirement         | URL                        | File                    |
| ------------------- | -------------------------- | ----------------------- |
| Homepage            | `/`                        | `src/app/page.tsx`      |
| About page          | `/about`                   | `src/app/about/page.tsx` |
| Registration page   | `/register`                | `src/app/register/page.tsx` |
| Login page          | `/login`                   | `src/app/login/page.tsx` |
| User dashboard      | `/dashboard` (logged in)   | `src/app/dashboard/page.tsx` |
| Data listing page   | `/menu`                    | `src/app/menu/page.tsx` |
| Details page        | `/menu/1`                  | `src/app/menu/[id]/page.tsx` |
| Search              | Header search + `/menu?q=` | `src/components/features/menu/MenuBrowser.tsx` |
| Data entry forms    | Admin item form, checkout, contact, register | `src/components/features/admin/ProductDialog.tsx`, `src/components/features/cart/Checkout.tsx` |
| Contact page        | `/contact`                 | `src/app/contact/page.tsx` |
| Admin management    | `/admin` (admin only)      | `src/app/admin/page.tsx` |
| Your order (checkout) | `/cart`                  | `src/app/cart/page.tsx` |
| REST API            | `/api/...`                 | `src/app/api/**/route.ts` |
| Wireframe           | open in a browser          | `docs/wireframe.html`   |
| SQL scripts         | table creation, seed data, queries | `db/schema.sql`, `db/seed.sql`, `db/queries.sql` |

## Design

The look comes from the tuckshop counter itself: a painted blue wall with prices signwritten in yellow.

- **Home page:** the hero is that price board, filled with live prices from the database.
- **Menu:** a grouped price list with dotted leaders running to each price, the way a menu board reads, instead of a grid of cards.
- **Sold-out items:** marked with a red "price sticker".
- **Pictures:** every menu item has its own flat illustration (`public/images/menu/*.svg`) in the same ink-outline style: rolls with russians or boerewors, slap chips in a paper scoop, cooldrink bottles in their brand colours, a Reboost can, chip packets, chocolate bars and mugs. The pictures carry no logos. Admins pick an item's picture from a list when adding or editing it.
- **Colours:**
  - Wall blue `#1F4FA3`
  - Signwriter yellow `#F7C600`
  - Sticker red `#D62718`
  - Ink `#0E1A33`
  - Paper white
  - Concrete grey `#E8EAE5`
- **Type:** Big Shoulders Display, a condensed signage face, for headings and prices. Libre Franklin for reading text.
- **Restraint:** the board is the one bold element. Everything else is plain and left-aligned, with small corners and no decorative shadows. The only automatic animation is the board's prices painting in on load, and it respects reduced-motion settings.

The menu is a typical Windhoek tuckshop: russian, cheese russian, boerewors, mince and chip rolls, vetkoek and slap chips, snacks such as Simba and NikNaks, and Coca-Cola brands, Reboost and Fruitree in the fridge.

## Project structure

```
src/app/               Pages (server components) and the REST API (app/api/**/route.ts)
src/components/ui/     Small reusable pieces: Field, Tabs, Money, StatusTag, Highlight
src/components/layout/ Header, navigation, footer, toast messages, providers
src/components/features/  Menu, cart, auth, dashboard, contact and admin components
src/hooks/             useCart, useFormValidation, useMyOrders, useAdmin, useDebounce, useToast
src/lib/               Database connection, sessions, validation, password hashing, API client
src/lib/data/          All SQL queries, shared by pages and API routes
src/styles/            The stylesheets, split by layer
db/                    SQL scripts (schema, seed data, example queries)
public/images/         Logo, favicon and the menu item illustrations
docs/wireframe.html    Wireframes, site map and ER diagram
```

## Concepts demonstrated

### HTML (written as JSX)
- Semantic structure: `header`, `nav`, `main`, `section`, `article`, `aside`, `footer`, `address`, `time`, `data`, `output`, `mark`, `details`/`summary` (an exclusive accordion using `name`), `dialog`, `dl`
- Forms: `fieldset`/`legend`, `label`, and input types `email`, `tel`, `password`, `number`, `time`, `search`, `checkbox` and `radio`; `select`, `textarea`, `datalist`; validation with `required`, `pattern`, `min`/`max`, `minlength`/`maxlength`
- Tables with `caption`, `thead`/`tbody`, `scope`; ordered and unordered lists; breadcrumb navigation; `iframe` map embed
- Accessibility: skip link, `aria-label`, `aria-expanded`, `aria-current`, `aria-live`, `aria-invalid`, `role="tab"` tab panels with arrow-key support, alt text and visually-hidden labels
- Page titles and descriptions from Next.js `metadata`, viewport theme colour, favicon, Google Fonts

### CSS (`src/styles/`)
- Custom properties (design tokens), `@import`, a modern reset and the box model
- **Flexbox** (header, rows) and **Grid** (`auto-fill`/`minmax`, page layouts)
- **Mobile-first responsive design**: media queries at 600, 768 and 1024px, plus `clamp()` fluid type, `min()` and scrolling tables
- Selectors: pseudo-classes (`:hover`, `:focus-visible`, `:nth-child`, `:not`), pseudo-elements (`::before`, `::after`, `::backdrop`) and attribute selectors (`[aria-pressed='true']`, `[data-score]`)
- Positioning (`sticky`, `absolute`, `fixed`), transitions and `@keyframes` animations
- Dark mode (`prefers-color-scheme`), `prefers-reduced-motion`, print styles (`@media print`)

### JavaScript / TypeScript, client side
- React components, props and state; custom hooks; context (toast messages)
- **TanStack Query**: cached queries, mutations, cache invalidation, polling (order status every 30 seconds), and server-rendered data passed in as `initialData`
- A `class` with private fields and getters (the cart), `EventTarget` events, `localStorage`, syncing between tabs with the `storage` event, and `useSyncExternalStore`
- `fetch` with `async`/`await` and `try`/`catch`, `URLSearchParams` and `history.replaceState` (shareable search URLs), a debounced live search
- Form validation with the Constraint Validation API (`validity`, `setCustomValidity`), a password strength meter, a modal `<dialog>`
- `Intl.NumberFormat`/`toLocaleString` formatting; text is escaped by React, so user input cannot inject HTML

### JavaScript / TypeScript, server side
- **Server components** that query the database directly, dynamic routes (`/menu/[id]`), `notFound()`, `redirect()`
- **REST API** with route handlers: GET, POST, PUT, PATCH and DELETE, JSON, HTTP status codes
- Sessions stored in SQL with an HTTP-only cookie; role-based access control (customer/admin) for pages and API routes
- Password hashing with scrypt and a salt, server-side validation, central error handling

### SQL (`db/`)
- `CREATE TABLE` with primary keys, foreign keys (`ON DELETE CASCADE`/`RESTRICT`), and `NOT NULL`, `UNIQUE`, `CHECK` and `DEFAULT` constraints
- Indexes, **views** (`v_order_summary`, `v_product_sales`), a **trigger** (auto-hide out-of-stock items)
- CRUD with parameterised queries (prevents SQL injection), `JOIN`/`LEFT JOIN`, `GROUP BY`/`HAVING`, aggregates, sub-queries and **transactions** (order placement)

## Using MySQL instead of SQLite

The schema is mostly standard SQL. To run `db/schema.sql` on MySQL 8:
- Replace `INTEGER PRIMARY KEY AUTOINCREMENT` with `INT AUTO_INCREMENT PRIMARY KEY`.
- Remove the `PRAGMA` line.
- Rewrite the trigger. MySQL triggers cannot update their own table, so use:

  ```sql
  CREATE TRIGGER trg_products_out_of_stock BEFORE UPDATE ON products FOR EACH ROW
  SET NEW.is_available = IF(NEW.stock_quantity = 0, 0, NEW.is_available);
  ```
