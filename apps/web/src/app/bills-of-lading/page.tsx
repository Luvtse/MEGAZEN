"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  ShieldCheck
} from "lucide-react";

type Bill = {
  id: string;
  blNumber: string;
  status: string;
  version: number;
  shipperName: string;
  consigneeName: string;
  portOfLoading: string;
  portOfDischarge: string;
};

type Api = {
  success: boolean;
  data: Bill[];
  error: { message: string } | null;
};

export default function BillOfLadingPage() {
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

  const filtered = items.filter(b =>
    `${b.blNumber} ${b.shipperName} ${b.consigneeName}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#0a0a0a] p-8 text-white">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[.25em] text-zinc-500">
              Trade documents
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              Bills of Lading
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Create, issue, verify and manage controlled shipping documents.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search B/L, shipper, consignee"
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-zinc-600"
            />
            <Link
              href="/bill-of-lading/create"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200"
            >
              <Plus size={16} />
              Create B/L
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
            <FileText className="mb-4" />
            <p className="text-sm text-zinc-400">Documents</p>
            <p className="mt-2 text-3xl font-bold">{items.length}</p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
            <ShieldCheck className="mb-4" />
            <p className="text-sm text-zinc-400">Verified</p>
            <p className="mt-2 text-3xl font-bold">
              {items.filter(b => b.status === "verified").length}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
            <FileText className="mb-4" />
            <p className="text-sm text-zinc-400">Active Versions</p>
            <p className="mt-2 text-3xl font-bold">
              {items.reduce((sum, b) => sum + b.version, 0)}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <p className="mb-6 rounded-lg border border-red-900 p-4 text-red-300">
            {error}
          </p>
        )}

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-950 text-xs uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="p-4">B/L</th>
                <th className="p-4">Shipper</th>
                <th className="p-4">Consignee</th>
                <th className="p-4">Route</th>
                <th className="p-4">Status</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id} className="border-t border-zinc-900">
                  <td className="p-4 font-mono">
                    {b.blNumber}
                    <div className="text-xs text-zinc-600">v{b.version}</div>
                  </td>
                  <td className="p-4">{b.shipperName}</td>
                  <td className="p-4">{b.consigneeName}</td>
                  <td className="p-4 text-zinc-400">
                    {b.portOfLoading} → {b.portOfDischarge}
                  </td>
                  <td className="p-4">
                    <span className="rounded-full border border-zinc-700 px-2 py-1 text-xs">
                      {b.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      className="text-zinc-300 underline hover:text-white"
                      href={`/bill-of-lading/${b.id}`}
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-zinc-500">
                    No bills found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
