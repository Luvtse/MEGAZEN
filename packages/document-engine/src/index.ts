import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { createHash } from "node:crypto";

export type BillOfLadingContainer = {
  containerNumber: string;
  sealNumber?: string | null;
  packageCount?: number | null;
  packageType?: string | null;
  grossWeight?: number | null;
  measurement?: number | null;
};

export type BillOfLadingDocument = {
  blNumber: string;
  version: number;
  status: string;
  documentType: string;
  issueDate: Date;
  issuePlace: string;
  placeOfReceipt: string;
  portOfLoading: string;
  portOfDischarge: string;
  placeOfDelivery?: string | null;
  shipperName: string;
  shipperAddress: string;
  consigneeName: string;
  consigneeAddress: string;
  notifyPartyName?: string | null;
  notifyPartyAddress?: string | null;
  vesselName?: string | null;
  voyageNumber?: string | null;
  numberOfOriginals: number;
  freightTerms?: string | null;
  marksAndNumbers?: string | null;
  description: string;
  grossWeight?: number | null;
  measurement?: number | null;
  packageCount?: number | null;
  currency?: string | null;
  declaredValue?: number | null;
  termsText?: string | null;
  verificationCode: string;
  documentHash?: string | null;
  containers: BillOfLadingContainer[];
};

const margin = 36;
const pageWidth = 595.28;
const pageHeight = 841.89;

const text = (value: unknown): string =>
  value === null || value === undefined || value === "" ? "—" : String(value);

const money = (currency: string | null | undefined, value: number | null | undefined): string =>
  value === null || value === undefined ? "—" : `${text(currency)} ${value.toFixed(2)}`;

const hashForDocument = (document: BillOfLadingDocument): string =>
  createHash("sha256").update(JSON.stringify({
    blNumber: document.blNumber,
    version: document.version,
    issueDate: document.issueDate.toISOString(),
    verificationCode: document.verificationCode,
    shipperName: document.shipperName,
    consigneeName: document.consigneeName,
    description: document.description,
    containers: document.containers
  })).digest("hex");

const header = (pdf: PDFKit.PDFDocument, document: BillOfLadingDocument, page: number, totalPages: number) => {
  pdf.font("Helvetica-Bold").fontSize(16).text("MEGAZEN", margin, 28);
  pdf.font("Helvetica").fontSize(7).text("INTERNATIONAL TRANSPORT DOCUMENT", margin, 48);
  pdf.font("Helvetica-Bold").fontSize(12).text("BILL OF LADING", 370, 28, { width: 189, align: "right" });
  pdf.font("Helvetica").fontSize(8).text(`No. ${document.blNumber}`, 370, 45, { width: 189, align: "right" });
  pdf.text(`${document.documentType} • Version ${document.version}`, 370, 58, { width: 189, align: "right" });
  pdf.moveTo(margin, 74).lineTo(pageWidth - margin, 74).stroke();
  pdf.fontSize(7).text(`Page ${page} of ${totalPages}`, 450, pageHeight - 28, { width: 109, align: "right" });
};

const box = (pdf: PDFKit.PDFDocument, title: string, body: string, x: number, y: number, w: number, h: number) => {
  pdf.rect(x, y, w, h).stroke();
  pdf.font("Helvetica-Bold").fontSize(7).text(title, x + 7, y + 6, { width: w - 14 });
  pdf.font("Helvetica").fontSize(8).text(body, x + 7, y + 20, { width: w - 14, height: h - 25 });
};

