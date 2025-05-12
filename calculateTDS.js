/**
 * Calculates the gross amount and TDS deducted from a given net amount.
 *
 * @param {number} netAmount - The net amount received after TDS deduction.
 * @param {number} [tdsPercent=2] - The TDS percentage (optional, default is 2%).
 * @returns {{ gross: number, tds: number }} - The calculated gross amount and TDS value.
 *
 * @example
 * calculateTDS(9800) // => { gross: 10000, tds: 200 }
 * calculateTDS(9000, 10) // => { gross: 10000, tds: 1000 }
 */
function calculateTDS(netAmount, tdsPercent = 2) {
  if (typeof netAmount !== 'number' || netAmount <= 0) {
    throw new Error('netAmount must be a positive number');
  }
  if (typeof tdsPercent !== 'number' || tdsPercent < 0 || tdsPercent >= 100) {
    throw new Error('tdsPercent must be a number between 0 and 100');
  }

  const gross = netAmount / (1 - tdsPercent / 100);
  const tds = gross - netAmount;

  return {
    gross: parseFloat(gross.toFixed(2)),
    tds: parseFloat(tds.toFixed(2)),
  };
}

console.log(calculateTDS(9800)); // { gross: 10000, tds: 200 }
console.log(calculateTDS(9000, 10)); // { gross: 10000, tds: 1000 }
