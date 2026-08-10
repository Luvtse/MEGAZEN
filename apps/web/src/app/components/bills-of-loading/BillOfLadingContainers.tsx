"use client";

import { useEffect, useState } from "react";

type Container = {
  id: string;
  containerNumber: string;
  type: string;
  size: string;
  status: string;
};

type BillContainer = {
  id: string;
  containerId: string;
  sealNumber: string | null;
  packageCount: number | null;
  packageType: string | null;
  grossWeight: string | number | null;
  measurement: string | number | null;
  container: Container;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  error: {
    code: string;
    message: string;
  } | null;
};

export function BillOfLadingContainers({
  billOfLadingId,
  editable
}: {
  billOfLadingId: string;
  editable: boolean;
}) {
  const [relations, setRelations] = useState<BillContainer[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [containerId, setContainerId] = useState("");
  const [sealNumber, setSealNumber] = useState("");
  const [packageCount, setPackageCount] = useState("");
  const [packageType, setPackageType] = useState("");
  const [grossWeight, setGrossWeight] = useState("");
  const [measurement, setMeasurement] = useState("");
  const [message, setMessage] = useState("");

  const headers = {
    "Content-Type": "application/json",
    "x-tenant-id": "REPLACE_WITH_TENANT_ID"
  };

  const load = async (): Promise<void> => {
    const response = await fetch(
      `http://localhost:4000/api/bills-of-lading/${billOfLadingId}/containers`,
      {
        headers
      }
    );

    const body = (await response.json()) as ApiResponse<BillContainer[]>;

    if (body.success) {
      setRelations(body.data);
    }
  };

  const loadContainers = async (): Promise<void> => {
    const response = await fetch(
      "http://localhost:4000/api/containers?limit=100",
      {
        headers
      }
    );

    const body = (await response.json()) as ApiResponse<Container[]>;

    if (body.success) {
      setContainers(body.data);
    }
  };

  useEffect(() => {
    void load();
    void loadContainers();
  }, [billOfLadingId]);

  const attach = async (): Promise<void> => {
    if (!containerId) {
      setMessage("Select a container.");
      return;
    }

    setMessage("Attaching container...");

    const response = await fetch(
      `http://localhost:4000/api/bills-of-lading/${billOfLadingId}/containers`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          containerId,
          sealNumber: sealNumber || undefined,
          packageCount: packageCount
            ? Number(packageCount)
            : undefined,
          packageType: packageType || undefined,
          grossWeight: grossWeight
            ? Number(grossWeight)
            : undefined,
          measurement: measurement
            ? Number(measurement)
            : undefined
        })
      }
    );

    const body =
      (await response.json()) as ApiResponse<BillContainer>;

    if (!response.ok || !body.success) {
      setMessage(body.error?.message ?? "Unable to attach container.");
      return;
    }

    setContainerId("");
    setSealNumber("");
    setPackageCount("");
    setPackageType("");
    setGrossWeight("");
    setMeasurement("");
    setMessage("Container attached.");
    await load();
  };

  const remove = async (relationId: string): Promise<void> => {
    const response = await fetch(
      `http://localhost:4000/api/bills-of-lading/${billOfLadingId}/containers/${relationId}`,
      {
        method: "DELETE",
        headers
      }
    );

    const body =
      (await response.json()) as ApiResponse<{ deleted: boolean }>;

    if (!response.ok || !body.success) {
      setMessage(body.error?.message ?? "Unable to remove container.");
      return;
    }

    await load();
  };

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          Cargo Equipment
        </p>

        <h2 className="mt-1 text-lg font-medium">
          Containers & Seals
        </h2>
      </div>

      {editable && (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <label>
            <span className="mb-2 block text-xs text-zinc-500">
              Container
            </span>

            <select
              value={containerId}
              onChange={(event) => setContainerId(event.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-sm"
            >
              <option value="">Select container</option>

              {containers
                .filter(
                  (container) =>
                    !relations.some(
                      (relation) =>
                        relation.containerId === container.id
                    )
                )
                .map((container) => (
                  <option key={container.id} value={container.id}>
                    {container.containerNumber} · {container.size} ·{" "}
                    {container.type}
                  </option>
                ))}
            </select>
          </label>

          <Input
            label="Seal Number"
            value={sealNumber}
            onChange={setSealNumber}
          />

          <Input
            label="Package Count"
            value={packageCount}
            onChange={setPackageCount}
            type="number"
          />

          <Input
            label="Package Type"
            value={packageType}
            onChange={setPackageType}
          />

          <Input
            label="Gross Weight"
            value={grossWeight}
            onChange={setGrossWeight}
            type="number"
          />

          <Input
            label="Measurement"
            value={measurement}
            onChange={setMeasurement}
            type="number"
          />

          <button
            type="button"
            onClick={() => void attach()}
            className="rounded-lg bg-white px-5 py-3 text-sm font-medium text-black"
          >
            Attach Container
          </button>
        </div>
      )}

      {message && (
        <p className="mt-4 text-sm text-zinc-400">
          {message}
        </p>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-800">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="border-b border-zinc-800 bg-zinc-900">
            <tr>
              <th className="px-4 py-3 text-xs text-zinc-500">
                Container
              </th>
              <th className="px-4 py-3 text-xs text-zinc-500">
                Type
              </th>
              <th className="px-4 py-3 text-xs text-zinc-500">
                Seal
              </th>
              <th className="px-4 py-3 text-xs text-zinc-500">
                Packages
              </th>
              <th className="px-4 py-3 text-xs text-zinc-500">
                Weight
              </th>
              <th className="px-4 py-3 text-xs text-zinc-500">
                Measurement
              </th>
              {editable && (
                <th className="px-4 py-3 text-xs text-zinc-500">
                  Action
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {relations.map((relation) => (
              <tr
                key={relation.id}
                className="border-b border-zinc-900"
              >
                <td className="px-4 py-3 font-medium">
                  {relation.container.containerNumber}
                </td>

                <td className="px-4 py-3">
                  {relation.container.size} /{" "}
                  {relation.container.type}
                </td>

                <td className="px-4 py-3">
                  {relation.sealNumber ?? "—"}
                </td>

                <td className="px-4 py-3">
                  {relation.packageCount ?? "—"}
                </td>

                <td className="px-4 py-3">
                  {relation.grossWeight ?? "—"}
                </td>

                <td className="px-4 py-3">
                  {relation.measurement ?? "—"}
                </td>

                {editable && (
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => void remove(relation.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </td>
                )}
              </tr>
            ))}

            {relations.length === 0 && (
              <tr>
                <td
                  colSpan={editable ? 7 : 6}
                  className="px-4 py-8 text-center text-zinc-500"
                >
                  No containers attached to this B/L.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label>
      <span className="mb-2 block text-xs text-zinc-500">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-sm"
      />
    </label>
  );
}