type PageHelpProps = {
  items: string[];
  title?: string;
};

export function PageHelp({ items, title = "How to use this page" }: PageHelpProps) {
  return (
    <section className="page-help" aria-label={title}>
      <div>
        <p className="section-label">Help</p>
        <h2>{title}</h2>
      </div>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
