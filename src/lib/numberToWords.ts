/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen"
];

const TENS = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
];

function convertLessThanThousand(num: number): string {
  let result = "";
  if (num >= 100) {
    result += ONES[Math.floor(num / 100)] + " Hundred ";
    num %= 100;
  }
  if (num >= 20) {
    result += TENS[Math.floor(num / 10)] + " ";
    num %= 10;
  }
  if (num > 0) {
    result += ONES[num] + " ";
  }
  return result.trim();
}

/**
 * Converts a number to words in Indian numbering system (Lakhs, Crores).
 */
export function numberToWordsIndian(amount: number, currency: string = "INR"): string {
  const isInr = !currency || currency.toUpperCase() === "INR" || currency.trim().toLowerCase() === "rupees";
  const displayCurrency = isInr ? "Rupees" : currency;
  if (isNaN(amount) || amount === 0) return `${displayCurrency} Zero Only`;

  const absAmount = Math.abs(amount);
  const integerPart = Math.floor(absAmount);
  const decimalPart = Math.round((absAmount - integerPart) * 100);

  let num = integerPart;
  let words = "";

  const crore = Math.floor(num / 10000000);
  num %= 10000000;

  const lakh = Math.floor(num / 100000);
  num %= 100000;

  const thousand = Math.floor(num / 1000);
  num %= 1000;

  const remainder = num;

  if (crore > 0) {
    words += convertLessThanThousand(crore) + " Crore ";
  }
  if (lakh > 0) {
    words += convertLessThanThousand(lakh) + " Lakh ";
  }
  if (thousand > 0) {
    words += convertLessThanThousand(thousand) + " Thousand ";
  }
  if (remainder > 0) {
    words += convertLessThanThousand(remainder);
  }

  words = words.trim();
  if (!words) words = "Zero";

  const currPrefix = displayCurrency ? `${displayCurrency} ` : "";
  let result = `${currPrefix}${words}`;

  if (decimalPart > 0) {
    const decimalWords = convertLessThanThousand(decimalPart);
    const subUnit = isInr ? "Paise" : "Cents";
    result += ` and ${decimalWords} ${subUnit}`;
  }

  return `${result} Only`.replace(/\s+/g, " ");
}

/**
 * Converts a number to words in International numbering system (Millions, Billions).
 */
export function numberToWordsInternational(amount: number, currency: string = "USD"): string {
  if (isNaN(amount) || amount === 0) return `${currency} Zero Only`;

  const absAmount = Math.abs(amount);
  const integerPart = Math.floor(absAmount);
  const decimalPart = Math.round((absAmount - integerPart) * 100);

  let num = integerPart;
  let words = "";

  const billion = Math.floor(num / 1000000000);
  num %= 1000000000;

  const million = Math.floor(num / 1000000);
  num %= 1000000;

  const thousand = Math.floor(num / 1000);
  num %= 1000;

  const remainder = num;

  if (billion > 0) {
    words += convertLessThanThousand(billion) + " Billion ";
  }
  if (million > 0) {
    words += convertLessThanThousand(million) + " Million ";
  }
  if (thousand > 0) {
    words += convertLessThanThousand(thousand) + " Thousand ";
  }
  if (remainder > 0) {
    words += convertLessThanThousand(remainder);
  }

  words = words.trim();
  if (!words) words = "Zero";

  const currPrefix = currency ? `${currency} ` : "";
  let result = `${currPrefix}${words}`;

  if (decimalPart > 0) {
    const decimalWords = convertLessThanThousand(decimalPart);
    let subUnit = "Cents";
    const upperCurr = currency.toUpperCase();
    if (upperCurr === "GBP") subUnit = "Pence";
    else if (upperCurr === "AED") subUnit = "Fils";
    else if (upperCurr === "EUR") subUnit = "Cents";
    else if (upperCurr === "INR") subUnit = "Paise";

    result += ` and ${decimalWords} ${subUnit}`;
  }

  return `${result} Only`.replace(/\s+/g, " ");
}

/**
 * Automatically chooses Indian numbering system for INR and International numbering system for all other currencies.
 */
export function formatAmountInWords(amount: number, currency: string = "INR"): string {
  if (!currency || currency.toUpperCase() === "INR") {
    return numberToWordsIndian(amount, "Rupees");
  }
  return numberToWordsInternational(amount, currency);
}

/**
 * Formats a number with Indian grouping (e.g. 1,00,000.00) for INR,
 * or International grouping (e.g. 1,000,000.00) for all other currencies.
 */
export function formatNumberForCurrency(
  amount: number,
  currency: string = "INR",
  minimumFractionDigits: number = 2,
  maximumFractionDigits: number = 2
): string {
  if (isNaN(amount) || amount === null || amount === undefined) return "0.00";
  const isIndian = !currency || currency.toUpperCase() === "INR";
  const locale = isIndian ? "en-IN" : "en-US";
  return Number(amount).toLocaleString(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  });
}
