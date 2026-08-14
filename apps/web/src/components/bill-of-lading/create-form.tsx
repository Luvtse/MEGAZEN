"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

import {
  createBillOfLading
} from "@/lib/api/bill-of-lading";

const schema = z.object({
  bookingId:
    z.string().uuid(),

  customerId:
    z.string().uuid(),

  placeOfReceipt:
    z.string().min(2),

  portOfLoading:
    z.string().min(2),

  portOfDischarge:
    z.string().min(2),

  placeOfDelivery:
    z.string().optional(),

  shipperName:
    z.string().min(2),

  shipperAddress:
    z.string().min(2),

  consigneeName:
    z.string().min(2),

  consigneeAddress:
    z.string().min(2),

  notifyPartyName:
    z.string().optional(),

  notifyPartyAddress:
    z.string().optional(),

  vesselName:
    z.string().optional(),

  voyageNumber:
    z.string().optional(),

  issuePlace:
    z.string().min(2),

  description:
    z.string().min(2),

  numberOfOriginals:
    z.coerce.number().int().min(1).max(9),

  grossWeight:
    z.coerce.number().nonnegative().optional(),

  measurement:
    z.coerce.number().nonnegative().optional(),

  packageCount:
    z.coerce.number().int().nonnegative().optional(),

  currency:
    z.string().length(3).optional(),

  declaredValue:
    z.coerce.number().nonnegative().optional(),

  freightTerms:
    z.string().optional(),

  marksAndNumbers:
    z.string().optional(),

  termsText:
    z.string().optional()
});

type FormState = z.infer<
  typeof schema
>;

const initialState: FormState = {
  bookingId: "",
  customerId: "",

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

  issuePlace: "Addis Ababa",

  description: "",

  numberOfOriginals: 3,

  grossWeight:
    undefined,

  measurement:
    undefined,

  packageCount:
    undefined,

  currency:
    "USD",

  declaredValue:
    undefined,

  freightTerms: "",

  marksAndNumbers: "",

  termsText: ""
};

function Field({
  label,
  value,
  onChange,
  multiline = false,
  placeholder
}: {
  label: string;
  value: string | number | undefined;
  onChange: (
    value: string
  ) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  const className =
    "mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-zinc-500";

  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </span>

      {multiline ? (
        <textarea
          value={
            value === undefined
              ? ""
              : String(value)
          }
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          rows={4}
          placeholder={
            placeholder
          }
          className={className}
        />
      ) : (
        <input
          value={
            value === undefined
              ? ""
              : String(value)
          }
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          placeholder={
            placeholder
          }
          className={className}
        />
      )}
    </label>
  );
}

