/**
 * Formats integer paise into INR currency representation
 * @param {number} paise
 * @param {boolean} includeDecimals
 * @returns {string} e.g. "₹2,499"
 */
export function formatPaise(paise, includeDecimals = false) {
  if (paise === null || paise === undefined || isNaN(paise)) {
    return '₹0';
  }

  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: includeDecimals ? 2 : 0,
    minimumFractionDigits: includeDecimals ? 2 : 0,
  }).format(rupees);
}

export const formatINR = (amount) => formatPaise(amount * 100);
