'use client';

import { useEffect, useRef } from 'react';
import { AssessmentSubmitButton } from '../../submit-button';

/** One automatic attempt per paid order in this tab; manual recovery always remains available. */
export function PrepareDesignPd({ action, orderId, autoPrepare }: {
  action: (formData: FormData) => void | Promise<void>;
  orderId: string;
  autoPrepare: boolean;
}) {
  const form = useRef<HTMLFormElement>(null);
  const attempted = useRef(false);
  useEffect(() => {
    if (!autoPrepare || attempted.current || !form.current) return;
    attempted.current = true;
    const key = `dydd-designpd-prepare:${orderId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      // Mark before posting, including across redirects and Strict Mode effect replays.
      sessionStorage.setItem(key, 'attempted');
    } catch {
      // Without persistent tab storage, leave the explicit button instead of risking a loop.
      return;
    }
    form.current.requestSubmit();
  }, [autoPrepare, orderId]);

  return <form ref={form} action={action}>
    <AssessmentSubmitButton pendingLabel="Preparing your DesignPD report…">Prepare my DesignPD report</AssessmentSubmitButton>
  </form>;
}
