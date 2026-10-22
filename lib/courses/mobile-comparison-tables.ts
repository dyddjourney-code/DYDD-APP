/** Presentation metadata for our trusted, rectangular authored comparison tables.
 * Keep a single semantic table and all authored cells in source order. Score
 * tables (without designid-authored-table) deliberately remain tables on phones.
 */
export function mobileComparisonTables(html: string): string {
  return html.replace(/<table\b[^>]*>[\s\S]*?<\/table>/g, table => {
    if (!/class="[^"]*\bdesignid-authored-table\b/.test(table)) return table;
    const head = table.match(/<thead\b[^>]*>([\s\S]*?)<\/thead>/)?.[1] ?? "";
    const labels = [...head.matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/g)]
      .map(match => match[1].replace(/<[^>]*>/g, "").trim());
    if (!labels.length) return table;
    return table.replace('class="', 'class="mobile-comparison-table ')
      .replace(/<tbody\b[^>]*>([\s\S]*?)<\/tbody>/g, (body, rows: string) =>
        body.replace(rows, rows.replace(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g, (row: string, cells: string) => {
          let column = 0;
          return row.replace(cells, cells.replace(/<(th|td)\b([^>]*)>/g, (open, tag: string, attrs: string) => {
            const label = labels[column++] ?? "";
            // Labels are existing authored header text, never learner input.
            return tag === "td" ? `<td${attrs} data-label="${label.replaceAll('"', '&quot;')}">` : open;
          }));
        })));
  });
}
