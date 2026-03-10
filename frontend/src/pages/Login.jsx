import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();

    const identifier = emailOrPhone.trim();
    const looksLikeEmail = identifier.includes("@");
    const isEmail = EMAIL_REGEX.test(identifier.toLowerCase());

    if (looksLikeEmail && !isEmail) {
      setError("Invalid email format");
      return;
    }
    if (!isEmail && !PHONE_REGEX.test(identifier)) {
      setError("Invalid phone format");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await login({ emailOrPhone: identifier, password });
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container min-vh-100 d-flex align-items-center justify-content-center py-3 py-lg-2">
      <div className="row shadow-lg rounded-4 overflow-hidden login-wrapper">
        {/* Left Side */}
        <div className="col-lg-6 d-none d-lg-flex flex-column justify-content-center p-5 text-white left-panel">
          <h1 className="fw-bold display-6">Welcome back to MiniStore.</h1>
          <p className="mt-3 mb-0">
            Login to manage your orders, cart, and enjoy smooth online shopping.
          </p>
        </div>

        {/* Right Side */}
        <div className="col-lg-6 bg-white p-4 p-md-5">
          <h3 className="fw-bold ">Welcome Back</h3>
          <p className="text-muted">Please login to your account</p>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={onSubmit} className="mt-4">
            <div className="mb-3">
              <label className="form-label ">Email or Phone</label>
              <input
                type="text"
                className="form-control rounded-3"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                placeholder="uday@test.com or 9876543210"
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label ">Password</label>
              <div className="input-group">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control rounded-start-3"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary rounded-end-3"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="mb-3 text-end">
              <Link
                to="/forgot-password"
                className="small text-decoration-none fw-semibold"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-100 rounded-3 fw-bold mt-2"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="mt-4">
            New user?{" "}
            <Link to="/register" className=" fw-bold text-decoration-none">
              Signup
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
