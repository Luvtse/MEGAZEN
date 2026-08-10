"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Bill = {
  id: string; blNumber: string; status: string; version: number;
  shipperName: string; consigneeName: string; portOfLoading: string; portOfDischarge: string;
};
type Api = { success: boolean; data: Bill[]; error: { message: string } | null };

export default function BillsOfLadingPage() {
  const [items, setItems] = useState<Bill[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:4000/api/bills-of-lading?limit=100", {
      headers: { "x-tenant-id": "REPLACE_WITH_TENANT_ID" }
    }).then(async r => {
      const body = await r.json() as Api;
      if (!r.ok || !body.success) throw new Error(body.error?.message ?? "Unable to load bills");
      setItems(body.data);
    }).catch((e: unknown) => setError(e instanceof Error ? e.message : "Unable to load bills"));
  }, []);

  const filtered = items.filter(b => `${b.blNumber} ${b.shipperName} ${b.consigneeName}`.toLowerCase().includes(query.toLowerCase()));

  return <main className="min-h-screen bg-[#0a0a0a] p-8 text-zinc-100">
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div><p className="text-xs uppercase tracking-[.25em] text-zinc-500">Trade documents</p><h1 className="mt-2 text-3xl font-semibold">Bills of Lading</h1></div>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search B/L, shipper, consignee"
          className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm outline-none focus:border-zinc-600" />
      </div>
      {error && <p className="mt-6 rounded-lg border border-red-900 p-4 text-red-300">{error}</p>}
      <div className="mt-8 overflow-hidden rounded-xl border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-950 text-xs uppercase tracking-wider text-zinc-500">
            <tr><th className="p-4">B/L</th><th className="p-4">Shipper</th><th className="p-4">Consignee</th><th className="p-4">Route</th><th className="p-4">Status</th><th className="p-4"></th></tr>
          </thead>
          <tbody>
            {filtered.map(b => <tr key={b.id} className="border-t border-zinc-900">
              <td className="p-4 font-mono">{b.blNumber}<div className="text-xs text-zinc-600">v{b.version}</div></td>
              <td className="p-4">{b.shipperName}</td><td className="p-4">{b.consigneeName}</td>
              <td className="p-4 text-zinc-400">{b.portOfLoading} → {b.portOfDischarge}</td>
              <td className="p-4"><span className="rounded-full border border-zinc-700 px-2 py-1 text-xs">{b.status}</span></td>
              <td className="p-4 text-right"><Link className="text-zinc-300 underline" href={`/bills-of-lading/${b.id}`}>Open</Link></td>
            </tr>)}
          </tbody>
        </table>
        {!filtered.length && <div className="p-10 text-center text-zinc-500">No bills found.</div>}
      </div>
    </div>
  </main>;
}
