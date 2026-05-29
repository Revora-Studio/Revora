import { FormEvent, useEffect, useState } from "react";
import { Navigate, useOutletContext } from "react-router-dom";
import { CalendarDays, Edit3, LogOut, Save, X } from "lucide-react";
import { businessTypes, isPresetBusinessType, otherBusinessType } from "@/data/businessTypes";
import { contactEmail } from "@/data/contact";
import { getClientMe, updateClientMe } from "@/lib/api";
import type { ClientUser } from "@/types";
import { PremiumButton } from "@/components/PremiumButton";

const emptyProfile = {
  name: "",
  email: "",
  brandName: "",
  businessType: "Restaurant"
};

export function PortalPage() {
  const { openLeadForm } = useOutletContext<{ openLeadForm: () => void }>();
  const [client, setClient] = useState<ClientUser | null>(null);
  const [profile, setProfile] = useState(emptyProfile);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loggedOut, setLoggedOut] = useState(false);
  const token = localStorage.getItem("revora_client_token");
  const businessTypeChoice = isPresetBusinessType(profile.businessType) ? profile.businessType : otherBusinessType;

  const syncProfile = (nextClient: ClientUser) => {
    setClient(nextClient);
    setProfile({
      name: nextClient.name,
      email: nextClient.email,
      brandName: nextClient.brandName,
      businessType: nextClient.businessType
    });
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    getClientMe()
      .then((response) => syncProfile(response.client))
      .catch(() => localStorage.removeItem("revora_client_token"))
      .finally(() => setLoading(false));
  }, [token]);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      const response = await updateClientMe(profile);
      localStorage.setItem("revora_client_token", response.token);
      syncProfile(response.client);
      setEditing(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    if (client) syncProfile(client);
    setError("");
    setEditing(false);
  };

  if (loggedOut || (!token && !loading)) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main id="content" className="page-shell">
      <section className="portal-hero">
        <div>
          <p className="eyebrow">Client portal</p>
          <h1>{loading ? "Loading your workspace." : `Welcome, ${client?.name ?? "client"}.`}</h1>
          <p>
            Your private hospitality growth workspace for consultation requests, campaign planning, performance
            reporting, and upcoming brand assets.
          </p>
        </div>
        <button
          className="nav-cta"
          type="button"
          onClick={() => {
            localStorage.removeItem("revora_client_token");
            setLoggedOut(true);
          }}
        >
          <LogOut size={16} />
          Logout
        </button>
      </section>

      <section className="portal-grid">
        <article className="profile-card">
          <div className="profile-card-top">
            <span>Profile</span>
            {!editing ? (
              <button className="icon-text-button" type="button" onClick={() => setEditing(true)} disabled={loading}>
                <Edit3 size={15} />
                Edit
              </button>
            ) : null}
          </div>

          {editing ? (
            <form className="profile-form" onSubmit={saveProfile}>
              <label>
                Your name
                <input
                  value={profile.name}
                  onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))}
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={profile.email}
                  onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))}
                  required
                />
              </label>
              <label>
                Brand name
                <input
                  value={profile.brandName}
                  onChange={(event) => setProfile((current) => ({ ...current, brandName: event.target.value }))}
                  required
                />
              </label>
              <label>
                Business type
                <select
                  value={businessTypeChoice}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      businessType: event.target.value === otherBusinessType ? "" : event.target.value
                    }))
                  }
                >
                  {businessTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                  <option>{otherBusinessType}</option>
                </select>
              </label>
              {businessTypeChoice === otherBusinessType ? (
                <label>
                  Other business type
                  <input
                    value={profile.businessType}
                    onChange={(event) =>
                      setProfile((current) => ({ ...current, businessType: event.target.value }))
                    }
                    placeholder="Type your business category"
                    required
                  />
                </label>
              ) : null}
              {error ? <p className="form-error">{error}</p> : null}
              <div className="profile-actions">
                <button type="submit" disabled={saving}>
                  <Save size={15} />
                  {saving ? "Saving" : "Save"}
                </button>
                <button type="button" onClick={cancelEdit}>
                  <X size={15} />
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <strong>{client?.brandName ?? "Loading"}</strong>
              <p>{client?.businessType ?? "Hospitality"} account</p>
              <dl className="profile-details">
                <div>
                  <dt>Name</dt>
                  <dd>{client?.name ?? "Loading"}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{client?.email ?? "Loading"}</dd>
                </div>
              </dl>
            </>
          )}
        </article>
        <article>
          <span>Next step</span>
          <strong>Brand audit</strong>
          <p>Submit or update your consultation request so the team can prepare context.</p>
          <PremiumButton onClick={openLeadForm}>Book consultation</PremiumButton>
        </article>
        <article>
          <span>Reports</span>
          <strong>Coming next</strong>
          <p>Campaign dashboards, content approvals, and monthly performance reports are ready to connect here.</p>
        </article>
      </section>

      <section className="final-cta compact">
        <p className="eyebrow">Need help?</p>
        <h2>Talk to the Revora team.</h2>
        <a className="calendar-link" href={`mailto:${contactEmail}`}>
          <CalendarDays size={18} />
          {contactEmail}
        </a>
      </section>
    </main>
  );
}
