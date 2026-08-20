export interface CustomerReference {
  id: string;
  name: string;
  code: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
}

type Envelope<T> = { success: boolean; data: T; error: unknown; timestamp: string };
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? "MEGAZEN-DEMO";

export async function listCustomers(): Promise<CustomerReference[]> {
  const response = await fetch(`${API_URL}/api/customers`, {
    headers: { "x-tenant-id": TENANT_ID }, cache: "no-store",
  });
  const payload = await response.json() as Envelope<CustomerReference[]>;
  if (!response.ok || !payload.success) throw new Error("Unable to load customers");
  return payload.data;
}
