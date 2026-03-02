import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Password and confirm password do not match");
      return;
    }

    if (!PASSWORD_REGEX.test(password)) {
      setError(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
      );
      return;
    }

    try {
      setLoading(true);
      setError("");
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

      await register({
        name,
        password,
        confirmPassword,
        ...(isEmail ? { email: identifier } : { phone: identifier }),
      });
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
              <label className="form-label">Email or Phone</label>
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
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control rounded-3"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8, Aa1@ format"
                title="Minimum 8 characters, with uppercase, lowercase, number, and special character"
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                className="form-control rounded-3"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="re-enter password"
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
