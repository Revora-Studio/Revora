import { FormEvent, useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Download, Loader2, LogOut, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import {
  adminLogin,
  adminSignup,
  createCaseStudy,
  createRestaurant,
  createService,
  deleteCaseStudy,
  deleteLead,
  deleteRestaurant,
  deleteService,
  getCaseStudies,
  getLeads,
  getLeadStats,
  getRestaurants,
  getServices,
  updateService,
  updateLead
} from "@/lib/api";
import { serviceIconOptions } from "@/data/serviceIcons";
import type { CaseStudy, Lead, LeadStats, LeadStatus, Restaurant, ServiceItem } from "@/types";

const statuses: Array<{ label: string; value: "all" | LeadStatus }> = [
  { label: "All", value: "all" },
  { label: "New", value: "new" },
  { label: "Contacted", value: "contacted" },
  { label: "Qualified", value: "qualified" },
  { label: "Proposal", value: "proposal" },
  { label: "Won", value: "won" },
  { label: "Lost", value: "lost" }
];

const emptyServiceForm = {
  title: "",
  kicker: "",
  detail: "",
  iconKey: "MousePointer2"
};

const emptyCaseStudyForm = {
  name: "",
  type: "",
  image: "",
  before: "",
  after: "",
  stats: ""
};

const maxImageBytes = 4 * 1024 * 1024;

function AdminAuthForm({ onAuthenticated }: { onAuthenticated: (token: string) => void }) {
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isSignup = authMode === "signup";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = isSignup
        ? await adminSignup({ email, password, inviteCode })
        : await adminLogin({ email, password });
      localStorage.setItem("revora_admin_token", response.token);
      onAuthenticated(response.token);
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Unable to continue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main id="content" className="auth-page-shell">
      <section className="auth-panel">
        <div className="auth-copy">
          <p className="eyebrow">Admin access</p>
          <h1>{isSignup ? "Create your admin account." : "Login to admin."}</h1>
          <p>Manage leads, restaurants, services, and case studies from one workspace.</p>
        </div>
        <form className="admin-login auth-card" onSubmit={submit}>
          <div className="auth-switch" role="tablist" aria-label="Admin authentication mode">
            <button
              type="button"
              className={!isSignup ? "active" : ""}
              onClick={() => {
                setAuthMode("login");
                setError("");
              }}
            >
              Login
            </button>
            <button
              type="button"
              className={isSignup ? "active" : ""}
              onClick={() => {
                setAuthMode("signup");
                setError("");
              }}
            >
              Signup
            </button>
          </div>
          <label>
            Admin email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            Password
            <span className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={isSignup ? 8 : undefined}
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>
          {isSignup ? (
            <label>
              Invite code
              <input value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} required />
            </label>
          ) : null}
          {error ? <p className="form-error">{error}</p> : null}
          <button className="form-submit" type="submit" disabled={loading}>
            {loading ? "Please wait..." : isSignup ? "Create admin account" : "Login"}
          </button>
        </form>
      </section>
    </main>
  );
}

