import { useOutletContext } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { CalendarDays, ChevronDown, CirclePlay, LineChart } from "lucide-react";
import {
  caseStudies,
  heroFrames,
  logos,
  metrics,
} from "@/data/content";
import { contactEmail } from "@/data/contact";
import { getCaseStudies, getRestaurants } from "@/lib/api";
import { PremiumButton } from "@/components/PremiumButton";
import { SectionLabel } from "@/components/SectionLabel";
import type { CaseStudy } from "@/types";

type LayoutContext = {
  openLeadForm: () => void;
};

const fadeUp = {
  hidden: { opacity: 1, y: 28 },
  show: { opacity: 1, y: 0 }
};

const viewport = { once: true, margin: "-80px" };

const fallbackCaseStudies: CaseStudy[] = caseStudies.map((study) => ({
  ...study,
  id: study.name,
  createdAt: "",
  updatedAt: ""
}));

export function Home() {
  const { openLeadForm } = useOutletContext<LayoutContext>();
  const [restaurantNames, setRestaurantNames] = useState(logos);
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.25], [0, 120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.22], [1, 0.24]);

  useEffect(() => {
    getRestaurants()
      .then((response) => {
        if (response.restaurants.length) {
          setRestaurantNames(response.restaurants.map((restaurant) => restaurant.name));
        }
      })
      .catch(() => setRestaurantNames(logos));
  }, []);

  return (
    <main id="content">
      <section className="hero">
        <motion.div className="hero-backdrop" style={{ y: heroY, opacity: heroOpacity }}>
          <img
            src="https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=1800&q=82"
            alt="Restaurant kitchen preparing plated dishes during service"
          />
        </motion.div>
        <div className="hero-vignette" />
        <div className="hero-grid">
          <motion.div className="hero-copy" initial="hidden" animate="show" variants={fadeUp}>
            <p className="eyebrow">Social-first hospitality growth studio</p>
            <h1>We Turn Restaurants Into Cultural Brands.</h1>
            <p>
              Cinematic content, paid growth systems, and brand strategy for dining concepts that want to be talked
              about, booked out, and remembered.
            </p>
            <div className="hero-actions">
              <PremiumButton onClick={openLeadForm}>Book a brand audit</PremiumButton>
              <PremiumButton variant="ghost" href="/case-studies">
                View transformations
              </PremiumButton>
            </div>
          </motion.div>

          <motion.div className="reel-stack" initial={{ opacity: 1, x: 40 }} animate={{ opacity: 1, x: 0 }}>
            {heroFrames.map((frame, index) => (
              <motion.div
                className={`reel-card reel-${index + 1}`}
                key={frame}
                animate={{ y: [0, index % 2 ? -12 : 12, 0] }}
                transition={{ duration: 5 + index, repeat: Infinity, ease: "easeInOut" }}
              >
                <img src={frame} alt="" />
                <div className="reel-ui">
                  <span />
                  <CirclePlay size={22} />
                </div>
                <strong>{index === 0 ? "2.4M" : index === 1 ? "418K" : "91K"}</strong>
              </motion.div>
            ))}
          </motion.div>
        </div>
        <div className="scroll-cue">
          <span>Scroll</span>
          <ChevronDown size={18} />
        </div>
      </section>

      <section className="proof">
        <div className="logo-strip" aria-label="Selected client brands">
          {restaurantNames.map((logo) => (
            <span key={logo}>{logo}</span>
          ))}
        </div>
        <div className="metric-grid">
          {metrics.map((metric) => (
            <motion.div className="metric" key={metric.label} initial="hidden" whileInView="show" viewport={viewport} variants={fadeUp}>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="ai-analytics">
        <div className="dashboard-shell">
          <div className="dashboard-top">
            <span>Revora Signal OS</span>
            <LineChart size={20} />
          </div>
          <div className="dashboard-grid">
            <div>
              <small>Content idea velocity</small>
              <strong>146</strong>
            </div>
            <div>
              <small>ROI tracked</small>
              <strong>3.8x</strong>
            </div>
            <div>
              <small>Winning hooks</small>
              <strong>24</strong>
            </div>
            <div>
              <small>Reservation lift</small>
              <strong>68%</strong>
            </div>
          </div>
          <div className="dashboard-wave" />
        </div>
        <div>
          <SectionLabel
            eyebrow="AI + analytics"
            title="Future-ready growth systems, without losing the human taste layer."
            copy="AI helps us mine comments, spot content opportunities, forecast creative fatigue, and turn reporting into decisions. Strategy still belongs to people who understand restaurants."
          />
          <PremiumButton onClick={openLeadForm}>See the growth system</PremiumButton>
          <PremiumButton variant="ghost" href="/services">
            Explore services
          </PremiumButton>
        </div>
      </section>

      <section className="final-cta">
        <p className="eyebrow">Private consultation</p>
        <h2>Your restaurant already has a story. Let&apos;s make the market feel it.</h2>
        <p>
          Bring us your menu, your margins, your best nights, and the moments nobody has captured yet. We will map the
          brand system that turns attention into reservations, orders, and cultural pull.
        </p>
        <div className="hero-actions">
          <PremiumButton onClick={openLeadForm}>Book your consultation</PremiumButton>
          <a className="calendar-link" href={`mailto:${contactEmail}`}>
            <CalendarDays size={18} />
            {contactEmail}
          </a>
        </div>
      </section>
    </main>
  );
}

export function CaseStudyPreview({ compact = false }: { compact?: boolean }) {
  const [caseStudyItems, setCaseStudyItems] = useState(fallbackCaseStudies);
  const visibleCases = compact ? caseStudyItems.slice(0, 2) : caseStudyItems;

  useEffect(() => {
    getCaseStudies()
      .then((response) => {
        if (response.caseStudies.length) setCaseStudyItems(response.caseStudies);
      })
      .catch(() => setCaseStudyItems(fallbackCaseStudies));
  }, []);

  return (
    <section className="cases">
      <SectionLabel
        eyebrow="Case studies"
        title="Transformations built around appetite, identity, and measurable demand."
        copy="No vanity posts. Each case moves from scattered content into a recognizable brand world with performance discipline behind it."
      />
      <div className="case-stack">
        {visibleCases.map((study) => (
          <motion.article className="case-row" key={study.name} initial="hidden" whileInView="show" viewport={viewport} variants={fadeUp}>
            <div className="case-image">
              <img src={study.image} alt={`${study.name} hospitality campaign`} />
            </div>
            <div className="case-content">
              <p className="eyebrow">{study.type}</p>
              <h3>{study.name}</h3>
              <div className="before-after">
                <div>
                  <span>Before</span>
                  <p>{study.before}</p>
                </div>
                <div>
                  <span>After</span>
                  <p>{study.after}</p>
                </div>
              </div>
              <ul>
                {study.stats.map((stat) => (
                  <li key={stat}>{stat}</li>
                ))}
              </ul>
            </div>
          </motion.article>
        ))}
      </div>
      {compact ? (
        <div className="section-link-row">
          <PremiumButton variant="ghost" href="/case-studies">
            View all case studies
          </PremiumButton>
        </div>
      ) : null}
    </section>
  );
}
