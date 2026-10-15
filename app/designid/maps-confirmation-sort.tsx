"use client";

import { useRef, useState, type DragEvent, type PointerEvent } from "react";
import { mapsConfirmationItems, mapsConfirmationBuckets, type MapsAssignments, type MapsBucket } from "@/lib/designid/maps-confirmation";

const alphabeticalItems = [...mapsConfirmationItems].sort((a, b) => a.word.localeCompare(b.word));
type Props = { assignments: MapsAssignments; onChange: (next: MapsAssignments) => void };
export function MapsConfirmationSort({ assignments, onChange }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [touchDragging, setTouchDragging] = useState<string | null>(null);
  const pointerItem = useRef<string | null>(null);
  const suppressClick = useRef(false);

  function move(id: string, destination: MapsBucket | "unplaced") {
    if (!mapsConfirmationItems.some((item) => item.id === id)) return;
    if (destination !== "unplaced" && !mapsConfirmationBuckets.some((bucket) => bucket.id === destination)) return;
    if (assignments[id] === destination) return;
    if (destination !== "unplaced" && Object.values(assignments).filter((value) => value === destination).length >= 3) {
      setAnnouncement("That group has three words. Move one out first, then try again.");
      return;
    }
    const next = { ...assignments };
    if (destination === "unplaced") delete next[id];
    else next[id] = destination;
    onChange(next);
    setSelected(null);
    setAnnouncement(`${mapsConfirmationItems.find((item) => item.id === id)?.word} moved to ${mapsConfirmationBuckets.find((bucket) => bucket.id === destination)?.label ?? "the list"}.`);
  }

  function drop(event: DragEvent, destination: MapsBucket | "unplaced") {
    event.preventDefault();
    move(event.dataTransfer.getData("text/plain"), destination);
  }

  function releasePointer(event: PointerEvent<HTMLButtonElement>) {
    if (!pointerItem.current) return;
    const destination = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-maps-bucket]")?.dataset.mapsBucket;
    if (destination && destination !== assignments[pointerItem.current] && (destination !== "unplaced" || assignments[pointerItem.current])) {
      suppressClick.current = true;
      move(pointerItem.current, destination as MapsBucket | "unplaced");
    }
    pointerItem.current = null;
    setTouchDragging(null);
  }

  function card(item: (typeof mapsConfirmationItems)[number]) {
    return <article className={`maps-sort-word ${selected === item.id ? "is-selected" : ""}`} key={item.id}
      draggable onDragStart={(event) => {
        if (pointerItem.current) { event.preventDefault(); return; }
        event.dataTransfer.setData("text/plain", item.id); event.dataTransfer.effectAllowed = "move";
      }}>
      <div className="maps-sort-word-heading">
        <button type="button" className="maps-sort-select-word maps-sort-grip" aria-label={`Select or drag ${item.word}`} aria-pressed={selected === item.id}
          onPointerDown={(event) => { suppressClick.current = false; pointerItem.current = item.id; setTouchDragging(item.id); event.currentTarget.setPointerCapture(event.pointerId); }}
          onPointerUp={releasePointer} onPointerCancel={() => { pointerItem.current = null; setTouchDragging(null); }}
          onClick={() => {
            if (suppressClick.current) { suppressClick.current = false; return; }
            setSelected(selected === item.id ? null : item.id);
            setAnnouncement(`${item.word} selected. Choose a group.`);
          }}>{item.word}</button>
        <span className="maps-sort-menu"><span aria-hidden="true">⌄</span>
          <select aria-label={`Move ${item.word}`} value={assignments[item.id] ?? "unplaced"} onChange={(event) => move(item.id, event.target.value as MapsBucket | "unplaced")}>
            <option value="unplaced">Not placed</option>
            {mapsConfirmationBuckets.map((bucket) => <option key={bucket.id} value={bucket.id}>{bucket.label}</option>)}
          </select>
        </span>
      </div>
      <p>{item.phrase}</p>
    </article>;
  }

  return <div className="maps-confirmation-sort">
    <div className="maps-sort-intro">
      <h2>What sounds most like you?</h2>
      <p>Place these 12 words into four groups, <strong>three in each</strong>. Think about what comes naturally, not what you wish were true.</p>
      <p>Drag a word into a group, tap a word then a group, or use the word’s down arrow.</p>
    </div>
    <p className="maps-sort-announcement" role="status" aria-live="polite">{announcement}</p>
    <div className={`maps-sort-buckets ${touchDragging ? "is-dragging" : ""}`}>
      {mapsConfirmationBuckets.map((bucket) => {
        const members = alphabeticalItems.filter((item) => assignments[item.id] === bucket.id);
        return <section className="maps-sort-bucket" data-maps-bucket={bucket.id} key={bucket.id} aria-label={bucket.label} onDragOver={(event) => event.preventDefault()} onDrop={(event) => drop(event, bucket.id)}>
          <header><button className="maps-sort-place" type="button" aria-label={`Place selected word in ${bucket.label}`} disabled={!selected || members.length >= 3 || assignments[selected] === bucket.id} onClick={() => { if (selected) move(selected, bucket.id); }}>{bucket.label}</button></header>
          {members.map(card)}
        </section>;
      })}
    </div>
    <section className="maps-sort-bank" data-maps-bucket="unplaced" onDragOver={(event) => event.preventDefault()} onDrop={(event) => drop(event, "unplaced")} aria-label="Available words">
      {selected && assignments[selected] ? <button type="button" className="button secondary" onClick={() => move(selected, "unplaced")}>Return selected word to list</button> : null}
      <div className="maps-sort-word-grid">{alphabeticalItems.filter((item) => !assignments[item.id]).map(card)}</div>
    </section>
  </div>;
}
