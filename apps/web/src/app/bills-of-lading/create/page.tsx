import Link from "next/link";

import {
  BillOfLadingCreateForm
} from "@/components/bill-of-lading/create-form";

export default function CreateBillOfLadingPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <Link
            href="/bills-of-lading"
            className="text-sm text-zinc-500 hover:text-white"
          >
            ← Bills of Lading
          </Link>

          <h1 className="mt-4 text-3xl font-bold">
            Create Bill of Lading
          </h1>

          <p className="mt-2 text-sm text-zinc-400">
            Create a controlled draft from
            the booking and shipment data.
          </p>
        </div>

        <BillOfLadingCreateForm />
      </div>
    </main>
  );
}
