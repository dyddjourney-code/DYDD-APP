"use client";

import { useFormStatus } from "react-dom";
import styles from "./public-assessments.module.css";

export function AssessmentSubmitButton({ children, pendingLabel, secondary = false, disabled = false }: {
  children: React.ReactNode;
  pendingLabel: string;
  secondary?: boolean;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return <button className={secondary ? styles.secondary : styles.primary} type="submit" disabled={pending || disabled} aria-disabled={pending || disabled}>
    {pending ? pendingLabel : children}
  </button>;
}
