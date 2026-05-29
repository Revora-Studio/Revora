import { useOutletContext } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { industries } from "@/data/content";
import { PremiumButton } from "@/components/PremiumButton";
import { SectionLabel } from "@/components/SectionLabel";

export function IndustriesPage() {
  const { openLeadForm } = useOutletContext<{ openLeadForm: () => void }>();
  return (
    <main id="content" className="page-shell">
      <section className="page-hero slim">
        <p className="eyebrow">Industries</p>
        <h1>Different hospitality categories need different growth mechanics.</h1>
        <p>We shape strategy around how your guests discover, decide, book, reorder, share, and return.</p>
      </section>
      <section className="industries page-block">
        <SectionLabel eyebrow="Playbooks" title="Choose the growth lane that matches your brand." />
        <div className="industry-grid">
          {industries.map((industry) => (
            <button type="button" key={industry.title} onClick={openLeadForm}>
              <span>{industry.title}</span>
              <p>{industry.line}</p>
              <ArrowRight size={18} />
            </button>
          ))}
        </div>
      </section>
      <section className="final-cta compact">
        <p className="eyebrow">Consultation</p>
        <h2>Bring the category. We will bring the operating system.</h2>
        <PremiumButton onClick={openLeadForm}>Book consultation</PremiumButton>
      </section>
    </main>
  );
}
