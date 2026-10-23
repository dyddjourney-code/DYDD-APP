"use client";
import { useCallback, useEffect, useState } from "react";
import styles from "@/app/contact/support.module.css";
type SupportRequest = { id: string; name: string; email: string; subject: string; message: string; status: string; created_at: string; revision: number };
const statuses = ["new", "in_progress", "resolved"];
const label = (status: string) => status.replace("_", " ");
export function SupportQueue() {
  const [filter, setFilter] = useState("new"), [page, setPage] = useState(0), [requests, setRequests] = useState<SupportRequest[]>([]), [more, setMore] = useState(false), [loading, setLoading] = useState(true), [error, setError] = useState(""), [saving, setSaving] = useState("");
  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setError("");
    try { const response = await fetch(`/api/admin/support?status=${filter}&page=${page}`, { cache: "no-store", signal }); const data = await response.json(); if (!response.ok) throw Error(data.error); setRequests(data.requests); setMore(data.hasMore); }
    catch (e) { if (!signal?.aborted) { setRequests([]); setError(e instanceof Error ? e.message : "The queue could not be loaded."); } } finally { if (!signal?.aborted) setLoading(false); }
  }, [filter,page]);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);
  async function update(request: SupportRequest, status: string) {
    setSaving(request.id); setError("");
    try { const response = await fetch("/api/admin/support", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: request.id, status, revision: request.revision }), cache: "no-store" }); const data = await response.json(); if (!response.ok) throw Error(data.error); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "The request could not be updated."); } finally { setSaving(""); }
  }
  return <main className={styles.queue}><p className="section-label">DYDD administration</p><h1>Support queue</h1><p>Private requests from Contact. Status updates do not send email or notify the requester.</p><div className={styles.toolbar}><label>Request status<select value={filter} onChange={e => { setFilter(e.target.value); setPage(0); }}>{statuses.map(s => <option key={s} value={s}>{label(s)}</option>)}</select></label><button className="button secondary" onClick={() => void load()} disabled={loading}>Reload queue</button></div>{error && <p role="alert" className={styles.error}>{error}</p>}{loading ? <p role="status">Loading support requests…</p> : requests.length === 0 ? <p>No {label(filter)} requests. Requests submitted through Contact will appear here.</p> : requests.map(r => <article key={`${r.id}-${r.revision}`} className={styles.request}><p>{new Date(r.created_at).toLocaleString()} · {r.id}</p><h2>{r.subject}</h2><p>{r.name} · {r.email}</p><p className={styles.message}>{r.message}</p><form onSubmit={e => { e.preventDefault(); void update(r, String(new FormData(e.currentTarget).get("status"))); }}><label>Status for {r.subject}<select name="status" defaultValue={r.status} disabled={Boolean(saving)}>{statuses.map(s => <option key={s} value={s}>{label(s)}</option>)}</select></label><button className="button secondary" disabled={Boolean(saving)}>{saving === r.id ? "Saving…" : "Save status"}</button></form></article>)}<div className={styles.toolbar}><button className="button secondary" disabled={loading || page === 0} onClick={() => setPage(page - 1)}>Previous page</button><span>Page {page + 1}</span><button className="button secondary" disabled={loading || !more} onClick={() => setPage(page + 1)}>Next page</button></div></main>;
}
