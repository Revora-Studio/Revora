import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { businessTypes, isPresetBusinessType, otherBusinessType } from "@/data/businessTypes";
import { adminLogin, adminSignup, clientLogin, clientSignup } from "@/lib/api";

type ClientAuthPageProps = {
  mode: "login" | "signup";
};

export function ClientAuthPage({ mode }: ClientAuthPageProps) {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState<"client" | "admin">("client");
  const [authMode, setAuthMode] = useState<"login" | "signup">(mode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [brandName, setBrandName] = useState("");
  const [businessType, setBusinessType] = useState("Restaurant");
  const [customBusinessType, setCustomBusinessType] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isSignup = authMode === "signup";
  const isAdmin = accountType === "admin";
  const businessTypeChoice = isPresetBusinessType(businessType) ? businessType : otherBusinessType;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isAdmin) {
        const response = isSignup
          ? await adminSignup({ email, password, inviteCode })
          : await adminLogin({ email, password });
        localStorage.setItem("revora_admin_token", response.token);
        navigate("/admin");
      } else {
        const response = isSignup
          ? await clientSignup({ name, email, brandName, businessType, password })
          : await clientLogin({ email, password });
        localStorage.setItem("revora_client_token", response.token);
        navigate("/portal");
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Unable to continue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main id="content" className="auth-page-shell">
      <section className="auth-panel">
        <div>
          <p className="eyebrow">{isAdmin ? "Admin access" : "Client portal"}</p>
          <h1>
            {isSignup
              ? isAdmin
                ? "Create your admin account."
                : "Create your client account."
              : isAdmin
                ? "Login to admin."
                : "Login to your client portal."}
          </h1>
          <p>
            {isAdmin
              ? "Manage leads, restaurants, services, and case studies from one workspace."
              : "Access your consultation status, brand workspace, reports, and future campaign dashboard from one place."}
          </p>
        </div>
        <form className="admin-login" onSubmit={submit}>
          <div className="auth-switch" role="tablist" aria-label="Account type">
            <button
              type="button"
              className={!isAdmin ? "active" : ""}
              onClick={() => setAccountType("client")}
            >
              Client
            </button>
            <button
              type="button"
              className={isAdmin ? "active" : ""}
              onClick={() => setAccountType("admin")}
            >
              Admin
            </button>
          </div>
          <div className="auth-switch" role="tablist" aria-label="Authentication mode">
            <button
              type="button"
              className={!isSignup ? "active" : ""}
              onClick={() => setAuthMode("login")}
            >
              Login
            </button>
            <button
              type="button"
              className={isSignup ? "active" : ""}
              onClick={() => setAuthMode("signup")}
            >
              Signup
            </button>
          </div>
          {isSignup && !isAdmin ? (
            <>
              <label>
                Your name
                <input value={name} onChange={(event) => setName(event.target.value)} required />
              </label>
              <label>
                Brand name
                <input value={brandName} onChange={(event) => setBrandName(event.target.value)} required />
              </label>
              <label>
                Business type
                <select
                  value={businessTypeChoice}
                  onChange={(event) => {
                    if (event.target.value === otherBusinessType) {
                      setBusinessType(customBusinessType);
                      return;
                    }
                    setCustomBusinessType("");
                    setBusinessType(event.target.value);
                  }}
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
                    value={customBusinessType}
                    onChange={(event) => {
                      setCustomBusinessType(event.target.value);
                      setBusinessType(event.target.value);
                    }}
                    placeholder="Type your business category"
                    required
                  />
                </label>
              ) : null}
            </>
          ) : null}
          <label>
            {isAdmin ? "Admin email" : "Email"}
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
          {isSignup && isAdmin ? (
            <label>
              Invite code
              <input value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} required />
            </label>
          ) : null}
          {error ? <p className="form-error">{error}</p> : null}
          <button className="form-submit" type="submit" disabled={loading}>
            {loading ? "Please wait..." : isSignup ? `Create ${isAdmin ? "admin" : "client"} account` : "Login"}
          </button>
        </form>
      </section>
    </main>
  );
}
