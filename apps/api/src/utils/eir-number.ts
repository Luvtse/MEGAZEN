import { randomInt } from "node:crypto";

const EIR_PREFIX = "EIR-ZENU";

/**
 * Generates an Equipment Interchange Receipt reference on the backend only.
 * The database UNIQUE constraint remains the authoritative collision guard.
 */
export const createEirNumber = (): string => {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const entropy = randomInt(0, 1_000_000).toString().padStart(6, "0");
  return `${EIR_PREFIX}-${date}-${entropy}`;
};
