import { FormEvent, useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
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
  phone: "",
  brandName: "",
  businessType: "Restaurant",
  avatarUrl: ""
};

const maxImageBytes = 4 * 1024 * 1024;

function isProfileIncomplete(client: ClientUser | null) {
  return !client?.phone?.trim() || !client.brandName?.trim() || !client.businessType?.trim();
}

export function PortalPage() {
  const { openLeadForm } = useOutletContext<{ openLeadForm: () => void }>();
  const { getToken, isLoaded, isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const [client, setClient] = useState<ClientUser | null>(null);
  const [profile, setProfile] = useState(emptyProfile);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loggedOut, setLoggedOut] = useState(false);
  const businessTypeChoice = isPresetBusinessType(profile.businessType) ? profile.businessType : otherBusinessType;
  const profileIncomplete = isProfileIncomplete(client);

  const syncProfile = (nextClient: ClientUser) => {
    setClient(nextClient);
    setProfile({
      name: nextClient.name,
      email: nextClient.email,
      phone: nextClient.phone ?? "",
      brandName: nextClient.brandName,
      businessType: nextClient.businessType || "Restaurant",
      avatarUrl: nextClient.avatarUrl ?? ""
    });
    setEditing(isProfileIncomplete(nextClient));
  };

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    getToken()
      .then((token) => getClientMe(token))
      .then((response) => syncProfile(response.client))
      .catch(() => {
        if (user) {
          const email = user.primaryEmailAddress?.emailAddress || user.emailAddresses[0]?.emailAddress || "";
          syncProfile({
            id: user.id,
            name: user.fullName || user.firstName || email.split("@")[0] || "Client",
            email,
            phone: user.primaryPhoneNumber?.phoneNumber || "",
            brandName: "",
            businessType: "",
            avatarUrl: user.imageUrl || "",
            createdAt: new Date().toISOString()
          });
        }
      })
      .finally(() => setLoading(false));
  }, [getToken, isLoaded, isSignedIn, user]);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      const token = await getToken();
      const response = await updateClientMe(profile, token);
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
    setEditing(profileIncomplete);
  };

  const updateAvatar = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }
    if (file.size > maxImageBytes) {
      setError("Please upload an image under 4 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setProfile((current) => ({ ...current, avatarUrl: String(reader.result || "") }));
      setError("");
    };
    reader.onerror = () => setError("Unable to read image file.");
    reader.readAsDataURL(file);
  };

  if (loggedOut || (isLoaded && !isSignedIn && !loading)) {
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
          onClick={async () => {
            await signOut();
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
            <span>{profileIncomplete ? "Complete profile" : "Profile"}</span>
            {!editing && !profileIncomplete ? (
              <button className="icon-text-button" type="button" onClick={() => setEditing(true)} disabled={loading}>
                <Edit3 size={15} />
                Edit
              </button>
            ) : null}
          </div>

          {editing ? (
            <form className="profile-form" onSubmit={saveProfile}>
              <div className="profile-avatar-preview">
                {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : <span>{profile.name.charAt(0) || "R"}</span>}
              </div>
              {profileIncomplete ? (
                <p className="form-notice">Add these details to finish setting up your client workspace.</p>
              ) : null}
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
                Phone / WhatsApp
                <input
                  value={profile.phone}
                  onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))}
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
              <label>
                Avatar image
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => updateAvatar(event.target.files?.[0])}
                />
              </label>
              {error ? <p className="form-error">{error}</p> : null}
              <div className="profile-actions">
                <button type="submit" disabled={saving}>
                  <Save size={15} />
                  {saving ? "Saving" : "Save"}
                </button>
                <button type="button" onClick={cancelEdit}>
                  <X size={15} />
                  {profileIncomplete ? "Later" : "Cancel"}
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="profile-avatar-preview">
                {client?.avatarUrl ? <img src={client.avatarUrl} alt="" /> : <span>{client?.name?.charAt(0) ?? "R"}</span>}
              </div>
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
                <div>
                  <dt>Phone</dt>
                  <dd>{client?.phone || "Add phone for OTP recovery"}</dd>
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
