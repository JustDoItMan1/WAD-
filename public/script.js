// Tuck In: all browser-side behaviour for every page.
// Each page sets <body data-page="..."> and only its own section below runs.
'use strict';

// ---------- DOM and formatting helpers ----------

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

// Prices are written like the board: "N$28", with cents only when there are some.
// Browsers render NAD as a bare "$", so the Namibian "N$" prefix is added explicitly.
const wholeFormatter = new Intl.NumberFormat('en-NA', { maximumFractionDigits: 0 });
const centsFormatter = new Intl.NumberFormat('en-NA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatMoney = (amount) =>
  `N$${(Number.isInteger(amount) ? wholeFormatter : centsFormatter).format(amount)}`;

// SQLite stores UTC as "YYYY-MM-DD HH:MM:SS"
const formatDate = (value) =>
  new Date(`${value.replace(' ', 'T')}Z`).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Windhoek',
  });

// Escape user-supplied text before putting it into innerHTML (prevents XSS)
const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ESCAPES[char]);

// Wraps matches of the search term in <mark> for highlighted search results
const highlight = (text, term) => {
  const safe = escapeHtml(text);
  if (!term) return safe;
  const pattern = new RegExp(`(${escapeHtml(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return safe.replace(pattern, '<mark>$1</mark>');
};

// Debounce: waits until the user stops typing before running fn (closure keeps the timer)
const debounce = (fn, delay = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

const toast = (message, type = 'info') => {
  let region = $('.toast-region');
  if (!region) {
    region = document.createElement('div');
    region.className = 'toast-region';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    document.body.append(region);
  }
  const item = document.createElement('p');
  item.className = `toast toast--${type}`;
  item.textContent = message;
  region.append(item);
  setTimeout(() => item.remove(), 3500);
};

const capitalise = (text) => text.charAt(0).toUpperCase() + text.slice(1);
const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

const statusTag = (status) =>
  `<span class="status status--${escapeHtml(status)}">${escapeHtml(capitalise(status))}</span>`;

const isSoldOut = (product) => !product.is_available || product.stock_quantity === 0;

// One line of the price list: name ...... price, description, and an Add button
const menuRow = (product, term = '') => {
  const soldOut = isSoldOut(product);
  return `
    <li class="menu-row ${soldOut ? 'menu-row--sold-out' : ''}">
      <img class="menu-row__img" src="${escapeHtml(product.image_url)}" alt="" width="64" height="64" loading="lazy">
      <div class="menu-row__line">
        <h3 class="menu-row__name"><a href="/product?id=${product.product_id}">${highlight(product.name, term)}</a></h3>
        <span class="leader" aria-hidden="true"></span>
        <data class="menu-row__price" value="${product.price}">${formatMoney(product.price)}</data>
      </div>
      <p class="menu-row__desc">${highlight(product.description ?? '', term)}</p>
      <div class="menu-row__action">
        ${soldOut
          ? '<span class="sticker">Sold out</span>'
          : `<button class="btn btn--sm btn--sign" type="button" data-add="${product.product_id}"
              aria-label="Add ${escapeHtml(product.name)} to your order">Add</button>`}
      </div>
    </li>`;
};

// Sets up an accessible tab interface (arrow keys move between tabs)
const initTabs = (tablist, onChange = () => {}) => {
  const tabs = $$('[role="tab"]', tablist);
  const select = (tab) => {
    tabs.forEach((other) => {
      const selected = other === tab;
      other.setAttribute('aria-selected', String(selected));
      other.tabIndex = selected ? 0 : -1;
      document.getElementById(other.getAttribute('aria-controls')).hidden = !selected;
    });
    onChange(tab.id);
  };
  tablist.addEventListener('click', (event) => {
    const tab = event.target.closest('[role="tab"]');
    if (tab) select(tab);
  });
  tablist.addEventListener('keydown', (event) => {
    const index = tabs.indexOf(document.activeElement);
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (index < 0 || !step) return;
    const next = tabs[(index + step + tabs.length) % tabs.length];
    next.focus();
    select(next);
  });
  return select;
};

// ---------- Talking to the server ----------

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Thin wrapper around fetch(): sends/receives JSON and turns HTTP errors into exceptions
const request = async (method, url, body) => {
  const options = {
    method,
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
  };
  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`/api${url}`, options);
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection.', 0);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(data.error ?? `Request failed (${response.status})`, response.status);
  return data;
};

const api = {
  get: (url) => request('GET', url),
  post: (url, body = {}) => request('POST', url, body),
  put: (url, body = {}) => request('PUT', url, body),
  patch: (url, body = {}) => request('PATCH', url, body),
  delete: (url) => request('DELETE', url),
};

// Session helper cached for the lifetime of the page
let currentUserPromise;
const getCurrentUser = () => {
  currentUserPromise ??= api.get('/auth/me').then(({ user }) => user).catch(() => null);
  return currentUserPromise;
};

// ---------- Shopping cart ----------
// Stored in localStorage so it survives page reloads.
// Demonstrates an ES class, private fields, getters and custom events.

const CART_KEY = 'tuckin-cart';
const MAX_QTY = 20;

class Cart extends EventTarget {
  #items = [];

  constructor() {
    super();
    this.#load();
    // Keep multiple open tabs in sync
    window.addEventListener('storage', (event) => {
      if (event.key === CART_KEY) {
        this.#load();
        this.#notify();
      }
    });
  }

  get items() {
    return [...this.#items];
  }

  get count() {
    return this.#items.reduce((total, item) => total + item.quantity, 0);
  }

  get total() {
    return this.#items.reduce((total, { price, quantity }) => total + price * quantity, 0);
  }

  add({ product_id, name, price, image_url }, quantity = 1) {
    const existing = this.#items.find((item) => item.productId === product_id);
    if (existing) {
      existing.quantity = Math.min(existing.quantity + quantity, MAX_QTY);
    } else {
      this.#items.push({ productId: product_id, name, price, image: image_url, quantity });
    }
    this.#save();
  }

  update(productId, quantity) {
    if (quantity <= 0) return this.remove(productId);
    const item = this.#items.find((entry) => entry.productId === productId);
    if (item) item.quantity = Math.min(quantity, MAX_QTY);
    this.#save();
  }

  remove(productId) {
    this.#items = this.#items.filter((item) => item.productId !== productId);
    this.#save();
  }

  clear() {
    this.#items = [];
    this.#save();
  }

  #load() {
    try {
      this.#items = JSON.parse(localStorage.getItem(CART_KEY)) ?? [];
    } catch {
      this.#items = [];
    }
  }

  #save() {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(this.#items));
    } catch {
      // Storage may be unavailable (private mode); the cart still works for this page
    }
    this.#notify();
  }

  #notify() {
    this.dispatchEvent(new CustomEvent('change', { detail: { count: this.count } }));
  }
}

const cart = new Cart();

// ---------- Form validation ----------
// Built on the HTML5 Constraint Validation API. The server validates again;
// this gives instant, friendly feedback.

const messageFor = (input) => {
  const { validity } = input;
  const label = input.labels?.[0]?.textContent.replace('*', '').trim() ?? 'This field';
  if (validity.valueMissing && input.type === 'checkbox') return 'Tick this box to continue.';
  if (validity.valueMissing) return input.dataset.requiredMessage ?? `${label} is required.`;
  if (validity.typeMismatch) return `Enter a valid ${input.type === 'email' ? 'email address' : 'value'}.`;
  if (validity.tooShort) return `${label} must be at least ${input.minLength} characters.`;
  if (validity.rangeUnderflow) return `${label} must be at least ${input.min}.`;
  if (validity.rangeOverflow) return `${label} must be at most ${input.max}.`;
  if (validity.patternMismatch) return input.dataset.patternMessage ?? `${label} is in the wrong format.`;
  if (validity.customError) return input.validationMessage;
  return '';
};

const showError = (input) => {
  const error = $(`#${input.id}-error`);
  const message = input.validity.valid ? '' : messageFor(input);
  input.setAttribute('aria-invalid', String(!input.validity.valid));
  input.closest('.field')?.classList.toggle('has-error', Boolean(message));
  if (error) error.textContent = message;
  return !message;
};

// Attaches live validation to a form. `extraChecks` can add cross-field rules.
const enableValidation = (form, extraChecks = () => {}) => {
  form.noValidate = true; // we display our own messages instead of the browser bubbles
  const fields = $$('input, select, textarea', form).filter((el) => el.id && el.type !== 'hidden');

  fields.forEach((input) => {
    input.setAttribute('aria-describedby', `${input.id}-error`);
    input.addEventListener('blur', () => {
      extraChecks(form);
      showError(input);
    });
    input.addEventListener('input', () => {
      if (input.getAttribute('aria-invalid') === 'true') {
        extraChecks(form);
        showError(input);
      }
    });
  });

  return () => {
    extraChecks(form);
    const results = fields.map(showError);
    const firstInvalid = fields.find((input) => !input.validity.valid);
    firstInvalid?.focus();
    return results.every(Boolean);
  };
};

// Reads every named field of a form into a plain object
const formToObject = (form) => {
  const data = Object.fromEntries(new FormData(form));
  $$('input[type="checkbox"]', form).forEach((box) => {
    if (box.name) data[box.name] = box.checked;
  });
  return data;
};

const setBusy = (button, busy, busyText = 'Please wait…') => {
  button.disabled = busy;
  if (busy) {
    button.dataset.label = button.textContent;
    button.textContent = busyText;
  } else if (button.dataset.label) {
    button.textContent = button.dataset.label;
  }
};

// ---------- Behaviour shared by every page ----------
// Navigation, auth-aware links, cart badge and add-to-cart buttons

const products = new Map();

// Pages call this after rendering product rows so the "Add" buttons know what they add
const registerProducts = (list) => list.forEach((product) => products.set(product.product_id, product));

const initNavigation = () => {
  const toggle = $('.nav-toggle');
  const nav = $('#site-nav');
  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    nav.classList.toggle('is-open', !open);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav?.classList.contains('is-open')) {
      toggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
      toggle.focus();
    }
  });

  // Highlight the link for the current page
  const path = location.pathname.replace(/\.html$/, '').replace(/\/index$/, '/');
  $$('.site-nav a').forEach((link) => {
    if (link.getAttribute('href') === path) link.setAttribute('aria-current', 'page');
  });

  const searchInput = $('#site-search');
  if (searchInput) searchInput.value = new URLSearchParams(location.search).get('q') ?? '';
};

