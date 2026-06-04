import { SignIn, SignUp, SignedIn, SignedOut } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";

type ClientAuthPageProps = {
  mode: "login" | "signup";
};

const pendingProfileKey = "revora_pending_signup_profile";
const clerkAppearance = {
  variables: {
    colorPrimary: "var(--gold)",
    colorBackground: "var(--auth-card-bg)",
    colorInputBackground: "var(--auth-field-bg)",
    colorInputText: "var(--cream)",
    colorText: "var(--cream)",
    colorTextSecondary: "var(--muted)",
    colorDanger: "#f0a38c",
    borderRadius: "0px",
    fontFamily: "Inter, Arial, sans-serif"
  },
  elements: {
    rootBox: "clerk-root-box",
    card: "clerk-card",
    headerTitle: "clerk-title",
    headerSubtitle: "clerk-subtitle",
    socialButtonsBlockButton: "clerk-social-button",
    formButtonPrimary: "clerk-primary-button",
    footerActionLink: "clerk-link",
    footer: "clerk-footer",
    footerAction: "clerk-footer-action",
    footerPages: "clerk-footer-pages",
    formFieldInput: "clerk-input",
    formFieldInputGroup: "clerk-input-group",
    formFieldLabel: "clerk-label",
    dividerLine: "clerk-divider-line",
    dividerText: "clerk-divider-text"
  }
};

export function ClientAuthPage({ mode }: ClientAuthPageProps) {
  const isSignup = mode === "signup";

  return (
    <main id="content" className="auth-page-shell">
      <SignedIn>
        <Navigate to="/" replace />
      </SignedIn>
      <SignedOut>
        <section className="auth-panel">
          <div className="auth-card clerk-auth-card">
            {isSignup ? (
              <SignUp
                routing="path"
                path="/signup"
                signInUrl="/login"
                fallbackRedirectUrl="/"
                forceRedirectUrl="/"
                appearance={clerkAppearance}
              />
            ) : (
              <SignIn
                routing="path"
                path="/login"
                signUpUrl="/signup"
                fallbackRedirectUrl="/"
                forceRedirectUrl="/"
                appearance={clerkAppearance}
              />
            )}
          </div>
        </section>
      </SignedOut>
    </main>
  );
}

export { pendingProfileKey };
