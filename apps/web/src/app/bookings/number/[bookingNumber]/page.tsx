"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getBookingByNumber, type BookingReference } from "@/lib/api/bookings";

export default function BookingByNumberPage({ params }: { params: { bookingNumber: string } }) {
  const [booking, setBooking] = useState<BookingReference | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { void getBookingByNumber(params.bookingNumber).then(setBooking).catch((e: unknown)=>setError(e instanceof Error?e.message:"Booking not found")); }, [params.bookingNumber]);
  if (error) return <main className="min-h-screen bg-[#0a0a0a] p-8 text-red-300">{error}</main>;
  if (!booking) return <main className="min-h-screen bg-[#0a0a0a] p-8 text-zinc-400">Loading booking...</main>;
  return <main className="min-h-screen bg-[#0a0a0a] px-6 py-8 text-white"><div className="mx-auto max-w-5xl"><Link href="/bookings" className="text-sm text-zinc-500 hover:text-white">← Bookings</Link><div className="mt-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><p className="text-xs uppercase tracking-wide text-zinc-600">Permanent shipment reference</p><h1 className="mt-1 font-mono text-3xl font-bold">{booking.bookingNumber}</h1><p className="mt-2 text-sm text-zinc-500">B/L number inherited at document creation: ZENU{booking.bookingNumber}</p></div><Link href={`/bills-of-lading/create?bookingNumber=${booking.bookingNumber}`} className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black">Create B/L</Link></div><div className="mt-8 grid gap-5 md:grid-cols-2"><Card title="Movement"><Item label="Origin" value={booking.origin}/><Item label="Destination" value={booking.destination}/><Item label="Status" value={booking.status}/></Card><Card title="Cargo"><Item label="Description" value={booking.cargoDescription}/><Item label="Weight" value={String(booking.weight)}/><Item label="Volume" value={booking.volume==null?"—":String(booking.volume)}/></Card></div></div></main>;
}
function Card({title,children}:{title:string;children:React.ReactNode}){return <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-6"><h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">{title}</h2><div className="mt-5 space-y-4">{children}</div></section>}
function Item({label,value}:{label:string;value:string}){return <div><p className="text-xs text-zinc-600">{label}</p><p className="mt-1 text-sm text-zinc-200">{value}</p></div>}
