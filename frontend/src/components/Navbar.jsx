import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }) =>
  `nav-link px-0 px-lg-2 ${isActive ? "fw-bold text-primary" : "text-secondary"}`;

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const onLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="bg-white border-bottom sticky-top shadow-sm">
      <div className="container py-3">
        <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-3">
          <Link to="/" className="text-decoration-none fs-4 fw-bold text-dark">
            MiniStore
          </Link>

          <nav className="nav gap-3 flex-grow-1">
            <NavLink to="/" className={linkClass}>
              Home
            </NavLink>
            <NavLink to="/cart" className={linkClass}>
              Cart
            </NavLink>
            <NavLink to="/orders" className={linkClass}>
              My Orders
            </NavLink>
          </nav>

          <nav className="d-flex align-items-center gap-2 flex-wrap">
            {user ? (
              <>
                <span className="small text-secondary">
                  Hi, <b>{user.name}</b>
                </span>

                {user.isAdmin && (
                  <>
                    <Link
                      to="/admin/products"
                      className="btn btn-outline-primary btn-sm"
                    >
                      Products
                    </Link>
                    <Link to="/admin/faqs" className="btn btn-outline-primary btn-sm">
                      FAQs
                    </Link>
                  </>
                )}

                <button
                  onClick={onLogout}
                  className="btn btn-outline-secondary btn-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={linkClass}>
                  Login
                </NavLink>
                <NavLink to="/register" className={linkClass}>
                  Register
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
