"use client";

import { useEffect, useState } from "react";

type Revision = {
  id: string;
  version: number;
  reason: string | null;
  contentHash: string | null;
  changedBy: string | null;
  createdAt: string;
};

type Props = {
  billOfLadingId: string;
};

export function BillOfLadingAmendmentHistory({
  billOfLadingId
}: Props) {
  const [revisions, setRevisions] =
    useState<Revision[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const load =
      async (): Promise<void> => {
        try {
          const response =
            await fetch(
              `/api/bills-of-lading/${billOfLadingId}/revisions`,
              {
                cache: "no-store"
              }
            );

          if (!response.ok) {
            throw new Error(
              "Unable to load B/L revisions."
            );
          }

          const body =
            (await response.json()) as {
              success: boolean;
              data: {
                revisions: Revision[];
              };
            };

          if (
            body.success &&
            body.data
          ) {
            setRevisions(
              body.data.revisions
            );
          }
        } finally {
          setLoading(false);
        }
      };

    void load();
  }, [billOfLadingId]);

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
        <p className="text-sm text-zinc-500">
          Loading document history...
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950">
      <div className="border-b border-zinc-800 px-6 py-4">
        <h2 className="text-sm font-semibold text-zinc-100">
          Document History
        </h2>

        <p className="mt-1 text-xs text-zinc-500">
          Every document version remains traceable.
        </p>
      </div>

      <div className="divide-y divide-zinc-800">
        {revisions.map(
          (revision) => (
            <div
              key={revision.id}
              className="grid gap-4 px-6 py-5 md:grid-cols-[100px_1fr_auto]"
            >
              <div>
                <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-medium text-zinc-300">
                  v{revision.version}
                </span>
              </div>

              <div>
                <p className="text-sm text-zinc-200">
                  {revision.reason ??
                    "Document revision"}
                </p>

                <p className="mt-1 text-xs text-zinc-600">
                  {new Date(
                    revision.createdAt
                  ).toLocaleString()}
                </p>
              </div>

              <div className="max-w-xs truncate font-mono text-xs text-zinc-600">
                {revision.contentHash ??
                  "No integrity hash"}
              </div>
            </div>
          )
        )}

        {revisions.length === 0 && (
          <div className="px-6 py-8 text-sm text-zinc-600">
            No document revisions found.
          </div>
        )}
      </div>
    </section>
  );
}