const initAuthLinks = async () => {
  const user = await getCurrentUser();
  const role = user ? 'user' : 'guest';
  $$('[data-auth]').forEach((item) => {
    const wanted = item.dataset.auth;
    item.hidden = wanted === 'admin' ? user?.role !== 'admin' : wanted !== role;
  });

  $('[data-logout]')?.addEventListener('click', async () => {
    await api.post('/auth/logout');
    location.href = '/';
  });
};

const initCartBadge = () => {
  const render = () => {
    $$('[data-cart-count]').forEach((badge) => {
      badge.textContent = cart.count;
      badge.classList.remove('bump');
      void badge.offsetWidth; // restart the CSS animation
      badge.classList.add('bump');
    });
  };
  cart.addEventListener('change', render);
  $$('[data-cart-count]').forEach((badge) => (badge.textContent = cart.count));
};

// Event delegation: one listener handles every current and future "Add" button
const initAddButtons = () => {
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-add]');
    if (!button) return;
    const product = products.get(Number(button.dataset.add));
    if (!product) return;
    const quantity = Number(button.dataset.qty ?? 1);
    cart.add(product, quantity);
    toast(`Added ${quantity} × ${product.name}`, 'success');
  });
};

// ---------- Home ----------

const ROLLS_CATEGORY = 1;
const COLD_DRINKS_CATEGORY = 4;

