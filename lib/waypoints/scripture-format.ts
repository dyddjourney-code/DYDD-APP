/** Presentation only: keep canonical NIV text and required attribution untouched.
 * The passage is an outer quotation; Biblical speech uses nested single quotes.
 * A cited verse may stop before the source closes a speech spanning more verses.
 */
export function formatWaypointScripture(text: string): string {
  let speechOpen = false;
  const passage = text.trim().replace(/[“”"]/g, (mark) => {
    const opening = mark === "“" || (mark === '"' && !speechOpen);
    speechOpen = opening;
    return opening ? "‘" : "’";
  });
  return `“${passage}${speechOpen ? "’" : ""}”`;
}
