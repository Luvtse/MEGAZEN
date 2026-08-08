import { randomInt } from "node:crypto";

export const yearCode = (): string => new Date().getUTCFullYear().toString();

export const createDocumentNumber = (prefix: string): string =>
  `${prefix}-${yearCode()}-${Date.now().toString(36).toUpperCase()}-${randomInt(1000, 9999)}`;

export const createVerificationCode = (): string =>
  `MEGA-${Date.now().toString(36).toUpperCase()}-${randomInt(100000, 999999)}`;
