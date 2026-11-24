import { redirect } from "next/navigation";

// Sandbox 2 opens the existing sandbox teaching entry; no production login or data changes.
export default function Home() { redirect("/base-camp"); }
