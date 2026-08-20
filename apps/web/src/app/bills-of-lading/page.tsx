"use client";

import Link from "next/link";
import {
  FileText,
  Plus,
  Search
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  listBillOfLadings,
  type BillOfLading
} from "@/lib/api/bill-of-lading";

import {
  BillOfLadingStatusBadge
} from "@/components/bill-of-lading/status-badge";

export default function BillsOfLadingPage() {
  const [
    documents,
    setDocuments
  ] = useState<BillOfLading[]>([]);

  const [
    search,
    setSearch
  ] = useState("");

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    error,
    setError
  ] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void listBillOfLadings()
      .then((items) => {
        if (active) {
          setDocuments(items);
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Unable to load B/L documents"
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const filtered =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return documents;
      }

      return documents.filter(
        (document) =>
          document.blNumber
            .toLowerCase()
            .includes(query) ||
          document.shipperName
            .toLowerCase()
            .includes(query) ||
          document.consigneeName
            .toLowerCase()
            .includes(query) ||
          document.portOfLoading
            .toLowerCase()
            .includes(query) ||
          document.portOfDischarge
            .toLowerCase()
            .includes(query)
      );
    }, [
      documents,
      search
    ]);

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <FileText size={28} />

              <h1 className="text-3xl font-bold">
                Bills of Lading
              </h1>
            </div>

            <p className="mt-2 text-sm text-zinc-400">
              Controlled transport-document
              lifecycle and issuance.
            </p>
          </div>

          <Link
            href="/bills-of-lading/create"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            <Plus size={16} />
            New Bill of Lading
          </Link>
        </div>

        <div className="mb-5 flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4">
          <Search
            size={18}
            className="text-zinc-500"
          />

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search B/L number, shipper, consignee, port..."
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-zinc-600"
          />
        </div>

        {error ? (
          <div className="rounded-xl border border-red-900 bg-red-950/30 p-4 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-900/70 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-5 py-4">
                    B/L Number
                  </th>

                  <th className="px-5 py-4">
                    Version
                  </th>

                  <th className="px-5 py-4">
                    Shipper
                  </th>

                  <th className="px-5 py-4">
                    Consignee
                  </th>

                  <th className="px-5 py-4">
                    Routing
                  </th>

                  <th className="px-5 py-4">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-zinc-500"
                    >
                      Loading documents...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-zinc-500"
                    >
                      No Bills of Lading found.
                    </td>
                  </tr>
                ) : (
                  filtered.map(
                    (document) => (
                      <tr
                        key={
                          document.id
                        }
                        className="border-b border-zinc-900 transition hover:bg-zinc-900/60"
                      >
                        <td className="px-5 py-4">
                          <Link
                            href={`/bills-of-lading/${document.id}`}
                            className="font-semibold text-white hover:underline"
                          >
                            {
                              document.blNumber
                            }
                          </Link>
                        </td>

                        <td className="px-5 py-4 text-zinc-400">
                          V
                          {
                            document.version
                          }
                        </td>

                        <td className="px-5 py-4">
                          {
                            document.shipperName
                          }
                        </td>

                        <td className="px-5 py-4">
                          {
                            document.consigneeName
                          }
                        </td>

                        <td className="px-5 py-4 text-zinc-400">
                          {
                            document.portOfLoading
                          }
                          {" → "}
                          {
                            document.portOfDischarge
                          }
                        </td>

                        <td className="px-5 py-4">
                          <BillOfLadingStatusBadge
                            status={
                              document.status
                            }
                          />
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
