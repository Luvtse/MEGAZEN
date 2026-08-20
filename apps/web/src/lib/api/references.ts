export interface ShipmentReferenceResult {
  reference: string;
  bookingNumber: string;
  billOfLadingNumber: string;
  booking: Record<string, unknown>;
  shipment: Record<string, unknown> | null;
  billOfLadings: Array<Record<string, unknown>>;
  container: Record<string, unknown> | null;
  customer: Record<string, unknown>;
}

type Envelope<T> = {
  success: boolean;
  data: T;
  error: unknown;
  timestamp: string;
};

export async function lookupShipmentReference(
  reference: string,
): Promise<ShipmentReferenceResult> {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  const tenantId =
    process.env.NEXT_PUBLIC_TENANT_ID ?? "MEGAZEN-DEMO";

  const response = await fetch(
    `${apiUrl}/api/references/${encodeURIComponent(reference.trim())}`,
    {
      headers: { "x-tenant-id": tenantId },
      cache: "no-store",
    },
  );

  const payload = (await response.json()) as Envelope<ShipmentReferenceResult>;

  if (!response.ok || !payload.success) {
    const error = payload.error;
    const message =
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message === "string"
        ? error.message
        : "Reference lookup failed";
    throw new Error(message);
  }

  return payload.data;
}

export type GlobalSearchResult = {
  type: "booking" | "bill_of_lading" | "shipment" | "container" | "customer";
  id: string;
  reference: string;
  title: string;
  subtitle: string;
  status: string | null;
  bookingNumber?: string | null;
  billOfLadingNumber?: string;
  version?: number;
};

export type GlobalSearchResponse = {
  query: string;
  counts: Record<string, number>;
  results: GlobalSearchResult[];
};

export async function globalSearch(query: string): Promise<GlobalSearchResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  const tenantId = process.env.NEXT_PUBLIC_TENANT_ID ?? "MEGAZEN-DEMO";
  const response = await fetch(
    `${apiUrl}/api/search?q=${encodeURIComponent(query.trim())}`,
    { headers: { "x-tenant-id": tenantId }, cache: "no-store" },
  );
  const payload = (await response.json()) as Envelope<GlobalSearchResponse>;
  if (!response.ok || !payload.success) {
    const error = payload.error;
    const message =
      typeof error === "object" && error !== null && "message" in error &&
      typeof error.message === "string" ? error.message : "Search failed";
    throw new Error(message);
  }
  return payload.data;
}
