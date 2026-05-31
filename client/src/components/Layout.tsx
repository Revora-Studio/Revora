import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { LogIn, Menu, Moon, Sun, UserCircle, X } from "lucide-react";
import { contactEmail } from "@/data/contact";
import { navItems } from "@/data/content";
import { LeadFormModal } from "@/components/LeadFormModal";

export function Layout() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [leadOpen, setLeadOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("revora_theme") || "dark");
  const clientLoggedIn = Boolean(localStorage.getItem("revora_client_token"));
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
        <span>Revora Studio</span>
        <p>Social media, content production, brand systems, and performance marketing for hospitality.</p>
        <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
      </footer>
      <LeadFormModal open={leadOpen} onClose={() => setLeadOpen(false)} />
    </>
  );
}
