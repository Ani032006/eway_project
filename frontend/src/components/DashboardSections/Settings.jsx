import { useState, useEffect } from "react";
import { changePassword, getProfile } from "../../services/api";

function Settings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  // Default from localStorage — overwritten by live /profile fetch below
  const [user, setUser] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("ewb_user"));
      if (stored) {
        return {
          name: stored.name || "Officer",
          role:
            stored.role === "admin"
              ? "System Administrator"
              : "State Officer",
          state: stored.state || "—",
          department: stored.department || "—",
          email: stored.email || "—",
        };
      }
    } catch {}
    return {
      name: "Officer",
      role: "State Officer",
      state: "—",
      department: "—",
      email: "—",
    };
  });

  // Fetch live profile data on mount
  useEffect(() => {
    let cancelled = false;
    const loadProfile = async () => {
      try {
        const data = await getProfile();
        if (!cancelled) {
          setUser({
            name: data.name || "Officer",
            role: data.role === "admin" ? "System Administrator" : "State Officer",
            state: data.state || "—",
            department: data.department || "—",
            email: data.email || "—",
          });
          // Refresh localStorage so other components see the updated data
          const existing = JSON.parse(localStorage.getItem("ewb_user") || "{}");
          localStorage.setItem(
            "ewb_user",
            JSON.stringify({ ...existing, ...data })
          );
        }
      } catch (err) {
        console.warn("Could not refresh profile:", err.message);
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    };
    loadProfile();
    return () => { cancelled = true; };
  }, []);

  // Password strength helper
  const getStrength = (pwd) => {
    if (!pwd) return null;
    if (pwd.length < 6) return { label: "Too short", color: "#C62828" };
    if (pwd.length < 8) return { label: "Weak", color: "#EF6C00" };
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && pwd.length >= 8)
      return { label: "Strong", color: "#2E7D32" };
    return { label: "Fair", color: "#F9A825" };
  };

  const strength = getStrength(newPassword);

  const handleChangePassword = async () => {
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const data = await changePassword({ currentPassword, newPassword });
      setSuccess(data.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: "32px", marginBottom: "30px" }}>Settings</h1>

      {/* PROFILE CARD */}
      <div
        style={{
          background: "#005F5F",
          padding: "30px",
          borderRadius: "20px",
          marginBottom: "30px",
          color: "#fff",
          position: "relative",
        }}
      >
        <h2 style={{ marginBottom: "20px" }}>
          {user.role === "System Administrator" ? "Admin Profile" : "Officer Profile"}
        </h2>

        {profileLoading ? (
          <p style={{ color: "#B2DFDB", fontSize: "14px" }}>Loading profile…</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "20px",
            }}
          >
            <ProfileItem label="Officer Name" value={user.name} />
            <ProfileItem label="Role" value={user.role} />
            <ProfileItem label="Jurisdiction" value={user.state} />
            <ProfileItem label="Department" value={user.department} />
            <ProfileItem label="Email" value={user.email} />
          </div>
        )}
      </div>

      {/* CHANGE PASSWORD CARD */}
      <div
        style={{
          background: "#005F5F",
          padding: "30px",
          borderRadius: "20px",
          color: "#fff",
        }}
      >
        <h2 style={{ marginBottom: "20px" }}>Password Management</h2>

        {error && (
          <div
            style={{
              background: "#C62828",
              padding: "12px",
              borderRadius: "10px",
              marginBottom: "16px",
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
              padding: "12px",
              borderRadius: "10px",
              marginBottom: "16px",
              fontSize: "14px",
            }}
          >
            ✅ {success}
          </div>
        )}

        <div style={{ display: "grid", gap: "20px", maxWidth: "500px" }}>
          <input
            id="settings-current-password"
            type="password"
            placeholder="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            style={inputStyle}
            autoComplete="current-password"
          />
          <div>
            <input
              id="settings-new-password"
              type="password"
              placeholder="New Password (min 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={inputStyle}
              autoComplete="new-password"
            />
            {strength && (
              <div
                style={{
                  marginTop: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
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
                      width:
                        strength.label === "Too short"
                          ? "20%"
                          : strength.label === "Weak"
                          ? "40%"
                          : strength.label === "Fair"
                          ? "65%"
                          : "100%",
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
          <input
            id="settings-confirm-password"
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleChangePassword()}
            style={{
              ...inputStyle,
              borderColor:
                confirmPassword && confirmPassword !== newPassword
                  ? "#C62828"
                  : confirmPassword && confirmPassword === newPassword
                  ? "#2E7D32"
                  : "#ccc",
            }}
            autoComplete="new-password"
          />
          {confirmPassword && confirmPassword !== newPassword && (
            <p style={{ color: "#FF8A65", fontSize: "12px", marginTop: "-12px" }}>
              Passwords do not match
            </p>
          )}

          <button
            id="settings-change-password-btn"
            onClick={handleChangePassword}
            disabled={loading}
            style={{ ...buttonStyle, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Updating…" : "Change Password"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileItem({ label, value }) {
  return (
    <div>
      <p style={{ color: "#B2DFDB", marginBottom: "4px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </p>
      <h3 style={{ fontSize: "16px", fontWeight: "600" }}>{value}</h3>
    </div>
  );
}

const inputStyle = {
  background: "#fff",
  border: "1px solid #ccc",
  padding: "16px",
  borderRadius: "12px",
  color: "#000",
  fontSize: "15px",
  width: "100%",
};

const buttonStyle = {
  background: "#FFFFCC",
  color: "#000",
  border: "none",
  padding: "16px",
  borderRadius: "12px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "15px",
};

export default Settings;
