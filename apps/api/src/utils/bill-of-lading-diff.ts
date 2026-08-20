export type BillOfLadingChange = {
  field: string;
  before: unknown;
  after: unknown;
};

const AMENDABLE_FIELDS = [
  "placeOfReceipt",
  "portOfLoading",
  "portOfDischarge",
  "placeOfDelivery",

  "shipperName",
  "shipperAddress",

  "consigneeName",
  "consigneeAddress",

  "notifyPartyName",
  "notifyPartyAddress",

  "vesselName",
  "voyageNumber",

  "freightTerms",
  "marksAndNumbers",

  "description",

  "grossWeight",
  "measurement",
  "packageCount",

  "currency",
  "declaredValue",

  "termsText"
] as const;

export type AmendableField =
  (typeof AMENDABLE_FIELDS)[number];

export function calculateBillOfLadingChanges(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): BillOfLadingChange[] {
  const changes: BillOfLadingChange[] = [];

  for (
    const field of AMENDABLE_FIELDS
  ) {
    const previous =
      before[field];

    const next =
      after[field];

    if (
      JSON.stringify(previous) !==
      JSON.stringify(next)
    ) {
      changes.push({
        field,
        before: previous,
        after: next
      });
    }
  }

  return changes;
}