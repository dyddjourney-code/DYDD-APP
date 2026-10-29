"use client";

import { useEffect, useState, type FormEvent } from "react";
import { assessmentKeys, assessmentNames, fixtures, initialState, pdMovement, reflectionColors, reflections, storageKey, teamData, validState, type Assessment, type DemoState, type Status } from "@/lib/expedition/demo";
import styles from "./expedition-demo.module.css";

const steps = [["Form", "Basecamp · Discovery"], ["Prepare", "Route Map · Alignment"], ["Team data", "The Ascent · Development"], ["Perspective", "Summit · Impact"], ["Launch", "Return · Integration"]];
const signed = (n: number) => `${n > 0 ? "+" : ""}${n}`;

export function ExpeditionDemo() {
  const [state, setState] = useState<DemoState>(initialState);
  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState("");
  const [saved, setSaved] = useState(true);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) { const parsed: unknown = JSON.parse(raw); if (validState(parsed)) setState(parsed); else setNotice("Saved demo was incompatible. The fictional starting team has been restored."); }
    } catch { setNotice("Browser storage is unavailable or unreadable. You can still explore this session."); }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(storageKey, JSON.stringify(state)); if (!saved) setSaved(true); }
    catch { if (saved) setSaved(false); }
  }, [state, loaded, saved]);
  const data = teamData(state);
  function changePerson(index: number, update: Partial<DemoState["people"][number]>) {
    setState(s => ({ ...s, launched: false, people: s.people.map((p, i) => i === index ? { ...p, ...update } : p) }));
  }
  function setStatus(index: number, key: Assessment, status: Status) {
    const statuses = { ...state.people[index].statuses, [key]: status };
    if (key === "designId" && status !== "complete") statuses.designPd = "assigned";
    if (key === "designPd" && status === "complete" && statuses.designId !== "complete") return;
    changePerson(index, { statuses, reportRead: false });
    setNotice(`${fixtures[index].name}: ${assessmentNames[key]} ${status} in this demo only.`);
  }
  function saveInfo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    if (["organization", "expedition", "purpose"].some(key => !String(form.get(key) || "").trim())) { setNotice("Enter an organization, expedition name, and purpose before saving."); return; }
    setState(s => ({ ...s, organization: String(form.get("organization")).trim(), expedition: String(form.get("expedition")).trim(), purpose: String(form.get("purpose")).trim(), launched: false }));
    setNotice("Expedition information saved in this browser only.");
  }
  function completeRemaining() {
    setState(s => ({ ...s, launched: false, people: s.people.map(p => ({ ...p, statuses: { designId: "complete", gifts: "complete", designPd: "complete" } })) }));
    setNotice("All 12 fictional assessment results are now complete. Charts and readiness have updated. Nothing was submitted.");
  }
  if (!loaded) return <section className={styles.demo} aria-busy="true"><p>Loading the isolated fictional team demo…</p></section>;
  return <section className={styles.demo} aria-label="Expedition fictional team demo">
    <div className={styles.banner}>
      <div><strong>DEMO ONLY · Four fictional people</strong><p>Browser-local simulation. No real invitations, assignments, assessment records, credits, billing, or emails. Keep real names and sensitive information out of this demo.</p></div>
      <button type="button" onClick={() => { setState(initialState()); setNotice("Demo reset to the original four fictional people and starting statuses."); }}>Reset demo</button>
    </div>
    <p className={styles.storage}>{saved ? "Demo changes stay in this browser on this device." : "Storage unavailable: changes last only for this session."}</p>
    <p className={styles.notice} role="status" aria-live="polite">{notice || "Start with the prepared example, then change a status to see the same data flow through the team view."}</p>
    <nav className={styles.steps} aria-label="Five Expedition demo steps">{steps.map(([name, caption], i) => <a key={name} href={`#expedition-demo-${i + 1}`}><b>{i + 1}</b><span><strong>{name}</strong><small>{caption}</small></span></a>)}</nav>

    <section className={styles.section} id="expedition-demo-1">
      <header><p className="section-label">1 · Form your expedition</p><h2>Gather around a shared purpose.</h2><p>Set the organization, expedition, and team. Invitations here are a rehearsal only.</p></header>
      <form className={styles.form} onSubmit={saveInfo} key={`${state.organization}:${state.expedition}:${state.purpose}`}>
        <label>Organization<input name="organization" required maxLength={100} defaultValue={state.organization} /></label>
        <label>Expedition name<input name="expedition" required maxLength={100} defaultValue={state.expedition} /></label>
        <label className={styles.wide}>Purpose<textarea name="purpose" required maxLength={500} defaultValue={state.purpose} rows={2} /></label>
        <button className={styles.primary} type="submit">Save demo information</button>
      </form>
      <div className={styles.roster}>{fixtures.map((p, i) => <article key={p.name}><strong>{p.name}</strong><span>{p.role} · Fictional</span><button onClick={() => { changePerson(i, { invited: true }); setNotice(`Invitation to ${p.name} simulated locally. No message was sent.`); }}>{state.people[i].invited ? "Simulate invite again" : "Simulate invitation"}</button><small>{state.people[i].invited ? "Invitation simulated · no email sent" : "Not invited in demo yet"}</small></article>)}</div>
    </section>

    <section className={styles.section} id="expedition-demo-2">
      <header><p className="section-label">2 · Prepare the team</p><h2>Assign, complete, and review.</h2><p>Change a fictional assignment or completion state. Only completed results appear in charts. DesignPD follows the current DesignID-derived scoring model; complete DesignID first.</p></header>
      <div className={styles.actions}><button className={styles.primary} onClick={() => { setState(s => ({ ...s, launched: false, people: s.people.map(p => ({ ...p, statuses: Object.fromEntries(assessmentKeys.map(k => [k, p.statuses[k] === "unassigned" ? "assigned" : p.statuses[k]])) as typeof p.statuses })) })); setNotice("Remaining fictional assessments assigned locally. No credits used or notifications sent."); }}>Assign remaining in demo</button><button onClick={completeRemaining}>Simulate completing remaining assessments</button></div>
      <div className={styles.people}>{fixtures.map((person, i) => <article className={styles.person} key={person.name} data-person={i}>
        <h3>{person.name} <small>Fictional</small></h3>
        <div className={styles.assessments}>{assessmentKeys.map(key => <label key={key}>{assessmentNames[key]}<select aria-label={`${person.name} ${assessmentNames[key]} status`} value={state.people[i].statuses[key]} onChange={e => setStatus(i, key, e.target.value as Status)}><option value="unassigned">Not assigned</option><option value="assigned">Assigned · pending</option><option value="complete" disabled={key === "designPd" && state.people[i].statuses.designId !== "complete"}>Complete · fictional result</option></select></label>)}</div>
        <details className={styles.report}><summary>Read fictional assessment summary</summary><p>Fabricated example only, not a generated personal report. Pending results remain hidden.</p>
          {state.people[i].statuses.designId === "complete" ? <p><strong>DesignID:</strong> {reflections.map((r, n) => `${r} ${person.id[n]}`).join(" · ")} raw points (total 100).</p> : <p>DesignID: awaiting completion.</p>}
          {state.people[i].statuses.gifts === "complete" ? <p><strong>Spiritual Gifts, ranked top five:</strong> {person.gifts.join(" · ")}.</p> : <p>Spiritual Gifts: awaiting completion.</p>}
          {state.people[i].statuses.designPd === "complete" && state.people[i].statuses.designId === "complete" ? <p><strong>DesignPD signed movement:</strong> {Object.entries(pdMovement(person.id)).map(([k, v]) => `${k} ${signed(v)}`).join(" · ")} percentage points.</p> : <p>DesignPD: awaiting completion.</p>}
        </details>
        <div className={styles.checks}><label><input type="checkbox" checked={state.people[i].reportRead} onChange={e => changePerson(i, { reportRead: e.target.checked })} />Summary reviewed in demo</label><label><input type="checkbox" checked={state.people[i].courseReviewed} onChange={e => changePerson(i, { courseReviewed: e.target.checked })} />Optional course review noted in demo</label></div>
      </article>)}</div>
      <p>Optional existing resource: <a href="/courses/designid-foundations">DesignID Foundations</a>. Course access follows existing permissions. This link does not assign a course; the checkbox above is local tracking only.</p>
    </section>

    <section className={styles.section} id="expedition-demo-3">
      <header><p className="section-label">3 · One team data view</p><h2>The same four people. Three lenses.</h2><p>Completed fictional results only. Counts differ while preparation is in progress; missing results are never treated as zero.</p></header>
      <div className={styles.chartGrid}>
        <article className={styles.chart} data-chart="gifts"><h3>Spiritual Gifts overlap</h3><p>{data.gifts.length} of 4 completed profiles · membership in each person’s ranked top five, not gift strength.</p>{data.gifts.length ? <div className={styles.tableWrap}><table><caption>Completed profiles’ top-five gift overlay · number is rank</caption><thead><tr><th scope="col">Gift</th>{data.gifts.map(p => <th scope="col" key={p.name}>{p.name}</th>)}<th scope="col">People</th></tr></thead><tbody>{data.giftRows.map(row => <tr key={row.name}><th scope="row">{row.name}</th>{data.gifts.map(p => <td key={p.name}>{(p.gifts as readonly string[]).includes(row.name) ? (p.gifts as readonly string[]).indexOf(row.name) + 1 : "—"}</td>)}<td>{row.count}</td></tr>)}</tbody></table></div> : <p>No completed Spiritual Gifts profiles. Simulate a completion above.</p>}</article>
        <article className={styles.chart} data-chart="designId"><h3>DesignID capacity structure</h3><p>{data.id.length} of 4 completed profiles · average raw reflection points. Each fictional profile allocates 100 points across four reflections (0–60 each), not independent percentages.</p>{data.id.length ? <><div className={styles.bars}>{reflections.map((r, i) => <div key={r}><span>{r}</span><div aria-hidden="true"><i style={{ width: `${(data.averages[i] || 0) / 60 * 100}%`, backgroundColor: reflectionColors[i] }} /></div><b data-average={r}>{data.averages[i]}</b></div>)}</div><p>Bar scale: 0–60 raw points.</p><div className={styles.tableWrap}><table><caption>Underlying completed DesignID scores</caption><thead><tr><th scope="col">Person</th>{reflections.map(r => <th scope="col" key={r}>{r}</th>)}</tr></thead><tbody>{data.id.map(p => <tr key={p.name}><th scope="row">{p.name}</th>{p.id.map((n, i) => <td key={i}>{n}</td>)}</tr>)}</tbody></table></div></> : <p>No completed DesignID profiles. Simulate a completion above.</p>}</article>
      </div>
      <article className={styles.chart} data-chart="designPd"><h3>DesignPD scatter plot</h3><p>{data.pd.length} of 4 completed profiles · Plan and Decide shown spatially; Do shown in the legend. All three use signed movement (−50 to +50 percentage points), matching Command Center poles. This is a view of tendencies, not a compatibility or performance score.</p>
        {data.pd.length ? <div className={styles.scatterLayout}><svg className={styles.scatter} viewBox="0 0 420 330" role="img" aria-labelledby="pd-title pd-desc"><title id="pd-title">Fictional team DesignPD scatter plot</title><desc id="pd-desc">Horizontal Plan: Doer negative to Dreamer positive. Vertical Decide: Think It negative to Feel It positive. Exact coordinates and Do tendency are listed in the adjacent legend.</desc><rect x="55" y="35" width="320" height="240" fill="#f5f7f2" stroke="#d4ddcd" />{[-50, -25, 0, 25, 50].map(n => <g key={n}><line x1={215 + n * 3.2} x2={215 + n * 3.2} y1="35" y2="275" stroke={n === 0 ? "#7a8972" : "#e1e7dc"} /><line x1="55" x2="375" y1={155 - n * 2.4} y2={155 - n * 2.4} stroke={n === 0 ? "#7a8972" : "#e1e7dc"} /><text x={215 + n * 3.2} y="291" textAnchor="middle">{signed(n)}</text><text x="47" y={159 - n * 2.4} textAnchor="end">{signed(n)}</text></g>)}<text x="55" y="319">Doer ← Plan → Dreamer</text><text x="55" y="21">Feel It (+) · Decide · Think It (−)</text>{data.pd.map(p => { const pd = pdMovement(p.id); return <g key={p.name} data-pd-person={p.name} data-plan={pd.plan} data-decide={pd.decide}><circle cx={215 + pd.plan * 3.2} cy={155 - pd.decide * 2.4} r="9" fill={p.color} stroke="white" strokeWidth="2"><title>{p.name}: Plan {signed(pd.plan)}, Decide {signed(pd.decide)}</title></circle><text x={229 + pd.plan * 3.2} y={159 - pd.decide * 2.4}>{p.name.split(" ").map(n => n[0]).join("")}</text></g>; })}</svg><ul className={styles.legend}>{data.pd.map(p => { const pd = pdMovement(p.id); return <li key={p.name}><strong><i style={{ background: p.color }} />{p.name}</strong><span>Plan {signed(pd.plan)} · Decide {signed(pd.decide)}</span><span>Do {signed(pd.do)} · {pd.do < 0 ? "Together" : pd.do > 0 ? "Solo" : "Balanced"}</span></li>; })}</ul></div> : <p>No completed DesignPD profiles. Complete DesignID, then simulate DesignPD completion.</p>}
        <p>DesignPD values are derived from the same fictional DesignID scores using the current scoring formula. No assessment was run or submitted.</p>
      </article>
    </section>

    <section className={styles.section} id="expedition-demo-4">
      <header><p className="section-label">4 · Team perspective</p><h2>{data.ready ? "Assessment preparation is complete." : "A shared view is taking shape."}</h2></header>
      <div className={styles.overview}><div><strong data-testid="completion">{data.complete} / 12</strong><span>Fictional assessments complete</span></div><div><strong>{state.people.filter(p => p.reportRead).length} / 4</strong><span>Summaries reviewed</span></div><div><strong>{state.people.filter(p => p.invited).length} / 4</strong><span>Invitations simulated</span></div></div>
      <p>{data.ready ? "All three lenses are available for all four people. This demo’s assessment checklist is complete; that is not a validated measure of team readiness or effectiveness." : "Finish the remaining fictional assessments to explore the full team picture. Partial charts describe only the people counted above, not the whole team."}</p>
      <ul>{fixtures.map((p, i) => <li key={p.name}><strong>{p.name}:</strong> {assessmentKeys.filter(k => state.people[i].statuses[k] !== "complete").map(k => assessmentNames[k]).join(", ") || "All three complete"}{assessmentKeys.some(k => state.people[i].statuses[k] !== "complete") ? " still to complete." : "."}</li>)}</ul>
      <p>Use the overlap, capacity mix, and tendency differences to ask who wants to contribute where, and what support each person needs. These examples do not determine roles, calling, suitability, or team outcomes.</p>
      <label className={styles.note}>Conversation / next-step note (fictional only)<textarea maxLength={1000} value={state.conversation} onChange={e => setState(s => ({ ...s, conversation: e.target.value, launched: false }))} placeholder="For example: ask each teammate which contribution energizes them." rows={3} /></label>
      <p><a href="/command-center/design-map">Explore the existing Design Map (optional)</a>. Its availability for Expedition is not decided; it is not required by this demo. Existing permissions apply.</p>
    </section>

    <section className={styles.section} id="expedition-demo-5">
      <header><p className="section-label">5 · Launch your expedition</p><h2>Rehearse the next step.</h2><p>The launch below is a local demonstration, not an activation, purchase, or integration.</p></header>
      <p><strong>{state.expedition}</strong> · {state.organization}</p><p>{state.purpose}</p>
      <button className={styles.primary} disabled={!data.ready || state.launched} onClick={() => { setState(s => ({ ...s, launched: true })); setNotice("Demo expedition launched in this browser only. No MAPS project, group, message, or real assignment was created."); }}>{state.launched ? "Demo launched" : "Simulate expedition launch"}</button>
      {!data.ready && <p>Complete all 12 fictional assessments to unlock this example launch checklist. This is a demo rule, not final access policy.</p>}
      {state.launched && <div className={styles.launch} role="status"><h3>Demo expedition launched</h3><p>Your four fictional teammates are ready for a facilitated conversation. Agree on a first action and a follow-up rhythm.</p>{state.conversation && <p>Conversation note: {state.conversation}</p>}<p>No live expedition or MAPS project was created. A future MAPS connection remains a possibility, not a promised integration.</p></div>}
      <p><a href="/command-center/maps">Explore existing MAPS separately</a> · <a href="/command-center">Back to Command Center</a></p>
    </section>
  </section>;
}
