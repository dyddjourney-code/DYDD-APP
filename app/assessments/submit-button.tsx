"use client";

import { useFormStatus } from "react-dom";
import styles from "./public-assessments.module.css";

export function AssessmentSubmitButton({ children, pendingLabel, secondary = false }: {
  children: React.ReactNode;
  pendingLabel: string;
  secondary?: boolean;
}) {
  const { pending } = useFormStatus();
  return <button className={secondary ? styles.secondary : styles.primary} type="submit" disabled={pending} aria-disabled={pending}>
    {pending ? pendingLabel : children}
  </button>;
}
