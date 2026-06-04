import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import "./styles.css";

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPublishableKey) {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <main className="auth-page-shell">
        <section className="auth-panel">
          <div className="auth-card clerk-auth-card">
            <p className="form-error">Clerk publishable key is missing. Add VITE_CLERK_PUBLISHABLE_KEY to client/.env and restart the client server.</p>
          </div>
        </section>
      </main>
    </React.StrictMode>
  );
} else {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <ClerkProvider
        publishableKey={clerkPublishableKey}
        signInUrl="/login"
        signUpUrl="/signup"
        afterSignInUrl="/"
        afterSignUpUrl="/"
      >
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ClerkProvider>
    </React.StrictMode>
  );
}
