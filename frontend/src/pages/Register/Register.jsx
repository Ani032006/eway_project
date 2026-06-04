import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../../services/api";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const data = await register({ name, email, password, state });
      setSuccess(data.message);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleRegister();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#004848",
      }}
    >
      <div
        style={{
          width: "450px",
          background: "#005F5F",
          padding: "40px",
          borderRadius: "20px",
          color: "white",
        }}
      >
        <h2
          style={{
            color: "white",
            marginBottom: "30px",
            fontSize: "32px",
          }}
        >
          Officer Registration
        </h2>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          {error && (
            <div
              style={{
                background: "#C62828",
                color: "#fff",
                padding: "12px 16px",
                borderRadius: "10px",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                background: "#2E7D32",
                color: "#fff",
                padding: "12px 16px",
                borderRadius: "10px",
                fontSize: "14px",
              }}
            >
              {success}
            </div>
          )}

          <input
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            style={inputStyle}
          />

          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            style={inputStyle}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            style={inputStyle}
          />

          <input
            placeholder="State / Jurisdiction"
            value={state}
            onChange={(e) => setState(e.target.value)}
            onKeyDown={handleKeyDown}
            style={inputStyle}
          />

          <button
            onClick={handleRegister}
            disabled={loading}
            style={{
              ...buttonStyle,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Registering..." : "Register"}
          </button>

          <p style={{ color: "#E0E0E0" }}>
            Already have an account?{" "}
            <span
              onClick={() => navigate("/login")}
              style={{
                color: "#FFFFCC",
                cursor: "pointer",
              }}
            >
              Login here
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  background: "#fff",
  border: "1px solid #ccc",
  padding: "18px",
  borderRadius: "12px",
  color: "#000",
  fontSize: "16px",
};

const buttonStyle = {
  background: "#FFFFCC",
  color: "#000",
  border: "none",
  padding: "18px",
  borderRadius: "12px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "16px",
};

export default Register;
