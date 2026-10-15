"use client";

import { useRef, useState, type DragEvent, type PointerEvent } from "react";
import { mapsConfirmationItems, mapsConfirmationBuckets, type MapsAssignments, type MapsBucket } from "@/lib/designid/maps-confirmation";

// Interleave phases rather than introducing the words in their framework/scoring order.
const presentationOrder = [4, 8, 1, 9, 6, 0, 10, 3, 7, 2, 11, 5];

type Props = { assignments: MapsAssignments; onChange: (next: MapsAssignments) => void };
export function MapsConfirmationSort({ assignments, onChange }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [touchDragging, setTouchDragging] = useState<string | null>(null);
  const pointerItem = useRef<string | null>(null);
  const items = presentationOrder.map((index) => mapsConfirmationItems[index]);
  const placed = Object.keys(assignments).length;

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
    setAnnouncement(`${mapsConfirmationItems.find((item) => item.id === id)?.word} moved to ${mapsConfirmationBuckets.find((bucket) => bucket.id === destination)?.label ?? "Words to place"}.`);
  }

  function drop(event: DragEvent, destination: MapsBucket | "unplaced") {
    event.preventDefault();
    move(event.dataTransfer.getData("text/plain"), destination);
  }

  function releasePointer(event: PointerEvent<HTMLButtonElement>) {
    if (!pointerItem.current) return;
    const destination = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-maps-bucket]")?.dataset.mapsBucket;
    if (destination) move(pointerItem.current, destination as MapsBucket | "unplaced");
    pointerItem.current = null;
    setTouchDragging(null);
  }

  function card(item: (typeof mapsConfirmationItems)[number]) {
    return (
      <article className={`maps-sort-word ${selected === item.id ? "is-selected" : ""}`} key={item.id}
        draggable onDragStart={(event) => {
          // Grip drags use pointer capture and the fixed drop dock; native HTML
          // dragging would cancel that pointer stream before release.
          if (pointerItem.current) { event.preventDefault(); return; }
          event.dataTransfer.setData("text/plain", item.id); event.dataTransfer.effectAllowed = "move";
        }}>
        <div className="maps-sort-word-heading">
          <button type="button" className="maps-sort-grip" aria-label={`Drag ${item.word}`} onPointerDown={(event) => {
            pointerItem.current = item.id; setTouchDragging(item.id); event.currentTarget.setPointerCapture(event.pointerId);
          }} onPointerUp={releasePointer} onPointerCancel={() => { pointerItem.current = null; setTouchDragging(null); }}>
            <svg width="18" height="20" viewBox="0 0 18 20" aria-hidden="true"><path d="M6 4h.01M12 4h.01M6 10h.01M12 10h.01M6 16h.01M12 16h.01" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="3" /></svg>
          </button>
          <button type="button" className="maps-sort-select-word" aria-pressed={selected === item.id} onClick={() => { setSelected(selected === item.id ? null : item.id); setAnnouncement(`${item.word} selected. Choose a group or use the placement menu.`); }}>{item.word}</button>
        </div>
        <p>{item.phrase}</p>
        <small>{item.terms.join(" · ")}</small>
        <label className="maps-sort-move-label">Place {item.word}
          <select value={assignments[item.id] ?? "unplaced"} onChange={(event) => move(item.id, event.target.value as MapsBucket | "unplaced")}>
            <option value="unplaced">Words to place</option>
            {mapsConfirmationBuckets.map((bucket) => <option key={bucket.id} value={bucket.id}>{bucket.label}</option>)}
          </select>
        </label>
      </article>
    );
  }

  return <div className="maps-confirmation-sort">
    {touchDragging ? <div className="maps-sort-drag-dock" aria-label="Drop targets">
      <strong>Drag {mapsConfirmationItems.find((item) => item.id === touchDragging)?.word} to a group</strong>
      <div>{mapsConfirmationBuckets.map((bucket) => <div data-maps-bucket={bucket.id} key={bucket.id}>
        {bucket.label}<span>{Object.values(assignments).filter((value) => value === bucket.id).length} / 3</span>
      </div>)}</div>
    </div> : null}
    <div className="maps-sort-intro">
      <p className="section-label">One final reflection · MAPS</p>
      <h2>Where do you naturally begin?</h2>
      <p>Place these 12 words into four groups, <strong>three in each</strong>. Think about what comes naturally, not what you wish were true. Every word describes a valuable contribution.</p>
      <p>Drag a card (use its grip on a touch screen), or tap a word and then a group’s “Place selected word” button. You can also use each card’s placement menu.</p>
      <p>This adds another perspective alongside your DesignID answers; it does not replace them.</p>
      <strong>{placed} of 12 placed</strong>
    </div>
    <p className="maps-sort-announcement" role="status" aria-live="polite">{announcement || (selected ? "Choose a group for the selected word." : "Choose any word to begin.")}</p>
    <section className="maps-sort-bank" data-maps-bucket="unplaced" onDragOver={(event) => event.preventDefault()} onDrop={(event) => drop(event, "unplaced")} aria-label="Words to place">
      <h3>Words to place <span>{12 - placed}</span></h3>
      {selected && assignments[selected] ? <button type="button" className="button secondary" onClick={() => move(selected, "unplaced")}>Return selected word here</button> : null}
      <div className="maps-sort-word-grid">{items.filter((item) => !assignments[item.id]).map(card)}</div>
      {placed === 12 ? <p>All words placed. Review your groups below; you can still move a word.</p> : null}
    </section>
    <div className="maps-sort-buckets">
      {mapsConfirmationBuckets.map((bucket) => {
        const members = items.filter((item) => assignments[item.id] === bucket.id);
        return <section className="maps-sort-bucket" data-maps-bucket={bucket.id} key={bucket.id} aria-label={bucket.label} onDragOver={(event) => event.preventDefault()} onDrop={(event) => drop(event, bucket.id)}>
          <header><h3>{bucket.label}</h3><span>{members.length} / 3</span></header>
          <button className="maps-sort-place" type="button" disabled={!selected || members.length >= 3 || assignments[selected] === bucket.id} onClick={() => { if (selected) move(selected, bucket.id); }}>Place selected word here</button>
          {members.map(card)}
          {members.length < 3 ? <p className="maps-sort-empty">Drop {3 - members.length} {members.length === 2 ? "word" : "words"} here</p> : null}
        </section>;
      })}
    </div>
  </div>;
}
