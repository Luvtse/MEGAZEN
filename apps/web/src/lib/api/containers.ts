export interface ContainerReference {
  id: string;
  containerNumber: string;
  type: string;
  size: string;
  status: string;
  location?: string | null;
  carrier?: string | null;
}

type Envelope<T> = { success: boolean; data: T; error: unknown; timestamp: string };
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? "MEGAZEN-DEMO";

export async function listContainers(): Promise<ContainerReference[]> {
  const response = await fetch(`${API_URL}/api/containers`, {
    headers: { "x-tenant-id": TENANT_ID }, cache: "no-store",
  });
  const payload = await response.json() as Envelope<ContainerReference[]>;
  if (!response.ok || !payload.success) throw new Error("Unable to load containers");
  return payload.data;
}
