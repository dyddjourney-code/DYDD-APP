import styles from "./digital-product-disclosure.module.css";

export const digitalPurchaseDisclosure = "Digital assessment/report. All sales are final; no refunds except as required by law.";
export const dyddSupportEmail = "support@discoverdivine.design";

export function DigitalPurchaseDisclosure() {
  return <p className={styles.purchase}>{digitalPurchaseDisclosure}</p>;
}

export function DigitalProductFooter() {
  return <footer className={styles.footer} aria-label="Digital product and support information">
    <p>Technical trouble? Email <a href={`mailto:${dyddSupportEmail}`}>{dyddSupportEmail}</a>.</p>
    <p>© {new Date().getFullYear()} Discover Your Divine Design. For personal use only. No unauthorized copying or distribution.</p>
  </footer>;
}
