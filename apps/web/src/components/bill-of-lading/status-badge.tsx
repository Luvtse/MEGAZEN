import { CheckCircle2, Clock3, FileEdit, LockKeyhole, Send, ShieldCheck, XCircle } from "lucide-react";
import type { BillOfLadingStatus } from "@/lib/api/bill-of-lading";

const config:Record<BillOfLadingStatus,{label:string;icon:typeof CheckCircle2;className:string}>={
  DRAFT:{label:"Draft",icon:FileEdit,className:"border-zinc-700 bg-zinc-900 text-zinc-300"},
  REVIEW:{label:"In Review",icon:Clock3,className:"border-amber-900 bg-amber-950/40 text-amber-300"},
  APPROVED:{label:"Approved",icon:ShieldCheck,className:"border-blue-900 bg-blue-950/40 text-blue-300"},
  ISSUED:{label:"Issued",icon:CheckCircle2,className:"border-emerald-900 bg-emerald-950/40 text-emerald-300"},
  RELEASED:{label:"Released",icon:Send,className:"border-purple-900 bg-purple-950/40 text-purple-300"},
  AMENDED:{label:"Amended",icon:FileEdit,className:"border-orange-900 bg-orange-950/40 text-orange-300"},
  SURRENDERED:{label:"Surrendered",icon:LockKeyhole,className:"border-red-900 bg-red-950/40 text-red-300"},
  CANCELLED:{label:"Cancelled",icon:XCircle,className:"border-red-900 bg-red-950/40 text-red-300"}
};
export function BillOfLadingStatusBadge({status}:{status:BillOfLadingStatus}){
  const item=config[status]; const Icon=item.icon;
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${item.className}`}><Icon size={13}/>{item.label}</span>;
}
