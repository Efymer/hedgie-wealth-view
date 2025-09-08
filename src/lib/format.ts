export const formatAmount = (value: number, opts?: { minimumFractionDigits?: number; maximumFractionDigits?: number; locale?: string }) => {
  const { minimumFractionDigits = 0, maximumFractionDigits = 6, locale = 'en-US' } = opts || {};
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value ?? 0);
};

export const formatTokenBalance = (rawBalance: number, decimals: number, opts?: { locale?: string }) => {
  const actual = (rawBalance ?? 0) / Math.pow(10, Number.isFinite(decimals) ? decimals : 0);
  return formatAmount(actual, { minimumFractionDigits: 0, maximumFractionDigits: 6, locale: opts?.locale });
};

export const formatUSD = (value: number, locale: string = 'en-US') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
  }).format(value ?? 0);
};

export const formatUSDWithDecimals = (
  value: number,
  decimals: number,
  locale: string = 'en-US'
) => {
  const fraction = Number.isFinite(decimals) ? Math.max(0, Math.floor(decimals)) : 2;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: fraction,
    maximumFractionDigits: fraction,
  }).format(value ?? 0);
};

// Expects a percentage value in the 0-100 range (e.g., 2.85 for +2.85%)
export const formatPercent = (value: number, locale: string = 'en-US') => {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format((value ?? 0) / 100);
};
