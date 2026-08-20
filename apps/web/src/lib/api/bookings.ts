export interface BookingReference {
  id: string;
  bookingNumber: string;
  customerId: string;
  customer?: { id: string; name: string; code: string } | null;
  container?: { id: string; containerNumber: string; type?: string | null; size?: string | null; status?: string | null } | null;
  containerId?: string | null;
  origin: string;
  destination: string;
  cargoDescription: string;
  weight: number;
  volume?: number | null;
  status: string;
}

type Envelope<T> = { success: boolean; data: T; error: unknown; timestamp: string };
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? "MEGAZEN-DEMO";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", "x-tenant-id": TENANT_ID, ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  const payload = await response.json() as Envelope<T>;
  if (!response.ok || !payload.success) {
    const error = payload.error;
    const message = typeof error === "object" && error !== null && "message" in error && typeof error.message === "string" ? error.message : "Request failed";
    throw new Error(message);
  }
  return payload.data;
}

export const listBookings = (): Promise<BookingReference[]> => request<BookingReference[]>("/api/bookings");
export const getBookingByNumber = (bookingNumber: string): Promise<BookingReference> => request<BookingReference>(`/api/bookings/by-number/${encodeURIComponent(bookingNumber)}`);
export type CreateBookingInput = {
  customerId: string;
  containerId?: string | null;
  origin: string;
  destination: string;
  cargoDescription: string;
  weight: number;
  volume?: number | null;
};

export const createBooking = (input: CreateBookingInput): Promise<BookingReference> =>
  request<BookingReference>("/api/bookings", {
    method: "POST",
    body: JSON.stringify(input),
  });
