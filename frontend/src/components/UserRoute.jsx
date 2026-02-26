import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function UserRoute({ children }) {
  // user -> logged-in user object, booting -> app is still checking session (like /auth/me API)
  const { user, booting } = useAuth();

  // Loading State
  if (booting) {
    return (
      <div className="container py-5 d-flex align-items-center gap-2 text-secondary">
        <div className="spinner-border spinner-border-sm" role="status" />
        <span>Checking session...</span>
      </div>
    );
  }

  // If no user: Redirect to login page
  if (!user) return <Navigate to="/login" replace />;
  // If admin tries to access user-only page: Redirect to admin dashboard
  if (user.isAdmin) return <Navigate to="/admin/products" replace />;

  return children;
}
