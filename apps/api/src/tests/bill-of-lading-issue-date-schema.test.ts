import assert from "node:assert/strict";
import { createBillOfLadingSchema, updateBillOfLadingSchema } from "../validators/bill-of-lading.js";

const base = {
  bookingNumber: "8372946155",
  carrierName: "MEGAZEN Carrier",
  shipperName: "Shipper",
  shipperAddress: "Addis Ababa",
  consigneeName: "Consignee",
  consigneeAddress: "Djibouti",
  portOfLoading: "Djibouti",
  portOfDischarge: "Mombasa",
  placeOfIssue: "Djibouti",
  description: "General cargo"
};

assert.equal(createBillOfLadingSchema.safeParse({ ...base, issueDate: new Date() }).success, false);
assert.equal(updateBillOfLadingSchema.safeParse({ issueDate: new Date() }).success, false);
