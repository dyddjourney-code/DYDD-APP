const navItems = [
  {
    icon: "tent",
    label: "Base Camp",
    href: "/hq",
    children: [{ icon: "hiker", label: "Journey", href: "/journey" }],
  },
  { icon: "signpost", label: "Trailheads", href: "/trailheads" },
  {
    icon: "map",
    label: "Field Kit",
    href: "/field-kit",
    children: [
      { icon: "camera", label: "Artifacts", href: "/field-kit#artifacts" },
      { icon: "badge", label: "Trail Badges", href: "/field-kit#trail-badges" },
    ],
  },
  {
    icon: "backpack",
    label: "Gear",
    href: "/gear",
    children: [
      { icon: "compass", label: "Journal", href: "/gear#journal" },
      { icon: "flashlight", label: "Waypoints", href: "/gear#waypoints" },
      { icon: "magnifier", label: "Pathfinder", href: "/pathfinder" },
    ],
  },
  { icon: "fireside", label: "Fireside", href: "/fireside" },
  {
    icon: "group",
    label: "Camp Circle",
    href: "/camp-circle",
    children: [{ icon: "playbook", label: "Host Playbook", href: "/camp-circle#host-playbook" }],
  },
];

function AppNavIcon({ name }: { name: string }) {
  const common = {
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 32 32",
  };

  const icon =
    name === "tent" ? (
      <svg {...common}>
        <path d="M4 25 15.4 6.8 28 25Z" fill="#f6d36d" stroke="var(--green-dark)" />
        <path d="M15.4 6.8V25" stroke="#6f4d20" />
        <path d="M15.4 25 20 16.8 24.4 25Z" fill="#759a5b" stroke="var(--green-dark)" />
      </svg>
    ) : name === "hiker" ? (
      <svg {...common}>
        <circle cx="14" cy="7" r="3" fill="#d4a451" stroke="var(--green-dark)" />
        <path d="m13 11 4 5 4-2" stroke="var(--green-dark)" />
        <path d="m16.8 16-2.5 5.5L9 27" stroke="#476b42" />
        <path d="m17 17 4.5 9" stroke="#476b42" />
        <path d="M23 9v18" stroke="#6f4d20" />
      </svg>
    ) : name === "signpost" ? (
      <svg {...common}>
        <path d="M16 6v21" stroke="#6f4d20" />
        <path d="M8 8h14l3 3-3 3H8Z" fill="#d4a451" stroke="var(--green-dark)" />
        <path d="M10 17h14l-3 4H10Z" fill="#759a5b" stroke="var(--green-dark)" />
      </svg>
    ) : name === "map" ? (
      <svg {...common}>
        <path d="m5 8 7-2 8 3 7-2v17l-7 2-8-3-7 2Z" fill="#fffaf0" stroke="var(--green-dark)" />
        <path d="M12 6v17M20 9v17" stroke="#759a5b" />
        <path d="m8 16 3-2 4 2 5-3 4 2" stroke="#d4a451" />
      </svg>
    ) : name === "camera" ? (
      <svg {...common}>
        <path d="M7 11h5l1.7-2.5h5L20.8 11H25a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-9a3 3 0 0 1 3-3Z" fill="#647c9b" stroke="var(--green-dark)" />
        <circle cx="16" cy="18.5" r="4.8" fill="#fffaf0" stroke="#243f27" />
      </svg>
    ) : name === "badge" ? (
      <svg {...common}>
        <path d="m16 4 3.5 2 4-.1 1.9 3.6 3.4 2.2-.8 4 1.1 3.9-3.2 2.5-1.6 3.8-4.1.3L16 28l-4.2-1.8-4.1-.3-1.6-3.8-3.2-2.5L4 15.7l-.8-4 3.4-2.2 1.9-3.6 4 .1Z" fill="#d4a451" stroke="var(--green-dark)" />
        <circle cx="16" cy="16" r="6" fill="#fffaf0" stroke="#6f4d20" />
      </svg>
    ) : name === "backpack" ? (
      <svg {...common}>
        <path d="M11 11V9a5 5 0 0 1 10 0v2" stroke="var(--green-dark)" />
        <path d="M9 10.5h14a3 3 0 0 1 3 3v10.2a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V13.5a3 3 0 0 1 3-3Z" fill="#759a5b" stroke="var(--green-dark)" />
        <path d="M10 18.2h12v8.5H10z" fill="#f0d08a" stroke="#6f4d20" />
      </svg>
    ) : name === "compass" ? (
      <svg {...common}>
        <circle cx="16" cy="16" r="10.5" fill="#fffaf0" stroke="var(--green-dark)" />
        <path d="m19.8 9.8-2.2 7.8-5.4 4.6 2.2-7.8z" fill="#d4a451" stroke="#6f4d20" />
      </svg>
    ) : name === "flashlight" ? (
      <svg {...common}>
        <path d="M6 13.2h4.8l2.2 2.2v4.4L10.8 22H6z" fill="#d4a451" stroke="var(--green-dark)" />
        <path d="M12.8 15.5h12.7a2 2 0 0 1 2 2v.2a2 2 0 0 1-2 2H12.8z" fill="#759a5b" stroke="var(--green-dark)" />
        <path d="M5.8 15.2 2.8 13.6M5.3 17.6H2.1M5.8 20l-3 1.6" stroke="#f0d08a" />
      </svg>
    ) : name === "magnifier" ? (
      <svg {...common}>
        <circle cx="14" cy="14" r="7.5" fill="#fffaf0" stroke="var(--green-dark)" />
        <path d="m19.5 19.5 6.5 6.5" stroke="#6f4d20" />
        <path d="M10.7 14.2 13.2 17l4.5-5.5" stroke="#d4a451" />
      </svg>
    ) : name === "fireside" ? (
      <svg {...common}>
        <path d="M11 26.5 22 22M10 22l12 4.5" stroke="#6f4d20" />
        <path d="M16.5 24.5c-4.4-2.2-6-5.5-4.7-9.8 1.4 1.4 2.6 2.1 3.5 2.1-.3-3.3.9-6 3.7-8.3.2 3.6 1.5 5.3 3.9 7 2.1 3.8.5 7-6.4 9Z" fill="#d96f2a" stroke="var(--green-dark)" />
        <path d="M16.6 22.2c-2.1-1.2-2.8-2.9-1.9-5.1 1 .9 1.9 1.2 2.6 1 .1-1.8.8-3.2 2.1-4.4 0 2 .7 3.1 1.8 4 1 2-.2 3.6-4.6 4.5Z" fill="#f6d36d" stroke="#6f4d20" />
      </svg>
    ) : name === "group" ? (
      <svg {...common}>
        <circle cx="16" cy="12" r="4.2" fill="#d4a451" stroke="var(--green-dark)" />
        <circle cx="8.5" cy="14" r="3" fill="#739d5e" stroke="var(--green-dark)" />
        <circle cx="23.5" cy="14" r="3" fill="#647c9b" stroke="var(--green-dark)" />
        <path d="M7 25c1-4 4-6 9-6s8 2 9 6" fill="#fffaf0" stroke="var(--green-dark)" />
      </svg>
    ) : name === "playbook" ? (
      <svg {...common}>
        <path d="M7 6.5h12.5A4.5 4.5 0 0 1 24 11v14.5H11.5A4.5 4.5 0 0 1 7 21Z" fill="#fffaf0" stroke="var(--green-dark)" />
        <path d="M11.5 10.5h8M11.5 14.5h7M11.5 18.5h5" stroke="#739d5e" />
        <path d="M22.5 7.5 25.5 5l1.6 3.6-2.8 2.5Z" fill="#d4a451" stroke="#6f4d20" />
        <path d="m20.6 13.2 3.7-2.1" stroke="#6f4d20" />
      </svg>
    ) : null;

  return (
    <span aria-hidden="true" className={`hq-menu-icon icon-${name}`}>
      {icon}
    </span>
  );
}

export function AppSidebar() {
  return (
    <aside className="hq-sidebar app-sidebar" aria-label="DYDD navigation">
      <a className="hq-sidebar-brand" href="/hq">
        <img src="/brand/dydd-logo.webp" alt="Discover Your Divine Design" />
      </a>
      <nav className="hq-sidebar-nav">
        {navItems.map((item) => (
          <div className="hq-nav-group" key={item.label}>
            <a className="hq-nav-item" href={item.href}>
              <AppNavIcon name={item.icon} />
              <span>{item.label}</span>
            </a>
            {item.children ? (
              <div className="hq-subnav">
                {item.children.map((child) => (
                  <a className="hq-subnav-item" href={child.href} key={child.label}>
                    <AppNavIcon name={child.icon} />
                    <span>{child.label}</span>
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </nav>
    </aside>
  );
}
