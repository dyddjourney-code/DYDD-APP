import { notFound } from "next/navigation";
import { isSandbox } from "@/lib/environment";
export default function CommandCenterLayout({ children }: { children: React.ReactNode }) {
  if (!isSandbox()) notFound();
  return children;
}
