import crypto from "node:crypto";

export function generateBillOfLadingNumber(): string {
  const timestamp =
    Date.now()
      .toString(36)
      .toUpperCase();

  const random =
    crypto
      .randomBytes(3)
      .toString("hex")
      .toUpperCase();

  return `MZG-${timestamp}-${random}`;
}
