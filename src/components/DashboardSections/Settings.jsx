import { useLocation } from "react-router-dom";
function Settings() {
  const location = useLocation();

  const isAdmin =
    new URLSearchParams(
      location.search
    ).get("role") === "admin";

  return (
    <div>
      <h1
        style={{
          fontSize: "32px",
          marginBottom: "30px",
        }}
      >
        Settings
      </h1>

      {/* PROFILE */}

      <div
        style={{
          background: "#005F5F",
          padding: "30px",
          borderRadius: "20px",
          marginBottom: "30px",
          color: "#fff",
        }}
      >
        <h2
          style={{
            marginBottom: "20px",
          }}
        >
          {isAdmin ? "Admin Profile" : "Officer Profile"}
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2,1fr)",
            gap: "20px",
          }}
        >
          <ProfileItem
            label="Officer Name"
            value={isAdmin ? "Admin" : "Rahul Sharma"}
          />

          <ProfileItem
            label="Role"
            value={isAdmin ? "System Administrator" : "State Officer"}
          />

          <ProfileItem
            label="Jurisdiction"
            value={isAdmin ? "All States" : "Haryana"}
          />

          <ProfileItem
            label="Department"
            value={isAdmin ? "System Administration" : "GST Intelligence"}
          />

          <ProfileItem
            label="Email"
            value={isAdmin ? "admin@gst.gov" : "rahul@gst.gov"}
          />
        </div>
      </div>

      {/* PASSWORD */}

      <div
        style={{
          background: "#005F5F",
          padding: "30px",
          borderRadius: "20px",
          color: "#fff",
        }}
      >
        <h2
          style={{
            marginBottom: "20px",
          }}
        >
          Password Management
        </h2>

        <div
          style={{
            display: "grid",
            gap: "20px",
            maxWidth: "500px",
          }}
        >
          <input
            type="password"
            placeholder="Current Password"
            style={inputStyle}
          />

          <input
            type="password"
            placeholder="New Password"
            style={inputStyle}
          />

          <input
            type="password"
            placeholder="Confirm Password"
            style={inputStyle}
          />

          <button
            style={buttonStyle}
          >
            Request Password Change
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileItem({
  label,
  value,
}) {
  return (
    <div>
      <p
        style={{
          color: "#E0E0E0",
          marginBottom: "6px",
        }}
      >
        {label}
      </p>

      <h3>{value}</h3>
    </div>
  );
}

const inputStyle = {
  background: "#fff",
  border: "1px solid #ccc",
  padding: "16px",
  borderRadius: "12px",
  color: "#000",
};

const buttonStyle = {
  background: "#FFFFCC",
  color: "#000",
  border: "none",
  padding: "16px",
  borderRadius: "12px",
  cursor: "pointer",
  fontWeight: "bold",
};

export default Settings;
