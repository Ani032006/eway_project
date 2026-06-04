import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword } from "../../services/api";

const inputStyle = {
  background: "#fff",
  border: "1px solid #ccc",
  padding: "18px",
  borderRadius: "12px",
  color: "#000",
  fontSize: "16px",
  width: "100%",
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
  width: "100%",
};

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const data = await forgotPassword(email);
      let msg = data.message;
      if (data.devResetUrl) {
        // In dev mode, show the reset link inline so the developer can click it
        msg += ` Dev reset link: ${data.devResetUrl}`;
      }
      setSuccess(msg);
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#004848",
        padding: "20px",
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
        <h2 style={{ fontSize: "28px", marginBottom: "8px" }}>Forgot Password</h2>
        <p style={{ color: "#B2DFDB", marginBottom: "28px", fontSize: "14px" }}>
          Enter your registered email. We&apos;ll send a password reset link valid for
          15 minutes.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {error && (
            <div
              style={{
                background: "#C62828",
                padding: "12px 16px",
                borderRadius: "10px",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          {sent ? (
            /* Success state */
            <div
              style={{
                background: "#2E7D32",
                padding: "20px",
                borderRadius: "12px",
                fontSize: "14px",
                lineHeight: 1.7,
              }}
            >
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>✅</div>
              <strong>Reset link sent!</strong>
              <p style={{ marginTop: "6px", wordBreak: "break-all" }}>{success}</p>
            </div>
          ) : (
            <>
              <input
                id="forgot-password-email"
                placeholder="Your email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                style={inputStyle}
                autoComplete="email"
              />

              <button
                id="forgot-password-submit-btn"
                onClick={handleSubmit}
                disabled={loading || !email.trim()}
                style={{ ...buttonStyle, opacity: loading || !email.trim() ? 0.7 : 1 }}
              >
                {loading ? "Sending…" : "Send Reset Link"}
              </button>
            </>
          )}

          <p style={{ color: "#E0E0E0", fontSize: "14px", textAlign: "center" }}>
            <span
              id="back-to-login-link"
              onClick={() => navigate("/login")}
              style={{ color: "#FFFFCC", cursor: "pointer" }}
            >
              ← Back to Login
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
