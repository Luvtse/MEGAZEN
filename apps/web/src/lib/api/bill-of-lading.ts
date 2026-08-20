export type BillOfLadingStatus =
  | "DRAFT" | "REVIEW" | "APPROVED" | "ISSUED" | "RELEASED" | "AMENDED" | "SURRENDERED" | "CANCELLED";

export interface BillOfLadingContainer {
  id: string;
  containerId: string;
  containerNumber: string;
  sealNumber?: string | null;
  containerType?: string | null;
  packageCount?: number | null;
  grossWeight?: number | null;
  measurement?: number | null;
  container?: { id:string; containerNumber:string; type?:string|null; status?:string|null } | null;
}

export interface BillOfLadingRevision {
  id: string;
  version: number;
  status: string;
  reason?: string | null;
  documentHash?: string | null;
  createdAt: string;
}

export interface BillOfLading {
  id:string; blNumber:string; version:number; status:BillOfLadingStatus; copyType:string;
  bookingId?:string|null; customerId?:string|null;
  placeOfReceipt?:string|null; portOfLoading:string; portOfDischarge:string; placeOfDelivery?:string|null;
  shipperName:string; shipperAddress:string; consigneeName:string; consigneeAddress:string;
  notifyPartyName?:string|null; notifyPartyAddress?:string|null;
  vesselName?:string|null; voyageNumber?:string|null; placeOfIssue:string; issueDate?:string|null;
  numberOfOriginals:number; freightTerms?:string|null; description:string; marksAndNumbers?:string|null;
  totalPackages?:number|null; totalGrossWeight?:number|null; totalMeasurement?:number|null;
  currency?:string|null; declaredValue?:number|null; termsText?:string|null;
  verificationToken:string; documentHash?:string|null;
  containers:BillOfLadingContainer[];
  revisions?:BillOfLadingRevision[];
  booking?:{id:string;bookingNumber:string;origin:string;destination:string;cargoDescription:string;weight:number;volume?:number|null}|null;
}

export interface CreateBillOfLadingInput {
  bookingNumber: string;
  carrierName: string;
  carrierAddress?: string;
  agentName?: string;
  agentAddress?: string;
  placeOfReceipt?: string;
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
  placeOfIssue: string;
  numberOfOriginals: number;
  freightTerms?: string;
  marksAndNumbers?: string;
  description: string;
  totalPackages?: number;
  totalGrossWeight?: number;
  totalMeasurement?: number;
  currency?: string;
  declaredValue?: number;
  termsText?: string;
  containerIds?: string[];
}

type Envelope<T>={success:boolean;data:T;error:unknown;timestamp:string};
const API_URL=process.env.NEXT_PUBLIC_API_URL??"http://localhost:4000";
async function request<T>(path:string,init?:RequestInit):Promise<T>{
  const response=await fetch(`${API_URL}${path}`,{...init,headers:{"Content-Type":"application/json","x-tenant-id":process.env.NEXT_PUBLIC_TENANT_ID??"MEGAZEN-DEMO",...(init?.headers??{})},cache:"no-store"});
  const payload=await response.json() as Envelope<T>;
  if(!response.ok||!payload.success){
    const err=payload.error;
    const message=typeof err==="object"&&err!==null&&"message" in err&&typeof err.message==="string"?err.message:"Request failed";
    throw new Error(message);
  }
  return payload.data;
}
export const listBillOfLadings=()=>request<BillOfLading[]>("/api/bills-of-lading");
export const getBillOfLading=(id:string)=>request<BillOfLading>(`/api/bills-of-lading/${id}`);
export const createBillOfLading=(input:CreateBillOfLadingInput)=>request<BillOfLading>("/api/bills-of-lading",{method:"POST",body:JSON.stringify(input)});
export const updateBillOfLading=(id:string,input:Partial<CreateBillOfLadingInput>)=>request<BillOfLading>(`/api/bills-of-lading/${id}`,{method:"PUT",body:JSON.stringify(input)});
export const submitBillOfLading=(id:string)=>request<BillOfLading>(`/api/bills-of-lading/${id}/submit`,{method:"POST",body:"{}"});
export const approveBillOfLading=(id:string,comment?:string)=>request<BillOfLading>(`/api/bills-of-lading/${id}/approve`,{method:"POST",body:JSON.stringify({comment})});
export const issueBillOfLading=async(id:string)=>{await request<{id:string;filename:string;documentHash:string;pdfHash:string}>(`/api/bills-of-lading/${id}/issue`,{method:"POST",body:"{}"});return getBillOfLading(id);};
export const releaseBillOfLading=(id:string)=>request<BillOfLading>(`/api/bills-of-lading/${id}/release`,{method:"POST",body:"{}"});
export const surrenderBillOfLading=(id:string)=>request<BillOfLading>(`/api/bills-of-lading/${id}/surrender`,{method:"POST",body:"{}"});
export const amendBillOfLading=(id:string,reason:string)=>request<BillOfLading>(`/api/bills-of-lading/${id}/amend`,{method:"POST",body:JSON.stringify({reason})});

export async function downloadBillOfLadingPdf(id: string): Promise<Blob> {
  const response = await fetch(
    `${API_URL}/api/bills-of-lading/${id}/pdf`,
    {
      headers: {
        "x-tenant-id":
          process.env.NEXT_PUBLIC_TENANT_ID ?? "MEGAZEN-DEMO"
      },
      cache: "no-store"
    }
  );

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | Envelope<unknown>
      | null;
    const message =
      payload &&
      typeof payload.error === "object" &&
      payload.error !== null &&
      "message" in payload.error &&
      typeof payload.error.message === "string"
        ? payload.error.message
        : "Unable to download B/L PDF";
    throw new Error(message);
  }

  return response.blob();
}

export async function getBillOfLadingByNumber(
  blNumber: string
): Promise<BillOfLading> {
  return request<BillOfLading>(
    `/api/bills-of-lading/by-number/${encodeURIComponent(blNumber)}`
  );
}
