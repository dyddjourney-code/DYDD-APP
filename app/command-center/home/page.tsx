import Link from "next/link";
import { notFound } from "next/navigation";
import { isPrivateOwnerConsole } from "@/lib/private-owner";
import { ownerDestinations } from "@/lib/owner-navigation";
import styles from "./home.module.css";
export const dynamic = "force-dynamic";
export const metadata = { title: "Owner Home | DYDD", robots: { index: false, follow: false } };
export default function OwnerHome() {
  if (!isPrivateOwnerConsole()) notFound();
  return <main className={styles.shell}>
    <header className={styles.intro}><div><p className={styles.eyebrow}>DYDD / Owner workspace</p><h1>Where would you like to go?</h1><p className={styles.lede}>Choose a workspace. Your participant tools, reports, gatherings, and app environments are all here.</p></div><aside className={styles.context}><span>Start here</span><p>The Command Center is still your detailed participant workspace. Home brings the existing destinations together.</p></aside></header>
    {["Manage", "Explore", "App environments"].map((section,index) => <section className={styles.section} key={section} aria-labelledby={`section-${index}`}><div className={styles.sectionHeading}><h2 id={`section-${index}`}>{section}</h2><p>{section === "Manage" ? "People, results, and access" : section === "Explore" ? "Maps, journeys, and gatherings" : "Open an existing app destination"}</p></div><div className={styles.grid}>{ownerDestinations.filter(item=>item.section===section).map(item=>{const content=<><span className={styles.tileTop}>{section === "App environments" ? "App destination" : "Owner workspace"}<span aria-hidden="true">{item.href.startsWith("https:") ? "↗" : "→"}</span></span><h3>{item.title}</h3><p>{item.description}</p><span className={styles.tileFoot}>{"note" in item ? item.note : "Private owner console"}</span></>;return item.href.startsWith("https:") ? <a className={styles.tile} key={item.href} href={item.href} referrerPolicy="no-referrer">{content}</a> : <Link className={styles.tile} key={item.href} href={item.href}>{content}</Link>;})}</div></section>)}
    <footer className={styles.footer}>Same destinations. Existing owner access. App links keep their own environment and access requirements.</footer>
  </main>;
}