export async function renderBillOfLading(document: BillOfLadingDocument): Promise<Buffer> {
  const pdf = new PDFDocument({
    size: "A4",
    margins: { top: 90, bottom: 42, left: margin, right: margin },
    info: {
      Title: `Bill of Lading ${document.blNumber}`,
      Author: "MEGAZEN",
      Subject: "International transport document"
    },
    autoFirstPage: false
  });

  const chunks: Buffer[] = [];
  pdf.on("data", (chunk: Buffer) => chunks.push(chunk));
  const finished = new Promise<Buffer>((resolve, reject) => {
    pdf.on("end", () => resolve(Buffer.concat(chunks)));
    pdf.on("error", reject);
  });

  const contentHash = document.documentHash ?? hashForDocument(document);
  const rows: string[][] = document.containers.length
    ? document.containers.map((c) => [
        c.containerNumber,
        text(c.sealNumber),
        text(c.packageCount),
        text(c.packageType),
        c.grossWeight === null || c.grossWeight === undefined ? "—" : c.grossWeight.toFixed(3),
        c.measurement === null || c.measurement === undefined ? "—" : c.measurement.toFixed(3)
      ])
    : [["—", "—", text(document.packageCount), "Packages", text(document.grossWeight), text(document.measurement)]];

  const rowsPerPage = 12;
  const pageCount = Math.max(1, Math.ceil(rows.length / rowsPerPage));
  const totalPages = pageCount;

  for (let page = 1; page <= totalPages; page += 1) {
    pdf.addPage();
    header(pdf, document, page, totalPages);
    let y = 88;

    if (page === 1) {
      box(pdf, "SHIPPER", `${document.shipperName}\n${document.shipperAddress}`, margin, y, 255, 82);
      box(pdf, "CONSIGNEE", `${document.consigneeName}\n${document.consigneeAddress}`, 303, y, 256, 82);
      y += 92;
      box(pdf, "NOTIFY PARTY", `${text(document.notifyPartyName)}\n${text(document.notifyPartyAddress)}`, margin, y, 255, 66);
      box(pdf, "DOCUMENT / ISSUE", `B/L: ${document.blNumber}\nPlace: ${document.issuePlace}\nDate: ${document.issueDate.toISOString().slice(0, 10)}\nOriginals: ${document.numberOfOriginals}`, 303, y, 256, 66);
      y += 76;
      box(pdf, "ROUTING", `Receipt: ${document.placeOfReceipt}\nLoading: ${document.portOfLoading}\nDischarge: ${document.portOfDischarge}\nDelivery: ${text(document.placeOfDelivery)}`, margin, y, 255, 86);
      box(pdf, "VESSEL / VOYAGE", `Vessel: ${text(document.vesselName)}\nVoyage: ${text(document.voyageNumber)}\nFreight: ${text(document.freightTerms)}`, 303, y, 256, 86);
      y += 96;
      box(pdf, "MARKS & NUMBERS", text(document.marksAndNumbers), margin, y, 170, 76);
      box(pdf, "DESCRIPTION OF GOODS", text(document.description), 212, y, 210, 76);
      box(pdf, "DECLARED VALUE", money(document.currency, document.declaredValue), 434, y, 125, 76);
      y += 86;
    }

    pdf.font("Helvetica-Bold").fontSize(8).text("CONTAINERS / PACKAGES", margin, y);
    y += 13;

    const widths = [82, 75, 65, 105, 75, 97];
    const labels = ["CONTAINER", "SEAL", "PACKAGES", "TYPE", "GROSS WT.", "MEASUREMENT"];
    let x = margin;
    pdf.font("Helvetica-Bold").fontSize(6.5);
    labels.forEach((label, i) => { pdf.rect(x, y, widths[i], 20).stroke(); pdf.text(label, x + 3, y + 7, { width: widths[i] - 6 }); x += widths[i]; });
    y += 20;
    pdf.font("Helvetica").fontSize(7);

    const pageRows = rows.slice((page - 1) * rowsPerPage, page * rowsPerPage);
    for (const row of pageRows) {
      x = margin;
      const rowHeight = 23;
      row.forEach((value, i) => {
        pdf.rect(x, y, widths[i], rowHeight).stroke();
        pdf.text(value, x + 3, y + 7, { width: widths[i] - 6, ellipsis: true });
        x += widths[i];
      });
      y += rowHeight;
    }

    if (page === totalPages) {
      y += 14;
      box(pdf, "TERMS / CLAUSES", text(document.termsText), margin, y, 360, 86);
      const qrPayload = `MEGAZEN|BL=${document.blNumber}|V=${document.version}|H=${contentHash}|C=${document.verificationCode}`;
      const qr = await QRCode.toDataURL(qrPayload, { errorCorrectionLevel: "M", margin: 1, width: 110 });
      const qrBuffer = Buffer.from(qr.split(",")[1], "base64");
      pdf.rect(434, y, 125, 86).stroke();
      pdf.image(qrBuffer, 469, y + 6, { width: 56, height: 56 });
      pdf.font("Helvetica").fontSize(6).text("VERIFY DOCUMENT", 442, y + 64, { width: 109, align: "center" });
      pdf.fontSize(5).text(document.verificationCode, 440, y + 73, { width: 113, align: "center" });
      y += 98;
      pdf.font("Helvetica").fontSize(6).text(`Document integrity hash: ${contentHash}`, margin, y, { width: 523 });
      pdf.text("This electronically generated document is an immutable MEGAZEN document representation once issued.", margin, y + 11, { width: 523 });
      pdf.font("Helvetica-Bold").fontSize(7).text(`Status: ${document.status}`, margin, y + 29);
    }
  }

  pdf.end();
  return finished;
}
