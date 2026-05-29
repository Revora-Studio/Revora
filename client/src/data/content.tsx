import {
  BarChart3,
  Brush,
  Camera,
  ChartNoAxesCombined,
  Clapperboard,
  Code2,
  Megaphone,
  MousePointer2,
  Sparkles,
  Utensils
} from "lucide-react";

export const navItems = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Case Studies", href: "/case-studies" },
  { label: "Industries", href: "/industries" },
  { label: "Insights", href: "/insights" }
];

export const metrics = [
  { value: "38M+", label: "tracked reel views across hospitality campaigns" },
  { value: "4.7x", label: "average increase in qualified profile actions" },
  { value: "72%", label: "paid media spend shifted into winning creatives" },
  { value: "21", label: "cities with restaurant and cafe growth systems" }
];

export const logos = ["Oro Table", "Maison Crumb", "Koya Bar", "Rasa House", "Cloud & Co.", "Luma Dining"];

export const services = [
  {
    title: "Social Media Management",
    kicker: "Daily brand presence",
    icon: MousePointer2,
    detail:
      "Editorial calendars, community rhythm, platform-native publishing, and reputation moments handled with the care of an in-house brand desk."
  },
  {
    title: "Reels & Short-form Content",
    kicker: "Culture-ready film",
    icon: Clapperboard,
    detail:
      "Storyboards, shoot direction, hooks, edits, captions, and testable variants built for Instagram, TikTok, and YouTube Shorts."
  },
  {
    title: "Paid Ads",
    kicker: "Demand capture",
    icon: Megaphone,
    detail:
      "Meta and Google campaign architecture with creative testing, offer mapping, landing pages, and weekly optimization loops."
  },
  {
    title: "Influencer Campaigns",
    kicker: "Local taste networks",
    icon: Sparkles,
    detail:
      "Creator sourcing, invitation flows, table experiences, content rights, briefing, and reporting for high-signal hospitality launches."
  },
  {
    title: "Branding",
    kicker: "Identity systems",
    icon: Brush,
    detail:
      "Positioning, naming support, campaign language, art direction, and social design systems that make dining brands recognizable."
  },
  {
    title: "Food Photography",
    kicker: "Craveable stills",
    icon: Camera,
    detail:
      "Menu photography, ambient dining moments, founder portraits, plating details, launch assets, and seasonal content libraries."
  },
  {
    title: "Menu Design",
    kicker: "Conversion at table",
    icon: Utensils,
    detail:
      "Menu hierarchy, naming, premium print design, QR menu journeys, upsell architecture, and category storytelling."
  },
  {
    title: "Website Development",
    kicker: "Booking-ready web",
    icon: Code2,
    detail:
      "Fast hospitality websites with reservations, private dining flows, campaign landing pages, analytics, and CMS-ready content models."
  },
  {
    title: "Performance Marketing",
    kicker: "Revenue systems",
    icon: ChartNoAxesCombined,
    detail:
      "Full-funnel growth for delivery, reservations, franchise leads, loyalty, events, seasonal menus, and new-location openings."
  },
  {
    title: "Analytics & Growth",
    kicker: "Boardroom clarity",
    icon: BarChart3,
    detail:
      "Dashboards, reporting cadences, content scorecards, attribution views, and AI-assisted insights for smarter budget moves."
  }
];

export const caseStudies = [
  {
    name: "Maison Crumb",
    type: "Luxury dessert atelier",
    image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=1200&q=80",
    before: "A beautiful bakery hidden behind inconsistent product shots and quiet launches.",
    after: "A collectible dessert brand with weekly drops, creator waitlists, and sell-out reels.",
    stats: ["812% reel reach", "3.9x preorders", "46K new local followers"]
  },
  {
    name: "Koya Bar",
    type: "Cocktail bar and late-night dining",
    image: "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=1200&q=80",
    before: "Strong walk-in energy, weak weekday demand, and no recognizable content language.",
    after: "A cinematic nightlife identity with creator nights and paid campaigns for signature rituals.",
    stats: ["68% more bookings", "11.4M content views", "2.1x weekday revenue"]
  },
  {
    name: "Rasa House",
    type: "Modern Indian dining",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
    before: "Fine dining craft was buried under delivery-app visuals and generic festival posts.",
    after: "A founder-led brand story with menu films, editorial stills, and high-intent private dining leads.",
    stats: ["5.6x inquiry growth", "37% lower CAC", "124 event leads"]
  }
];

export const industries = [
  { title: "Cafes", line: "Daily rituals, neighborhood loyalty, seasonal beverages, founder-led warmth." },
  { title: "Fine dining", line: "Restraint, reservation demand, chef authority, private dining storytelling." },
  { title: "Bars", line: "Night energy, signature pours, creator tables, weekday demand generation." },
  { title: "Bakeries", line: "Drop culture, gifting moments, visual cravings, repeat purchase loops." },
  { title: "Cloud kitchens", line: "Performance creative, offer testing, delivery funnels, retention reporting." },
  { title: "Franchises", line: "Multi-location playbooks, local pages, launch kits, regional dashboards." }
];

export const process = [
  "Discovery",
  "Brand Audit",
  "Strategy",
  "Shoot Planning",
  "Production",
  "Campaign Launch",
  "Analytics & Scaling"
];

export const heroFrames = [
  "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1560624052-449f5ddf0c31?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=900&q=80"
];

export const production = [
  "Dish movement tests",
  "Chef-led story capture",
  "Lighting and table styling",
  "Hook scripting",
  "Vertical edit suites",
  "Thumbnail and caption variants"
];

export const testimonials = [
  {
    quote: "Revora made our restaurant feel like a world people wanted to enter before they ever booked a table.",
    name: "Anaya Rao",
    role: "Founder, Rasa House"
  },
  {
    quote: "The shoots look beautiful, but the real win is how disciplined the system is. Every post has a job.",
    name: "Kabir Mehta",
    role: "Partner, Koya Bar"
  },
  {
    quote: "We stopped posting desserts and started building anticipation. The difference showed up in preorders immediately.",
    name: "Mira Shah",
    role: "Creative Director, Maison Crumb"
  }
];
