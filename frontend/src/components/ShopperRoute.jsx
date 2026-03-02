import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ShopperRoute({ children, guestOnly = false }) {
  const { user, booting } = useAuth();

  if (booting) {
    return (
      <div className="container py-5 d-flex align-items-center gap-2 text-secondary">
        <div className="spinner-border spinner-border-sm" role="status" />
        <span>Checking session...</span>
      </div>
    );
  }

  if (guestOnly) {
    if (user?.isAdmin) return <Navigate to="/admin/products" replace />;
    if (user) return <Navigate to="/" replace />;
    return children;
  }

  // guest or normal user can access; only admin is blocked
  if (user?.isAdmin) return <Navigate to="/admin/products" replace />;

  return children;
}