// The board shows the hot rolls plus a couple of cold drinks, like the wall at the counter
const pickBoardItems = (list) => {
  const available = list.filter((product) => !isSoldOut(product));
  return [
    ...available.filter((p) => p.category_id === ROLLS_CATEGORY).slice(0, 6),
    ...available.filter((p) => p.category_id === COLD_DRINKS_CATEGORY).slice(0, 3),
  ];
};

const renderBoard = async () => {
  const board = $('#board');
  try {
    const { products: list } = await api.get('/products?sort=menu');
    board.innerHTML = pickBoardItems(list)
      .map((product) => `
        <li>
          <a href="/product?id=${product.product_id}">${escapeHtml(product.name)}</a>
          <span class="leader" aria-hidden="true"></span>
          <data value="${product.price}">${formatMoney(product.price)}</data>
        </li>`)
      .join('');
  } catch (error) {
    board.innerHTML = `<li>${escapeHtml(error.message)}</li>`;
  }
};

// Tells visitors whether the counter is open right now
const showOpenStatus = () => {
  const now = new Date();
  const day = now.getDay();
  const time = now.toTimeString().slice(0, 5);
  const closing = day === 5 ? '14:00' : '15:30';
  const isWeekday = day >= 1 && day <= 5;
  const status = $('#open-status');
  if (isWeekday && time >= '07:30' && time < closing) {
    status.textContent = `Open now until ${closing}.`;
  } else if (isWeekday && time < '07:30') {
    status.textContent = 'Opens today at 07:30. You can place an order now for later.';
  }
};

const initHome = () => {
  renderBoard();
  showOpenStatus();
};

// ---------- Menu (data listing and search) ----------
// The price list grouped by section, with live search, section filter and sorting.
// Filter state is kept in the URL so results can be shared.

const initMenu = () => {
  const form = $('#filters');
  const results = $('#results');
  const resultCount = $('#result-count');
  const chips = $('#categories');
  const state = { q: '', category: '', sort: 'menu', available: false };
  let categories = [];

  const readUrl = () => {
    const params = new URLSearchParams(location.search);
    state.q = params.get('q') ?? '';
    state.category = params.get('category') ?? '';
    state.sort = params.get('sort') ?? 'menu';
    state.available = params.get('available') === '1';
    form.q.value = state.q;
    form.sort.value = state.sort;
    form.available.checked = state.available;
  };

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (state.q) params.set('q', state.q);
    if (state.category) params.set('category', state.category);
    if (state.sort !== 'menu') params.set('sort', state.sort);
    if (state.available) params.set('available', '1');
    return params.toString();
  };

  const renderChips = () => {
    const all = { category_id: '', name: 'Everything' };
    chips.innerHTML = [all, ...categories]
      .map(({ category_id, name }) => `
        <button type="button" class="chip" data-category="${category_id}"
          aria-pressed="${String(category_id) === state.category}">${escapeHtml(name)}</button>`)
      .join('');
  };

  // Groups products under their section heading, keeping the chosen sort inside each group
  const renderGroups = (list) => categories
    .map((category) => ({ category, items: list.filter((p) => p.category_id === category.category_id) }))
    .filter(({ items }) => items.length > 0)
    .map(({ category, items }) => `
      <section class="price-group" aria-labelledby="group-${category.category_id}">
        <h2 id="group-${category.category_id}">${escapeHtml(category.name)}</h2>
        <ul role="list">${items.map((product) => menuRow(product, state.q)).join('')}</ul>
      </section>`)
    .join('');

  const describeResults = (count) =>
    state.q ? `${plural(count, 'item')} matching “${state.q}”` : plural(count, 'item');

  const loadProducts = async () => {
    const query = buildQuery();
    history.replaceState(null, '', query ? `?${query}` : location.pathname);
    results.setAttribute('aria-busy', 'true');
    try {
      const { products: list, count } = await api.get(`/products?${query}`);
      registerProducts(list);
      resultCount.textContent = describeResults(count);
      results.innerHTML = count
        ? renderGroups(list)
        : `<p class="empty-state">Nothing on the menu matches “${escapeHtml(state.q)}”. Try “russian”, “chips” or “Coke”.</p>`;
    } catch (error) {
      results.innerHTML = `<p class="alert alert--error">${escapeHtml(error.message)}</p>`;
    } finally {
      results.removeAttribute('aria-busy');
    }
  };

  const init = async () => {
    readUrl();
    const [categoryData, { products: all }] = await Promise.all([api.get('/categories'), api.get('/products')]);
    categories = categoryData.categories.sort((a, b) => a.category_id - b.category_id);
    renderChips();
    const names = [...new Set(all.map(({ name }) => name))];
    $('#product-names').innerHTML = names.map((name) => `<option value="${escapeHtml(name)}">`).join('');
    loadProducts();
  };

  form.q.addEventListener('input', debounce(() => {
    state.q = form.q.value.trim();
    loadProducts();
  }, 300));

  form.addEventListener('change', (event) => {
    if (event.target === form.q) return;
    state.sort = form.sort.value;
    state.available = form.available.checked;
    loadProducts();
  });

  form.addEventListener('submit', (event) => event.preventDefault());

  chips.addEventListener('click', (event) => {
    const chip = event.target.closest('[data-category]');
    if (!chip) return;
    state.category = chip.dataset.category;
    $$('.chip', chips).forEach((other) => other.setAttribute('aria-pressed', String(other === chip)));
    loadProducts();
  });

  init().catch((error) => {
    results.innerHTML = `<p class="alert alert--error">${escapeHtml(error.message)}</p>`;
  });
};

