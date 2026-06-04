import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../../services/api";

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

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const tokenFromUrl = searchParams.get("token") || "";
  const emailFromUrl = searchParams.get("email") || "";

  // If token and email come from URL (clicked email link), they're pre-filled and hidden
  const fromEmailLink = Boolean(tokenFromUrl && emailFromUrl);

  const [email, setEmail] = useState(emailFromUrl);
  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Password strength helper
  const getStrength = (pwd) => {
    if (!pwd) return null;
    if (pwd.length < 6) return { label: "Too short", color: "#C62828", pct: "20%" };
    if (pwd.length < 8) return { label: "Weak", color: "#EF6C00", pct: "40%" };
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && pwd.length >= 8)
      return { label: "Strong", color: "#2E7D32", pct: "100%" };
    return { label: "Fair", color: "#F9A825", pct: "65%" };
  };

  const strength = getStrength(password);

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!token) {
      setError("Reset token is required.");
      return;
    }
    if (!email) {
      setError("Email is required.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const data = await resetPassword({ token, email, password });
      setSuccess(data.message + " Redirecting to login…");
      setTimeout(() => navigate("/login"), 2000);
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
        <h2 style={{ fontSize: "28px", marginBottom: "8px" }}>Reset Password</h2>
        <p style={{ color: "#B2DFDB", marginBottom: "28px", fontSize: "14px" }}>
          {fromEmailLink
            ? `Setting a new password for ${email}`
            : "Enter your email, the reset token from your email, and your new password."}
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
          {success && (
            <div
              style={{
                background: "#2E7D32",
                padding: "12px 16px",
                borderRadius: "10px",
                fontSize: "14px",
              }}
            >
              ✅ {success}
            </div>
          )}

          {/* Only show email and token fields when NOT arriving from email link */}
          {!fromEmailLink && (
            <>
              <input
                id="reset-email"
                placeholder="Your email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                autoComplete="email"
              />
              <input
                id="reset-token"
                placeholder="Reset token (from your email)"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                style={inputStyle}
              />
            </>
          )}

          {/* New password with strength indicator */}
          <div>
            <input
              id="reset-new-password"
              type="password"
              placeholder="New password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              autoComplete="new-password"
            />
            {strength && (
              <div
                style={{
                  marginTop: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    height: "4px",
                    flex: 1,
                    background: "#004848",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      background: strength.color,
                      width: strength.pct,
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: "12px",
                    color: strength.color,
                    fontWeight: "bold",
                    minWidth: "60px",
                  }}
                >
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          <div>
            <input
              id="reset-confirm-password"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              style={{
                ...inputStyle,
                borderColor:
                  confirmPassword && confirmPassword !== password
                    ? "#C62828"
                    : confirmPassword && confirmPassword === password
                    ? "#2E7D32"
                    : "#ccc",
              }}
              autoComplete="new-password"
            />
            {confirmPassword && confirmPassword !== password && (
              <p style={{ color: "#FF8A65", fontSize: "12px", marginTop: "6px" }}>
                Passwords do not match
              </p>
            )}
          </div>

          <button
            id="reset-password-submit-btn"
            onClick={handleSubmit}
            disabled={loading}
            style={{ ...buttonStyle, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Saving…" : "Reset Password"}
          </button>

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

export default ResetPassword;
