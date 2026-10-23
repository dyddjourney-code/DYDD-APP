import { redirect } from "next/navigation";
import { supportAdmin } from "@/lib/support/auth";
import { SupportQueue } from "./support-queue";
export const dynamic = "force-dynamic";
export const metadata = { title: "Support queue | DYDD", robots: { index: false, follow: false } };
export default async function SupportAdminPage() {
  if (!await supportAdmin()) redirect("/login?next=%2Fadmin%2Fsupport");
  return <SupportQueue />;
}