function uniqueByTitle<T extends { title?: string; name?: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = (item.title || item.name || "").trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function AdminPage() {
  const [token, setToken] = useState(() => localStorage.getItem("revora_admin_token") || "");
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [restaurantName, setRestaurantName] = useState("");
  const [serviceForm, setServiceForm] = useState(emptyServiceForm);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [caseStudyForm, setCaseStudyForm] = useState(emptyCaseStudyForm);
  const [restaurantError, setRestaurantError] = useState("");
  const [contentError, setContentError] = useState("");
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [status, setStatus] = useState<"all" | LeadStatus>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = leads.find((lead) => lead.id === selectedId) || leads[0] || null;

  const pipelineValue = useMemo(() => {
    const weights: Record<LeadStatus, number> = { new: 1, contacted: 2, qualified: 4, proposal: 7, won: 10, lost: 0 };
    return leads.reduce((total, lead) => total + weights[lead.status], 0);
  }, [leads]);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [leadResponse, statResponse] = await Promise.all([
        getLeads({ status, q: query }),
        getLeadStats()
      ]);
      setLeads(leadResponse.leads);
      setStats(statResponse);
      setSelectedId((current) => current || leadResponse.leads[0]?.id || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    void load();
    getRestaurants()
      .then((response) => setRestaurants(response.restaurants))
      .catch(() => setRestaurantError("Unable to load public restaurants."));
    getServices()
      .then((response) => setServices(uniqueByTitle(response.services)))
      .catch(() => setContentError("Unable to load services."));
    getCaseStudies()
      .then((response) => setCaseStudies(uniqueByTitle(response.caseStudies)))
      .catch(() => setContentError("Unable to load case studies."));
  }, [token, status]);

  const saveLead = async (lead: Lead, next: Partial<Pick<Lead, "status" | "notes">>) => {
    const response = await updateLead(lead.id, next);
    setLeads((current) => current.map((item) => (item.id === lead.id ? response.lead : item)));
  };

  const removeLead = async (lead: Lead) => {
    await deleteLead(lead.id);
    setLeads((current) => current.filter((item) => item.id !== lead.id));
    setSelectedId(null);
  };

  const addRestaurant = async (event: FormEvent) => {
    event.preventDefault();
    setRestaurantError("");
    try {
      const response = await createRestaurant({ name: restaurantName });
      setRestaurants((current) => [...current, response.restaurant]);
      setRestaurantName("");
    } catch (error) {
      setRestaurantError(error instanceof Error ? error.message : "Unable to add restaurant.");
    }
  };

  const removeRestaurant = async (restaurant: Restaurant) => {
    await deleteRestaurant(restaurant.id);
    setRestaurants((current) => current.filter((item) => item.id !== restaurant.id));
  };

  const saveService = async (event: FormEvent) => {
    event.preventDefault();
    setContentError("");
    try {
      if (editingServiceId) {
        const response = await updateService(editingServiceId, serviceForm);
        setServices((current) => current.map((item) => (item.id === editingServiceId ? response.service : item)));
      } else {
        const response = await createService(serviceForm);
        setServices((current) => [...current, response.service]);
      }
      setServiceForm(emptyServiceForm);
      setEditingServiceId(null);
    } catch (error) {
      setContentError(error instanceof Error ? error.message : "Unable to save service.");
    }
  };

  const editService = (service: ServiceItem) => {
    setServiceForm({
      title: service.title,
      kicker: service.kicker,
      detail: service.detail,
      iconKey: service.iconKey
    });
    setEditingServiceId(service.id);
  };

  const removeService = async (service: ServiceItem) => {
    await deleteService(service.id);
    setServices((current) => current.filter((item) => item.id !== service.id));
    if (editingServiceId === service.id) {
      setEditingServiceId(null);
      setServiceForm(emptyServiceForm);
    }
  };

  const addCaseStudy = async (event: FormEvent) => {
    event.preventDefault();
    setContentError("");
    if (!caseStudyForm.image) {
      setContentError("Please upload a case study image.");
      return;
    }
    try {
      const response = await createCaseStudy({
        ...caseStudyForm,
        stats: caseStudyForm.stats
          .split(",")
          .map((stat) => stat.trim())
          .filter(Boolean)
      });
      setCaseStudies((current) => [...current, response.caseStudy]);
      setCaseStudyForm(emptyCaseStudyForm);
    } catch (error) {
      setContentError(error instanceof Error ? error.message : "Unable to add case study.");
    }
  };

  const updateCaseStudyImage = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setContentError("Please upload an image file.");
      return;
    }
    if (file.size > maxImageBytes) {
      setContentError("Please upload an image under 4 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCaseStudyForm((current) => ({ ...current, image: String(reader.result || "") }));
      setContentError("");
    };
    reader.onerror = () => setContentError("Unable to read image file.");
    reader.readAsDataURL(file);
  };

  const removeCaseStudy = async (caseStudy: CaseStudy) => {
    await deleteCaseStudy(caseStudy.id);
    setCaseStudies((current) => current.filter((item) => item.id !== caseStudy.id));
  };

  const exportCsv = () => {
    const rows = [
      ["Name", "Email", "Phone", "Brand", "Type", "City", "Budget", "Services", "Status", "Created"],
      ...leads.map((lead) => [
        lead.name,
        lead.email,
        lead.phone,
        lead.brandName,
        lead.businessType,
        lead.city,
        lead.monthlyBudget,
        lead.services.join(" | "),
        lead.status,
        lead.createdAt
      ])
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "revora-leads.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!token) return <AdminAuthForm onAuthenticated={setToken} />;

  return (
    <main id="content" className="admin-shell">
      <section className="admin-header">
        <div>
          <p className="eyebrow">Admin profile</p>
          <h1>Consultation command center.</h1>
          <p>Review new leads, update pipeline stages, add team notes, delete spam, and export the list.</p>
        </div>
        <button
          className="nav-cta"
          type="button"
          onClick={() => {
            localStorage.removeItem("revora_admin_token");
            setToken("");
          }}
        >
          <LogOut size={16} />
          Logout
        </button>
      </section>

      <section className="admin-stats">
        <div>
          <span>Total leads</span>
          <strong>{stats?.total ?? 0}</strong>
        </div>
        <div>
          <span>New leads</span>
          <strong>{stats?.byStatus.new ?? 0}</strong>
        </div>
        <div>
          <span>Qualified</span>
          <strong>{stats?.byStatus.qualified ?? 0}</strong>
        </div>
        <div>
          <span>Pipeline score</span>
          <strong>{pipelineValue}</strong>
        </div>
      </section>

      <section className="restaurant-manager">
        <div>
          <p className="eyebrow">Public restaurants</p>
          <h2>Manage restaurant names on the website.</h2>
          <p>Add or delete the restaurant/brand names shown in the home page logo strip.</p>
        </div>
        <form onSubmit={addRestaurant}>
          <label>
            Restaurant name
            <input
              value={restaurantName}
              onChange={(event) => setRestaurantName(event.target.value)}
              placeholder="Add restaurant or brand"
              required
            />
          </label>
          <button type="submit">
            <Plus size={16} />
            Add
          </button>
        </form>
        {restaurantError ? <p className="form-error">{restaurantError}</p> : null}
        <div className="restaurant-list">
          {restaurants.map((restaurant) => (
            <span key={restaurant.id}>
              {restaurant.name}
              <button
                type="button"
                aria-label={`Delete ${restaurant.name}`}
                title={`Delete ${restaurant.name}`}
                onClick={() => removeRestaurant(restaurant)}
              >
                <Trash2 size={15} />
              </button>
            </span>
          ))}
        </div>
      </section>

      <section className="content-manager">
        <div>
          <p className="eyebrow">Website content</p>
          <h2>Website service tabs.</h2>
          <p>Add, edit, or delete the items shown on the public Services page.</p>
        </div>
        <form className="cms-form" onSubmit={saveService}>
          <label>
            Title
            <input
              value={serviceForm.title}
              onChange={(event) => setServiceForm((current) => ({ ...current, title: event.target.value }))}
              required
            />
          </label>
          <label>
            Kicker
            <input
              value={serviceForm.kicker}
              onChange={(event) => setServiceForm((current) => ({ ...current, kicker: event.target.value }))}
              required
            />
          </label>
          <label>
            Icon
            <select
              value={serviceForm.iconKey}
              onChange={(event) => setServiceForm((current) => ({ ...current, iconKey: event.target.value }))}
            >
              {serviceIconOptions.map((icon) => (
                <option key={icon}>{icon}</option>
              ))}
            </select>
          </label>
          <label className="cms-wide">
            Detail
            <textarea
              value={serviceForm.detail}
              onChange={(event) => setServiceForm((current) => ({ ...current, detail: event.target.value }))}
              required
            />
          </label>
          <button type="submit">
            <Plus size={16} />
            {editingServiceId ? "Update service" : "Add service"}
          </button>
          {editingServiceId ? (
            <button
              type="button"
              onClick={() => {
                setEditingServiceId(null);
                setServiceForm(emptyServiceForm);
              }}
            >
              Cancel edit
            </button>
          ) : null}
        </form>
        <div className="cms-list">
          {services.map((service) => (
            <article key={service.id}>
              <div>
                <strong>{service.title}</strong>
                <small>{service.kicker}</small>
              </div>
              <button type="button" onClick={() => editService(service)}>
                Edit
              </button>
              <button type="button" className="danger-button" onClick={() => removeService(service)}>
                <Trash2 size={15} />
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="content-manager">
        <div>
          <p className="eyebrow">Case studies</p>
          <h2>Add or delete restaurants, bars, cafes, and other case studies.</h2>
          <p>These appear on the Case Studies page and the compact home page preview.</p>
        </div>
        <form className="cms-form" onSubmit={addCaseStudy}>
          <label>
            Brand name
            <input
              value={caseStudyForm.name}
              onChange={(event) => setCaseStudyForm((current) => ({ ...current, name: event.target.value }))}
              required
            />
          </label>
          <label>
            Type
            <input
              placeholder="Restaurant, bar, cafe..."
              value={caseStudyForm.type}
              onChange={(event) => setCaseStudyForm((current) => ({ ...current, type: event.target.value }))}
              required
            />
          </label>
          <label>
            Upload image
            <input
              type="file"
              accept="image/*"
              onChange={(event) => updateCaseStudyImage(event.target.files?.[0])}
            />
          </label>
          {caseStudyForm.image ? (
            <div className="cms-image-preview">
              <img src={caseStudyForm.image} alt="" />
            </div>
          ) : null}
          <label>
            Before
            <textarea
              value={caseStudyForm.before}
              onChange={(event) => setCaseStudyForm((current) => ({ ...current, before: event.target.value }))}
              required
            />
          </label>
          <label>
            After
            <textarea
              value={caseStudyForm.after}
              onChange={(event) => setCaseStudyForm((current) => ({ ...current, after: event.target.value }))}
              required
            />
          </label>
          <label className="cms-wide">
            Stats
            <input
              placeholder="68% more bookings, 11.4M views, 2.1x revenue"
              value={caseStudyForm.stats}
              onChange={(event) => setCaseStudyForm((current) => ({ ...current, stats: event.target.value }))}
              required
            />
          </label>
          <button type="submit">
            <Plus size={16} />
            Add case study
          </button>
        </form>
        {contentError ? <p className="form-error">{contentError}</p> : null}
        <div className="cms-list">
          {caseStudies.map((caseStudy) => (
            <article key={caseStudy.id}>
              <div>
                <strong>{caseStudy.name}</strong>
                <small>{caseStudy.type}</small>
              </div>
              <button type="button" className="danger-button" onClick={() => removeCaseStudy(caseStudy)}>
                <Trash2 size={15} />
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="lead-section-heading">
        <div>
          <p className="eyebrow">Consultation requests</p>
          <h2>Lead inbox.</h2>
          <p>These are submitted client inquiries. Their selected services are shown inside each lead detail.</p>
        </div>
      </section>

      <section className="admin-toolbar">
        <label>
          <Search size={16} />
          <input
            placeholder="Search brand, owner, city, email"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void load();
            }}
          />
        </label>
        <select value={status} onChange={(event) => setStatus(event.target.value as "all" | LeadStatus)}>
          {statuses.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <button type="button" onClick={load}>
          {loading ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
          Refresh
        </button>
        <button type="button" onClick={exportCsv}>
          <Download size={16} />
          Export CSV
        </button>
      </section>

      <section className="admin-grid">
        <div className="lead-list">
          {leads.length ? (
            leads.map((lead) => (
              <button
                key={lead.id}
                type="button"
                className={selected?.id === lead.id ? "active" : ""}
                onClick={() => setSelectedId(lead.id)}
              >
                <span>{lead.brandName}</span>
                <strong>{lead.name}</strong>
                <small>
                  {lead.businessType} / {lead.city} / {lead.status}
                </small>
              </button>
            ))
          ) : (
            <div className="empty-state">No consultation requests match this view.</div>
          )}
        </div>

        {selected ? (
          <article className="lead-detail">
            <div className="lead-detail-top">
              <div>
                <p className="eyebrow">{selected.businessType}</p>
                <h2>{selected.brandName}</h2>
                <p>{selected.goals}</p>
              </div>
              <button className="danger-button" type="button" onClick={() => removeLead(selected)}>
                <Trash2 size={16} />
                Delete
              </button>
            </div>

            <div className="detail-grid">
              <span>Name</span>
              <strong>{selected.name}</strong>
              <span>Email</span>
              <strong>{selected.email}</strong>
              <span>Phone</span>
              <strong>{selected.phone}</strong>
              <span>City</span>
              <strong>{selected.city}</strong>
              <span>Budget</span>
              <strong>{selected.monthlyBudget}</strong>
              <span>Preferred date</span>
              <strong>{selected.preferredDate || "Not selected"}</strong>
            </div>

            <div className="service-tags">
              {selected.services.map((service) => (
                <span key={service}>{service}</span>
              ))}
            </div>

            <label>
              Pipeline status
              <select
                value={selected.status}
                onChange={(event) => saveLead(selected, { status: event.target.value as LeadStatus })}
              >
                {statuses
                  .filter((item) => item.value !== "all")
                  .map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
              </select>
            </label>

            <label>
              Internal notes
              <textarea
                value={selected.notes || ""}
                onChange={(event) => saveLead(selected, { notes: event.target.value })}
              />
            </label>
          </article>
        ) : null}
      </section>
    </main>
  );
}
