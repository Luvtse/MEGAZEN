"use client";

import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getBookingByNumber, listBookings, type BookingReference } from "@/lib/api/bookings";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingReference[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { void listBookings().then(setBookings).catch((e: unknown) => setError(e instanceof Error ? e.message : "Unable to load bookings")); }, []);

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return bookings;
    return bookings.filter((b) => b.bookingNumber.includes(q) || b.origin.toLowerCase().includes(q.toLowerCase()) || b.destination.toLowerCase().includes(q.toLowerCase()));
  }, [bookings, search]);

  async function exactLookup() {
    if (!/^\d{10}$/.test(search.trim())) return;
    try { setError(null); const booking = await getBookingByNumber(search.trim()); setBookings([booking]); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Booking not found"); }
  }

  return <main className="min-h-screen bg-[#0a0a0a] px-6 py-8 text-white"><div className="mx-auto max-w-7xl">
    <div className="mb-8 flex items-center justify-between"><div><h1 className="text-3xl font-bold">Bookings</h1><p className="mt-2 text-sm text-zinc-400">The 10-digit booking number is the permanent shipment reference.</p></div><Link href="/bookings/create" className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black"><Plus size={16}/>New Booking</Link></div>
    <div className="mb-5 flex gap-2"><div className="flex flex-1 items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4"><Search size={18} className="text-zinc-500"/><input value={search} onChange={(e)=>setSearch(e.target.value)} onKeyDown={(e)=>{if(e.key==="Enter") void exactLookup();}} placeholder="Search exact 10-digit booking number or route..." className="h-12 w-full bg-transparent text-sm outline-none"/></div><button onClick={()=>void exactLookup()} className="rounded-xl border border-zinc-700 px-5 text-sm hover:bg-zinc-900">Lookup</button></div>
    {error && <div className="mb-5 rounded-xl border border-red-900 bg-red-950/30 p-4 text-sm text-red-300">{error}</div>}
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950"><table className="w-full text-left text-sm"><thead className="border-b border-zinc-800 text-xs uppercase text-zinc-500"><tr><th className="px-5 py-4">Booking Number</th><th className="px-5 py-4">Origin</th><th className="px-5 py-4">Destination</th><th className="px-5 py-4">Cargo</th><th className="px-5 py-4">Status</th></tr></thead><tbody>{filtered.map((b)=><tr key={b.id} className="border-b border-zinc-900"><td className="px-5 py-4 font-mono font-semibold"><Link href={`/bookings/number/${b.bookingNumber}`} className="hover:underline">{b.bookingNumber}</Link><div className="text-xs font-normal text-zinc-600">B/L: ZENU{b.bookingNumber}</div></td><td className="px-5 py-4">{b.origin}</td><td className="px-5 py-4">{b.destination}</td><td className="px-5 py-4 text-zinc-400">{b.cargoDescription}</td><td className="px-5 py-4 text-zinc-400">{b.status}</td></tr>)}</tbody></table></div>
  </div></main>;
}
