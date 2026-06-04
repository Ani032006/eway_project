import { useLocation } from "react-router-dom";

function Navbar() {
  const location = useLocation();

  const storedUser = JSON.parse(localStorage.getItem("ewb_user") || "{}");
  const isAdmin = storedUser.role === "admin" || new URLSearchParams(location.search).get("role") === "admin";

  let user = { name: "Officer", role: "State Officer", state: "—" };
  try {
    const stored = JSON.parse(localStorage.getItem("ewb_user"));
    if (stored) {
      user = {
        name: stored.name || "Officer",
        role:
          stored.role === "admin"
            ? "System Administrator"
            : "State Officer",
        state: stored.state || "—",
      };
    }
  } catch {
    // use defaults
  }


  return (
    <div
      style={{
        background: "#005F5F",
        padding: "20px 30px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        color: "#fff",
      }}
    >
      {/* LEFT */}

      <div>
        <h2
          style={{
            marginBottom: "6px",
          }}
        >
          {isAdmin
            ? "Admin Dashboard"
            : "Officer Dashboard"}
        </h2>

        <p
          style={{
            color: "#E0E0E0",
          }}
        >
          {isAdmin
            ? "Monitor officers and requests"
            : "Monitor E-Way Movement"}
        </p>
      </div>

      {/* RIGHT */}

      <div
        style={{
          textAlign: "right",
        }}
      >
        <h3>{user.name}</h3>

        <p
          style={{
            color: "#FFFFCC",
          }}
        >
          {user.role} • {user.state}
        </p>
      </div>
    </div>
  );
}

export default Navbar;
