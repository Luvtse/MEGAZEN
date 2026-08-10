"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type FormState = {
  bookingId: string;
  customerId: string;
  documentType: string;
  placeOfReceipt: string;
  portOfLoading: string;
  portOfDischarge: string;
  placeOfDelivery: string;
  shipperName: string;
  shipperAddress: string;
  consigneeName: string;
  consigneeAddress: string;
  notifyPartyName: string;
  notifyPartyAddress: string;
  vesselName: string;
  voyageNumber: string;
  issuePlace: string;
  numberOfOriginals: string;
  freightTerms: string;
  marksAndNumbers: string;
  description: string;
  grossWeight: string;
  measurement: string;
  packageCount: string;
  currency: string;
  declaredValue: string;
  termsText: string;
};

const initialForm: FormState = {
  bookingId: "",
  customerId: "",
  documentType: "ORIGINAL",
  placeOfReceipt: "",
  portOfLoading: "",
  portOfDischarge: "",
  placeOfDelivery: "",
  shipperName: "",
  shipperAddress: "",
  consigneeName: "",
  consigneeAddress: "",
  notifyPartyName: "",
  notifyPartyAddress: "",
  vesselName: "",
  voyageNumber: "",
  issuePlace: "",
  numberOfOriginals: "3",
  freightTerms: "PREPAID",
  marksAndNumbers: "",
  description: "",
  grossWeight: "",
  measurement: "",
  packageCount: "",
  currency: "USD",
  declaredValue: "",
  termsText: ""
};

const inputClass =
  "w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-zinc-500";

