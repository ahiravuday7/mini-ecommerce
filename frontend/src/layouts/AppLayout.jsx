import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";

export default function AppLayout() {
  const { booting } = useAuth();
  const location = useLocation();

  // const isAuthPage =
  //   location.pathname === "/login" || location.pathname === "/register";

  // Add any route here that should be full-width + no padding
  const noPaddingRoutes = ["/login", "/register", "/"];
  const isNoPaddingPage = noPaddingRoutes.includes(location.pathname);

  return (
    <div className="min-vh-100 d-flex flex-column bg-body-tertiary">
      <Navbar />
      <main className={`flex-grow-1 ${isNoPaddingPage ? "" : "py-4"}`}>
        {booting ? (
          <div className="container py-5 d-flex align-items-center gap-2 text-secondary">
            <div className="spinner-border spinner-border-sm" role="status" />
            <span>Checking session...</span>
          </div>
        ) : isNoPaddingPage ? (
          <Outlet />
        ) : (
          <div className="container">
            <Outlet />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