// ---------- Product details ----------
// Reads ?id= from the URL and shows one menu item on its own board

const stockText = (product) => {
  if (isSoldOut(product)) return 'Sold out until the next delivery';
  if (product.stock_quantity < 10) return `Only ${product.stock_quantity} left today`;
  return 'In stock';
};

const renderProduct = (container, product) => {
  const soldOut = isSoldOut(product);
  const maxQty = Math.max(1, Math.min(product.stock_quantity, MAX_QTY));
  document.title = `${product.name} | Tuck In`;
  $('#crumb-category').textContent = product.category;

  container.innerHTML = `
    <header class="product-board">
      <img class="product-board__img" src="${escapeHtml(product.image_url)}" alt="${escapeHtml(product.name)}" width="180" height="180">
      <div>
        <h1>${escapeHtml(product.name)}</h1>
        <p>${escapeHtml(product.description ?? '')}</p>
      </div>
      <data class="product-board__price" value="${product.price}">${formatMoney(product.price)}</data>
    </header>
    <dl class="product-facts">
      <dt>Section</dt><dd><a href="/menu?category=${product.category_id}">${escapeHtml(product.category)}</a></dd>
      <dt>Availability</dt><dd>${stockText(product)}</dd>
    </dl>
    ${soldOut ? '<p><span class="sticker">Sold out</span></p>' : `
    <form class="purchase" id="purchase-form">
      <div class="qty">
        <button type="button" data-step="-1" aria-label="One less">−</button>
        <label class="visually-hidden" for="quantity">Quantity</label>
        <input type="number" id="quantity" value="1" min="1" max="${maxQty}">
        <button type="button" data-step="1" aria-label="One more">+</button>
      </div>
      <button class="btn btn--sign" type="submit" data-add="${product.product_id}">Add to order</button>
      <a class="btn btn--outline" href="/cart">View your order</a>
    </form>`}`;

  const form = $('#purchase-form');
  if (!form) return;
  const quantity = $('#quantity');
  const addButton = $('[data-add]', form);
  const clamp = (value) => Math.max(1, Math.min(maxQty, value || 1));
  const sync = (value) => {
    quantity.value = clamp(value);
    addButton.dataset.qty = quantity.value;
    addButton.textContent = quantity.value === '1' ? 'Add to order' : `Add ${quantity.value} to order`;
  };

  form.addEventListener('click', (event) => {
    const step = Number(event.target.dataset.step);
    if (step) sync(Number(quantity.value) + step);
  });
  quantity.addEventListener('change', () => sync(Number(quantity.value)));
  form.addEventListener('submit', (event) => event.preventDefault());
};

const initProduct = () => {
  const container = $('#product');
  const id = new URLSearchParams(location.search).get('id');

  const load = async () => {
    if (!id) throw new Error('No item was chosen.');
    const { product, related } = await api.get(`/products/${encodeURIComponent(id)}`);
    registerProducts([product, ...related]);
    renderProduct(container, product);
    if (related.length) {
      $('#related').innerHTML = related.map((item) => menuRow(item)).join('');
      $('#related-title').textContent = `More ${product.category.toLowerCase()}`;
      $('#related-section').hidden = false;
    }
  };

  load().catch((error) => {
    container.innerHTML = `
      <h1>Item not found</h1>
      <p>${escapeHtml(error.message)} It may have been taken off the menu.</p>
      <p><a class="btn" href="/menu">Go to the menu</a></p>`;
  });
};

// ---------- About ----------

// Accordion behaviour: opening one FAQ answer closes the others
const initAbout = () => {
  const questions = $$('.faq details');
  questions.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (item.open) questions.filter((other) => other !== item).forEach((other) => (other.open = false));
    });
  });
};

// ---------- Your order (cart and checkout) ----------

