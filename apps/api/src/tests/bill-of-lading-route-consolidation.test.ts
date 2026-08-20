import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const workflowRoute = readFileSync(join(here, "../routes/bill-of-lading-workflow.ts"), "utf8");

assert.equal(workflowRoute.includes('post("/:id/approve"'), false);
assert.equal(workflowRoute.includes('post("/:id/release"'), false);
assert.equal(workflowRoute.includes('post("/:id/surrender"'), false);
assert.equal(workflowRoute.includes("BL_WORKFLOW_ROUTE_DEPRECATED"), true);

console.log("B/L route consolidation checks passed.");
