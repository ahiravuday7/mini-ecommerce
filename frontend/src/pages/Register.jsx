import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      await register({ name, email, password });
      navigate("/");
    } catch (e2) {
      setError(e2?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center py-4">
      <div className="row shadow-lg rounded-4 overflow-hidden login-wrapper w-100">
        {/* Left Side (Same as Login) */}
        <div className="col-lg-6 d-none d-lg-flex flex-column justify-content-center p-5 text-white left-panel">
          <h1 className="fw-bold display-6">Join us and start your journey.</h1>
          <p className="mt-3 mb-0">
            Create your account and explore a seamless shopping experience with
            our modern e-commerce platform.
          </p>
        </div>

        {/* Right Side */}
        <div className="col-lg-6 bg-white p-4 p-md-5">
          <h3 className="fw-bold">Create Account</h3>
          <p className="text-muted">Register to start shopping</p>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={onSubmit} className="mt-4">
            <div className="mb-3">
              <label className="form-label">Name</label>
              <input
                className="form-control rounded-3"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Uday Ahirav"
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Email</label>
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
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control rounded-3"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="min 6 chars"
                required
              />
            </div>

            <button
              disabled={loading}
              className="btn btn-primary w-100 rounded-3 fw-bold mt-2"
            >
              {loading ? "Creating..." : "Register"}
            </button>
          </form>

          <p className="mt-4">
            Already have an account?{" "}
            <Link to="/login" className="fw-bold text-decoration-none">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
