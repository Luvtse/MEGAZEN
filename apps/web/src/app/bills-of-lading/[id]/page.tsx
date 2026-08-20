"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Download,
  FileCheck2,
  FileEdit,
  Lock,
  Send,
  ShieldCheck
} from "lucide-react";
import {
  useEffect,
  useState
} from "react";

import {
  approveBillOfLading,
  amendBillOfLading,
  downloadBillOfLadingPdf,
  getBillOfLading,
  issueBillOfLading,
  releaseBillOfLading,
  submitBillOfLading,
  surrenderBillOfLading,
  type BillOfLading
} from "@/lib/api/bill-of-lading";

import {
  BillOfLadingStatusBadge
} from "@/components/bill-of-lading/status-badge";
import { BillOfLadingContainers } from "@/app/components/bills-of-loading/BillOfLadingContainers";

type Props = {
  params: {
    id: string;
  };
};

export default function BillOfLadingDetailPage({
  params
}: Props) {
  const [
    document,
    setDocument
  ] = useState<BillOfLading | null>(
    null
  );

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    working,
    setWorking
  ] = useState(false);

  const [
    error,
    setError
  ] = useState<string | null>(
    null
  );

  async function reload() {
    setLoading(true);

    try {
      const item =
        await getBillOfLading(
          params.id
        );

      setDocument(item);
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to load document"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, [params.id]);

  async function action(
    operation: () => Promise<BillOfLading>
  ) {
    setWorking(true);
    setError(null);

    try {
      const updated =
        await operation();

      setDocument(updated);
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Operation failed"
      );
    } finally {
      setWorking(false);
    }
  }

  async function downloadPdf() {
    setWorking(true);
    setError(null);
    try {
      const blob = await downloadBillOfLadingPdf(document?.id ?? params.id);
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = `${document?.blNumber ?? "MEGAZEN-BL"}-v${document?.version ?? 1}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to download B/L PDF"
      );
    } finally {
      setWorking(false);
    }
  }

  async function amend() {
    const reason =
      window.prompt(
        "Reason for amendment"
      );

    if (!reason?.trim()) {
      return;
    }

    await action(() =>
      amendBillOfLading(
        params.id,
        reason.trim()
      )
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] p-8 text-zinc-400">
        Loading Bill of Lading...
      </main>
    );
  }

  if (!document) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] p-8 text-white">
        Document not found.
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/bills-of-lading"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white"
        >
          <ArrowLeft size={15} />
          Bills of Lading
        </Link>

        <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold">
                {document.blNumber}
              </h1>

              <BillOfLadingStatusBadge
                status={
                  document.status
                }
              />
            </div>

            <p className="mt-2 text-sm text-zinc-500">
              Version{" "}
              {document.version}
              {" · "}
              {
                document.documentType
              }
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {document.status ===
            "DRAFT" ? (
              <button
                disabled={working}
                onClick={() =>
                  action(() =>
                    submitBillOfLading(
                      document.id
                    )
                  )
                }
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
              >
                <Send size={15} />
                Submit
              </button>
            ) : null}

            {document.status ===
            "REVIEW" ? (
              <button
                disabled={working}
                onClick={() =>
                  action(() =>
                    approveBillOfLading(
                      document.id
                    )
                  )
                }
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
              >
                <ShieldCheck
                  size={15}
                />
                Approve
              </button>
            ) : null}

            {document.status ===
            "APPROVED" ? (
              <button
                disabled={working}
                onClick={() =>
                  action(() =>
                    issueBillOfLading(
                      document.id
                    )
                  )
                }
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
              >
                <FileCheck2
                  size={15}
                />
                Issue
              </button>
            ) : null}

            {["ISSUED", "RELEASED", "SURRENDERED"].includes(document.status) ? (
              <>
                <Link
                  href={`/bills-of-lading/${document.id}/preview`}
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium hover:bg-zinc-900"
                >
                  Preview
                </Link>
                <button
                  disabled={working}
                  onClick={() => void downloadPdf()}
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium hover:bg-zinc-900 disabled:opacity-50"
                >
                  <Download size={15} />
                  PDF
                </button>

                {document.status === "ISSUED" ? (
                  <>
                    <button
                      disabled={working}
                      onClick={() =>
                        action(() =>
                          releaseBillOfLading(document.id)
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-lg border border-purple-800 px-4 py-2 text-sm font-medium text-purple-300 hover:bg-purple-950/30 disabled:opacity-50"
                    >
                      <Send size={15} />
                      Release
                    </button>

                    <button
                      disabled={working}
                      onClick={amend}
                      className="inline-flex items-center gap-2 rounded-lg border border-amber-800 px-4 py-2 text-sm font-medium text-amber-300 hover:bg-amber-950/30 disabled:opacity-50"
                    >
                      <FileEdit size={15} />
                      Amend
                    </button>

                    <button
                      disabled={working}
                      onClick={() =>
                        action(() =>
                          surrenderBillOfLading(document.id)
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-lg border border-red-900 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-950/30 disabled:opacity-50"
                    >
                      <Lock size={15} />
                      Surrender
                    </button>
                  </>
                ) : null}
              </>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-xl border border-red-900 bg-red-950/30 p-4 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <InfoCard
            title="Parties"
            items={[
              [
                "Shipper",
                document.shipperName
              ],
              [
                "Consignee",
                document.consigneeName
              ],
              [
                "Notify",
                document.notifyPartyName ??
                  "—"
              ]
            ]}
          />

          <InfoCard
            title="Routing"
            items={[
              [
                "Receipt",
                document.placeOfReceipt
              ],
              [
                "Loading",
                document.portOfLoading
              ],
              [
                "Discharge",
                document.portOfDischarge
              ],
              [
                "Delivery",
                document.placeOfDelivery ??
                  "—"
              ]
            ]}
          />

          <InfoCard
            title="Voyage"
            items={[
              [
                "Vessel",
                document.vesselName ??
                  "—"
              ],
              [
                "Voyage",
                document.voyageNumber ??
                  "—"
              ],
              [
                "Issue Place",
                document.issuePlace
              ],
              [
                "Issue Date",
                new Date(document.issueDate ?? Date.now()).toLocaleDateString()
              ]
            ]}
          />
        </div>

        <section className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950 p-6">
          <h2 className="text-lg font-semibold">
            Cargo Particulars
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-4">
            <Metric
              label="Packages"
              value={
                document.packageCount ??
                "—"
              }
            />

            <Metric
              label="Gross Weight"
              value={
                document.grossWeight ??
                "—"
              }
            />

            <Metric
              label="Measurement"
              value={
                document.measurement ??
                "—"
              }
            />

            <Metric
              label="Declared Value"
              value={
                document.declaredValue
                  ? `${document.currency ?? ""} ${document.declaredValue}`
                  : "—"
              }
            />
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <TextBlock
              title="Marks & Numbers"
              value={
                document.marksAndNumbers ??
                "—"
              }
            />

            <TextBlock
              title="Description"
              value={
                document.description
              }
            />
          </div>
        </section>

        <BillOfLadingContainers
          billOfLadingId={document.id}
          editable={document.status === "DRAFT"}
        />

        <section className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950 p-6">
          <h2 className="text-lg font-semibold">
            Document Integrity
          </h2>

          <div className="mt-4 rounded-lg border border-zinc-900 bg-black p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-600">
              Verification Code
            </p>

            <p className="mt-1 font-mono text-sm text-zinc-300">
              {
                document.verificationCode
              }
            </p>

            <p className="mt-5 text-xs uppercase tracking-wide text-zinc-600">
              SHA-256 Document Hash
            </p>

            <p className="mt-1 break-all font-mono text-xs text-zinc-500">
              {
                document.documentHash ??
                "Not issued"
              }
            </p>
          </div>
        </section>

        <section className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950 p-6">
          <h2 className="text-lg font-semibold">
            Revision History
          </h2>

          <div className="mt-4 space-y-3">
            {document.revisions?.map(
              (revision) => (
                <div
                  key={
                    revision.id
                  }
                  className="flex items-center justify-between rounded-lg border border-zinc-900 bg-black px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      Version{" "}
                      {
                        revision.version
                      }
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      {
                        revision.reason
                      }
                    </p>
                  </div>

                  <span className="text-xs text-zinc-600">
                    {new Date(
                      revision.createdAt
                    ).toLocaleString()}
                  </span>
                </div>
              )
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoCard({
  title,
  items
}: {
  title: string;
  items: Array<
    [string, string]
  >;
}) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </h2>

      <div className="mt-5 space-y-4">
        {items.map(
          ([label, value]) => (
            <div
              key={label}
            >
              <p className="text-xs text-zinc-600">
                {label}
              </p>

              <p className="mt-1 text-sm text-zinc-200">
                {value}
              </p>
            </div>
          )
        )}
      </div>
    </section>
  );
}

function Metric({
  label,
  value
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border border-zinc-900 bg-black p-4">
      <p className="text-xs uppercase text-zinc-600">
        {label}
      </p>

      <p className="mt-2 text-lg font-semibold">
        {value}
      </p>
    </div>
  );
}

function TextBlock({
  title,
  value
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-900 bg-black p-4">
      <p className="text-xs uppercase text-zinc-600">
        {title}
      </p>

      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-300">
        {value}
      </p>
    </div>
  );
}