export function BillOfLadingCreateForm() {
  const router = useRouter();

  const [
    form,
    setForm
  ] = useState<FormState>(
    initialState
  );

  const [
    error,
    setError
  ] = useState<string | null>(
    null
  );

  const [
    saving,
    setSaving
  ] = useState(false);

  function update(
    key: keyof FormState,
    value: string
  ) {
    setForm(
      (current) => ({
        ...current,
        [key]: value
      })
    );
  }

  async function submit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError(null);

    const parsed =
      schema.safeParse(form);

    if (!parsed.success) {
      setError(
        parsed.error.issues
          .map(
            (issue) =>
              issue.message
          )
          .join(", ")
      );

      return;
    }

    try {
      setSaving(true);

      const document =
        await createBillOfLading(
          {
            ...parsed.data,

            documentType:
              "ORIGINAL",

            containerIds: []
          }
        );

      router.push(
        `/bills-of-lading/${document.id}`
      );
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to create B/L"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-8"
    >
      {error ? (
        <div className="rounded-xl border border-red-900 bg-red-950/30 p-4 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
        <h2 className="text-lg font-semibold">
          Document References
        </h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field
            label="Booking ID"
            value={
              form.bookingId
            }
            onChange={(value) =>
              update(
                "bookingId",
                value
              )
            }
          />

          <Field
            label="Customer ID"
            value={
              form.customerId
            }
            onChange={(value) =>
              update(
                "customerId",
                value
              )
            }
          />
        </div>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
        <h2 className="text-lg font-semibold">
          Parties
        </h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field
            label="Shipper"
            value={
              form.shipperName
            }
            onChange={(value) =>
              update(
                "shipperName",
                value
              )
            }
          />

          <Field
            label="Consignee"
            value={
              form.consigneeName
            }
            onChange={(value) =>
              update(
                "consigneeName",
                value
              )
            }
          />

          <Field
            label="Shipper Address"
            value={
              form.shipperAddress
            }
            multiline
            onChange={(value) =>
              update(
                "shipperAddress",
                value
              )
            }
          />

          <Field
            label="Consignee Address"
            value={
              form.consigneeAddress
            }
            multiline
            onChange={(value) =>
              update(
                "consigneeAddress",
                value
              )
            }
          />

          <Field
            label="Notify Party"
            value={
              form.notifyPartyName
            }
            onChange={(value) =>
              update(
                "notifyPartyName",
                value
              )
            }
          />

          <Field
            label="Notify Address"
            value={
              form.notifyPartyAddress
            }
            multiline
            onChange={(value) =>
              update(
                "notifyPartyAddress",
                value
              )
            }
          />
        </div>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
        <h2 className="text-lg font-semibold">
          Routing & Vessel
        </h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field
            label="Place of Receipt"
            value={
              form.placeOfReceipt
            }
            onChange={(value) =>
              update(
                "placeOfReceipt",
                value
              )
            }
          />

          <Field
            label="Place of Delivery"
            value={
              form.placeOfDelivery
            }
            onChange={(value) =>
              update(
                "placeOfDelivery",
                value
              )
            }
          />

          <Field
            label="Port of Loading"
            value={
              form.portOfLoading
            }
            onChange={(value) =>
              update(
                "portOfLoading",
                value
              )
            }
          />

          <Field
            label="Port of Discharge"
            value={
              form.portOfDischarge
            }
            onChange={(value) =>
              update(
                "portOfDischarge",
                value
              )
            }
          />

          <Field
            label="Vessel"
            value={
              form.vesselName
            }
            onChange={(value) =>
              update(
                "vesselName",
                value
              )
            }
          />

          <Field
            label="Voyage"
            value={
              form.voyageNumber
            }
            onChange={(value) =>
              update(
                "voyageNumber",
                value
              )
            }
          />

          <Field
            label="Issue Place"
            value={
              form.issuePlace
            }
            onChange={(value) =>
              update(
                "issuePlace",
                value
              )
            }
          />
        </div>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
        <h2 className="text-lg font-semibold">
          Cargo Particulars
        </h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field
            label="Description"
            value={
              form.description
            }
            multiline
            onChange={(value) =>
              update(
                "description",
                value
              )
            }
          />

          <Field
            label="Marks & Numbers"
            value={
              form.marksAndNumbers
            }
            multiline
            onChange={(value) =>
              update(
                "marksAndNumbers",
                value
              )
            }
          />

          <Field
            label="Package Count"
            value={
              form.packageCount
            }
            onChange={(value) =>
              update(
                "packageCount",
                value
              )
            }
          />

          <Field
            label="Gross Weight"
            value={
              form.grossWeight
            }
            onChange={(value) =>
              update(
                "grossWeight",
                value
              )
            }
          />

          <Field
            label="Measurement"
            value={
              form.measurement
            }
            onChange={(value) =>
              update(
                "measurement",
                value
              )
            }
          />

          <Field
            label="Currency"
            value={
              form.currency
            }
            onChange={(value) =>
              update(
                "currency",
                value.toUpperCase()
              )
            }
          />

          <Field
            label="Declared Value"
            value={
              form.declaredValue
            }
            onChange={(value) =>
              update(
                "declaredValue",
                value
              )
            }
          />

          <Field
            label="Freight Terms"
            value={
              form.freightTerms
            }
            onChange={(value) =>
              update(
                "freightTerms",
                value
              )
            }
          />
        </div>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
        <h2 className="text-lg font-semibold">
          Terms & Originals
        </h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field
            label="Number of Originals"
            value={
              form.numberOfOriginals
            }
            onChange={(value) =>
              update(
                "numberOfOriginals",
                value
              )
            }
          />

          <Field
            label="Terms / Clauses"
            value={
              form.termsText
            }
            multiline
            onChange={(value) =>
              update(
                "termsText",
                value
              )
            }
          />
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() =>
            router.push(
              "/bills-of-lading"
            )
          }
          className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-900"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? "Creating..."
            : "Create Draft B/L"}
        </button>
      </div>
    </form>
  );
}
