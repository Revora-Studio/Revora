import { FormEvent, useEffect, useMemo, useState } from "react";
import { Download, Eye, EyeOff, Loader2, LogOut, RefreshCw, Search, Trash2 } from "lucide-react";
import { adminLogin, adminSignup, deleteLead, getLeads, getLeadStats, updateLead } from "@/lib/api";
import type { Lead, LeadStats, LeadStatus } from "@/types";

const statuses: Array<{ label: string; value: "all" | LeadStatus }> = [
  { label: "All", value: "all" },
  { label: "New", value: "new" },
  { label: "Contacted", value: "contacted" },
  { label: "Qualified", value: "qualified" },
  { label: "Proposal", value: "proposal" },
  { label: "Won", value: "won" },
  { label: "Lost", value: "lost" }
];

export function AdminPage() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [status, setStatus] = useState<"all" | LeadStatus>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = leads.find((lead) => lead.id === selectedId) || leads[0] || null;

  useEffect(() => {
    localStorage.removeItem("revora_admin_token");
  }, []);

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
    void load();
  }, [token, status]);

  const submitLogin = async (event: FormEvent) => {
    event.preventDefault();
    setLoginError("");
    try {
      const response =
        authMode === "login"
          ? await adminLogin({ email, password })
          : await adminSignup({ email, password, inviteCode });
      localStorage.setItem("revora_admin_token", response.token);
      setToken(response.token);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Unable to continue.");
    }
  };

  const saveLead = async (lead: Lead, next: Partial<Pick<Lead, "status" | "notes">>) => {
    const response = await updateLead(lead.id, next);
    setLeads((current) => current.map((item) => (item.id === lead.id ? response.lead : item)));
  };

  const removeLead = async (lead: Lead) => {
    await deleteLead(lead.id);
    setLeads((current) => current.filter((item) => item.id !== lead.id));
    setSelectedId(null);
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

  if (!token) {
    return (
      <main id="content" className="admin-login-shell">
        <form className="admin-login" onSubmit={submitLogin} autoComplete="off">
          <p className="eyebrow">Admin profile</p>
          <h1>{authMode === "login" ? "Login to the lead desk." : "Create an admin account."}</h1>
          <p>Manage consultation forms, pipeline status, notes, and exports from a private admin workspace.</p>
          <div className="auth-switch" role="tablist" aria-label="Admin authentication">
            <button
              type="button"
              className={authMode === "login" ? "active" : ""}
              onClick={() => setAuthMode("login")}
            >
              Login
            </button>
            <button
              type="button"
              className={authMode === "signup" ? "active" : ""}
              onClick={() => setAuthMode("signup")}
            >
              Signup
            </button>
          </div>
          <label>
            Admin email
            <input
              type="email"
              name="revora-admin-email"
              autoComplete="off"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            Password
            <span className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                name="revora-admin-password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
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
          {authMode === "signup" ? (
            <label>
              Invite code
              <input
                name="revora-admin-invite-code"
                autoComplete="off"
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value)}
              />
            </label>
          ) : null}
          {loginError ? <p className="form-error">{loginError}</p> : null}
          <button className="form-submit" type="submit">
            {authMode === "login" ? "Login to admin" : "Create admin"}
          </button>
        </form>
      </main>
    );
  }

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
