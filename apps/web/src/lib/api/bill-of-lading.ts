export type BillOfLadingStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "ISSUED"
  | "AMMENDED"
  | "RELEASED"
  | "SURRENDERED";

export interface BillOfLadingContainer {
  id: string;
  containerId: string;
  sealNumber?: string | null;
  packageCount?: number | null;
  packageType?: string | null;
  grossWeight?: number | null;
  measurement?: number | null;
  container?: {
    id: string;
    containerNumber: string;
    type?: string | null;
    status?: string | null;
  } | null;
}

export interface BillOfLadingRevision {
  id: string;
  version: number;
  reason: string;
  createdAt: string;
  snapshot: Record<string, unknown>;
}

export interface BillOfLading {
  id: string;
  blNumber: string;
  version: number;
  status: BillOfLadingStatus;
  documentType: string;

  bookingId: string;
  customerId: string;

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

  issuePlace: string;
  issueDate: string;

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
  revisions?: BillOfLadingRevision[];
}

export interface CreateBillOfLadingInput {
  bookingId: string;
  customerId: string;

  documentType: string;

  placeOfReceipt: string;
  portOfLoading: string;
  portOfDischarge: string;
  placeOfDelivery?: string;

  shipperName: string;
  shipperAddress: string;

  consigneeName: string;
  consigneeAddress: string;

  notifyPartyName?: string;
  notifyPartyAddress?: string;

  vesselName?: string;
  voyageNumber?: string;

  issuePlace: string;
  numberOfOriginals: number;

  freightTerms?: string;

  marksAndNumbers?: string;
  description: string;

  grossWeight?: number;
  measurement?: number;
  packageCount?: number;

  currency?: string;
  declaredValue?: number;

  termsText?: string;

  containerIds: string[];
}

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  error: unknown;
  timestamp: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3001";

async function request<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...init,
      headers: {
        "Content-Type":
          "application/json",
        ...(init?.headers ?? {})
      },
      cache: "no-store"
    }
  );

  const payload =
    (await response.json()) as ApiEnvelope<T>;

  if (!response.ok || !payload.success) {
    const message =
      typeof payload.error === "object" &&
      payload.error !== null &&
      "message" in payload.error &&
      typeof payload.error.message ===
        "string"
        ? payload.error.message
        : "Request failed";

    throw new Error(message);
  }

  return payload.data;
}

export async function listBillOfLadings(): Promise<
  BillOfLading[]
> {
  return request<BillOfLading[]>(
    "/api/bills-of-lading"
  );
}

export async function getBillOfLading(
  id: string
): Promise<BillOfLading> {
  return request<BillOfLading>(
    `/api/bills-of-lading/${id}`
  );
}

export async function createBillOfLading(
  input: CreateBillOfLadingInput
): Promise<BillOfLading> {
  return request<BillOfLading>(
    "/api/bills-of-lading",
    {
      method: "POST",
      body: JSON.stringify(input)
    }
  );
}

export async function updateBillOfLading(
  id: string,
  input: Partial<
    Omit<
      CreateBillOfLadingInput,
      | "bookingId"
      | "customerId"
      | "containerIds"
    >
  >
): Promise<BillOfLading> {
  return request<BillOfLading>(
    `/api/bills-of-lading/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(input)
    }
  );
}

export async function submitBillOfLading(
  id: string
): Promise<BillOfLading> {
  return request<BillOfLading>(
    `/api/bills-of-lading/${id}/submit`,
    {
      method: "POST",
      body: JSON.stringify({})
    }
  );
}

export async function approveBillOfLading(
  id: string,
  comment?: string
): Promise<BillOfLading> {
  return request<BillOfLading>(
    `/api/bills-of-lading/${id}/approve`,
    {
      method: "POST",
      body: JSON.stringify({
        comment
      })
    }
  );
}

export async function issueBillOfLading(
  id: string
): Promise<BillOfLading> {
  return request<BillOfLading>(
    `/api/bills-of-lading/${id}/issue`,
    {
      method: "POST",
      body: JSON.stringify({})
    }
  );
}

export async function releaseBillOfLading(
  id: string
): Promise<BillOfLading> {
  return request<BillOfLading>(
    `/api/bills-of-lading/${id}/release`,
    {
      method: "POST",
      body: JSON.stringify({})
    }
  );
}

export async function surrenderBillOfLading(
  id: string
): Promise<BillOfLading> {
  return request<BillOfLading>(
    `/api/bills-of-lading/${id}/surrender`,
    {
      method: "POST",
      body: JSON.stringify({})
    }
  );
}

export async function amendBillOfLading(
  id: string,
  reason: string
): Promise<BillOfLading> {
  return request<BillOfLading>(
    `/api/bills-of-lading/${id}/amend`,
    {
      method: "POST",
      body: JSON.stringify({
        reason
      })
    }
  );
}
