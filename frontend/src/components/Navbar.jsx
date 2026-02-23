import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkStyle = ({ isActive }) => ({
  marginRight: 12,
  textDecoration: "none",
  fontWeight: isActive ? 700 : 500,
});

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const onLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header
      style={{
        borderBottom: "1px solid #eee",
        padding: "12px 16px",
        position: "sticky",
        top: 0,
        background: "white",
        zIndex: 10,
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Link
          to="/"
          style={{ fontWeight: 800, marginRight: 18, textDecoration: "none" }}
        >
          MiniStore
        </Link>

        <nav style={{ flex: 1 }}>
          <NavLink to="/" style={linkStyle}>
            Home
          </NavLink>
          <NavLink to="/cart" style={linkStyle}>
            Cart
          </NavLink>
          <NavLink to="/orders" style={linkStyle}>
            My Orders
          </NavLink>
        </nav>

        <nav style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {user ? (
            <>
              <span style={{ fontSize: 14, color: "#333" }}>
                Hi, <b>{user.name}</b>
              </span>

              {user.isAdmin && (
                <Link
                  to="/admin/products"
                  style={{ textDecoration: "none", fontWeight: 800 }}
                >
                  Products
                </Link>
              )}

              <button
                onClick={onLogout}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid #ddd",
                  background: "white",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" style={linkStyle}>
                Login
              </NavLink>
              <NavLink to="/register" style={linkStyle}>
                Register
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
