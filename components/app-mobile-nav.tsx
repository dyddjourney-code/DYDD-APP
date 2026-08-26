import Link from "next/link";

const mobileNavItems = [
  { href: "/base-camp", label: "Base Camp" },
  { href: "/journey", label: "Journey" },
  { href: "/trailheads", label: "Trailheads" },
  { href: "/field-kit", label: "Field Kit" },
  { href: "/gear", label: "Gear" },
  { href: "/fireside", label: "Fireside" },
  { href: "/fireside#waypoints", label: "Waypoints" },
  { href: "/camp-circle", label: "Camp Circle" },
  { href: "/camp-circle#host-playbook", label: "Host Playbook" },
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
          <Link href={item.href} key={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
    </details>
  );
}
