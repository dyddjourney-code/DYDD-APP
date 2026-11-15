/** Existing private-console destinations; shared by Home and the compact header. */
export const ownerDestinations = [
  { title: "Command Center", href: "/command-center", description: "Review participants, saved assessment results, and assessment groups.", section: "Manage" },
  { title: "Accounts", href: "/command-center/accounts", description: "Review account records and the access connected to each person.", section: "Manage" },
  { title: "DYDD Guest Pass", href: "/owner/guest-access", description: "Open the existing guest-access tools and manage guest passes.", section: "Manage" },
  { title: "Design Map", href: "/command-center/design-map", description: "Explore the existing Design Map workspace and connected assessment insights.", section: "Explore" },
  { title: "MAPS", href: "/command-center/maps", description: "Open the MAPS report workspace and its existing report tools.", section: "Explore" },
  { title: "Expedition", href: "/command-center/expedition", description: "Open the Expedition workspace to review its existing journey tools.", section: "Explore" },
  { title: "Fireside", href: "/command-center/fireside", description: "Host gatherings, attendees, inquiries, media, and settings using this owner access.", section: "Explore", note: "Host tools · sandbox data" },
  { title: "Live app Base Camp", href: "https://dydd-online-school.vercel.app/base-camp", description: "Go to Base Camp in the live learner app.", section: "App environments", note: "Live app · separate destination" },
  { title: "Sandbox Base Camp", href: "https://dydd-online-school-sandbox.vercel.app/base-camp", description: "Enter Base Camp in the isolated sandbox app for review and testing.", section: "App environments", note: "Sandbox · separate test accounts and data" },
  { title: "Sandbox Live Fireside", href: "https://dydd-online-school-sandbox.vercel.app/live", description: "View the guest-facing Live Fireside page in the sandbox app.", section: "App environments", note: "Sandbox · guest view" },
] as const;
