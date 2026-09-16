import Link from "next/link";

export function FruitLifeMiniFooter() {
  return (
    <footer className="fruitlife-mini-footer" aria-label="FruitLife support links">
      <span>Support: support@discoverdivine.design</span>
      <Link href="/privacy">Privacy Policy</Link>
      <Link href="/terms">Terms of Service</Link>
    </footer>
  );
}
