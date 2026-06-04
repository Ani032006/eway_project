import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../services/api";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");

  const handleLogin = async () => {
    setError("");
    setNeedsVerification(false);
    setLoading(true);
    try {
      const data = await login(email, password);
      localStorage.setItem("ewb_token", data.token);
      localStorage.setItem("ewb_user", JSON.stringify(data.user));

      if (data.user.role === "admin") {
        navigate("/dashboard?role=admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      if (err.data?.requiresVerification && err.data?.email) {
        setNeedsVerification(true);
        setUnverifiedEmail(err.data.email);
        setError("Your email is not yet verified. Please complete OTP verification.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "#004848",
      }}
    >
      {/* LEFT SIDE */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px",
          color: "white",
        }}
      >
        <h1
          style={{
            fontSize: "48px",
            marginBottom: "20px",
            lineHeight: 1.2,
          }}
        >
          E-Way Intelligence System
        </h1>

        <p
          style={{
            fontSize: "20px",
            color: "#E0E0E0",
            maxWidth: "500px",
            lineHeight: 1.7,
          }}
        >
          Monitor E-Way bill movement, track transportation routes, and
          investigate vehicle-level movement intelligence.
        </p>
      </div>

      {/* RIGHT SIDE */}
      <div
        style={{
          width: "450px",
          background: "#005F5F",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "40px",
        }}
      >
        <div style={{ width: "100%" }}>
          <h2
            style={{
              color: "white",
              marginBottom: "8px",
              fontSize: "32px",
            }}
          >
            Officer Login
          </h2>
          <p style={{ color: "#B2DFDB", marginBottom: "30px", fontSize: "14px" }}>
            Sign in to access the E-Way Intelligence dashboard.
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            {/* Error message */}
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
                {needsVerification && (
                  <div style={{ marginTop: "10px" }}>
                    <button
                      id="go-to-register-btn"
                      onClick={() =>
                        navigate("/register", {
                          state: { email: unverifiedEmail },
                        })
                      }
                      style={{
                        background: "#FFFFCC",
                        color: "#000",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "13px",
                        marginRight: "8px",
                      }}
                    >
                      Go to OTP Verification →
                    </button>
                  </div>
                )}
              </div>
            )}

            <input
              id="login-email"
              placeholder="Officer Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              style={inputStyle}
              type="email"
              autoComplete="username"
            />

            <input
              id="login-password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              style={inputStyle}
              autoComplete="current-password"
            />

            <button
              id="login-btn"
              onClick={handleLogin}
              disabled={loading}
              style={{
                ...buttonStyle,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Logging in…" : "Login"}
            </button>

            <p style={{ color: "#E0E0E0" }}>
              <span
                id="forgot-password-link"
                onClick={() => navigate("/forgot-password")}
                style={{ color: "#FFFFCC", cursor: "pointer" }}
              >
                Forgot password?
              </span>
            </p>

            <p style={{ color: "#E0E0E0" }}>
              New officer?{" "}
              <span
                id="register-link"
                onClick={() => navigate("/register")}
                style={{ color: "#FFFFCC", cursor: "pointer" }}
              >
                Register here
              </span>
            </p>
          </div>
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

export default Login;
