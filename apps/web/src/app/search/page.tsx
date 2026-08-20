"use client";

import Link from "next/link";
import { ArrowRight, Search, Ship, FileText, Package, UserRound } from "lucide-react";
import { useState } from "react";
import {
  globalSearch,
  lookupShipmentReference,
  type GlobalSearchResponse,
  type ShipmentReferenceResult,
} from "@/lib/api/references";

export default function ReferenceSearchPage() {
  const [reference, setReference] = useState("");
  const [result, setResult] = useState<ShipmentReferenceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [globalResults, setGlobalResults] = useState<GlobalSearchResponse | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setGlobalResults(null);
    try {
      const normalized = reference.trim().toUpperCase();
      const [searchResult, exactResult] = await Promise.all([
        globalSearch(normalized),
        /^\d{10}$/.test(normalized) || /^ZENU\d{10}$/.test(normalized)
          ? lookupShipmentReference(normalized)
          : Promise.resolve(null),
      ]);
      setGlobalResults(searchResult);
      if (exactResult) setResult(exactResult);
      if (searchResult.results.length === 0) {
        setError("No matching booking, B/L, shipment, container, or customer was found.");
      }
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm text-zinc-500 hover:text-white">← MEGAZEN</Link>
        <div className="mt-8">
          <h1 className="text-3xl font-bold">Shipment Reference Search</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Search the entire shipment lifecycle using the permanent 10-digit booking reference or its ZENU B/L number.
          </p>
        </div>

        <form onSubmit={submit} className="mt-7 flex gap-2">
          <div className="flex flex-1 items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4">
            <Search size={18} className="text-zinc-500" />
            <input
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="8372946155 or ZENU8372946155"
              className="h-12 w-full bg-transparent font-mono text-sm outline-none"
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-white px-6 text-sm font-semibold text-black disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {error ? (
          <div className="mt-5 rounded-xl border border-red-900 bg-red-950/30 p-4 text-sm text-red-300">{error}</div>
        ) : null}

        {globalResults ? (
          <section className="mt-7 rounded-xl border border-zinc-800 bg-zinc-950 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Global results</h2>
                <p className="mt-1 text-xs text-zinc-600">Booking, B/L, shipment, container and customer records.</p>
              </div>
              <div className="text-xs text-zinc-600">
                {globalResults.results.length} result{globalResults.results.length === 1 ? "" : "s"}
              </div>
            </div>
            <div className="mt-5 space-y-2">
              {globalResults.results.map((item) => {
                const href =
                  item.type === "booking" ? `/bookings/${item.id}` :
                  item.type === "bill_of_lading" ? `/bills-of-lading/${item.id}` :
                  item.type === "shipment" && item.bookingNumber ? `/bookings/number/${item.bookingNumber}` :
                  item.type === "container" && item.bookingNumber ? `/bookings/number/${item.bookingNumber}` :
                  null;
                const content = (
                  <div className="flex items-center justify-between gap-4 rounded-lg border border-zinc-900 bg-black p-4">
                    <div>
                      <p className="font-mono text-sm font-semibold">{item.title}</p>
                      <p className="mt-1 text-xs text-zinc-600">
                        {item.type.replaceAll("_", " ")} · {item.subtitle}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {item.status ? <span className="text-xs text-zinc-500">{item.status}</span> : null}
                      {href ? <ArrowRight size={16} className="text-zinc-600" /> : null}
                    </div>
                  </div>
                );
                return href ? <Link key={`${item.type}-${item.id}`} href={href} className="block hover:border-zinc-700">{content}</Link> :
                  <div key={`${item.type}-${item.id}`}>{content}</div>;
              })}
            </div>
          </section>
        ) : null}

        {result ? (
          <div className="mt-7 space-y-5">
            <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-600">Permanent shipment reference</p>
                  <p className="mt-2 font-mono text-3xl font-bold">{result.bookingNumber}</p>
                  <p className="mt-2 font-mono text-sm text-zinc-500">B/L {result.billOfLadingNumber}</p>
                </div>
                <div className="rounded-lg border border-zinc-800 px-4 py-3 text-right">
                  <p className="text-xs text-zinc-600">Booking status</p>
                  <p className="mt-1 text-sm font-semibold">
                    {String(result.booking.status ?? "—")}
                  </p>
                </div>
              </div>
            </section>

            <div className="grid gap-5 md:grid-cols-2">
              <Card icon={<Ship size={18} />} title="Shipment">
                <Row label="Shipment ID" value={String(result.shipment?.id ?? "—")} />
                <Row label="Status" value={String(result.shipment?.status ?? "—")} />
                <Row label="B/L reference" value={String(result.shipment?.blNumber ?? result.billOfLadingNumber)} />
                <Row label="Vessel" value={String(result.shipment?.vessel ?? "—")} />
                <Row label="Voyage" value={String(result.shipment?.voyage ?? "—")} />
              </Card>

              <Card icon={<UserRound size={18} />} title="Customer">
                <Row label="Name" value={String(result.customer.name ?? "—")} />
                <Row label="Code" value={String(result.customer.code ?? "—")} />
                <Row label="Email" value={String(result.customer.email ?? "—")} />
              </Card>

              <Card icon={<Package size={18} />} title="Cargo & Container">
                <Row label="Cargo" value={String(result.booking.cargoDescription ?? "—")} />
                <Row label="Weight" value={String(result.booking.weight ?? "—")} />
                <Row label="Container" value={String(result.container?.containerNumber ?? "—")} />
              </Card>

              <Card icon={<FileText size={18} />} title="Bill of Lading">
                {result.billOfLadings.length === 0 ? (
                  <p className="text-sm text-zinc-500">No B/L has been created yet.</p>
                ) : (
                  result.billOfLadings.map((bill) => {
                    const id = String(bill.id);
                    return (
                      <Link
                        key={id}
                        href={`/bills-of-lading/${id}`}
                        className="flex items-center justify-between rounded-lg border border-zinc-900 bg-black p-3 hover:border-zinc-700"
                      >
                        <span>
                          <span className="block font-mono text-sm">{String(bill.blNumber)}</span>
                          <span className="text-xs text-zinc-600">Version {String(bill.version)} · {String(bill.status)}</span>
                        </span>
                        <ArrowRight size={16} className="text-zinc-600" />
                      </Link>
                    );
                  })
                )}
              </Card>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function Card({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
        {icon}
        {title}
      </h2>
      <div className="mt-5 space-y-3">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-zinc-900 pb-3">
      <span className="text-xs text-zinc-600">{label}</span>
      <span className="text-right text-sm text-zinc-300">{value}</span>
    </div>
  );
}
