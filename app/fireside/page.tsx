import { FiresideHub } from "@/components/fireside-hub";
import { isSandbox } from "@/lib/environment";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
export default function FiresidePage(){if(!isSandbox())notFound();return <FiresideHub/>;}
