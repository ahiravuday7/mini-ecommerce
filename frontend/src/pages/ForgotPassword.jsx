import { useState } from "react";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="container min-vh-100 d-flex align-items-center justify-content-center py-3 py-lg-2">
      <div className="w-100" style={{ maxWidth: "520px" }}>
        <div className="card border-0 shadow-lg rounded-4">
          <div className="card-body p-4 p-md-5">
            <h3 className="fw-bold mb-2">Forgot Password</h3>
            <p className="text-muted mb-4">
              Enter your email or phone to receive reset instructions.
            </p>

            {submitted && (
              <div className="alert alert-success">
                If an account exists, reset instructions will be sent shortly.
              </div>
            )}

            <form onSubmit={onSubmit}>
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

              <button type="submit" className="btn btn-primary w-100 rounded-3 fw-bold mt-2">
                Send Reset Link
              </button>
            </form>

            <p className="mt-4 mb-0">
              Back to{" "}
              <Link to="/login" className="fw-bold text-decoration-none">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
