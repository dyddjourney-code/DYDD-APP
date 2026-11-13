/** Participant assessment-start/chase mail is disabled in every Fruitful Life 360 mode.
 * Check both saved context and legacy template IDs so already-queued retries stop.
 * Observer requests and actual result/report delivery deliberately remain eligible.
 */
export const fruitLifeSelfEmailStop = 'Fruitful Life 360 self invitation and reminder emails are disabled; continue in the app.';
export function suppressFruitLifeSelfEmail(templateId?: string, deliveryContext?: Record<string, unknown>): boolean {
  return deliveryContext?.type === 'fruitlife_self' || deliveryContext?.type === 'fruitlife_status' ||
    ['B04-self', 'B04-self-reminder', 'B04-status'].includes(templateId || '');
}
