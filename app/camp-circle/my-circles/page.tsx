import { Suspense } from "react";
import CircleOperationsWorkspace from "@/components/circle-operations-workspace";
import { testBillingEnabled } from "@/lib/commerce/test-billing-config";
import { isSandbox } from "@/lib/environment";
import MyCirclesWorkspace from "@/components/my-circles-workspace";
export const dynamic = "force-dynamic";
export default function MyCirclesPage(){return <Suspense fallback={<main className="journey-shell"><p>Loading your Circles…</p></main>}>{isSandbox()?<CircleOperationsWorkspace testPurchases={testBillingEnabled()}/>:<MyCirclesWorkspace testPurchases={testBillingEnabled()}/>}</Suspense>;}
