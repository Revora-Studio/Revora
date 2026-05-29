import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { services } from "@/data/content";
import { PremiumButton } from "@/components/PremiumButton";
import { SectionLabel } from "@/components/SectionLabel";

export function ServicesPage() {
  const { openLeadForm } = useOutletContext<{ openLeadForm: () => void }>();
  const [active, setActive] = useState(0);

  return (
    <main id="content" className="page-shell">
      <section className="page-hero slim">
        <p className="eyebrow">Services</p>
        <h1>One operating system for content, brand, ads, and restaurant growth.</h1>
        <p>
          Choose one service, or build a complete monthly growth room around your hospitality brand.
        </p>
      </section>
      <section className="services-section page-block">
        <div className="service-stage">
          <div className="service-list" role="tablist" aria-label="Services">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <button
                  key={service.title}
                  role="tab"
                  aria-selected={active === index}
                  className={active === index ? "active" : ""}
                  onClick={() => setActive(index)}
                >
                  <Icon size={19} />
                  <span>{service.title}</span>
                  <small>{service.kicker}</small>
                </button>
              );
            })}
          </div>
          <article className="service-detail">
            <p className="eyebrow">{services[active].kicker}</p>
            <h3>{services[active].title}</h3>
            <p>{services[active].detail}</p>
            <PremiumButton onClick={openLeadForm}>Plan this service</PremiumButton>
          </article>
        </div>
      </section>
      <section className="page-block">
        <SectionLabel
          eyebrow="Scalable delivery"
          title="Built for future CMS, reporting, and dashboard extensions."
          copy="The app architecture separates content data, forms, admin APIs, and visual components so the business can grow into dashboards, analytics, and AI planning tools."
        />
      </section>
    </main>
  );
}
