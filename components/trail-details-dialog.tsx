"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

type Props = { name: string; children: ReactNode };

export function TrailDetailsDialog({ name, children }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  function close() { dialog.current?.close(); }

  return (
    <>
      <button ref={trigger} className="trail-details-trigger" type="button"
        aria-haspopup="dialog" aria-label={`Explore this trail: ${name}`}
        onClick={() => { dialog.current?.showModal(); if (dialog.current) dialog.current.scrollTop = 0; setOpen(true); }}>
        <span className="trail-guide-label-desktop">Review trail guide</span><span className="trail-guide-label-mobile">Explore this trail</span>
      </button>
      <dialog ref={dialog} className="trail-details-dialog" aria-labelledby={titleId}
        onClose={() => { setOpen(false); trigger.current?.focus({ preventScroll: true }); }}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const controls = Array.from(dialog.current?.querySelectorAll<HTMLElement>('button, a[href], summary, [tabindex="0"]') ?? []).filter((element) => element.getClientRects().length > 0);
          const first = controls[0], last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }}
        onClick={(event) => {
          if (event.target !== dialog.current) return;
          const rect = dialog.current.getBoundingClientRect();
          if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
        }}>
        <div className="trail-details-heading">
          <div><p className="section-label">Your trail guide</p><h2 id={titleId}>{name}</h2></div>
          <button className="trail-details-close" type="button" onClick={close} autoFocus aria-label="Close trail details">Close</button>
        </div>
        <div className="trail-details-content">{children}</div>
      </dialog>
    </>
  );
}
