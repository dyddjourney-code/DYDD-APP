"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ForestNavigation } from "@/components/forest-navigation";
function AppChromeFrame({children}:{children:React.ReactNode}) {
 const params=useSearchParams();
 if(params.get("lane")==="fruitlife")return <>{children}</>;
 return <ForestNavigation>{children}</ForestNavigation>;
}
export function AppChrome({children}:{children:React.ReactNode}) {return <Suspense fallback={children}><AppChromeFrame>{children}</AppChromeFrame></Suspense>;}
