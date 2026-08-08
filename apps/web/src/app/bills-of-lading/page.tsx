"use client";

import { useEffect, useState } from "react";

type Bill = {
  id: string;
  blNumber: string;
  status: string;
  portOfLoading: string;
  portOfDischarge: string;
  shipperName: string;
  consigneeName: string;
  issueDate: string;
};

export default function BillsOfLadingPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:4000/api/bills-of-lading", {
      headers: { "x-tenant-id": "REPLACE_WITH_TENANT_ID" }
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load bills of lading");
        return response.json() as Promise<{ data: Bill[] }>;
      })
      .then((body) => setBills(body.data))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load documents"));
  }, []);

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Documents</p>
        <h1 className="mt-2 text-3xl font-semibold">Bills of Lading</h1>
        <p className="mt-2 text-zinc-400">Draft, approve, issue and verify transport documents.</p>
        {error && <p className="mt-6 rounded-lg border border-red-900 bg-red-950/30 p-4 text-red-300">{error}</p>}
        <div className="mt-8 overflow-hidden rounded-xl border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-950 text-zinc-500">
              <tr><th className="p-4">B/L Number</th><th className="p-4">Route</th><th className="p-4">Shipper</th><th className="p-4">Consignee</th><th className="p-4">Status</th></tr>
            </thead>
            <tbody>
              {bills.map((bill) => (
                <tr key={bill.id} className="border-t border-zinc-800">
                  <td className="p-4 font-medium">{bill.blNumber}</td>
                  <td className="p-4 text-zinc-400">{bill.portOfLoading} → {bill.portOfDischarge}</td>
                  <td className="p-4">{bill.shipperName}</td>
                  <td className="p-4">{bill.consigneeName}</td>
                  <td className="p-4"><span className="rounded-full border border-zinc-700 px-2 py-1 text-xs">{bill.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
