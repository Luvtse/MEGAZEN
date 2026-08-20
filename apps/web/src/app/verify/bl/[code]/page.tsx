import Link from "next/link";

type Props={params:{code:string}};
type Result={success:boolean;data:{verified:boolean;integrity:"VALID"|"INVALID";blNumber:string;version:number;status:string;documentHash:string|null;calculatedHash:string;issueDate:string;shipperName:string;consigneeName:string;portOfLoading:string;portOfDischarge:string}|null;error:{message:string}|null};

async function verify(code:string):Promise<Result>{
  const api=process.env.NEXT_PUBLIC_API_URL??"http://localhost:4000";
  const response=await fetch(`${api}/public/verify/bl/${encodeURIComponent(code)}`,{cache:"no-store"});
  const payload=await response.json() as Result;
  if(!response.ok||!payload.success) throw new Error(payload.error?.message??"Document could not be verified");
  if(!payload.data?.verified || payload.data.integrity !== "VALID") {
    throw new Error("Document integrity verification failed.");
  }
  return payload;
}

export default async function Verify({params}:Props){
  try{
    const result=await verify(params.code);
    const d=result.data!;
    return <main className="min-h-screen bg-[#0a0a0a] px-6 py-12 text-white"><div className="mx-auto max-w-2xl rounded-2xl border border-emerald-900 bg-zinc-950 p-8"><p className="text-xs uppercase tracking-[.2em] text-emerald-400">Verified MEGAZEN Document — Integrity Valid</p><h1 className="mt-3 text-3xl font-bold">Bill of Lading {d.blNumber}</h1><div className="mt-8 grid gap-5 sm:grid-cols-2">{[["Status",d.status],["Version",`V${d.version}`],["Shipper",d.shipperName],["Consignee",d.consigneeName],["Loading",d.portOfLoading],["Discharge",d.portOfDischarge],["Issued",new Date(d.issueDate).toLocaleDateString()]].map(([k,v])=><div key={k}><p className="text-xs uppercase text-zinc-600">{k}</p><p className="mt-1 text-sm text-zinc-200">{v}</p></div>)}</div><div className="mt-8 rounded-xl border border-zinc-900 bg-black p-4"><p className="text-xs uppercase text-zinc-600">Integrity Hash</p><p className="mt-2 break-all font-mono text-xs text-zinc-400">{d.documentHash??"—"}</p></div><Link href="/" className="mt-8 inline-block text-sm text-zinc-400 hover:text-white">Return to MEGAZEN</Link></div></main>;
  }catch(e){return <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a] p-6 text-white"><div className="max-w-lg rounded-2xl border border-red-900 bg-red-950/20 p-8 text-center"><h1 className="text-2xl font-bold">Document Not Verified</h1><p className="mt-3 text-sm text-zinc-400">{e instanceof Error?e.message:"Verification failed"}</p></div></main>;}
}
