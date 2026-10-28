"use client";
import { useState, type FormEvent } from "react";
import styles from "./support.module.css";
export function ContactForm() {
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [reference, setReference] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = event.currentTarget, body = Object.fromEntries(new FormData(form));
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Your request could not be saved. Please try again.");
      setReference(data.reference || "received"); form.reset();
    } catch (e) { setError(e instanceof Error ? e.message : "Your request could not be saved. Please try again."); }
    finally { setBusy(false); }
  }
  if (reference) return <section className={styles.form} role="status"><h2>Request received</h2><p>Your message has been saved in the private support queue. No confirmation email has been sent.</p>{reference !== "received" && <p className={styles.reference}>Reference: {reference}</p>}<button className="button secondary" onClick={() => setReference("")}>Send another request</button></section>;
  return <form className={styles.form} onSubmit={submit} aria-busy={busy}>
    <h2>Send a support request</h2>
    <label>Your name<input name="name" autoComplete="name" required maxLength={100} /></label>
    <label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254} aria-describedby="support-email-help" /></label><p id="support-email-help" className={styles.hint}>Use the email linked to your account, if you have one.</p>
    <label>Subject<input name="subject" required minLength={3} maxLength={160} /></label>
    <label>How can we help?<textarea name="message" required minLength={10} maxLength={5000} rows={7} aria-describedby="support-message-help" /></label><p id="support-message-help" className={styles.hint}>10–5,000 characters. Include the page or course where you need help.</p>
    <div className={styles.trap} aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <button className="button" disabled={busy}>{busy ? "Saving your request…" : "Send request"}</button>
  </form>;
}
