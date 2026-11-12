import { DigitalProductFooter, DigitalPurchaseDisclosure } from "@/components/digital-product-disclosure";
export default function TermsPage() {
  return <main className="journey-shell hq-standalone-page policy-page"><section className="gear-panel">
    <p className="section-label">Digital product terms</p><h1>Assessment and report purchases</h1>
    <DigitalPurchaseDisclosure />
    <p>Assessment and report materials are for personal use only. Unauthorized copying or distribution is not permitted.</p>
    <DigitalProductFooter />
  </section></main>;
}