// Suggest the next 15-minute slot at least 20 minutes from now
const suggestPickupTime = () => {
  const now = new Date(Date.now() + 20 * 60 * 1000);
  now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0);
  const time = now.toTimeString().slice(0, 5);
  return time < '07:30' || time > '15:30' ? '07:30' : time;
};

const initCart = () => {
  const list = $('#cart-items');
  const form = $('#checkout-form');
  const errorBox = $('#checkout-error');

  const render = () => {
    const { items, count, total } = cart;
    $('#cart-empty').hidden = items.length > 0;
    $('#summary-count').textContent = count;
    $('#summary-total').textContent = formatMoney(total);
    $('#place-order').disabled = items.length === 0;
    list.innerHTML = items
      .map(({ productId, name, price, image, quantity }) => `
        <li class="slip-row" data-id="${productId}">
          <img class="slip-row__img" src="${escapeHtml(image ?? '/images/menu/default.svg')}" alt="" width="56" height="56">
          <div>
            <h3><a href="/product?id=${productId}">${escapeHtml(name)}</a></h3>
            <p class="field-hint">${formatMoney(price)} each</p>
          </div>
          <p class="slip-row__total">${formatMoney(price * quantity)}</p>
          <div class="slip-row__controls">
            <div class="qty">
              <button type="button" data-step="-1" aria-label="One less ${escapeHtml(name)}">−</button>
              <label class="visually-hidden" for="qty-${productId}">Quantity of ${escapeHtml(name)}</label>
              <input type="number" id="qty-${productId}" value="${quantity}" min="1" max="${MAX_QTY}">
              <button type="button" data-step="1" aria-label="One more ${escapeHtml(name)}">+</button>
            </div>
            <button class="btn btn--sm btn--outline" type="button" data-remove>Remove</button>
          </div>
        </li>`)
      .join('');
  };

  list.addEventListener('click', (event) => {
    const row = event.target.closest('.slip-row');
    if (!row) return;
    const id = Number(row.dataset.id);
    const current = cart.items.find((item) => item.productId === id);
    if (event.target.closest('[data-remove]')) cart.remove(id);
    const step = Number(event.target.dataset.step);
    if (step && current) cart.update(id, current.quantity + step);
  });

  list.addEventListener('change', (event) => {
    const row = event.target.closest('.slip-row');
    if (row) cart.update(Number(row.dataset.id), Math.round(Number(event.target.value)));
  });

  const validate = enableValidation(form);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBox.textContent = '';
    if (!validate()) return;
    const button = $('#place-order');
    setBusy(button, true, 'Sending…');
    try {
      const { payment, pickupTime, notes } = formToObject(form);
      const items = cart.items.map(({ productId, quantity }) => ({ productId, quantity }));
      const { orderId } = await api.post('/orders', { pickupTime, notes, payment, items });
      cart.clear();
      location.href = `/dashboard?placed=${orderId}&at=${encodeURIComponent(pickupTime)}`;
    } catch (error) {
      errorBox.textContent = error.message;
      setBusy(button, false);
    }
  });

  cart.addEventListener('change', render);
  render();
  getCurrentUser().then((user) => {
    form.hidden = !user;
    $('#login-prompt').hidden = Boolean(user);
    form.pickupTime.value = suggestPickupTime();
  }).catch(() => toast('Could not check whether you are logged in.', 'error'));
};

// ---------- Contact ----------

const initContact = () => {
  const form = $('#contact-form');
  const status = $('#form-status');
  const validate = enableValidation(form);

  // Pre-fill name and email for logged-in users
  const fillUser = async () => {
    const user = await getCurrentUser();
    if (!user) return;
    form.name.value = user.name;
    form.email.value = user.email;
  };

  form.message.addEventListener('input', () => {
    $('#char-count').textContent = form.message.value.length;
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    status.textContent = '';
    status.className = 'alert';
    if (!validate()) return;
    const button = $('[type="submit"]', form);
    setBusy(button, true, 'Sending…');
    try {
      await api.post('/contact', formToObject(form));
      form.reset();
      fillUser();
      $('#char-count').textContent = '0';
      status.classList.add('alert--success');
      status.textContent = 'Message sent. We reply by email within one school day.';
    } catch (error) {
      status.classList.add('alert--error');
      status.textContent = error.message;
    } finally {
      setBusy(button, false);
    }
  });

  fillUser();
};

// ---------- Login and registration ----------

// Only allow redirects to pages on this site (prevents open-redirect attacks)
const nextUrl = (fallback) => {
  const next = new URLSearchParams(location.search).get('next');
  return next && next.startsWith('/') && !next.startsWith('//') ? next : fallback;
};

const initShowPassword = (form) => {
  $('#show-password').addEventListener('change', (event) => {
    $$('input[name$="assword"]', form).forEach((input) => {
      input.type = event.target.checked ? 'text' : 'password';
    });
  });
};

// Carry ?next= across the "log in" / "register" links
const keepNextOnLinks = () => {
  const next = new URLSearchParams(location.search).get('next');
  if (!next) return;
  $$('[data-keep-next]').forEach((link) => {
    link.href += `?next=${encodeURIComponent(next)}`;
  });
};

