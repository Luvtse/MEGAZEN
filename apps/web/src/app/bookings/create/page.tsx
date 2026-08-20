"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBooking } from "@/lib/api/bookings";
import { listCustomers, type CustomerReference } from "@/lib/api/customers";
import { listContainers, type ContainerReference } from "@/lib/api/containers";

export default function CreateBookingPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerReference[]>([]);
  const [containers, setContainers] = useState<ContainerReference[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [containerId, setContainerId] = useState("");
  const [origin, setOrigin] = useState("Djibouti");
  const [destination, setDestination] = useState("Addis Ababa");
  const [cargoDescription, setCargoDescription] = useState("");
  const [weight, setWeight] = useState("0");
  const [volume, setVolume] = useState("");
  const [number, setNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { void Promise.all([listCustomers(), listContainers()]).then(([c, cs]) => { setCustomers(c); setContainers(cs); if (c[0]) setCustomerId(c[0].id); }).catch((e: unknown) => setError(e instanceof Error ? e.message : "Unable to load references")); }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(null); setSaving(true);
    try {
      const booking = await createBooking({ customerId, containerId: containerId || null, origin, destination, cargoDescription, weight: Number(weight), volume: volume ? Number(volume) : null });
      setNumber(booking.bookingNumber);
      window.setTimeout(() => router.push(`/bookings/${booking.id}`), 900);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Unable to create booking"); } finally { setSaving(false); }
  }

  const input = "mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-zinc-500";
  return <main className="min-h-screen bg-[#0a0a0a] px-6 py-8 text-white"><div className="mx-auto max-w-4xl"><h1 className="text-3xl font-bold">Create Booking</h1><p className="mt-2 text-sm text-zinc-400">Booking number is generated exclusively by the backend after successful creation.</p>
    {number && <div className="mt-6 rounded-xl border border-emerald-900 bg-emerald-950/20 p-5"><p className="text-xs uppercase text-emerald-500">Generated shipment reference</p><p className="mt-2 font-mono text-2xl font-bold">{number}</p><p className="mt-1 text-sm text-zinc-400">B/L reference will inherit: <strong>ZENU{number}</strong></p></div>}
    {error && <div className="mt-6 rounded-xl border border-red-900 bg-red-950/30 p-4 text-sm text-red-300">{error}</div>}
    <form onSubmit={submit} className="mt-8 space-y-6"><section className="rounded-xl border border-zinc-800 bg-zinc-950 p-6"><h2 className="font-semibold">References</h2><div className="mt-5 grid gap-5 md:grid-cols-2"><label className="block"><span className="text-xs uppercase text-zinc-500">Customer</span><select required value={customerId} onChange={(e)=>setCustomerId(e.target.value)} className={input}>{customers.map(c=><option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}</select></label><label className="block"><span className="text-xs uppercase text-zinc-500">Container</span><select value={containerId} onChange={(e)=>setContainerId(e.target.value)} className={input}><option value="">No container yet</option>{containers.map(c=><option key={c.id} value={c.id}>{c.containerNumber} · {c.size} · {c.status}</option>)}</select></label></div></section>
    <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-6"><h2 className="font-semibold">Movement</h2><div className="mt-5 grid gap-5 md:grid-cols-2"><label className="block"><span className="text-xs uppercase text-zinc-500">Origin</span><input required value={origin} onChange={e=>setOrigin(e.target.value)} className={input}/></label><label className="block"><span className="text-xs uppercase text-zinc-500">Destination</span><input required value={destination} onChange={e=>setDestination(e.target.value)} className={input}/></label><label className="block md:col-span-2"><span className="text-xs uppercase text-zinc-500">Cargo Description</span><textarea required rows={4} value={cargoDescription} onChange={e=>setCargoDescription(e.target.value)} className={input}/></label></div></section>
    <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-6"><h2 className="font-semibold">Cargo Measurements</h2><div className="mt-5 grid gap-5 md:grid-cols-2"><label className="block"><span className="text-xs uppercase text-zinc-500">Weight</span><input required min="0" step="0.001" type="number" value={weight} onChange={e=>setWeight(e.target.value)} className={input}/></label><label className="block"><span className="text-xs uppercase text-zinc-500">Volume</span><input min="0" step="0.001" type="number" value={volume} onChange={e=>setVolume(e.target.value)} className={input}/></label></div></section>
    <div className="flex justify-end gap-3"><button type="button" onClick={()=>router.push("/bookings")} className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm">Cancel</button><button disabled={saving || !customerId} className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-50">{saving ? "Creating..." : "Create Booking & Generate Number"}</button></div></form>
  </div></main>;
}
