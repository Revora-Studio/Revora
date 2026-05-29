import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { businessTypes, isPresetBusinessType, otherBusinessType } from "@/data/businessTypes";
import { clientLogin, clientSignup } from "@/lib/api";

type ClientAuthPageProps = {
  mode: "login" | "signup";
};

export function ClientAuthPage({ mode }: ClientAuthPageProps) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [brandName, setBrandName] = useState("");
  const [businessType, setBusinessType] = useState("Restaurant");
  const [customBusinessType, setCustomBusinessType] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isSignup = mode === "signup";
  const businessTypeChoice = isPresetBusinessType(businessType) ? businessType : otherBusinessType;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = isSignup
        ? await clientSignup({ name, email, brandName, businessType, password })
        : await clientLogin({ email, password });
      localStorage.setItem("revora_client_token", response.token);
      navigate("/portal");
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
          <p className="eyebrow">Client portal</p>
          <h1>{isSignup ? "Create your client account." : "Login to your client portal."}</h1>
          <p>
            Access your consultation status, brand workspace, reports, and future campaign dashboard from one place.
          </p>
        </div>
        <form className="admin-login" onSubmit={submit}>
          {isSignup ? (
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
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={isSignup ? 8 : undefined}
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="form-submit" type="submit" disabled={loading}>
            {loading ? "Please wait..." : isSignup ? "Create client account" : "Login"}
          </button>
          <p className="auth-alt">
            {isSignup ? "Already have an account?" : "New client?"}{" "}
            <Link to={isSignup ? "/login" : "/signup"}>{isSignup ? "Login" : "Create account"}</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
