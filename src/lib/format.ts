// Returns the preferred browser locale, falling back to 'en-US' if not available (e.g., SSR)
const getBrowserLocale = (): string => {
  if (typeof navigator !== 'undefined') {
    const lang = (navigator.languages && navigator.languages[0]) || navigator.language;
    if (lang) return lang;
  }
  return 'en-US';
};

export const formatAmount = (value: number, opts?: { minimumFractionDigits?: number; maximumFractionDigits?: number; locale?: string }) => {
  const { minimumFractionDigits = 0, maximumFractionDigits = 6 } = opts || {};
  const locale = (opts && opts.locale) || getBrowserLocale();
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value ?? 0);
};

export const formatTokenBalance = (rawBalance: number, decimals: number, opts?: { locale?: string }) => {
  const actual = (rawBalance ?? 0) / Math.pow(10, Number.isFinite(decimals) ? decimals : 0);
  return formatAmount(actual, { minimumFractionDigits: 0, maximumFractionDigits: 6, locale: opts?.locale });
};

export const formatCurrency = (value: number, currency: 'USD' | 'EUR' = 'USD', locale?: string) => {
  const loc = locale || getBrowserLocale();
  return new Intl.NumberFormat(loc, {
    style: 'currency',
    currency,
  }).format(value ?? 0);
};

export const formatUSD = (value: number, locale?: string) => {
  return formatCurrency(value, 'USD', locale);
};

export const formatCurrencyWithDecimals = (
  value: number,
  decimals: number,
  currency: 'USD' | 'EUR' = 'USD',
  locale?: string
) => {
  const loc = locale || getBrowserLocale();
  const fraction = Number.isFinite(decimals) ? Math.max(0, Math.floor(decimals)) : 2;
  return new Intl.NumberFormat(loc, {
    style: 'currency',
    currency,
    minimumFractionDigits: fraction,
    maximumFractionDigits: fraction,
  }).format(value ?? 0);
};

export const formatUSDWithDecimals = (
  value: number,
  decimals: number,
  locale?: string
) => {
  return formatCurrencyWithDecimals(value, decimals, 'USD', locale);
};

// Expects a percentage value in the 0-100 range (e.g., 2.85 for +2.85%)
export const formatPercent = (value: number, locale?: string) => {
  const loc = locale || getBrowserLocale();
  return new Intl.NumberFormat(loc, {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format((value ?? 0) / 100);
};
