# MEGAZEN Document Engine

Reusable PDF infrastructure for operational and trade documents.

Current renderer:
- Bill of Lading
- A4
- automatic pagination
- repeated page header
- page numbering
- cargo/container table
- QR verification payload
- SHA-256 integrity value
- version/status metadata

The renderer is intentionally independent of the web UI so the API, background jobs and future document services can use the same document contract.
