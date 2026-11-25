"use client";
import type { CourseBookSummary } from "@/components/course-book";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ForestNavigation } from "@/components/forest-navigation";
type ChromeProps={children:React.ReactNode;courses:readonly CourseBookSummary[]};
function AppChromeFrame({children,courses}:ChromeProps) {
 const params=useSearchParams();
 if(params.get("lane")==="fruitlife")return <>{children}</>;
 return <ForestNavigation courses={courses}>{children}</ForestNavigation>;
}
export function AppChrome({children,courses}:ChromeProps) {return <Suspense fallback={children}><AppChromeFrame courses={courses}>{children}</AppChromeFrame></Suspense>;}
