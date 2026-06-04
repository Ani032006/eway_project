import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../services/api";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
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
      setError(err.message);
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
          }}
        >
          E-Way Intelligence
          System
        </h1>

        <p
          style={{
            fontSize: "20px",
            color: "#E0E0E0",
            maxWidth: "500px",
          }}
        >
          Monitor E-Way bill
          movement, track
          transportation routes,
          and investigate
          vehicle-level movement
          intelligence.
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
              marginBottom: "30px",
              fontSize: "32px",
            }}
          >
            Officer Login
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

            <input
              placeholder="Officer Email / ID"
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

            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                ...buttonStyle,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <p style={{ color: "#E0E0E0" }}>
              New officer?{" "}
              <span
                onClick={() => navigate("/register")}
                style={{
                  color: "#FFFFCC",
                  cursor: "pointer",
                }}
              >
                Register here
              </span>
            </p>

            <p
              style={{
                color: "#E0E0E0",
                fontSize: "14px",
                marginTop: "10px",
              }}
            >
              Admin Login:
              <br />
              admin@gmail.com
              <br />
              Password: admin
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
