import type { ReactNode } from "react";

export function CirclePageHeader({ title, children }: { title: string; children: ReactNode }) {
  return (
    <header className="standalone-hero camp-circle-hero">
      <img
        className="circle-header-art"
        src="/brand/dydd-camp-circle-campfire-banner.png"
        alt="Illustrated Camp Circle gathered around a campfire"
        width={1884}
        height={835}
      />
      <div className="circle-header-copy">
        <p className="eyebrow">Together</p>
        <h1>{title}</h1>
        <p className="lede">{children}</p>
      </div>
    </header>
  );
}
