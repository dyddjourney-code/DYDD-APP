import { Suspense } from "react";
import { notFound } from "next/navigation";
import { isSandbox } from "@/lib/environment";
import CircleOperationsWorkspace from "@/components/circle-operations-workspace";
export const dynamic="force-dynamic";
export default function CircleOwnerPage(){if(!isSandbox())notFound();return <Suspense fallback={<main className="journey-shell">Loading Circle approvals…</main>}><CircleOperationsWorkspace ownerView/></Suspense>;}
