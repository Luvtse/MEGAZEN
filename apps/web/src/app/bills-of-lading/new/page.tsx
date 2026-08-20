import { redirect } from "next/navigation";

export default function NewBillOfLadingPage(): never {
  redirect("/bills-of-lading/create");
}
