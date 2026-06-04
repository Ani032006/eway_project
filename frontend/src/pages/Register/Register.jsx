import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { register, sendOtp, verifyOtp } from "../../services/api";

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

const alertError = {
  background: "#C62828",
  color: "#fff",
  padding: "12px 16px",
  borderRadius: "10px",
  fontSize: "14px",
};

const alertSuccess = {
  background: "#2E7D32",
  color: "#fff",
  padding: "12px 16px",
  borderRadius: "10px",
  fontSize: "14px",
};

function Register() {
  const navigate = useNavigate();
  const location = useLocation();

  // Support being redirected from Login when email is not yet verified
  const prefillEmail = location.state?.email || "";

  const [step, setStep] = useState(prefillEmail ? "otp" : "form");

  const [name, setName] = useState("");
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [state, setState] = useState("");
  const [department, setDepartment] = useState("");
  const [otp, setOtp] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(
    prefillEmail
      ? "A verification OTP was previously sent to your email. Enter it below or resend."
      : ""
  );
  const [loading, setLoading] = useState(false);

  // OTP expiry countdown (5 minutes from when OTP was sent)
  const [otpSentAt, setOtpSentAt] = useState(prefillEmail ? Date.now() : null);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!otpSentAt) {
      setTimeLeft(null);
      return;
    }
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - otpSentAt) / 1000);
      const remaining = 300 - elapsed; // 5 minutes = 300s
      if (remaining <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [otpSentAt]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const handleRegister = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const data = await register({ name, email, password, state, department });
      let msg = data.message;
      if (data.devOtp) msg += ` (Dev OTP: ${data.devOtp})`;
      setSuccess(msg);
      setOtpSentAt(Date.now());
      setStep("otp");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const data = await sendOtp(email);
      let msg = data.message;
      if (data.devOtp) msg += ` (Dev OTP: ${data.devOtp})`;
      setSuccess(msg);
      setOtpSentAt(Date.now());
      setOtp("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const data = await verifyOtp(email, otp);
      localStorage.setItem("ewb_token", data.token);
      localStorage.setItem("ewb_user", JSON.stringify(data.user));
      setSuccess(data.message + " Redirecting to dashboard…");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key !== "Enter") return;
    if (step === "form") handleRegister();
    else if (otp.length === 6) handleVerifyOtp();
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
          width: "460px",
          background: "#005F5F",
          padding: "40px",
          borderRadius: "20px",
          color: "white",
        }}
      >
        <h2 style={{ color: "white", marginBottom: "6px", fontSize: "32px" }}>
          {step === "form" ? "Officer Registration" : "Verify Your Email"}
        </h2>
        <p style={{ color: "#B2DFDB", marginBottom: "24px", fontSize: "14px" }}>
          {step === "form"
            ? "Create your account. A 6-digit OTP will be emailed to you."
            : `Enter the 6-digit OTP sent to ${email}`}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {error && <div style={alertError}>{error}</div>}
          {success && <div style={alertSuccess}>{success}</div>}

          {step === "form" ? (
            <>
              <input
                id="register-name"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                style={inputStyle}
                autoComplete="name"
              />
              <input
                id="register-email"
                placeholder="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                style={inputStyle}
                autoComplete="email"
              />
              <input
                id="register-password"
                type="password"
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                style={inputStyle}
                autoComplete="new-password"
              />
              <input
                id="register-state"
                placeholder="Jurisdiction State"
                value={state}
                onChange={(e) => setState(e.target.value)}
                onKeyDown={handleKeyDown}
                style={inputStyle}
              />
              <input
                id="register-department"
                placeholder="Department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                onKeyDown={handleKeyDown}
                style={inputStyle}
              />
              <button
                id="register-submit-btn"
                onClick={handleRegister}
                disabled={loading}
                style={{ ...buttonStyle, opacity: loading ? 0.7 : 1 }}
              >
                {loading ? "Submitting…" : "Register & Send OTP"}
              </button>
            </>
          ) : (
            <>
              {/* OTP Input with large digit display */}
              <input
                id="register-otp"
                placeholder="Enter 6-digit OTP"
                value={otp}
                maxLength={6}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                onKeyDown={handleKeyDown}
                style={{
                  ...inputStyle,
                  fontSize: "28px",
                  letterSpacing: "10px",
                  textAlign: "center",
                  fontWeight: "bold",
                }}
              />

              {/* OTP countdown timer */}
              {timeLeft !== null && (
                <p
                  style={{
                    textAlign: "center",
                    fontSize: "13px",
                    color: timeLeft < 60 ? "#FF8A65" : "#B2DFDB",
                    margin: "-6px 0",
                  }}
                >
                  {timeLeft > 0
                    ? `OTP expires in ${formatTime(timeLeft)}`
                    : "OTP expired — resend below"}
                </p>
              )}

              <button
                id="otp-verify-btn"
                onClick={handleVerifyOtp}
                disabled={loading || otp.length !== 6}
                style={{
                  ...buttonStyle,
                  opacity: loading || otp.length !== 6 ? 0.6 : 1,
                }}
              >
                {loading ? "Verifying…" : "Verify OTP"}
              </button>

              <button
                id="otp-resend-btn"
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                style={{
                  background: "transparent",
                  border: "1px solid #FFFFCC",
                  color: "#FFFFCC",
                  padding: "12px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontSize: "14px",
                  opacity: loading ? 0.6 : 1,
                  width: "100%",
                }}
              >
                Resend OTP
              </button>

              <button
                id="otp-back-btn"
                type="button"
                onClick={() => {
                  setStep("form");
                  setOtp("");
                  setError("");
                  setSuccess("");
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#B2DFDB",
                  cursor: "pointer",
                  fontSize: "13px",
                  padding: "4px",
                }}
              >
                ← Back to registration form
              </button>
            </>
          )}

          <p style={{ color: "#E0E0E0", fontSize: "14px" }}>
            Already have an account?{" "}
            <span
              id="login-link"
              onClick={() => navigate("/login")}
              style={{ color: "#FFFFCC", cursor: "pointer" }}
            >
              Login here
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
