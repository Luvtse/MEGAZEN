import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] px-6 py-16 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs tracking-[.35em] text-zinc-500">MEGAZEN</p>
        <h1 className="mt-5 text-5xl font-semibold">Digital logistics operations.</h1>
        <p className="mt-5 max-w-2xl text-zinc-400">
          Foundation for bookings, containers, shipments, documents, terminal operations and real-time trade visibility.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-black" href="/dashboard">
            Open dashboard
          </Link>
          <Link className="rounded-lg border border-zinc-700 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-900" href="/search">
            Search shipment reference
          </Link>
        </div>
      </div>
    </main>
  );
}
