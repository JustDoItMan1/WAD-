// Formatting helpers shared by server and client components

// Prices are written like the board: "N$28", with cents only when there are some.
// Browsers render NAD as a bare "$", so the Namibian "N$" prefix is added explicitly.
const wholeFormatter = new Intl.NumberFormat('en-NA', { maximumFractionDigits: 0 });
const centsFormatter = new Intl.NumberFormat('en-NA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatMoney = (amount: number) =>
  `N$${(Number.isInteger(amount) ? wholeFormatter : centsFormatter).format(amount)}`;

// SQLite stores UTC as "YYYY-MM-DD HH:MM:SS"
export const formatDate = (value: string) =>
  new Date(`${value.replace(' ', 'T')}Z`).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Windhoek',
  });

export const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

export const isSoldOut = (product: { is_available: number; stock_quantity: number }) =>
  !product.is_available || product.stock_quantity === 0;

export const imageLabel = (url: string) => url.split('/').pop()!.replace('.svg', '').replaceAll('-', ' ');
