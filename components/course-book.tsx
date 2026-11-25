"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { allCourseSummaries } from "@/lib/courses/course-catalog";
import { trailDefinitions } from "@/lib/trails/catalog";
import { ReviewAwareLink } from "@/components/review-aware-link";
import styles from "./course-book.module.css";

export function CourseBook({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const onCloseRef = useRef(onClose);
  const backdropPress = useRef(false);
  const [selected, setSelected] = useState(0);
  const id = useId();
  onCloseRef.current = onClose;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    const before=document.body.style.overflow;document.body.style.overflow="hidden";
    const trap=(event: globalThis.KeyboardEvent)=>{
      if(event.key!=="Tab")return;
      const items=[...dialog.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex="0"]')].filter(e=>e.getClientRects().length>0);
      const first=items[0],last=items.at(-1),active=document.activeElement;
      if(!dialog.contains(active)||(event.shiftKey&&active===first)||(!event.shiftKey&&active===last)){
        event.preventDefault();(event.shiftKey?last:first)?.focus();
      }
    };
    dialog.addEventListener("keydown",trap);
    return () => { dialog.removeEventListener("keydown",trap);document.body.style.overflow=before;if (dialog.open) dialog.close(); };
  }, []);

  function closeBook() {
    dialogRef.current?.close();
    onCloseRef.current();
  }

  function selectTab(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number;
    switch (event.key) {
      case "ArrowRight": next = (index + 1) % allCourseSummaries.length; break;
      case "ArrowLeft": next = (index - 1 + allCourseSummaries.length) % allCourseSummaries.length; break;
      case "Home": next = 0; break;
      case "End": next = allCourseSummaries.length - 1; break;
      default: return;
    }
    event.preventDefault();
    setSelected(next);
    tabRefs.current[next]?.focus();
  }

  function isExterior(event: { clientX: number; clientY: number }) {
    const bounds = dialogRef.current?.getBoundingClientRect();
    return Boolean(bounds && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom));
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      data-course-book=""
      onCancel={(event) => { event.preventDefault(); closeBook(); }}
      onPointerDown={(event) => { backdropPress.current = event.target === event.currentTarget && isExterior(event); }}
      onClick={(event) => {
        if (event.target === event.currentTarget && backdropPress.current && isExterior(event)) closeBook();
        backdropPress.current = false;
      }}
    >
      <header className={styles.header}>
        <div>
          <h2 id={`${id}-title`}>Explore Courses</h2>
          <p id={`${id}-description`} className={styles.srOnly}>Use the course tabs to turn pages. Open a course or its connected assessment.</p>
        </div>
        <button type="button" className={styles.close} onClick={closeBook} aria-label="Close course book" autoFocus>
          <span aria-hidden="true">×</span>
        </button>
      </header>
      <div className={styles.tabs} role="tablist" aria-label="Courses">
        {allCourseSummaries.map((course, index) => (
          <button
            key={course.slug}
            ref={(node) => { tabRefs.current[index] = node; }}
            type="button"
            role="tab"
            id={`${id}-tab-${index}`}
            aria-controls={`${id}-panel-${index}`}
            aria-selected={selected === index}
            tabIndex={selected === index ? 0 : -1}
            className={styles.tab}
            data-course-tab={course.slug}
            onClick={() => setSelected(index)}
            onKeyDown={(event) => selectTab(event, index)}
          >
            <span className={styles.tabNumber} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            {course.title}
          </button>
        ))}
      </div>
      {allCourseSummaries.map((course, index) => {
        const trail = trailDefinitions.find((item) => item.courseSlug === course.slug);
        const journey = course.slug === "discover-your-divine-design";
        return (
          <section
            key={course.slug}
            id={`${id}-panel-${index}`}
            role="tabpanel"
            aria-labelledby={`${id}-tab-${index}`}
            tabIndex={0}
            hidden={selected !== index}
            className={styles.spread}
          >
            <div className={styles.leftPage}>
              <p className={styles.eyebrow}>Chapter {String(index + 1).padStart(2, "0")}</p>
              <img className={styles.logo} src={course.logo} alt="" width={240} height={128} />
              <h3>{course.title}</h3>
              <p className={styles.description}>{course.description}</p>
              <span className={styles.pageNumber} aria-hidden="true">{String(index * 2 + 1).padStart(2, "0")}</span>
            </div>
            <div className={styles.rightPage}>
              <p className={styles.eyebrow}>Follow the trail</p>
              <h4>{journey ? "The Journey" : "Course access"}</h4>
              <p className={styles.prerequisite}>{trail?.prerequisite ?? (journey ? "No assessment needed to begin. Explore the connected assessments as you go." : "Explore the course through its existing learning route.")}</p>
              <div className={styles.actions}>
                <ReviewAwareLink className={styles.primaryLink} data-course-link={course.slug} href={journey ? "/journey" : course.hrefBase}>
                  {journey ? "Open the Journey" : "Explore the course"}<span aria-hidden="true"> →</span>
                </ReviewAwareLink>
                {trail ? <ReviewAwareLink className={styles.textLink} data-course-link={`${course.slug}-assessment`} href={trail.assessmentHref}>Explore {trail.name}<span aria-hidden="true"> →</span></ReviewAwareLink> : null}
                <ReviewAwareLink className={styles.textLink} data-course-link={`${course.slug}-trailheads`} href={trail ? `/trailheads#${trail.id}` : "/trailheads"}>View Trailheads<span aria-hidden="true"> →</span></ReviewAwareLink>
              </div>
              <p className={styles.accessNote}>Course access and assessment requirements are checked on the destination page.</p>
              <span className={styles.pageNumber} aria-hidden="true">{String(index * 2 + 2).padStart(2, "0")}</span>
            </div>
          </section>
        );
      })}
      <footer className={styles.footer}>
        <span>Discover Your Divine Design</span>
        <ReviewAwareLink href="/assessments" data-course-link="assessments">Explore assessments →</ReviewAwareLink>
      </footer>
    </dialog>
  );
}
