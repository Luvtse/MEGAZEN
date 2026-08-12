import PDFDocument from "pdfkit";
import crypto from "node:crypto";

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

  copyType:
    | "ORIGINAL"
    | "COPY"
    | "NON_NEGOTIABLE_COPY";

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

  qrVerificationUrl: string;

  signatureName?: string | null;
  signatureTitle?: string | null;
};

type RenderContext = {
  document: PDFKit.PDFDocument;
  pageWidth: number;
  pageHeight: number;
  margin: number;
  contentWidth: number;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

const MARGIN = 36;

const HEADER_HEIGHT = 88;
const FOOTER_HEIGHT = 38;

const ROW_MIN_HEIGHT = 32;

const BLACK = "#111111";
const DARK = "#202020";
const MID = "#666666";
const LIGHT = "#E5E5E5";
const WHITE = "#FFFFFF";

function safe(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

function money(
  value: number | null | undefined,
  currency: string | null | undefined
): string {
  if (value === null || value === undefined) {
    return "";
  }

  const code = safe(currency);

  return `${code} ${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`.trim();
}

function dateText(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function drawRule(
  context: RenderContext,
  y: number
): void {
  context.document
    .moveTo(
      context.margin,
      y
    )
    .lineTo(
      context.pageWidth -
        context.margin,
      y
    )
    .strokeColor(LIGHT)
    .lineWidth(0.6)
    .stroke();
}

function drawText(
  document: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number,
  width: number,
  fontSize = 8,
  bold = false
): void {
  document
    .font(
      bold
        ? "Helvetica-Bold"
        : "Helvetica"
    )
    .fontSize(fontSize)
    .fillColor(BLACK)
    .text(
      text,
      x,
      y,
      {
        width,
        lineGap: 1.5
      }
    );
}

function drawLabel(
  document: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number,
  width: number
): void {
  document
    .font("Helvetica-Bold")
    .fontSize(6.5)
    .fillColor(MID)
    .text(
      text.toUpperCase(),
      x,
      y,
      {
        width
      }
    );
}

function drawBox(
  document: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  document
    .rect(
      x,
      y,
      width,
      height
    )
    .strokeColor(LIGHT)
    .lineWidth(0.6)
    .stroke();
}

function drawHeader(
  context: RenderContext,
  data: BillOfLadingPdfData,
  continuation: boolean
): number {
  const {
    document,
    pageWidth,
    margin
  } = context;

  document
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor(BLACK)
    .text(
      data.carrierName,
      margin,
      margin
    );

  document
    .font("Helvetica")
    .fontSize(7)
    .fillColor(MID)
    .text(
      safe(data.carrierAddress),
      margin,
      margin + 23,
      240
    );

  document
    .font("Helvetica-Bold")
    .fontSize(15)
    .fillColor(BLACK)
    .text(
      "BILL OF LADING",
      pageWidth - margin - 190,
      margin,
      {
        width: 190,
        align: "right"
      }
    );

  document
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(BLACK)
    .text(
      continuation
        ? "CONTINUATION"
        : data.copyType.replace(
            /_/g,
            " "
          ),
      pageWidth - margin - 190,
      margin + 22,
      {
        width: 190,
        align: "right"
      }
    );

  document
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(BLACK)
    .text(
      data.blNumber,
      pageWidth - margin - 190,
      margin + 38,
      {
        width: 190,
        align: "right"
      }
    );

  drawRule(
    context,
    margin + HEADER_HEIGHT - 14
  );

  return (
    margin +
    HEADER_HEIGHT
  );
}

function drawFooter(
  context: RenderContext,
  pageNumber: number,
  totalPages: number,
  blNumber: string
): void {
  const {
    document,
    pageWidth,
    pageHeight,
    margin
  } = context;

  const y =
    pageHeight -
    FOOTER_HEIGHT;

  drawRule(
    context,
    y
  );

  document
    .font("Helvetica")
    .fontSize(6.5)
    .fillColor(MID)
    .text(
      `B/L ${blNumber}`,
      margin,
      y + 12
    );

  document
    .font("Helvetica-Bold")
    .fontSize(7)
    .fillColor(BLACK)
    .text(
      `Page ${pageNumber} of ${totalPages}`,
      pageWidth - margin - 100,
      y + 12,
      {
        width: 100,
        align: "right"
      }
    );
}

function drawPartyGrid(
  context: RenderContext,
  data: BillOfLadingPdfData,
  y: number
): number {
  const {
    document,
    margin,
    contentWidth
  } = context;

  const columnWidth =
    contentWidth / 2;

  const rowHeight = 92;

  const columns = [
    {
      title: "SHIPPER",
      value: `${data.shipperName}\n${data.shipperAddress}`
    },
    {
      title: "CONSIGNEE",
      value: `${data.consigneeName}\n${data.consigneeAddress}`
    },
    {
      title: "NOTIFY PARTY",
      value: `${safe(
        data.notifyPartyName
      )}\n${safe(
        data.notifyPartyAddress
      )}`
    },
    {
      title: "CARRIER / AGENT",
      value: `${data.carrierName}\n${safe(
        data.agentName
      )}\n${safe(
        data.agentAddress
      )}`
    }
  ];

  for (
    let index = 0;
    index < columns.length;
    index++
  ) {
    const row =
      Math.floor(index / 2);

    const column =
      index % 2;

    const x =
      margin +
      column * columnWidth;

    const boxY =
      y +
      row * rowHeight;

    drawBox(
      document,
      x,
      boxY,
      columnWidth,
      rowHeight
    );

    drawLabel(
      document,
      columns[index].title,
      x + 8,
      boxY + 8,
      columnWidth - 16
    );

    drawText(
      document,
      columns[index].value,
      x + 8,
      boxY + 23,
      columnWidth - 16,
      8
    );
  }

  return (
    y +
    rowHeight * 2
  );
}

function drawRoutingGrid(
  context: RenderContext,
  data: BillOfLadingPdfData,
  y: number
): number {
  const {
    document,
    margin,
    contentWidth
  } = context;

  const height = 78;

  const fields = [
    [
      "PLACE OF RECEIPT",
      safe(data.placeOfReceipt)
    ],
    [
      "PORT OF LOADING",
      data.portOfLoading
    ],
    [
      "PORT OF DISCHARGE",
      data.portOfDischarge
    ],
    [
      "PLACE OF DELIVERY",
      safe(data.placeOfDelivery)
    ],
    [
      "VESSEL",
      safe(data.vesselName)
    ],
    [
      "VOYAGE",
      safe(data.voyageNumber)
    ]
  ] as const;

  const width =
    contentWidth / 3;

  for (
    let index = 0;
    index < fields.length;
    index++
  ) {
    const row =
      Math.floor(index / 3);

    const column =
      index % 3;

    const x =
      margin +
      column * width;

    const boxY =
      y +
      row * (height / 2);

    drawBox(
      document,
      x,
      boxY,
      width,
      height / 2
    );

    drawLabel(
      document,
      fields[index][0],
      x + 8,
      boxY + 7,
      width - 16
    );

    drawText(
      document,
      fields[index][1],
      x + 8,
      boxY + 22,
      width - 16,
      8
    );
  }

  return y + height;
}

function calculateContainerRowHeight(
  container: BillOfLadingContainer
): number {
  const marks =
    safe(container.marksAndNumbers);

  const description =
    safe(container.description);

  const lines =
    Math.max(
      marks.split("\n").length,
      description.split("\n").length,
      1
    );

  return Math.max(
    ROW_MIN_HEIGHT,
    14 + lines * 8
  );
}

function drawContainerHeader(
  context: RenderContext,
  y: number
): number {
  const {
    document,
    margin,
    contentWidth
  } = context;

  const widths = [
    70,
    65,
    65,
    50,
    75,
    60,
    contentWidth -
      70 -
      65 -
      65 -
      50 -
      75 -
      60
  ];

  const labels = [
    "CONTAINER",
    "SEAL",
    "TYPE",
    "PACKAGES",
    "GROSS KG",
    "CBM",
    "DESCRIPTION / MARKS"
  ];

  let x = margin;

  for (
    let index = 0;
    index < labels.length;
    index++
  ) {
    document
      .rect(
        x,
        y,
        widths[index],
        26
      )
      .fillAndStroke(
        DARK,
        DARK
      );

    document
      .font("Helvetica-Bold")
      .fontSize(6)
      .fillColor(WHITE)
      .text(
        labels[index],
        x + 4,
        y + 9,
        {
          width:
            widths[index] - 8,
          align:
            index === 6
              ? "left"
              : "center"
        }
      );

    x += widths[index];
  }

  return y + 26;
}

function drawContainerRow(
  context: RenderContext,
  container: BillOfLadingContainer,
  y: number
): number {
  const {
    document,
    margin,
    contentWidth
  } = context;

  const height =
    calculateContainerRowHeight(
      container
    );

  const widths = [
    70,
    65,
    65,
    50,
    75,
    60,
    contentWidth -
      70 -
      65 -
      65 -
      50 -
      75 -
      60
  ];

  const values = [
    container.containerNumber,
    safe(container.sealNumber),
    safe(container.containerType),
    container.packageCount
      ?.toString() ?? "",
    container.grossWeight
      ?.toLocaleString(
        "en-US",
        {
          maximumFractionDigits: 3
        }
      ) ?? "",
    container.measurement
      ?.toFixed(3) ?? "",
    `${safe(
      container.description
    )}\n${safe(
      container.marksAndNumbers
    )}`
  ];

  let x = margin;

  for (
    let index = 0;
    index < values.length;
    index++
  ) {
    drawBox(
      document,
      x,
      y,
      widths[index],
      height
    );

    drawText(
      document,
      values[index],
      x + 4,
      y + 8,
      widths[index] - 8,
      6.5,
      index === 0
    );

    x += widths[index];
  }

  return y + height;
}

function drawTotals(
  context: RenderContext,
  data: BillOfLadingPdfData,
  y: number
): number {
  const {
    document,
    margin,
    contentWidth
  } = context;

  const height = 48;

  drawBox(
    document,
    margin,
    y,
    contentWidth,
    height
  );

  const text =
    [
      data.totalPackages !== null &&
      data.totalPackages !== undefined
        ? `TOTAL PACKAGES: ${data.totalPackages}`
        : "",
      data.totalGrossWeight !== null &&
      data.totalGrossWeight !== undefined
        ? `GROSS WEIGHT: ${data.totalGrossWeight.toLocaleString(
            "en-US"
          )} KG`
        : "",
      data.totalMeasurement !== null &&
      data.totalMeasurement !== undefined
        ? `MEASUREMENT: ${data.totalMeasurement.toFixed(
            3
          )} CBM`
        : "",
      data.declaredValue !== null &&
      data.declaredValue !== undefined
        ? `DECLARED VALUE: ${money(
            data.declaredValue,
            data.currency
          )}`
        : ""
    ]
      .filter(Boolean)
      .join("     ");

  drawText(
    document,
    text,
    margin + 10,
    y + 17,
    contentWidth - 20,
    7,
    true
  );

  return y + height;
}

function drawTerms(
  context: RenderContext,
  data: BillOfLadingPdfData,
  y: number
): number {
  const {
    document,
    margin,
    contentWidth
  } = context;

  const height = 105;

  drawBox(
    document,
    margin,
    y,
    contentWidth,
    height
  );

  drawLabel(
    document,
    "Terms and Conditions",
    margin + 10,
    y + 8,
    contentWidth - 20
  );

  const defaultTerms =
    "This Bill of Lading evidences the contract of carriage between the parties identified herein. The carrier's liability, applicable limitations, delivery provisions, freight obligations, claims procedure and governing law are subject to the applicable terms incorporated into this document.";

  drawText(
    document,
    safe(data.termsText) ||
      defaultTerms,
    margin + 10,
    y + 25,
    contentWidth - 20,
    6.5
  );

  return y + height;
}

function drawSignature(
  context: RenderContext,
  data: BillOfLadingPdfData,
  y: number
): number {
  const {
    document,
    margin,
    contentWidth
  } = context;

  const width =
    contentWidth / 2;

  const height = 76;

  drawBox(
    document,
    margin,
    y,
    width,
    height
  );

  drawBox(
    document,
    margin + width,
    y,
    width,
    height
  );

  drawLabel(
    document,
    "Place and Date of Issue",
    margin + 8,
    y + 8,
    width - 16
  );

  drawText(
    document,
    `${data.placeOfIssue}\n${dateText(
      data.issueDate
    )}`,
    margin + 8,
    y + 23,
    width - 16,
    8
  );

  drawLabel(
    document,
    "Carrier / Authorized Signatory",
    margin + width + 8,
    y + 8,
    width - 16
  );

  drawText(
    document,
    `${safe(
      data.signatureName
    )}\n${safe(
      data.signatureTitle
    )}`,
    margin + width + 8,
    y + 23,
    width - 16,
    8
  );

  return y + height;
}

function drawCopyMarking(
  context: RenderContext,
  data: BillOfLadingPdfData
): void {
  const {
    document,
    pageWidth,
    margin
  } = context;

  document
    .save()
    .opacity(0.12)
    .rotate(
      -32,
      {
        origin: [
          pageWidth / 2,
          PAGE_HEIGHT / 2
        ]
      }
    )
    .font("Helvetica-Bold")
    .fontSize(48)
    .fillColor(BLACK)
    .text(
      data.copyType ===
        "ORIGINAL"
        ? "ORIGINAL"
        : "NON-NEGOTIABLE COPY",
      margin,
      PAGE_HEIGHT / 2 - 20,
      pageWidth -
        margin * 2,
      {
        align: "center"
      }
    )
    .restore();
}

function drawQrPlaceholder(
  context: RenderContext,
  data: BillOfLadingPdfData,
  y: number
): void {
  const {
    document,
    pageWidth,
    margin
  } = context;

  const size = 58;

  const x =
    pageWidth -
    margin -
    size;

  drawBox(
    document,
    x,
    y,
    size,
    size
  );

  document
    .font("Helvetica-Bold")
    .fontSize(6)
    .fillColor(BLACK)
    .text(
      "VERIFY DOCUMENT",
      x,
      y + 19,
      size,
      {
        align: "center"
      }
    );

  document
    .font("Helvetica")
    .fontSize(5)
    .fillColor(MID)
    .text(
      "Use the verification URL encoded by the issuing system.",
      x + 4,
      y + 30,
      size - 8,
      {
        align: "center"
      }
    );

  document
    .font("Helvetica")
    .fontSize(4.5)
    .fillColor(MID)
    .text(
      data.qrVerificationUrl,
      x + 4,
      y + 45,
      size - 8,
      {
        align: "center"
      }
    );
}

function createPage(
  document: PDFKit.PDFDocument,
  data: BillOfLadingPdfData,
  pageNumber: number,
  totalPages: number,
  continuation: boolean
): RenderContext {
  document.addPage({
    size: "A4",
    margin: 0
  });

  const context: RenderContext = {
    document,
    pageWidth: PAGE_WIDTH,
    pageHeight: PAGE_HEIGHT,
    margin: MARGIN,
    contentWidth:
      PAGE_WIDTH -
      MARGIN * 2
  };

  drawHeader(
    context,
    data,
    continuation
  );

  drawFooter(
    context,
    pageNumber,
    totalPages,
    data.blNumber
  );

  return context;
}

export async function generateBillOfLadingPdf(
  data: BillOfLadingPdfData
): Promise<Buffer> {
  const document =
    new PDFDocument({
      size: "A4",
      margin: 0,
      autoFirstPage: false,
      info: {
        Title:
          `Bill of Lading ${data.blNumber}`,
        Author:
          data.carrierName,
        Subject:
          "Commercial Bill of Lading",
        Creator:
          "MEGAZEN"
      }
    });

  const chunks: Buffer[] = [];

  document.on(
    "data",
    (chunk: Buffer) => {
      chunks.push(chunk);
    }
  );

  const completion =
    new Promise<Buffer>(
      (resolve, reject) => {
        document.on(
          "end",
          () => {
            resolve(
              Buffer.concat(chunks)
            );
          }
        );

        document.on(
          "error",
          reject
        );
      }
    );

  /*
   * We render pages sequentially first.
   * PDFKit permits page creation while
   * preserving deterministic document
   * ordering.
   */
  let pageNumber = 1;

  let context =
    createPage(
      document,
      data,
      pageNumber,
      1,
      false
    );

  let y =
    MARGIN +
    HEADER_HEIGHT;

  y = drawPartyGrid(
    context,
    data,
    y
  );

  y += 10;

  y = drawRoutingGrid(
    context,
    data,
    y
  );

  y += 12;

  drawCopyMarking(
    context,
    data
  );

  drawQrPlaceholder(
    context,
    data,
    PAGE_HEIGHT -
      FOOTER_HEIGHT -
      72
  );

  /*
   * Container table.
   */
  y += 12;

  let tableHeaderDrawn =
    false;

  for (
    let index = 0;
    index <
      data.containers.length;
    index++
  ) {
    const container =
      data.containers[index];

    const rowHeight =
      calculateContainerRowHeight(
        container
      );

    const requiredHeight =
      26 +
      rowHeight +
      10;

    const bottom =
      PAGE_HEIGHT -
      FOOTER_HEIGHT;

    if (
      y +
        requiredHeight >
      bottom
    ) {
      pageNumber += 1;

      context =
        createPage(
          document,
          data,
          pageNumber,
          1,
          true
        );

      y =
        MARGIN +
        HEADER_HEIGHT;

      y = drawContainerHeader(
        context,
        y
      );

      tableHeaderDrawn = true;
    }

    if (
      !tableHeaderDrawn
    ) {
      y =
        drawContainerHeader(
          context,
          y
        );

      tableHeaderDrawn = true;
    }

    y =
      drawContainerRow(
        context,
        container,
        y
      );
  }

  /*
   * Final sections.
   */
  if (
    y + 48 >
    PAGE_HEIGHT -
      FOOTER_HEIGHT
  ) {
    pageNumber += 1;

    context =
      createPage(
        document,
        data,
        pageNumber,
        1,
        true
      );

    y =
      MARGIN +
      HEADER_HEIGHT;
  }

  y += 10;

  y = drawTotals(
    context,
    data,
    y
  );

  y += 10;

  if (
    y + 105 >
    PAGE_HEIGHT -
      FOOTER_HEIGHT
  ) {
    pageNumber += 1;

    context =
      createPage(
        document,
        data,
        pageNumber,
        1,
        true
      );

    y =
      MARGIN +
      HEADER_HEIGHT;
  }

  y = drawTerms(
    context,
    data,
    y
  );

  y += 10;

  if (
    y + 76 >
    PAGE_HEIGHT -
      FOOTER_HEIGHT
  ) {
    pageNumber += 1;

    context =
      createPage(
        document,
        data,
        pageNumber,
        1,
        true
      );

    y =
      MARGIN +
      HEADER_HEIGHT;
  }

  drawSignature(
    context,
    data,
    y
  );

  document.end();

  const buffer =
    await completion;

  /*
   * PDF content is hashed after the
   * complete binary document exists.
   */
  return buffer;
}

export function calculatePdfHash(
  pdf: Buffer
): string {
  return crypto
    .createHash("sha256")
    .update(pdf)
    .digest("hex");
}