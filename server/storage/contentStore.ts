import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import type { CaseStudy, ServiceItem } from "../types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../data");
const servicesFile = path.join(dataDir, "services.json");
const caseStudiesFile = path.join(dataDir, "case-studies.json");

const defaultServices = [
  ["Social Media Management", "Daily brand presence", "Editorial calendars, community rhythm, platform-native publishing, and reputation moments handled with the care of an in-house brand desk.", "MousePointer2"],
  ["Reels & Short-form Content", "Culture-ready film", "Storyboards, shoot direction, hooks, edits, captions, and testable variants built for Instagram, TikTok, and YouTube Shorts.", "Clapperboard"],
  ["Paid Ads", "Demand capture", "Meta and Google campaign architecture with creative testing, offer mapping, landing pages, and weekly optimization loops.", "Megaphone"],
  ["Influencer Campaigns", "Local taste networks", "Creator sourcing, invitation flows, table experiences, content rights, briefing, and reporting for high-signal hospitality launches.", "Sparkles"],
  ["Branding", "Identity systems", "Positioning, naming support, campaign language, art direction, and social design systems that make dining brands recognizable.", "Brush"],
  ["Food Photography", "Craveable stills", "Menu photography, ambient dining moments, founder portraits, plating details, launch assets, and seasonal content libraries.", "Camera"],
  ["Menu Design", "Conversion at table", "Menu hierarchy, naming, premium print design, QR menu journeys, upsell architecture, and category storytelling.", "Utensils"],
  ["Website Development", "Booking-ready web", "Fast hospitality websites with reservations, private dining flows, campaign landing pages, analytics, and CMS-ready content models.", "Code2"],
  ["Performance Marketing", "Revenue systems", "Full-funnel growth for delivery, reservations, franchise leads, loyalty, events, seasonal menus, and new-location openings.", "ChartNoAxesCombined"],
  ["Analytics & Growth", "Boardroom clarity", "Dashboards, reporting cadences, content scorecards, attribution views, and AI-assisted insights for smarter budget moves.", "BarChart3"]
];

const defaultCaseStudies = [
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

function withMeta<T extends object>(item: T) {
  const now = new Date().toISOString();
  return { id: crypto.randomUUID(), ...item, createdAt: now, updatedAt: now };
}

async function ensureFile<T extends object>(file: string, defaults: T[]) {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(file);
  } catch {
    await fs.writeFile(file, JSON.stringify(defaults.map(withMeta), null, 2), "utf-8");
  }
}

async function readJson<T extends object>(file: string, defaults: T[]) {
  await ensureFile(file, defaults);
  return JSON.parse(await fs.readFile(file, "utf-8")) as Array<T & { id: string; createdAt: string; updatedAt: string }>;
}

async function writeJson<T>(file: string, items: T[]) {
  await fs.writeFile(file, JSON.stringify(items, null, 2), "utf-8");
}

export async function listFileServices() {
  return readJson<ServiceItem>(
    servicesFile,
    defaultServices.map(([title, kicker, detail, iconKey]) => ({ title, kicker, detail, iconKey } as ServiceItem))
  );
}

export async function createFileService(input: Omit<ServiceItem, "id" | "createdAt" | "updatedAt">) {
  const services = await listFileServices();
  const exists = services.some((service) => service.title.toLowerCase() === input.title.toLowerCase().trim());
  if (exists) return null;
  const service = withMeta(input);
  services.push(service);
  await writeJson(servicesFile, services);
  return service;
}

export async function updateFileService(id: string, input: Omit<ServiceItem, "id" | "createdAt" | "updatedAt">) {
  const services = await listFileServices();
  const index = services.findIndex((service) => service.id === id);
  if (index === -1) return null;
  const exists = services.some(
    (service) => service.id !== id && service.title.toLowerCase() === input.title.toLowerCase().trim()
  );
  if (exists) return "title-taken" as const;
  services[index] = { ...services[index], ...input, updatedAt: new Date().toISOString() };
  await writeJson(servicesFile, services);
  return services[index];
}

export async function deleteFileService(id: string) {
  const services = await listFileServices();
  const next = services.filter((service) => service.id !== id);
  await writeJson(servicesFile, next);
  return next.length !== services.length;
}

export async function listFileCaseStudies() {
  return readJson<CaseStudy>(caseStudiesFile, defaultCaseStudies as CaseStudy[]);
}

export async function createFileCaseStudy(input: Omit<CaseStudy, "id" | "createdAt" | "updatedAt">) {
  const caseStudies = await listFileCaseStudies();
  const exists = caseStudies.some((caseStudy) => caseStudy.name.toLowerCase() === input.name.toLowerCase().trim());
  if (exists) return null;
  const caseStudy = withMeta(input);
  caseStudies.push(caseStudy);
  await writeJson(caseStudiesFile, caseStudies);
  return caseStudy;
}

export async function deleteFileCaseStudy(id: string) {
  const caseStudies = await listFileCaseStudies();
  const next = caseStudies.filter((caseStudy) => caseStudy.id !== id);
  await writeJson(caseStudiesFile, next);
  return next.length !== caseStudies.length;
}
