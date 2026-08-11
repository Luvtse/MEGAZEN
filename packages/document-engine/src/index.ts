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

type PdfColumn = {
  title: string;
  width: number;
  align?: "left" | "center" | "right";
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

const MARGIN_LEFT = 32;
const MARGIN_RIGHT = 32;
const HEADER_HEIGHT = 76;
const FOOTER_HEIGHT = 34;

const CONTENT_WIDTH =
  PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

const BLACK = "#111111";
const DARK_GRAY = "#303030";
const MID_GRAY = "#707070";
const LIGHT_GRAY = "#eeeeee";
const VERY_LIGHT_GRAY = "#f7f7f7";
const WHITE = "#ffffff";

const safeText = (value: unknown): string => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  return String(value);
};

const formatDate = (value: Date): string => {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatNumber = (
  value: number | null | undefined,
  decimals = 3
): string => {
  if (value === null || value === undefined) {
    return "—";
  }

  return value.toFixed(decimals);
};

const formatMoney = (
  currency: string | null | undefined,
  value: number | null | undefined
): string => {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${safeText(currency)} ${value.toFixed(2)}`;
};

const hashForDocument = (
  document: BillOfLadingDocument
): string => {
  return createHash("sha256")
    .update(
      JSON.stringify({
        blNumber: document.blNumber,
        version: document.version,
        documentType: document.documentType,
        issueDate: document.issueDate.toISOString(),
        issuePlace: document.issuePlace,

        placeOfReceipt: document.placeOfReceipt,
        portOfLoading: document.portOfLoading,
        portOfDischarge: document.portOfDischarge,
        placeOfDelivery: document.placeOfDelivery,

        shipperName: document.shipperName,
        shipperAddress: document.shipperAddress,

        consigneeName: document.consigneeName,
        consigneeAddress: document.consigneeAddress,

        notifyPartyName: document.notifyPartyName,
        notifyPartyAddress: document.notifyPartyAddress,

        vesselName: document.vesselName,
        voyageNumber: document.voyageNumber,

        numberOfOriginals: document.numberOfOriginals,
        freightTerms: document.freightTerms,

        marksAndNumbers: document.marksAndNumbers,
        description: document.description,

        grossWeight: document.grossWeight,
        measurement: document.measurement,
        packageCount: document.packageCount,

        currency: document.currency,
        declaredValue: document.declaredValue,

        termsText: document.termsText,

        verificationCode: document.verificationCode,

        containers: document.containers
      })
    )
    .digest("hex");
};

const drawText = (
  pdf: PDFKit.PDFDocument,
  value: string,
  x: number,
  y: number,
  width: number,
  options?: {
    fontSize?: number;
    bold?: boolean;
    align?: "left" | "center" | "right";
    color?: string;
    lineGap?: number;
  }
): void => {
  const fontSize = options?.fontSize ?? 8;
  const font =
    options?.bold === true
      ? "Helvetica-Bold"
      : "Helvetica";

  pdf
    .font(font)
    .fontSize(fontSize)
    .fillColor(options?.color ?? BLACK)
    .text(value, x, y, {
      width,
      align: options?.align ?? "left",
      lineGap: options?.lineGap ?? 1
    });
};

const drawLabel = (
  pdf: PDFKit.PDFDocument,
  value: string,
  x: number,
  y: number,
  width: number
): void => {
  drawText(pdf, value.toUpperCase(), x, y, width, {
    fontSize: 6.2,
    bold: true,
    color: MID_GRAY
  });
};

const drawBox = (
  pdf: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number
): void => {
  pdf
    .lineWidth(0.55)
    .strokeColor(DARK_GRAY)
    .rect(x, y, width, height)
    .stroke();
};

const drawFilledBox = (
  pdf: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number
): void => {
  pdf
    .fillColor(LIGHT_GRAY)
    .rect(x, y, width, height)
    .fill();

  pdf
    .strokeColor(DARK_GRAY)
    .lineWidth(0.55)
    .rect(x, y, width, height)
    .stroke();
};

const drawSectionTitle = (
  pdf: PDFKit.PDFDocument,
  title: string,
  x: number,
  y: number,
  width: number
): number => {
  drawFilledBox(pdf, x, y, width, 20);

  drawText(pdf, title, x + 7, y + 6, width - 14, {
    fontSize: 7,
    bold: true
  });

  return y + 20;
};

const drawFieldBox = (
  pdf: PDFKit.PDFDocument,
  title: string,
  value: string,
  x: number,
  y: number,
  width: number,
  height: number
): void => {
  drawBox(pdf, x, y, width, height);

  drawLabel(pdf, title, x + 7, y + 6, width - 14);

  drawText(pdf, value, x + 7, y + 19, width - 14, {
    fontSize: 8
  });
};

const drawHeader = (
  pdf: PDFKit.PDFDocument,
  document: BillOfLadingDocument,
  pageNumber: number,
  totalPages: number,
  continuation: boolean
): void => {
  const rightX = PAGE_WIDTH - MARGIN_RIGHT - 190;

  drawText(
    pdf,
    "MEGAZEN",
    MARGIN_LEFT,
    24,
    180,
    {
      fontSize: 17,
      bold: true
    }
  );

  drawText(
    pdf,
    "INTERNATIONAL TRANSPORT DOCUMENT",
    MARGIN_LEFT,
    45,
    230,
    {
      fontSize: 6.5,
      color: MID_GRAY
    }
  );

  drawText(
    pdf,
    continuation
      ? "BILL OF LADING — CONTINUATION"
      : "BILL OF LADING",
    rightX,
    24,
    190,
    {
      fontSize: 11,
      bold: true,
      align: "right"
    }
  );

  drawText(
    pdf,
    document.blNumber,
    rightX,
    42,
    190,
    {
      fontSize: 8,
      bold: true,
      align: "right"
    }
  );

  drawText(
    pdf,
    `${document.documentType} · VERSION ${document.version}`,
    rightX,
    55,
    190,
    {
      fontSize: 6.5,
      align: "right",
      color: MID_GRAY
    }
  );

  pdf
    .strokeColor(DARK_GRAY)
    .lineWidth(0.8)
    .moveTo(MARGIN_LEFT, HEADER_HEIGHT)
    .lineTo(PAGE_WIDTH - MARGIN_RIGHT, HEADER_HEIGHT)
    .stroke();

  drawText(
    pdf,
    `Page ${pageNumber} of ${totalPages}`,
    PAGE_WIDTH - MARGIN_RIGHT - 100,
    PAGE_HEIGHT - 25,
    100,
    {
      fontSize: 6,
      align: "right",
      color: MID_GRAY
    }
  );
};

const drawPartySection = (
  pdf: PDFKit.PDFDocument,
  document: BillOfLadingDocument,
  y: number
): number => {
  const gap = 8;
  const width = (CONTENT_WIDTH - gap) / 2;

  const nextY = drawSectionTitle(
    pdf,
    "PARTIES",
    MARGIN_LEFT,
    y,
    CONTENT_WIDTH
  );

  const partyY = nextY;
  const partyHeight = 91;

  drawFieldBox(
    pdf,
    "Shipper",
    `${document.shipperName}\n${document.shipperAddress}`,
    MARGIN_LEFT,
    partyY,
    width,
    partyHeight
  );

  drawFieldBox(
    pdf,
    "Consignee",
    `${document.consigneeName}\n${document.consigneeAddress}`,
    MARGIN_LEFT + width + gap,
    partyY,
    width,
    partyHeight
  );

  const notifyY = partyY + partyHeight;

  drawFieldBox(
    pdf,
    "Notify Party",
    `${safeText(document.notifyPartyName)}\n${safeText(
      document.notifyPartyAddress
    )}`,
    MARGIN_LEFT,
    notifyY,
    width,
    68
  );

  drawFieldBox(
    pdf,
    "Document / Issue",
    `B/L No.: ${document.blNumber}\nIssue Place: ${
      document.issuePlace
    }\nIssue Date: ${formatDate(document.issueDate)}\nOriginals: ${
      document.numberOfOriginals
    }`,
    MARGIN_LEFT + width + gap,
    notifyY,
    width,
    68
  );

  return notifyY + 68 + 8;
};

const drawRoutingSection = (
  pdf: PDFKit.PDFDocument,
  document: BillOfLadingDocument,
  y: number
): number => {
  const gap = 8;
  const width = (CONTENT_WIDTH - gap) / 2;

  const nextY = drawSectionTitle(
    pdf,
    "TRANSPORT ROUTING",
    MARGIN_LEFT,
    y,
    CONTENT_WIDTH
  );

  const boxY = nextY;

  drawFieldBox(
    pdf,
    "Place of Receipt",
    document.placeOfReceipt,
    MARGIN_LEFT,
    boxY,
    width,
    61
  );

  drawFieldBox(
    pdf,
    "Port of Loading",
    document.portOfLoading,
    MARGIN_LEFT + width + gap,
    boxY,
    width,
    61
  );

  const secondY = boxY + 61;

  drawFieldBox(
    pdf,
    "Port of Discharge",
    document.portOfDischarge,
    MARGIN_LEFT,
    secondY,
    width,
    61
  );

  drawFieldBox(
    pdf,
    "Place of Delivery",
    safeText(document.placeOfDelivery),
    MARGIN_LEFT + width + gap,
    secondY,
    width,
    61
  );

  const thirdY = secondY + 61;

  drawFieldBox(
    pdf,
    "Vessel",
    safeText(document.vesselName),
    MARGIN_LEFT,
    thirdY,
    width,
    48
  );

  drawFieldBox(
    pdf,
    "Voyage",
    safeText(document.voyageNumber),
    MARGIN_LEFT + width + gap,
    thirdY,
    width,
    48
  );

  return thirdY + 48 + 8;
};

const drawCargoSummary = (
  pdf: PDFKit.PDFDocument,
  document: BillOfLadingDocument,
  y: number
): number => {
  const gap = 7;

  const marksWidth = 145;
  const descriptionWidth = 245;
  const valueWidth =
    CONTENT_WIDTH -
    marksWidth -
    descriptionWidth -
    gap * 2;

  const nextY = drawSectionTitle(
    pdf,
    "CARGO PARTICULARS",
    MARGIN_LEFT,
    y,
    CONTENT_WIDTH
  );

  const boxY = nextY;
  const boxHeight = 95;

  drawFieldBox(
    pdf,
    "Marks & Numbers",
    safeText(document.marksAndNumbers),
    MARGIN_LEFT,
    boxY,
    marksWidth,
    boxHeight
  );

  drawFieldBox(
    pdf,
    "Description of Goods",
    safeText(document.description),
    MARGIN_LEFT + marksWidth + gap,
    boxY,
    descriptionWidth,
    boxHeight
  );

  drawFieldBox(
    pdf,
    "Declared Value",
    formatMoney(
      document.currency,
      document.declaredValue
    ),
    MARGIN_LEFT +
      marksWidth +
      gap +
      descriptionWidth +
      gap,
    boxY,
    valueWidth,
    boxHeight
  );

  return boxY + boxHeight + 8;
};

const drawMeasurementSummary = (
  pdf: PDFKit.PDFDocument,
  document: BillOfLadingDocument,
  y: number
): number => {
  const gap = 7;

  const widths = [
    120,
    120,
    120,
    CONTENT_WIDTH - 360 - gap * 3
  ];

  const titles = [
    "Package Count",
    "Gross Weight",
    "Measurement",
    "Freight Terms"
  ];

  const values = [
    safeText(document.packageCount),
    formatNumber(document.grossWeight),
    formatNumber(document.measurement),
    safeText(document.freightTerms)
  ];

  let x = MARGIN_LEFT;

  for (let i = 0; i < widths.length; i += 1) {
    drawFieldBox(
      pdf,
      titles[i]!,
      values[i]!,
      x,
      y,
      widths[i]!,
      53
    );

    x += widths[i]! + gap;
  }

  return y + 53 + 8;
};

const getContainerRows = (
  document: BillOfLadingDocument
): string[][] => {
  if (document.containers.length === 0) {
    return [
      [
        "—",
        "—",
        safeText(document.packageCount),
        "Packages",
        formatNumber(document.grossWeight),
        formatNumber(document.measurement)
      ]
    ];
  }

  return document.containers.map((container) => [
    container.containerNumber,
    safeText(container.sealNumber),
    safeText(container.packageCount),
    safeText(container.packageType),
    formatNumber(container.grossWeight),
    formatNumber(container.measurement)
  ]);
};

const CONTAINER_COLUMNS: PdfColumn[] = [
  {
    title: "CONTAINER / EQUIPMENT",
    width: 105
  },
  {
    title: "SEAL",
    width: 80
  },
  {
    title: "PACKAGES",
    width: 73,
    align: "right"
  },
  {
    title: "PACKAGE TYPE",
    width: 100
  },
  {
    title: "GROSS WT.",
    width: 82,
    align: "right"
  },
  {
    title: "MEASUREMENT",
    width: 83,
    align: "right"
  }
];

const drawContainerTableHeader = (
  pdf: PDFKit.PDFDocument,
  y: number
): number => {
  let x = MARGIN_LEFT;

  for (const column of CONTAINER_COLUMNS) {
    drawFilledBox(
      pdf,
      x,
      y,
      column.width,
      24
    );

    drawText(
      pdf,
      column.title,
      x + 4,
      y + 8,
      column.width - 8,
      {
        fontSize: 5.8,
        bold: true,
        align: column.align ?? "left"
      }
    );

    x += column.width;
  }

  return y + 24;
};

const drawContainerRows = (
  pdf: PDFKit.PDFDocument,
  rows: string[][],
  startY: number
): number => {
  let y = startY;

  for (const row of rows) {
    let x = MARGIN_LEFT;

    const rowHeight = 24;

    for (
      let index = 0;
      index < CONTAINER_COLUMNS.length;
      index += 1
    ) {
      const column = CONTAINER_COLUMNS[index]!;
      const value = row[index] ?? "—";

      drawBox(
        pdf,
        x,
        y,
        column.width,
        rowHeight
      );

      drawText(
        pdf,
        value,
        x + 4,
        y + 8,
        column.width - 8,
        {
          fontSize: 6.7,
          align: column.align ?? "left"
        }
      );

      x += column.width;
    }

    y += rowHeight;
  }

  return y;
};

const drawTermsAndVerification = async (
  pdf: PDFKit.PDFDocument,
  document: BillOfLadingDocument,
  contentHash: string,
  y: number
): Promise<number> => {
  const gap = 8;
  const verificationWidth = 145;
  const termsWidth =
    CONTENT_WIDTH - verificationWidth - gap;

  const sectionY = drawSectionTitle(
    pdf,
    "TERMS, CLAUSES & VERIFICATION",
    MARGIN_LEFT,
    y,
    CONTENT_WIDTH
  );

  const boxY = sectionY;
  const boxHeight = 118;

  drawBox(
    pdf,
    MARGIN_LEFT,
    boxY,
    termsWidth,
    boxHeight
  );

  drawLabel(
    pdf,
    "Terms / Clauses",
    MARGIN_LEFT + 7,
    boxY + 7,
    termsWidth - 14
  );

  drawText(
    pdf,
    safeText(document.termsText),
    MARGIN_LEFT + 7,
    boxY + 22,
    termsWidth - 14,
    {
      fontSize: 6.7,
      lineGap: 1.4
    }
  );

  const verificationBaseUrl =
  process.env.MEGAZEN_DOCUMENT_VERIFY_URL ??
  "http://localhost:3000/verify/bl";

const verificationUrl =
  `${verificationBaseUrl}/${encodeURIComponent(
    document.verificationCode
  )}`;

const qrPayload = verificationUrl;

  drawText(
  pdf,
  verificationUrl,
  verificationX + 7,
  boxY + 104,
  verificationWidth - 14,
  {
    fontSize: 4.5,
    align: "center",
    color: MID_GRAY
  }
);

  if (!qrBase64) {
    throw new Error(
      "Unable to create Bill of Lading verification QR code."
    );
  }

  const qrBuffer = Buffer.from(
    qrBase64,
    "base64"
  );

  const verificationX =
    MARGIN_LEFT + termsWidth + gap;

  drawBox(
    pdf,
    verificationX,
    boxY,
    verificationWidth,
    boxHeight
  );

  drawText(
    pdf,
    "DOCUMENT VERIFICATION",
    verificationX + 7,
    boxY + 7,
    verificationWidth - 14,
    {
      fontSize: 7,
      bold: true,
      align: "center"
    }
  );

  pdf.image(
    qrBuffer,
    verificationX + 39,
    boxY + 23,
    {
      width: 67,
      height: 67
    }
  );

  drawText(
    pdf,
    document.verificationCode,
    verificationX + 7,
    boxY + 94,
    verificationWidth - 14,
    {
      fontSize: 6.5,
      bold: true,
      align: "center"
    }
  );

  return boxY + boxHeight;
};

const drawIntegrityFooter = (
  pdf: PDFKit.PDFDocument,
  document: BillOfLadingDocument,
  contentHash: string
): void => {
  const y = PAGE_HEIGHT - 59;

  pdf
    .strokeColor(DARK_GRAY)
    .lineWidth(0.5)
    .moveTo(MARGIN_LEFT, y - 6)
    .lineTo(PAGE_WIDTH - MARGIN_RIGHT, y - 6)
    .stroke();

  drawText(
    pdf,
    `Integrity hash: ${contentHash}`,
    MARGIN_LEFT,
    y,
    CONTENT_WIDTH,
    {
      fontSize: 5.2,
      color: MID_GRAY
    }
  );

  drawText(
    pdf,
    `MEGAZEN · ${document.blNumber} · Version ${document.version} · Status ${document.status}`,
    MARGIN_LEFT,
    y + 10,
    CONTENT_WIDTH,
    {
      fontSize: 5.2,
      color: MID_GRAY
    }
  );

  drawText(
    pdf,
    "Electronic document generated by MEGAZEN.",
    MARGIN_LEFT,
    y + 20,
    CONTENT_WIDTH,
    {
      fontSize: 5.2,
      color: MID_GRAY
    }
  );
};

const createPdf = (): {
  pdf: PDFKit.PDFDocument;
  finished: Promise<Buffer>;
} => {
  const pdf = new PDFDocument({
    size: "A4",
    margins: {
      top: HEADER_HEIGHT + 10,
      bottom: FOOTER_HEIGHT + 10,
      left: MARGIN_LEFT,
      right: MARGIN_RIGHT
    },
    info: {
      Title: "MEGAZEN Bill of Lading",
      Author: "MEGAZEN",
      Subject: "International transport document"
    },
    autoFirstPage: false
  });

  const chunks: Buffer[] = [];

  pdf.on("data", (chunk: Buffer) => {
    chunks.push(chunk);
  });

  const finished = new Promise<Buffer>(
    (resolve, reject) => {
      pdf.on("end", () => {
        resolve(Buffer.concat(chunks));
      });

      pdf.on("error", reject);
    }
  );

  return {
    pdf,
    finished
  };
};

export async function renderBillOfLading(
  document: BillOfLadingDocument
): Promise<Buffer> {
  const { pdf, finished } = createPdf();

  const contentHash =
    document.documentHash ??
    hashForDocument(document);

  const rows = getContainerRows(document);

  /*
   * We deliberately keep the first page dense but readable.
   * Continuation pages are used when the equipment list grows.
   */
  const FIRST_PAGE_ROWS = 7;
  const CONTINUATION_PAGE_ROWS = 23;

  const remainingRows =
    Math.max(
      0,
      rows.length - FIRST_PAGE_ROWS
    );

  const continuationPages =
    Math.ceil(
      remainingRows / CONTINUATION_PAGE_ROWS
    );

  const totalPages =
    1 + continuationPages;

  for (
    let pageNumber = 1;
    pageNumber <= totalPages;
    pageNumber += 1
  ) {
    const continuation =
      pageNumber > 1;

    pdf.addPage();

    drawHeader(
      pdf,
      document,
      pageNumber,
      totalPages,
      continuation
    );

    if (!continuation) {
      let y = HEADER_HEIGHT + 10;

      y = drawPartySection(
        pdf,
        document,
        y
      );

      y = drawRoutingSection(
        pdf,
        document,
        y
      );

      y = drawCargoSummary(
        pdf,
        document,
        y
      );

      y = drawMeasurementSummary(
        pdf,
        document,
        y
      );

      y = drawSectionTitle(
        pdf,
        "CONTAINERS / PACKAGES",
        MARGIN_LEFT,
        y,
        CONTENT_WIDTH
      );

      y = drawContainerTableHeader(
        pdf,
        y
      );

      const firstRows =
        rows.slice(0, FIRST_PAGE_ROWS);

      y = drawContainerRows(
        pdf,
        firstRows,
        y
      );

      /*
       * If there is enough room, render terms
       * on page one. Otherwise they are placed
       * on the final continuation page.
       */
      const termsAvailable =
        PAGE_HEIGHT -
        FOOTER_HEIGHT -
        10 -
        y;

      if (
        continuationPages === 0 &&
        termsAvailable >= 160
      ) {
        y += 8;

        await drawTermsAndVerification(
          pdf,
          document,
          contentHash,
          y
        );
      }
    } else {
      const start =
        FIRST_PAGE_ROWS +
        (pageNumber - 2) *
          CONTINUATION_PAGE_ROWS;

      const end =
        start +
        CONTINUATION_PAGE_ROWS;

      const pageRows =
        rows.slice(start, end);

      let y = HEADER_HEIGHT + 18;

      y = drawSectionTitle(
        pdf,
        "CONTAINERS / PACKAGES — CONTINUATION",
        MARGIN_LEFT,
        y,
        CONTENT_WIDTH
      );

      y = drawContainerTableHeader(
        pdf,
        y
      );

      drawContainerRows(
        pdf,
        pageRows,
        y
      );

      if (
        pageNumber === totalPages
      ) {
        const finalY =
          PAGE_HEIGHT -
          FOOTER_HEIGHT -
          155;

        await drawTermsAndVerification(
          pdf,
          document,
          contentHash,
          finalY
        );
      }
    }

    drawIntegrityFooter(
      pdf,
      document,
      contentHash
    );
  }

  pdf.end();

  return finished;
}

export {
  hashForDocument
};
