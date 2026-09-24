import Link from "next/link";

const fruitLifeNavItems = [
  { href: "/hq?lane=fruitlife", label: "Base Camp" },
  { href: "/spiritual-gifts?lane=fruitlife", label: "Spiritual Gifts" },
  { href: "/field-kit?lane=fruitlife", label: "FruitLife 360" },
  { href: "/trailheads?lane=fruitlife", label: "Trailheads" },
  { href: "/fireside?lane=fruitlife#waypoints", label: "Waypoints" },
  { href: "/gear?lane=fruitlife", label: "Gear" },
];

type FruitLifeMiniNavProps = {
  reviewQuery?: string;
};

function appendReviewQuery(href: string, reviewQuery?: string) {
  if (!reviewQuery) {
    return href;
  }

  const cleanedQuery = reviewQuery.replace(/^\?/, "");

  if (!cleanedQuery) {
    return href;
  }

  const [pathWithQuery, hash] = href.split("#");

  return `${pathWithQuery}${pathWithQuery.includes("?") ? "&" : "?"}${cleanedQuery}${
    hash ? `#${hash}` : ""
  }`;
}

export function FruitLifeMiniNav({ reviewQuery }: FruitLifeMiniNavProps) {
  return (
    <nav className="fruitlife-mini-nav" aria-label="FruitLife 360 navigation">
      {fruitLifeNavItems.map((item) => (
        <Link href={appendReviewQuery(item.href, reviewQuery)} key={item.href}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
