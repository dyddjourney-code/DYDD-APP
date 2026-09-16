import Link from "next/link";

export function FruitLifeMiniFooter() {
  return (
    <footer className="fruitlife-mini-footer" aria-label="FruitLife support links">
      <a href="mailto:support@discoverdivine.design">Support</a>
      <Link href="/privacy">Privacy Policy</Link>
      <Link href="/terms">Terms of Service</Link>
    </footer>
  );
}