const initLogin = () => {
  const form = $('#login-form');
  const errorBox = $('#form-error');
  const validate = enableValidation(form);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBox.textContent = '';
    if (!validate()) return;
    const button = $('[type="submit"]', form);
    setBusy(button, true, 'Logging in…');
    try {
      const { user } = await api.post('/auth/login', formToObject(form));
      location.href = nextUrl(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (error) {
      errorBox.textContent = error.message;
      form.password.value = '';
      form.password.focus();
      setBusy(button, false);
    }
  });

  initShowPassword(form);
  keepNextOnLinks();
};

const STRENGTH = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];

// Scores a password 0–4 using a list of regular-expression rules
const scorePassword = (password) => {
  const rules = [/.{8,}/, /[A-Z]/, /[a-z]/, /\d/, /[^A-Za-z0-9]/];
  const passed = rules.filter((rule) => rule.test(password)).length;
  return Math.max(0, passed - 1);
};

const initRegister = () => {
  const form = $('#register-form');
  const errorBox = $('#form-error');

  // The meter's colour and width come from its data-score attribute in styles.css
  form.password.addEventListener('input', () => {
    const { value } = form.password;
    const score = scorePassword(value);
    $('#password-meter').dataset.score = value ? score : 'empty';
    $('#password-strength').textContent = value
      ? `Strength: ${STRENGTH[score]}`
      : 'At least 8 characters with a capital letter, a small letter and a number.';
  });

  // Cross-field rule: both password boxes must match
  const passwordsMatch = () => {
    const { password, confirmPassword } = form;
    confirmPassword.setCustomValidity(
      confirmPassword.value && confirmPassword.value !== password.value ? 'Passwords do not match.' : ''
    );
  };

  const validate = enableValidation(form, passwordsMatch);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBox.textContent = '';
    if (!validate()) return;
    const button = $('[type="submit"]', form);
    setBusy(button, true, 'Creating account…');
    try {
      await api.post('/auth/register', formToObject(form));
      location.href = nextUrl('/dashboard?welcome=1');
    } catch (error) {
      errorBox.textContent = error.message;
      setBusy(button, false);
    }
  });

  initShowPassword(form);
  keepNextOnLinks();
};

// ---------- Customer dashboard ----------
// Order history with status tracking, and editing your details

const ACTIVE_STATUSES = ['pending', 'preparing', 'ready'];

const orderItem = (order) => `
  <article class="order">
    <div class="order__head">
      <h3>Order ${order.order_id}</h3>
      ${statusTag(order.status)}
    </div>
    <p class="order__meta">
      Collect at <strong>${escapeHtml(order.pickup_time)}</strong>, paying by ${escapeHtml(order.payment_method)}.
      Ordered <time datetime="${escapeHtml(order.created_at)}">${formatDate(order.created_at)}</time>.
    </p>
    <ul class="order__items" role="list">
      ${order.items.map((item) => `<li><img src="${escapeHtml(item.image_url)}" alt="" width="36" height="36">${item.quantity} × ${escapeHtml(item.name)}</li>`).join('')}
    </ul>
    ${order.notes ? `<p>Note: ${escapeHtml(order.notes)}</p>` : ''}
    <div class="order__foot">
      <span class="order__total">${formatMoney(order.total_amount)}</span>
      ${order.status === 'pending'
        ? `<button class="btn btn--sm btn--outline" type="button" data-cancel="${order.order_id}">Cancel order</button>`
        : ''}
    </div>
  </article>`;

const initDashboard = () => {
  let orders = [];

  const renderOrders = () => {
    const filter = $('#order-filter').value;
    const visible = orders.filter((order) =>
      !filter || (filter === 'active' ? ACTIVE_STATUSES.includes(order.status) : order.status === filter)
    );
    $('#orders').innerHTML = visible.length
      ? visible.map(orderItem).join('')
      : '<p class="empty-state">No orders here. <a href="/menu">Order from the menu</a>.</p>';
    const spent = orders.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + o.total_amount, 0);
    $('#stat-orders').textContent = orders.length;
    $('#stat-active').textContent = orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length;
    $('#stat-spent').textContent = formatMoney(spent);
  };

  const loadOrders = async () => {
    ({ orders } = await api.get('/orders'));
    renderOrders();
  };

  $('#order-filter').addEventListener('change', renderOrders);
  $('#orders').addEventListener('click', async (event) => {
    const id = event.target.dataset.cancel;
    if (!id || !confirm(`Cancel order ${id}?`)) return;
    try {
      await api.patch(`/orders/${id}/cancel`);
      toast(`Order ${id} cancelled`);
      loadOrders();
    } catch (error) {
      toast(error.message, 'error');
    }
  });

  const profileForm = $('#profile-form');
  const validateProfile = enableValidation(profileForm);
  profileForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!validateProfile()) return;
    const button = $('[type="submit"]', profileForm);
    setBusy(button, true, 'Saving…');
    try {
      await api.put('/auth/me', formToObject(profileForm));
      toast('Details saved', 'success');
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setBusy(button, false);
    }
  });

  // One-off toast after checkout or sign-up, then the query string is removed so a reload does not repeat it
  const showNotice = () => {
    const params = new URLSearchParams(location.search);
    if (params.has('placed')) {
      toast(`Order ${params.get('placed')} sent. Collect it at ${params.get('at') ?? 'your chosen time'}.`, 'success');
    }
    if (params.has('welcome')) toast('Account created. You can order now.', 'success');
    if (params.has('placed') || params.has('welcome')) history.replaceState(null, '', location.pathname);
  };

  const init = async () => {
    const user = await getCurrentUser();
    if (!user) return (location.href = '/login?next=/dashboard');
    $('#greeting').textContent = `${user.name.split(' ')[0]}'s orders`;
    profileForm.name.value = user.name;
    profileForm.email.value = user.email;
    profileForm.phone.value = user.phone ?? '';
    showNotice();
    initTabs($('.tabs'));
    await loadOrders();
    // Check every 30 seconds so status changes made at the counter show up
    setInterval(loadOrders, 30_000);
  };

  init().catch((error) => toast(error.message, 'error'));
};

