import { useOutletContext } from "react-router-dom";
import { CaseStudyPreview } from "@/pages/Home";
import { PremiumButton } from "@/components/PremiumButton";

export function CaseStudiesPage() {
  const { openLeadForm } = useOutletContext<{ openLeadForm: () => void }>();
  return (
    <main id="content" className="page-shell">
      <section className="page-hero slim">
        <p className="eyebrow">Case studies</p>
        <h1>Brand worlds, social proof, and measurable hospitality demand.</h1>
        <p>Every transformation is designed to move attention into bookings, orders, and qualified inquiries.</p>
        <PremiumButton onClick={openLeadForm}>Request a similar audit</PremiumButton>
      </section>
      <CaseStudyPreview />
    </main>
  );
}
