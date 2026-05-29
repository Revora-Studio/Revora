import { useOutletContext } from "react-router-dom";
import { PremiumButton } from "@/components/PremiumButton";
import { SectionLabel } from "@/components/SectionLabel";

const insights = [
  {
    title: "Why restaurant reels fail even when the food looks beautiful",
    copy: "Most content captures the dish, not the decision moment. Hooks, rituals, and social proof carry the algorithm and the guest."
  },
  {
    title: "Cloud kitchens need conversion creative before brand films",
    copy: "Delivery-first brands need offer clarity, retention loops, and paid testing before expanding into lifestyle storytelling."
  },
  {
    title: "The new hospitality funnel is comment, save, share, reserve",
    copy: "Modern restaurant marketing has to treat social actions as demand signals, not soft vanity numbers."
  }
];

export function InsightsPage() {
  const { openLeadForm } = useOutletContext<{ openLeadForm: () => void }>();
  return (
    <main id="content" className="page-shell">
      <section className="page-hero slim">
        <p className="eyebrow">Insights</p>
        <h1>Editorial thinking for hospitality founders and operators.</h1>
        <p>Strategy notes from the intersection of brand, content production, analytics, and revenue.</p>
      </section>
      <section className="insight-grid page-block">
        {insights.map((insight) => (
          <article key={insight.title}>
            <p className="eyebrow">Field note</p>
            <h3>{insight.title}</h3>
            <p>{insight.copy}</p>
          </article>
        ))}
      </section>
      <section className="final-cta compact">
        <SectionLabel
          eyebrow="Contact"
          title="Want a private read on your brand?"
          copy="Submit your consultation request and the admin dashboard will capture it as a lead."
        />
        <PremiumButton onClick={openLeadForm}>Open consultation form</PremiumButton>
      </section>
    </main>
  );
}
