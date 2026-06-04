import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { AdminPage } from "@/pages/Admin";
import { CaseStudiesPage } from "@/pages/CaseStudies";
import { ClientAuthPage } from "@/pages/ClientAuth";
import { Home } from "@/pages/Home";
import { IndustriesPage } from "@/pages/Industries";
import { InsightsPage } from "@/pages/Insights";
import { PortalPage } from "@/pages/Portal";
import { ServicesPage } from "@/pages/Services";

export function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/case-studies" element={<CaseStudiesPage />} />
          <Route path="/industries" element={<IndustriesPage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/login/*" element={<ClientAuthPage mode="login" />} />
          <Route path="/signup/*" element={<ClientAuthPage mode="signup" />} />
          <Route path="/portal" element={<PortalPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  );
}

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [location.pathname]);

  return null;
}
