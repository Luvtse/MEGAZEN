import { formatBillOfLadingNumber, isValidBillOfLadingNumber } from "./numbering.js";

/**
 * B/L numbers are inherited from the booking number.
 * This module intentionally exposes no independent B/L-number generator.
 */
export { formatBillOfLadingNumber, isValidBillOfLadingNumber };