export default function NewBillOfLadingPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = <K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ): void => {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:4000/api/bills-of-lading",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-id": "REPLACE_WITH_TENANT_ID"
          },
          body: JSON.stringify({
            bookingId: form.bookingId,
            customerId: form.customerId,
            documentType: form.documentType,
            placeOfReceipt: form.placeOfReceipt,
            portOfLoading: form.portOfLoading,
            portOfDischarge: form.portOfDischarge,
            placeOfDelivery: form.placeOfDelivery || undefined,
            shipperName: form.shipperName,
            shipperAddress: form.shipperAddress,
            consigneeName: form.consigneeName,
            consigneeAddress: form.consigneeAddress,
            notifyPartyName: form.notifyPartyName || undefined,
            notifyPartyAddress: form.notifyPartyAddress || undefined,
            vesselName: form.vesselName || undefined,
            voyageNumber: form.voyageNumber || undefined,
            issuePlace: form.issuePlace,
            numberOfOriginals: Number(form.numberOfOriginals),
            freightTerms: form.freightTerms,
            marksAndNumbers: form.marksAndNumbers || undefined,
            description: form.description,
            grossWeight: form.grossWeight
              ? Number(form.grossWeight)
              : undefined,
            measurement: form.measurement
              ? Number(form.measurement)
              : undefined,
            packageCount: form.packageCount
              ? Number(form.packageCount)
              : undefined,
            currency: form.currency || undefined,
            declaredValue: form.declaredValue
              ? Number(form.declaredValue)
              : undefined,
            termsText: form.termsText || undefined,
            containerIds: []
          })
        }
      );

      const body = (await response.json()) as {
        success: boolean;
        data?: {
          id: string;
        };
        error?: {
          message: string;
        } | null;
      };

      if (!response.ok || !body.success || !body.data) {
        throw new Error(
          body.error?.message ?? "Unable to create Bill of Lading."
        );
      }

      router.push(`/bills-of-lading/${body.data.id}`);
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to create Bill of Lading."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-6 py-8 text-zinc-100">
      <div className="mx-auto max-w-7xl">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">
            Trade Documents
          </p>

          <h1 className="mt-2 text-3xl font-semibold">
            Create Bill of Lading
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Create a draft document. Container details can be attached after
            creation.
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-900 bg-red-950/30 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="mt-8 space-y-8">
          <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
            <h2 className="text-lg font-medium">Document & Routing</h2>

            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              <Field
                label="Booking ID"
                value={form.bookingId}
                onChange={(value) => update("bookingId", value)}
                required
              />

              <Field
                label="Customer ID"
                value={form.customerId}
                onChange={(value) => update("customerId", value)}
                required
              />

              <SelectField
                label="Document Type"
                value={form.documentType}
                options={[
                  "ORIGINAL",
                  "SEA_WAYBILL",
                  "NON_NEGOTIABLE"
                ]}
                onChange={(value) => update("documentType", value)}
              />

              <Field
                label="Place of Receipt"
                value={form.placeOfReceipt}
                onChange={(value) => update("placeOfReceipt", value)}
                required
              />

              <Field
                label="Port of Loading"
                value={form.portOfLoading}
                onChange={(value) => update("portOfLoading", value)}
                required
              />

              <Field
                label="Port of Discharge"
                value={form.portOfDischarge}
                onChange={(value) => update("portOfDischarge", value)}
                required
              />

              <Field
                label="Place of Delivery"
                value={form.placeOfDelivery}
                onChange={(value) => update("placeOfDelivery", value)}
              />

              <Field
                label="Issue Place"
                value={form.issuePlace}
                onChange={(value) => update("issuePlace", value)}
                required
              />

              <Field
                label="Number of Originals"
                type="number"
                value={form.numberOfOriginals}
                onChange={(value) => update("numberOfOriginals", value)}
                required
              />
            </div>
          </section>

          <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
            <h2 className="text-lg font-medium">Parties</h2>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <TextAreaField
                label="Shipper"
                value={form.shipperName}
                onChange={(value) => update("shipperName", value)}
                required
              />

              <TextAreaField
                label="Shipper Address"
                value={form.shipperAddress}
                onChange={(value) => update("shipperAddress", value)}
                required
              />

              <TextAreaField
                label="Consignee"
                value={form.consigneeName}
                onChange={(value) => update("consigneeName", value)}
                required
              />

              <TextAreaField
                label="Consignee Address"
                value={form.consigneeAddress}
                onChange={(value) => update("consigneeAddress", value)}
                required
              />

              <TextAreaField
                label="Notify Party"
                value={form.notifyPartyName}
                onChange={(value) => update("notifyPartyName", value)}
              />

              <TextAreaField
                label="Notify Party Address"
                value={form.notifyPartyAddress}
                onChange={(value) => update("notifyPartyAddress", value)}
              />
            </div>
          </section>

          <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
            <h2 className="text-lg font-medium">Cargo & Voyage</h2>

            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              <Field
                label="Vessel"
                value={form.vesselName}
                onChange={(value) => update("vesselName", value)}
              />

              <Field
                label="Voyage"
                value={form.voyageNumber}
                onChange={(value) => update("voyageNumber", value)}
              />

              <SelectField
                label="Freight Terms"
                value={form.freightTerms}
                options={[
                  "PREPAID",
                  "COLLECT",
                  "PREPAID_AND_COLLECT"
                ]}
                onChange={(value) => update("freightTerms", value)}
              />

              <Field
                label="Package Count"
                type="number"
                value={form.packageCount}
                onChange={(value) => update("packageCount", value)}
              />

              <Field
                label="Gross Weight"
                type="number"
                value={form.grossWeight}
                onChange={(value) => update("grossWeight", value)}
              />

              <Field
                label="Measurement"
                type="number"
                value={form.measurement}
                onChange={(value) => update("measurement", value)}
              />

              <Field
                label="Currency"
                value={form.currency}
                onChange={(value) => update("currency", value)}
              />

              <Field
                label="Declared Value"
                type="number"
                value={form.declaredValue}
                onChange={(value) => update("declaredValue", value)}
              />
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <TextAreaField
                label="Marks & Numbers"
                value={form.marksAndNumbers}
                onChange={(value) => update("marksAndNumbers", value)}
              />

              <TextAreaField
                label="Description of Goods"
                value={form.description}
                onChange={(value) => update("description", value)}
                required
              />

              <TextAreaField
                label="Terms & Clauses"
                value={form.termsText}
                onChange={(value) => update("termsText", value)}
              />
            </div>
          </section>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg border border-zinc-700 px-5 py-3 text-sm"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-white px-6 py-3 text-sm font-medium text-black disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Draft B/L"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label>
      <span className="mb-2 block text-xs uppercase tracking-wide text-zinc-500">
        {label}
      </span>

      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm outline-none focus:border-zinc-500"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  required = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label>
      <span className="mb-2 block text-xs uppercase tracking-wide text-zinc-500">
        {label}
      </span>

      <textarea
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="w-full resize-y rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm outline-none focus:border-zinc-500"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="mb-2 block text-xs uppercase tracking-wide text-zinc-500">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm outline-none focus:border-zinc-500"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}