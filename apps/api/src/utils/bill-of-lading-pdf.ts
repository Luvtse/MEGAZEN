/**
 * Backward-compatible adapter for the historical B/L PDF utility.
 *
 * The authoritative renderer is now @megazen/document-engine. Keeping this
 * module as an adapter preserves existing imports while preventing a second
 * independent PDF implementation from drifting away from the canonical B/L
 * workflow, numbering, QR verification, and document-integrity rules.
 */
import crypto from "node:crypto";
import {
  renderBillOfLading,
  type BillOfLadingDocument,
} from "@megazen/document-engine";

export type BillOfLadingContainer = {
  containerNumber: string;
  sealNumber?: string | null;
  containerType?: string | null;
  packageCount?: number | null;
  grossWeight?: number | null;
  measurement?: number | null;
  marksAndNumbers?: string | null;
  description?: string | null;
};

export type BillOfLadingPdfData = {
  blNumber: string;
  issueDate: Date;
  placeOfIssue: string;
  copyType: "ORIGINAL" | "COPY" | "NON_NEGOTIABLE_COPY";
  carrierName: string;
  carrierAddress?: string | null;
  agentName?: string | null;
  agentAddress?: string | null;
  shipperName: string;
  shipperAddress: string;
  consigneeName: string;
  consigneeAddress: string;
  notifyPartyName?: string | null;
  notifyPartyAddress?: string | null;
  placeOfReceipt?: string | null;
  portOfLoading: string;
  portOfDischarge: string;
  placeOfDelivery?: string | null;
  vesselName?: string | null;
  voyageNumber?: string | null;
  freightTerms?: string | null;
  containers: BillOfLadingContainer[];
  totalPackages?: number | null;
  totalGrossWeight?: number | null;
  totalMeasurement?: number | null;
  currency?: string | null;
  declaredValue?: number | null;
  termsText?: string | null;
  /** Legacy callers should pass the MEGAZEN verification URL/token. */
  qrVerificationUrl: string;
  signatureName?: string | null;
  signatureTitle?: string | null;
};

/**
 * Renders through the canonical document engine. This function intentionally
 * does not create or derive a B/L number.
 */
export async function generateBillOfLadingPdf(
  data: BillOfLadingPdfData,
): Promise<Buffer> {
  const document: BillOfLadingDocument = {
    blNumber: data.blNumber,
    version: 1,
    status: "ISSUED",
    documentType: data.copyType,
    issueDate: data.issueDate,
    issuePlace: data.placeOfIssue,
    placeOfReceipt: data.placeOfReceipt ?? "",
    portOfLoading: data.portOfLoading,
    portOfDischarge: data.portOfDischarge,
    placeOfDelivery: data.placeOfDelivery,
    shipperName: data.shipperName,
    shipperAddress: data.shipperAddress,
    consigneeName: data.consigneeName,
    consigneeAddress: data.consigneeAddress,
    notifyPartyName: data.notifyPartyName,
    notifyPartyAddress: data.notifyPartyAddress,
    vesselName: data.vesselName,
    voyageNumber: data.voyageNumber,
    numberOfOriginals: 3,
    freightTerms: data.freightTerms,
    marksAndNumbers: data.containers
      .map((container) => container.marksAndNumbers)
      .filter((value): value is string => Boolean(value))
      .join("\n") || null,
    description: data.containers
      .map((container) => container.description)
      .filter((value): value is string => Boolean(value))
      .join("\n"),
    grossWeight: data.totalGrossWeight ?? null,
    measurement: data.totalMeasurement ?? null,
    packageCount: data.totalPackages ?? null,
    currency: data.currency,
    declaredValue: data.declaredValue ?? null,
    termsText: data.termsText,
    verificationCode: data.qrVerificationUrl,
    documentHash: null,
    containers: data.containers.map((container) => ({
      containerNumber: container.containerNumber,
      sealNumber: container.sealNumber,
      packageCount: container.packageCount,
      packageType: container.containerType,
      grossWeight: container.grossWeight,
      measurement: container.measurement,
    })),
  };

  return renderBillOfLading(document);
}

export function calculatePdfHash(pdf: Buffer): string {
  return crypto.createHash("sha256").update(pdf).digest("hex");
}
