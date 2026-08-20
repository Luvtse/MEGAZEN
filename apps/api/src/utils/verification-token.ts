import crypto from "node:crypto";

export function createVerificationToken(): string {
  return crypto
    .randomBytes(32)
    .toString("hex");
}
