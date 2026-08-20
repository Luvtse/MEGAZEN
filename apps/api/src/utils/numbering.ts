import { randomInt } from "node:crypto";

export const SCAC_CODE = "ZENU" as const;
export const CONTAINER_PREFIX = SCAC_CODE;
export const BOOKING_NUMBER_DIGITS = 10 as const;
export const BOOKING_PAYLOAD_DIGITS = 9 as const;
const BOOKING_PAYLOAD_MIN = 100_000_000;
const BOOKING_PAYLOAD_MAX = 999_999_999;

export const calculateBookingCheckDigit = (payload: string): string => {
  if (!/^\d{9}$/.test(payload)) throw new Error("BOOKING_PAYLOAD_MUST_BE_9_DIGITS");
  let sum = 0;
  for (let index = payload.length - 1; index >= 0; index -= 1) {
    let digit = Number(payload[index]);
    const positionFromRight = payload.length - 1 - index;
    if (positionFromRight % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return String((10 - (sum % 10)) % 10);
};

export const isValidBookingNumber = (value: string): boolean =>
  new RegExp(`^[1-9]\\d{${BOOKING_NUMBER_DIGITS - 1}}$`).test(value) &&
  calculateBookingCheckDigit(value.slice(0, BOOKING_PAYLOAD_DIGITS)) === value[BOOKING_NUMBER_DIGITS - 1];

/** Cryptographically generates the 9-digit payload; DB UNIQUE is the collision guarantee. */
export const createBookingNumber = (): string => {
  const payload = String(randomInt(BOOKING_PAYLOAD_MIN, BOOKING_PAYLOAD_MAX + 1));
  return `${payload}${calculateBookingCheckDigit(payload)}`;
};

export const formatBillOfLadingNumber = (bookingNumber: string): string => {
  if (!isValidBookingNumber(bookingNumber)) throw new Error("INVALID_BOOKING_NUMBER");
  return `${SCAC_CODE}${bookingNumber}`;
};

export const isValidBillOfLadingNumber = (value: string): boolean => {
  const normalized = value.trim().toUpperCase();
  return normalized.startsWith(SCAC_CODE) && isValidBookingNumber(normalized.slice(SCAC_CODE.length)) && normalized.length === SCAC_CODE.length + BOOKING_NUMBER_DIGITS;
};

export const isValidContainerNumber = (value: string): boolean => /^ZENU\d{7}$/.test(value.trim().toUpperCase());

/** Generic non-B/L operational document number generator (RO/DO etc.). */
export const createDocumentNumber = (prefix: string): string =>
  `${prefix}-${new Date().getUTCFullYear()}-${Date.now().toString(36).toUpperCase()}-${randomInt(1000, 9999)}`;

export const createVerificationCode = (): string =>
  `MEGA-${Date.now().toString(36).toUpperCase()}-${randomInt(100000, 999999)}`;
