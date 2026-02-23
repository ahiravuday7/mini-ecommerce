import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./login.css";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      await login({ email, password });
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-main">
      <div className="row shadow-lg rounded-4 overflow-hidden login-wrapper">
        {/* LEFT SIDE */}
        <div className="col-lg-6 d-none d-lg-flex flex-column justify-content-center p-5 text-white left-panel">
          <h1 className="fw-bold display-6">
            Simplify management with our dashboard.
          </h1>
          <p className="mt-3">
            Manage your e-commerce platform smoothly with our modern admin
            dashboard.
          </p>
        </div>

        {/* RIGHT SIDE */}
        <div className="col-lg-6 bg-white p-5">
          <h3 className="fw-bold text-dark-brown">Welcome Back</h3>
          <p className="text-muted">Please login to your account</p>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={onSubmit} className="mt-4">
            <div className="mb-3">
              <label className="form-label text-dark-brown">Email</label>
              <input
                type="email"
                className="form-control rounded-3"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="uday@test.com"
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label text-dark-brown">Password</label>
              <input
                type="password"
                className="form-control rounded-3"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="123456"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn w-100 rounded-3 fw-bold btn-custom mt-2"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="mt-4">
            New user?{" "}
            <Link to="/register" className="text-orange fw-bold">
              Signup
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
