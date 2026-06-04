import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { ArrowUpRight, LogIn, Mail, Menu, Moon, Sun, UserCircle, X } from "lucide-react";
import { contactEmail } from "@/data/contact";
import { navItems } from "@/data/content";
import { LeadFormModal } from "@/components/LeadFormModal";
import { syncClerkClient } from "@/lib/api";
import { pendingProfileKey } from "@/pages/ClientAuth";

export function Layout() {
  const location = useLocation();
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [leadOpen, setLeadOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("revora_theme") || "dark");
  const clientLoggedIn = Boolean(isSignedIn);
  const adminLoggedIn = Boolean(localStorage.getItem("revora_admin_token"));
  const profilePath = adminLoggedIn ? "/admin" : clientLoggedIn ? "/portal" : "/login";
  const profileLabel = adminLoggedIn ? "Admin" : clientLoggedIn ? "Profile" : "Login";

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("revora_theme", theme);
  }, [theme]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isSignedIn || !user) return;

    const rawPendingProfile = localStorage.getItem(pendingProfileKey);
    const pendingProfile = rawPendingProfile
      ? JSON.parse(rawPendingProfile) as { name?: string; phone?: string; brandName?: string; businessType?: string }
      : {};
    const primaryEmail = user.primaryEmailAddress?.emailAddress || user.emailAddresses[0]?.emailAddress || "";
    const primaryPhone = user.primaryPhoneNumber?.phoneNumber || "";

    getToken()
      .then((token) =>
        syncClerkClient(
          {
            clerkUserId: user.id,
            name: pendingProfile.name || user.fullName || user.firstName || primaryEmail.split("@")[0] || "Client",
            email: primaryEmail,
            phone: pendingProfile.phone || primaryPhone,
            brandName: pendingProfile.brandName || "",
            businessType: pendingProfile.businessType || "",
            avatarUrl: user.imageUrl || ""
          },
          token
        )
      )
      .then(() => localStorage.removeItem(pendingProfileKey))
      .catch(() => undefined);
  }, [getToken, isSignedIn, user]);

  return (
    <>
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <header className="site-nav">
        <Link to="/" className="brand-mark" aria-label="Revora Studio home">
          <span>R</span>
          <small>Revora Studio</small>
        </Link>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavLink key={item.href} to={item.href}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="nav-actions">
          <Link
            className="login-link"
            to={profilePath}
            aria-label={adminLoggedIn ? "Admin dashboard" : clientLoggedIn ? "Client profile" : "Login"}
          >
            {adminLoggedIn || clientLoggedIn ? <UserCircle size={16} /> : <LogIn size={16} />}
            <span>{profileLabel}</span>
          </Link>
          <button
            className="theme-toggle"
            type="button"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button className="nav-cta" type="button" onClick={() => setLeadOpen(true)}>
            Book consultation
          </button>
        </div>
        <button className="menu-button" aria-label="Toggle menu" onClick={() => setMenuOpen((value) => !value)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>
      {menuOpen ? (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {navItems.map((item) => (
            <NavLink key={item.href} to={item.href} onClick={() => setMenuOpen(false)}>
              {item.label}
            </NavLink>
          ))}
          <NavLink to={profilePath} onClick={() => setMenuOpen(false)}>
            {adminLoggedIn ? "Admin dashboard" : clientLoggedIn ? "Client profile" : "Login"}
          </NavLink>
          {!clientLoggedIn && !adminLoggedIn ? (
            <NavLink to="/signup" onClick={() => setMenuOpen(false)}>
              Signup
            </NavLink>
          ) : null}
          <button
            type="button"
            onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
          >
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <button
            type="button"
            onClick={() => {
              setLeadOpen(true);
              setMenuOpen(false);
            }}
          >
            Book consultation
          </button>
        </nav>
      ) : null}
      <Outlet context={{ openLeadForm: () => setLeadOpen(true) }} />
      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand">
            <Link to="/" className="footer-logo" aria-label="Revora Studio home">
              <span>R</span>
              <strong>Revora Studio</strong>
            </Link>
            <p>Social media, content production, brand systems, and performance marketing for hospitality brands.</p>
          </div>
          <nav className="footer-links" aria-label="Footer navigation">
            <span>Explore</span>
            {navItems.map((item) => (
              <Link key={item.href} to={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="footer-contact">
            <span>Contact</span>
            <a href={`mailto:${contactEmail}`}>
              <Mail size={15} />
              {contactEmail}
            </a>
            <button type="button" onClick={() => setLeadOpen(true)}>
              Book consultation
              <ArrowUpRight size={15} />
            </button>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Revora Studio. All rights reserved.</span>
          <span>Built for hospitality growth teams.</span>
        </div>
      </footer>
      <LeadFormModal open={leadOpen} onClose={() => setLeadOpen(false)} />
    </>
  );
}
