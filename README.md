# Tuck In: Tuckshop Ordering System

Well designed website, no spaghetti.

A responsive web application for a school or campus tuckshop. Customers browse and search the menu, order ahead and track their orders. Administrators manage orders, products, customers and messages.

Built with plain **HTML**, **CSS** and **vanilla JavaScript**, and a **SQL database** (SQLite, built into Node). A small Node.js server (`server.js`) serves the pages and the JSON API, using only modules built into Node.

## Running it

Requires **Node.js 22.13 or newer**. The SQLite database is built into Node, so there is nothing else to install.

```bash
npm start            # run the site at http://localhost:4000 (same as: node server.js)
npm run dev          # same, restarting when server.js changes
npm run db:reset     # delete the database; it is rebuilt from the SQL scripts on the next start
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
| Homepage            | `/`                        | `public/index.html`     |
| About page          | `/about`                   | `public/about.html`     |
| Registration page   | `/register`                | `public/register.html`  |
| Login page          | `/login`                   | `public/login.html`     |
| User dashboard      | `/dashboard` (logged in)   | `public/dashboard.html` |
| Data listing page   | `/menu`                    | `public/menu.html`      |
| Details page        | `/product?id=1`            | `public/product.html`   |
| Search              | Header search + `/menu?q=` | `public/menu.html`, `public/script.js` |
| Data entry forms    | Admin item form, checkout, contact, register | `public/admin.html`, `public/cart.html` |
| Contact page        | `/contact`                 | `public/contact.html`   |
| Admin management    | `/admin` (admin only)      | `public/admin.html`     |
| Your order (checkout) | `/cart`                  | `public/cart.html`      |
| REST API            | `/api/...`                 | `server.js`             |
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
public/*.html          One standalone HTML file per page
public/styles.css      All the CSS
public/script.js       All the browser-side JavaScript; each page runs its own section
server.js              Serves the pages and the REST API, talks to the database
db/                    SQL scripts (schema, seed data, example queries)
public/images/         Logo, favicon and the menu item illustrations
docs/wireframe.html    Wireframes, site map and ER diagram
```

## Concepts demonstrated

### HTML
- Semantic structure: `header`, `nav`, `main`, `section`, `article`, `aside`, `footer`, `address`, `time`, `data`, `output`, `mark`, `details`/`summary` (an exclusive accordion using `name`), `dialog`, `dl`
- Forms: `fieldset`/`legend`, `label`, and input types `email`, `tel`, `password`, `number`, `time`, `search`, `checkbox` and `radio`; `select`, `textarea`, `datalist`; validation with `required`, `pattern`, `min`/`max`, `minlength`/`maxlength`
- Tables with `caption`, `thead`/`tbody`, `scope`; ordered and unordered lists; breadcrumb navigation; `iframe` map embed
- Accessibility: skip link, `aria-label`, `aria-expanded`, `aria-current`, `aria-live`, `aria-invalid`, `role="tab"` tab panels with arrow-key support, alt text and visually-hidden labels
- Page titles and meta descriptions, viewport theme colour, favicon, Google Fonts

### CSS (`public/styles.css`)
- Custom properties (design tokens), a modern reset and the box model
- **Flexbox** (header, rows) and **Grid** (`auto-fill`/`minmax`, page layouts)
- **Mobile-first responsive design**: media queries at 600, 768 and 1024px, plus `clamp()` fluid type, `min()` and scrolling tables
- Selectors: pseudo-classes (`:hover`, `:focus-visible`, `:nth-child`, `:not`), pseudo-elements (`::before`, `::after`, `::backdrop`) and attribute selectors (`[aria-pressed='true']`, `[data-score]`)
- Positioning (`sticky`, `absolute`, `fixed`), transitions and `@keyframes` animations
- Dark mode (`prefers-color-scheme`), `prefers-reduced-motion`, print styles (`@media print`)

### JavaScript, client side (`public/script.js`)
- DOM selection and updates, template literals, event listeners and event delegation (one listener for every "Add" button)
- A `class` with private fields and getters (the cart), `EventTarget` custom events, `localStorage`, and syncing between tabs with the `storage` event
- `fetch` with `async`/`await` and `try`/`catch`, `URLSearchParams` and `history.replaceState` (shareable search URLs), a debounced live search, polling (order status every 30 seconds)
- Form validation with the Constraint Validation API (`validity`, `setCustomValidity`), a password strength meter, a modal `<dialog>`, accessible tabs
- `Intl.NumberFormat`/`toLocaleString` formatting; user input is escaped before it goes into the page, so it cannot inject HTML

### JavaScript, server side (`server.js`)
- An HTTP server built with Node's `http` module: serves the HTML pages and redirects to the login page for `/dashboard` and `/admin`
- **REST API**: GET, POST, PUT, PATCH and DELETE, JSON, HTTP status codes
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
