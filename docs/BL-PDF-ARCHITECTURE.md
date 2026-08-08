# MEGAZEN Bill of Lading PDF Architecture

The document model is designed for modern carrier and freight-document workflows without tying the application to a third-party brand or proprietary implementation.

## Supported document lifecycle

Draft → Pending Approval → Approved → Issued → Surrendered/Released

## PDF goals

The next document-engine milestone will support:

- Single-page B/L layouts where content fits naturally.
- Multi-page B/L layouts when cargo descriptions, marks, clauses, container lines or terms exceed one page.
- Repeating document header and footer.
- Repeating cargo-table headers across pages.
- Page numbering (`Page X of Y`).
- Controlled page breaks.
- QR verification payload.
- Document hash.
- Revision/version indicator.
- Original/copy designation.
- Tenant branding.
- Watermark support.
- Printable A4 and Letter output.
- PDF metadata.
- Archived immutable issued-document representation.

## Important implementation boundary

MEGAZEN will use established international shipping-document concepts and interoperability practices, but the implementation will be MEGAZEN's own templates, data model, rendering code and UX. We will not reproduce another organization's proprietary source code, branding, certificates, seals or protected artwork.

The PDF engine will be implemented as a reusable package so the same pagination and verification infrastructure can later power Release Orders, Delivery Orders, EIRs, manifests and other operational documents.
