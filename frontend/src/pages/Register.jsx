import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const inputStyle = {
  padding: "10px 12px",
  border: "1px solid #ddd",
  borderRadius: 10,
  width: "100%",
  outline: "none",
};

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
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      <h2>Create Account</h2>

      {/* Error message */}
      {error && (
        <div
          style={{
            background: "#fff3f3",
            border: "1px solid #ffd0d0",
            padding: 10,
            borderRadius: 10,
            color: "#a40000",
          }}
        >
          {error}
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={onSubmit}
        style={{ display: "grid", gap: 12, marginTop: 12 }}
      >
        <div>
          <label>Name</label>
          <input
            style={inputStyle}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Uday Ahirav"
          />
        </div>

        <div>
          <label>Email</label>
          <input
            style={inputStyle}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="uday@test.com"
          />
        </div>

        <div>
          <label>Password</label>
          <input
            style={inputStyle}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="min 6 chars"
          />
        </div>

        <button
          disabled={loading}
          style={{
            padding: "12px 14px",
            borderRadius: 12,
            border: "none",
            cursor: "pointer",
            fontWeight: 800,
          }}
        >
          {loading ? "Creating..." : "Register"}
        </button>
      </form>

      <p style={{ marginTop: 12 }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}