// ---------- Admin: menu items (listing, data entry form, delete) ----------

const initAdminProducts = () => {
  const dialog = $('#product-dialog');
  const form = $('#product-form');
  const errorBox = $('#product-error');
  const validate = enableValidation(form);
  let list = [];

  const row = (product) => `
    <tr>
      <td class="item-cell"><img src="${escapeHtml(product.image_url)}" alt="" width="40" height="40"><a href="/product?id=${product.product_id}">${escapeHtml(product.name)}</a></td>
      <td>${escapeHtml(product.category)}</td>
      <td class="num">${formatMoney(product.price)}</td>
      <td class="num">${product.stock_quantity < 10 ? `<span class="low-stock">${product.stock_quantity}</span>` : product.stock_quantity}</td>
      <td>${product.is_available ? 'Yes' : 'Hidden'}</td>
      <td class="actions-cell">
        <button class="btn btn--sm" type="button" data-edit="${product.product_id}">Edit</button>
        <button class="btn btn--sm btn--danger" type="button" data-delete="${product.product_id}">Delete</button>
      </td>
    </tr>`;

  const render = () => {
    const term = $('#product-search').value.trim().toLowerCase();
    const visible = list.filter(({ name, category }) => `${name} ${category}`.toLowerCase().includes(term));
    $('#products-body').innerHTML = visible.length
      ? visible.map(row).join('')
      : '<tr><td colspan="6" class="empty-state">No menu items match that search.</td></tr>';
  };

  const loadProducts = async () => {
    ({ products: list } = await api.get('/products'));
    render();
  };

  // Fills the picture picker from the images folder and keeps the preview in sync
  const loadImages = async () => {
    const { images } = await api.get('/admin/images');
    form.image.innerHTML = images
      .map((url) => `<option value="${escapeHtml(url)}">${escapeHtml(url.split('/').pop().replace('.svg', '').replaceAll('-', ' '))}</option>`)
      .join('');
  };

  const showPreview = () => ($('#p-image-preview').src = form.image.value);
  form.image.addEventListener('change', showPreview);

  const loadCategories = async () => {
    const { categories } = await api.get('/categories');
    $('#p-category').innerHTML = '<option value="">Select…</option>' + categories
      .map(({ category_id, name }) => `<option value="${category_id}">${escapeHtml(name)}</option>`)
      .join('');
  };

  const openForm = (product) => {
    form.reset();
    errorBox.textContent = '';
    $$('.field-error', form).forEach((el) => (el.textContent = ''));
    $('#dialog-title').textContent = product ? `Edit ${product.name}` : 'Add menu item';
    $('#productId').value = product?.product_id ?? '';
    if (product) {
      form.name.value = product.name;
      form.categoryId.value = product.category_id;
      form.description.value = product.description ?? '';
      form.price.value = product.price;
      form.stock.value = product.stock_quantity;
      form.isAvailable.checked = Boolean(product.is_available);
      form.image.value = product.image_url;
    }
    showPreview();
    dialog.showModal();
    form.name.focus();
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBox.textContent = '';
    if (!validate()) return;
    const { productId, ...data } = formToObject(form);
    const button = $('[type="submit"]', form);
    setBusy(button, true, 'Saving…');
    try {
      if (productId) await api.put(`/admin/products/${productId}`, data);
      else await api.post('/admin/products', data);
      dialog.close();
      toast(`${data.name} saved`, 'success');
      loadProducts();
    } catch (error) {
      errorBox.textContent = error.message;
    } finally {
      setBusy(button, false);
    }
  });

  $('#add-product').addEventListener('click', () => openForm(null));
  $('#cancel-dialog').addEventListener('click', () => dialog.close());
  $('#product-search').addEventListener('input', render);
  $('#products-body').addEventListener('click', async (event) => {
    const { edit, delete: remove } = event.target.dataset;
    if (edit) openForm(list.find((p) => p.product_id === Number(edit)));
    if (!remove) return;
    const product = list.find((p) => p.product_id === Number(remove));
    if (!confirm(`Delete ${product.name} from the menu? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/products/${remove}`);
      toast(`${product.name} deleted`, 'success');
      loadProducts();
    } catch (error) {
      toast(error.message, 'error');
    }
  });

  return { loadProducts, loadImages, loadCategories };
};

// ---------- Admin dashboard ----------
// Statistics, order management, customers and contact messages

const ORDER_STATUSES = ['pending', 'preparing', 'ready', 'collected', 'cancelled'];

