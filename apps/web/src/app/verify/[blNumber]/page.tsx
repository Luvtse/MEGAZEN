import Link from "next/link";

type Props = { params: { blNumber: string } };
type VerificationResponse = { success: boolean; data: { verified: boolean; integrity: "VALID" | "INVALID"; blNumber: string; version: number; status: string; issueDate: string | null; carrierName: string; shipperName: string; consigneeName: string; portOfLoading: string; portOfDischarge: string; vesselName: string | null; voyageNumber: string | null; documentHash: string | null }; error: { message: string } | null };

async function getDocument(blNumber: string): Promise<VerificationResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  const response = await fetch(`${apiUrl}/public/verify/bl-number/${encodeURIComponent(blNumber)}`, { cache: "no-store" });
  const payload = await response.json() as VerificationResponse;
  if (!response.ok || !payload.success) throw new Error(payload.error?.message ?? "Document not found.");
  return payload;
}

export default async function VerifyBillOfLadingPage({ params }: Props) {
  const result = await getDocument(params.blNumber);
  const document = result.data;
  return (
    <main className="min-h-screen bg-[#0a0a0a] px-6 py-16 text-zinc-100">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8">
          <div className="flex items-start justify-between gap-6">
            <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">MEGAZEN Document Verification</p><h1 className="mt-3 text-2xl font-bold">Bill of Lading</h1><p className="mt-1 font-mono text-sm text-zinc-500">{document.blNumber}</p></div>
            <div className={document.verified ? "rounded-full border border-emerald-800 bg-emerald-950 px-4 py-2 text-xs font-semibold text-emerald-300" : "rounded-full border border-red-800 bg-red-950 px-4 py-2 text-xs font-semibold text-red-300"}>{document.integrity}</div>
          </div>
          <div className="mt-8 grid gap-px overflow-hidden rounded-xl border border-zinc-800 bg-zinc-800 md:grid-cols-2">
            {[["Carrier",document.carrierName],["Shipper",document.shipperName],["Consignee",document.consigneeName],["Loading Port",document.portOfLoading],["Discharge Port",document.portOfDischarge],["Vessel",document.vesselName ?? "—"],["Voyage",document.voyageNumber ?? "—"],["Version",`v${document.version}`]].map(([label,value]) => <div key={label} className="bg-zinc-950 p-5"><p className="text-xs uppercase tracking-wide text-zinc-600">{label}</p><p className="mt-2 text-sm text-zinc-200">{value}</p></div>)}
          </div>
          <div className="mt-6 rounded-xl border border-zinc-800 p-5"><p className="text-xs uppercase tracking-wide text-zinc-600">Document Integrity Hash</p><p className="mt-2 break-all font-mono text-xs text-zinc-400">{document.documentHash ?? "Not available"}</p></div>
          <div className="mt-8"><Link href="/" className="text-sm font-medium text-zinc-300 hover:text-white">Return to MEGAZEN</Link></div>
        </div>
      </div>
    </main>
  );
}
