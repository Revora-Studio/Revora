import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { services } from "@/data/content";
import { serviceIcons } from "@/data/serviceIcons";
import { getServices } from "@/lib/api";
import { PremiumButton } from "@/components/PremiumButton";
import { SectionLabel } from "@/components/SectionLabel";
import type { ServiceItem } from "@/types";

const fallbackServices: ServiceItem[] = services.map((service, index) => ({
  id: service.title,
  title: service.title,
  kicker: service.kicker,
  detail: service.detail,
  iconKey: Object.keys(serviceIcons)[index] || "MousePointer2",
  createdAt: "",
  updatedAt: ""
}));

function uniqueServices(items: ServiceItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.title.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function ServicesPage() {
  const { openLeadForm } = useOutletContext<{ openLeadForm: () => void }>();
  const [serviceItems, setServiceItems] = useState(fallbackServices);
  const [active, setActive] = useState(0);
  const activeService = serviceItems[active] || serviceItems[0];

  useEffect(() => {
    getServices()
      .then((response) => {
        if (response.services.length) setServiceItems(uniqueServices(response.services));
      })
      .catch(() => setServiceItems(fallbackServices));
  }, []);

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
            {serviceItems.map((service, index) => {
              const Icon = serviceIcons[service.iconKey as keyof typeof serviceIcons] || serviceIcons.MousePointer2;
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
            <p className="eyebrow">{activeService.kicker}</p>
            <h3>{activeService.title}</h3>
            <p>{activeService.detail}</p>
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