const initAdmin = () => {
  const { loadProducts, loadImages, loadCategories } = initAdminProducts();

  const loadOverview = async () => {
    const { stats, topProducts } = await api.get('/admin/stats');
    const figures = [
      ['Takings', formatMoney(stats.revenue)],
      ['Orders to make', stats.open_orders],
      ['All orders', stats.orders],
      ['Customers', stats.customers],
      ['Items running low', stats.low_stock],
      ['Unread messages', stats.unread_messages],
    ];
    $('#stats').innerHTML = figures
      .map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`)
      .join('');
    $('#top-products').innerHTML = topProducts
      .map((p) => `<tr><td>${escapeHtml(p.name)}</td><td>${escapeHtml(p.category)}</td><td class="num">${p.units_sold}</td><td class="num">${formatMoney(p.revenue)}</td></tr>`)
      .join('');
  };

  const loadOrders = async () => {
    const status = $('#status-filter').value;
    const { orders } = await api.get(`/admin/orders${status ? `?status=${status}` : ''}`);
    $('#orders-body').innerHTML = orders.length
      ? orders.map((order) => `
        <tr>
          <td>${order.order_id}</td>
          <td>${escapeHtml(order.customer_name)}<br><small>${formatDate(order.created_at)}</small></td>
          <td>${order.items.map((i) => `${i.quantity} × ${escapeHtml(i.name)}`).join('<br>')}
            ${order.notes ? `<br><em>“${escapeHtml(order.notes)}”</em>` : ''}</td>
          <td>${escapeHtml(order.pickup_time)}<br><small>${escapeHtml(order.payment_method)}</small></td>
          <td class="num">${formatMoney(order.total_amount)}</td>
          <td>
            <label class="visually-hidden" for="status-${order.order_id}">Status of order ${order.order_id}</label>
            <select id="status-${order.order_id}" data-order="${order.order_id}">
              ${ORDER_STATUSES.map((s) => `<option value="${s}" ${s === order.status ? 'selected' : ''}>${capitalise(s)}</option>`).join('')}
            </select>
          </td>
        </tr>`).join('')
      : '<tr><td colspan="6" class="empty-state">No orders with this status.</td></tr>';
  };

  const loadCustomers = async () => {
    const { users } = await api.get('/admin/users');
    $('#customers-body').innerHTML = users
      .map((u) => `
        <tr>
          <td>${escapeHtml(u.full_name)}</td>
          <td><a href="mailto:${escapeHtml(u.email)}">${escapeHtml(u.email)}</a></td>
          <td>${escapeHtml(u.phone ?? '—')}</td>
          <td>${statusTag(u.role)}</td>
          <td class="num">${u.order_count}</td>
          <td class="num">${formatMoney(u.total_spent)}</td>
          <td>${formatDate(u.created_at)}</td>
        </tr>`)
      .join('');
  };

  const loadMessages = async () => {
    const { messages } = await api.get('/admin/messages');
    $('#messages').innerHTML = messages.length
      ? messages.map((m) => `
        <article class="message ${m.is_read ? '' : 'message--unread'}">
          <h3>${escapeHtml(m.subject)}${m.is_read ? '' : ' <span class="status status--pending">New</span>'}</h3>
          <p><strong>${escapeHtml(m.name)}</strong> &lt;<a href="mailto:${escapeHtml(m.email)}">${escapeHtml(m.email)}</a>&gt;
            <br><small>${formatDate(m.created_at)}</small></p>
          <p>${escapeHtml(m.message)}</p>
          <div class="actions-cell">
            <button class="btn btn--sm" type="button" data-read="${m.message_id}" data-value="${m.is_read ? 0 : 1}">
              Mark as ${m.is_read ? 'unread' : 'read'}</button>
            <button class="btn btn--sm btn--danger" type="button" data-remove="${m.message_id}">Delete</button>
          </div>
        </article>`).join('')
      : '<p class="empty-state">No messages yet. Messages sent from the contact page appear here.</p>';
  };

  const loaders = {
    'tab-overview': loadOverview,
    'tab-orders': loadOrders,
    'tab-products': loadProducts,
    'tab-customers': loadCustomers,
    'tab-messages': loadMessages,
  };

  const safely = (fn) => fn().catch((error) => toast(error.message, 'error'));

  $('#status-filter').addEventListener('change', () => safely(loadOrders));
  $('#orders-body').addEventListener('change', async (event) => {
    const id = event.target.dataset.order;
    if (!id) return;
    try {
      await api.patch(`/admin/orders/${id}`, { status: event.target.value });
      toast(`Order ${id} is now ${event.target.value}`);
    } catch (error) {
      toast(error.message, 'error');
      loadOrders();
    }
  });

  $('#messages').addEventListener('click', (event) => {
    const { read, value, remove } = event.target.dataset;
    if (!read && !remove) return;
    safely(async () => {
      if (read) await api.patch(`/admin/messages/${read}`, { isRead: value === '1' });
      if (remove && confirm('Delete this message?')) await api.delete(`/admin/messages/${remove}`);
      await loadMessages();
    });
  });

  initTabs($('.tabs'), (tabId) => safely(loaders[tabId]));
  safely(loadCategories);
  safely(loadImages);
  safely(loadOverview);
};

// ---------- Start ----------

const PAGES = {
  home: initHome,
  menu: initMenu,
  product: initProduct,
  about: initAbout,
  cart: initCart,
  contact: initContact,
  login: initLogin,
  register: initRegister,
  dashboard: initDashboard,
  admin: initAdmin,
};

initNavigation();
initAuthLinks();
initCartBadge();
initAddButtons();
$$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
PAGES[document.body.dataset.page]?.();
