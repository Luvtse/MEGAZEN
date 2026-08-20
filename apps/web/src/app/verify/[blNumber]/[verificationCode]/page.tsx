"use client";

import { useEffect, useState } from "react";

type Verification = {
  blNumber: string;
  version: number;
  status: string;
  documentHash: string | null;
  issueDate: string | null;
  shipperName: string;
  consigneeName: string;
  portOfLoading: string;
  portOfDischarge: string;
};

export default function VerifyBillOfLading({ params }: { params: { blNumber: string; verificationCode: string } }) {
  const [document, setDocument] = useState<Verification | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
    fetch(`${apiUrl}/public/verify/bl/${encodeURIComponent(params.verificationCode)}`)
      .then(async (response) => {
        const payload = await response.json() as { success: boolean; data: Verification & { verified?: boolean } | null; error?: { message: string } | null };
        if (!response.ok || !payload.success || !payload.data) throw new Error(payload.error?.message ?? "Verification failed");
        if (payload.data.blNumber !== params.blNumber) throw new Error("Verification code does not match the B/L number.");
        return payload.data;
      })
      .then(setDocument)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Verification failed"));
  }, [params.blNumber, params.verificationCode]);

  return (
    <main className="min-h-screen bg-[#0a0a0a] p-8 text-zinc-100">
      <section className="mx-auto max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-950 p-8">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">MEGAZEN Document Verification</p>
        {error && <div className="mt-6 rounded-lg border border-red-900 bg-red-950/20 p-4 text-red-300">{error}</div>}
        {document && (
          <>
            <div className="mt-6 flex items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-semibold">{document.blNumber}</h1>
                <p className="mt-1 text-sm text-zinc-500">Version {document.version}</p>
              </div>
              <span className="rounded-full border border-emerald-900 bg-emerald-950/30 px-3 py-1 text-xs text-emerald-300">{document.status}</span>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div><p className="text-xs text-zinc-500">SHIPPER</p><p className="mt-1">{document.shipperName}</p></div>
              <div><p className="text-xs text-zinc-500">CONSIGNEE</p><p className="mt-1">{document.consigneeName}</p></div>
              <div><p className="text-xs text-zinc-500">PORT OF LOADING</p><p className="mt-1">{document.portOfLoading}</p></div>
              <div><p className="text-xs text-zinc-500">PORT OF DISCHARGE</p><p className="mt-1">{document.portOfDischarge}</p></div>
              <div><p className="text-xs text-zinc-500">ISSUE DATE</p><p className="mt-1">{document.issueDate ? new Date(document.issueDate).toLocaleDateString() : "—"}</p></div>
            </div>
            <div className="mt-8 rounded-xl border border-zinc-800 p-5">
              <p className="text-xs text-zinc-500">VERIFICATION CODE</p>
              <p className="mt-1 font-mono">{params.verificationCode}</p>
              <p className="mt-5 text-xs text-zinc-500">DOCUMENT INTEGRITY HASH</p>
              <p className="mt-1 break-all font-mono text-xs text-zinc-400">{document.documentHash ?? "—"}</p>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
