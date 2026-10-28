"use client";
import { useId } from "react";
import { displayCircleTime } from "@/lib/circles/plan";
import styles from "./circle-time-picker.module.css";

export function timeParts(value: string) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value))
    return { hour: "", minute: "", period: "" };
  const [hour, minute] = value.split(":");
  return { hour: String(Number(hour) % 12 || 12), minute, period: Number(hour) >= 12 ? "PM" : "AM" };
}
export function meetingTime(hour: string, minute: string, period: string) {
  return `${String((Number(hour) % 12) + (period === "PM" ? 12 : 0)).padStart(2, "0")}:${minute}`;
}
export function CircleTimePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const id = useId();
  const parts = timeParts(value);
  function choose(patch: Partial<typeof parts>) {
    const next = { hour: parts.hour || "7", minute: parts.minute || "00", period: parts.period || "PM", ...patch };
    onChange(meetingTime(next.hour, next.minute, next.period));
  }
  return (
    <fieldset className={styles.picker}>
      <legend>Choose time</legend>
      <p>{value ? `Meeting time: ${displayCircleTime(value)}` : "Hour:minute AM/PM — for example, 5:30 PM"}</p>
      <div className={styles.fields}>
        <label htmlFor={`${id}-hour`}>Hour
          <select id={`${id}-hour`} value={parts.hour} onChange={e => choose({ hour: e.target.value })}>
            <option value="" disabled>Hour</option>
            {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
          </select>
        </label>
        <label htmlFor={`${id}-minute`}>Minute
          <select id={`${id}-minute`} value={parts.minute} onChange={e => choose({ minute: e.target.value })}>
            <option value="" disabled>Minute</option>
            {Array.from({ length: 60 }, (_, i) => <option key={i} value={String(i).padStart(2, "0")}>{String(i).padStart(2, "0")}</option>)}
          </select>
        </label>
        <label htmlFor={`${id}-period`}>AM/PM
          <select id={`${id}-period`} value={parts.period} onChange={e => choose({ period: e.target.value })}>
            <option value="" disabled>AM/PM</option><option>AM</option><option>PM</option>
          </select>
        </label>
      </div>
      {value && <button className="button text-button" type="button" onClick={() => onChange("")}>Clear time</button>}
    </fieldset>
  );
}
