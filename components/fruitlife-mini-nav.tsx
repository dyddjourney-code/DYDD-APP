import Link from "next/link";

const fruitLifeNavItems = [
  { href: "/hq?lane=fruitlife", label: "Base Camp" },
  { href: "/spiritual-gifts?lane=fruitlife", label: "Spiritual Gifts" },
  { href: "/field-kit?lane=fruitlife", label: "FruitLife 360" },
  { href: "/trailheads?lane=fruitlife", label: "Trailheads" },
  { href: "/fireside?lane=fruitlife#waypoints", label: "Waypoints" },
  { href: "/gear?lane=fruitlife", label: "Gear" },
];

export function FruitLifeMiniNav() {
  return (
    <nav className="fruitlife-mini-nav" aria-label="FruitLife 360 navigation">
      {fruitLifeNavItems.map((item) => (
        <Link href={item.href} key={item.href}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
