export const BILL_OF_LADING_ERRORS = {
  BL_NOT_DRAFT: {
    code: "BL_NOT_DRAFT",
    message: "Only a draft Bill of Lading can be submitted."
  },
  BL_NOT_EDITABLE: {
    code: "BL_NOT_EDITABLE",
    message: "Only a draft Bill of Lading can be edited."
  },
  BL_NOT_PENDING_APPROVAL: {
    code: "BL_NOT_PENDING_APPROVAL",
    message: "Bill of Lading is not pending approval."
  },
  BL_NOT_APPROVED: {
    code: "BL_NOT_APPROVED",
    message: "Bill of Lading must be approved before issue."
  },
  BL_NOT_ISSUED: {
    code: "BL_NOT_ISSUED",
    message: "Bill of Lading must be issued for this operation."
  },
  BL_CONTAINERS_LOCKED: {
    code: "BL_CONTAINERS_LOCKED",
    message: "Container details cannot be changed after submission."
  },
  ISSUED_BL_REQUIRES_CONTROLLED_AMENDMENT: {
    code: "ISSUED_BL_REQUIRES_CONTROLLED_AMENDMENT",
    message:
      "An issued Bill of Lading requires a controlled amendment workflow."
  },
  ONE_OR_MORE_CONTAINERS_NOT_FOUND: {
    code: "ONE_OR_MORE_CONTAINERS_NOT_FOUND",
    message: "One or more selected containers do not belong to this tenant."
  }
} as const;

export type BillOfLadingErrorCode =
  keyof typeof BILL_OF_LADING_ERRORS;