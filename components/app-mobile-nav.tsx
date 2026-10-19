import { ReviewAwareLink } from "@/components/review-aware-link";

const mobileNavItems = [
  { href: "/base-camp", label: "Base Camp" },
  { href: "/ranger-station", label: "Ranger Station" },
  { href: "/trailheads", label: "Trailheads" },
  { href: "/field-kit", label: "Field Kit" },
  { href: "/gear", label: "Gear" },
  { href: "/fireside", label: "Fireside" },
  { href: "/waypoints", label: "Waypoints" },
  { href: "/live", label: "Live" },
  { href: "/camp-circle", label: "Camp Circles" },
  { href: "/command-center", label: "Command Center" },
  { href: "/command-center/design-map", label: "Design Map" },
  { href: "/command-center/expedition", label: "Expedition" },
];

export function AppMobileNav() {
  return (
    <details className="mobile-app-nav">
      <summary aria-label="Open app navigation">
        <span aria-hidden="true" />
        <strong>Menu</strong>
      </summary>
      <nav aria-label="Mobile app navigation">
        {mobileNavItems.map((item) => (
          <ReviewAwareLink href={item.href} key={item.href}>
            {item.label}
          </ReviewAwareLink>
        ))}
      </nav>
    </details>
  );
}
