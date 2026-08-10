"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BillOfLadingContainers } from "@/components/bills-of-lading/BillOfLadingContainers";

type Bill={id:string;blNumber:string;status:string;version:number;shipperName:string;consigneeName:string;portOfLoading:string;portOfDischarge:string;verificationCode:string};
type Container={id:string;containerId:string;sealNumber:string|null;packageCount:number|null;packageType:string|null;grossWeight:string|number|null;measurement:string|number|null;container:{containerNumber:string;type:string;size:string;status:string}};
const API="http://localhost:4000";
const TENANT="REPLACE_WITH_TENANT_ID";
<BillOfLadingContainers
  billOfLadingId={bill.id}
  editable={bill.status === "DRAFT"}
/>
export default function BillDetail({params}:{params:{id:string}}){
 const [bill,setBill]=useState<Bill|null>(null),[containers,setContainers]=useState<Container[]>([]),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 const load=async()=>{const r=await fetch(`${API}/api/bills-of-lading/${params.id}`,{headers:{"x-tenant-id":TENANT}});const b=await r.json();if(r.ok&&b.success)setBill(b.data);};
 const loadContainers=async()=>{const r=await fetch(`${API}/api/bills-of-lading/${params.id}/containers`,{headers:{"x-tenant-id":TENANT}});const b=await r.json();if(r.ok&&b.success)setContainers(b.data);};
 useEffect(()=>{void load();void loadContainers()},[]);
 const action=async(path:string,body:object={})=>{setBusy(true);try{const r=await fetch(`${API}/api/bills-of-lading/${params.id}/${path}`,{method:"POST",headers:{"Content-Type":"application/json","x-tenant-id":TENANT},body:JSON.stringify(body)});const b=await r.json();if(!r.ok||!b.success)throw new Error(b.error?.message??"Action failed");setBill(b.data);setMessage(`${path} completed`)}catch(e){setMessage(e instanceof Error?e.message:"Action failed")}finally{setBusy(false)}};
 if(!bill)return <main className="min-h-screen bg-[#0a0a0a] p-8 text-zinc-300">{message||"Loading..."}</main>;
 return <main className="min-h-screen bg-[#0a0a0a] p-8 text-zinc-100"><div className="mx-auto max-w-6xl">
 <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-[.25em] text-zinc-500">Bill of Lading</p><h1 className="mt-2 text-3xl font-semibold">{bill.blNumber}</h1><p className="mt-2 text-zinc-500">Version {bill.version} · {bill.status}</p></div>
 <div className="flex gap-2"><a target="_blank" rel="noreferrer" href={`${API}/api/bills-of-lading/${bill.id}/pdf`} className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-black">Open PDF</a><Link href="/bills-of-lading" className="rounded-lg border border-zinc-700 px-4 py-2 text-sm">Back</Link></div></div>
 {message&&<div className="mt-5 rounded-lg border border-zinc-800 p-3 text-sm text-zinc-400">{message}</div>}
 <section className="mt-7 grid gap-4 md:grid-cols-2"><div className="rounded-xl border border-zinc-800 p-5"><span className="text-xs text-zinc-500">SHIPPER</span><p className="mt-2">{bill.shipperName}</p></div><div className="rounded-xl border border-zinc-800 p-5"><span className="text-xs text-zinc-500">CONSIGNEE</span><p className="mt-2">{bill.consigneeName}</p></div><div className="rounded-xl border border-zinc-800 p-5"><span className="text-xs text-zinc-500">ROUTE</span><p className="mt-2">{bill.portOfLoading} → {bill.portOfDischarge}</p></div><div className="rounded-xl border border-zinc-800 p-5"><span className="text-xs text-zinc-500">VERIFICATION</span><p className="mt-2 font-mono">{bill.verificationCode}</p></div></section>
 <section className="mt-7 rounded-xl border border-zinc-800 p-5"><h2 className="font-semibold">Workflow</h2><div className="mt-4 flex flex-wrap gap-2">{(["lock","approve","issue","release","surrender"] as const).map(x=><button disabled={busy} onClick={()=>void action(x)} key={x} className="rounded-lg border border-zinc-700 px-3 py-2 text-sm hover:bg-zinc-900 disabled:opacity-50">{x.replace("_"," ")}</button>)}</div></section>
 <section className="mt-7 rounded-xl border border-zinc-800 p-5"><div className="flex items-center justify-between"><h2 className="font-semibold">Containers & seals</h2><button onClick={()=>void loadContainers()} className="text-sm text-zinc-400 underline">Refresh</button></div>
 <div className="mt-4 overflow-x-auto"><table className="w-full text-sm"><thead className="text-left text-xs text-zinc-500"><tr><th className="py-2">Container</th><th>Seal</th><th>Packages</th><th>Type</th><th>Gross</th><th>Measure</th></tr></thead><tbody>{containers.map(c=><tr className="border-t border-zinc-900" key={c.id}><td className="py-3 font-mono">{c.container.containerNumber}</td><td>{c.sealNumber||"—"}</td><td>{c.packageCount??"—"}</td><td>{c.packageType||"—"}</td><td>{String(c.grossWeight??"—")}</td><td>{String(c.measurement??"—")}</td></tr>)}</tbody></table>{!containers.length&&<p className="py-8 text-center text-zinc-600">No containers attached.</p>}</div></section>
 </div></main>;
}
