import assert from "node:assert/strict";
import {
  hashForDocument,
  type BillOfLadingDocument
} from "@megazen/document-engine";

const document: BillOfLadingDocument = {
  blNumber: "ZENU8372946155",
  version: 1,
  status: "ISSUED",
  documentType: "ORIGINAL",
  issueDate: new Date("2026-01-01T00:00:00.000Z"),
  issuePlace: "Addis Ababa",
  placeOfReceipt: "Addis Ababa",
  portOfLoading: "Djibouti",
  portOfDischarge: "Mombasa",
  placeOfDelivery: "Nairobi",
  shipperName: "Test Shipper",
  shipperAddress: "Test Address",
  consigneeName: "Test Consignee",
  consigneeAddress: "Test Address",
  notifyPartyName: "Test Notify",
  notifyPartyAddress: "Test Address",
  vesselName: "Test Vessel",
  voyageNumber: "001",
  numberOfOriginals: 3,
  freightTerms: "PREPAID",
  marksAndNumbers: "TEST",
  description: "Test cargo",
  grossWeight: 100,
  measurement: 1.5,
  packageCount: 10,
  currency: "USD",
  declaredValue: 1000,
  termsText: "Test terms",
  verificationCode: "TEST-VERIFY-0001",
  documentHash: null,
  containers: [
    {
      containerNumber: "ZENU0000001",
      sealNumber: "SEAL001",
      packageCount: 10,
      packageType: "40HC",
      grossWeight: 100,
      measurement: 1.5
    }
  ]
};

const first = hashForDocument(document);
const second = hashForDocument({
  ...document,
  documentHash: "ignored-for-content-hash"
});

assert.equal(first, second);
assert.equal(first.length, 64);
assert.match(first, /^[a-f0-9]{64}$/);

console.log("B/L document integrity test passed.");


const mutated = { ...document, description: `${document.description} ` };
assert.notEqual(hashForDocument(document), hashForDocument(mutated), "Document mutations must change the integrity hash");
console.log("document integrity mutation test passed");
