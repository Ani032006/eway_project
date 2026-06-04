import { useNavigate, useLocation } from "react-router-dom";

function Sidebar({ setActiveSection, activeSection }) {
  const navigate = useNavigate();
  const location = useLocation();

  const storedUser = JSON.parse(localStorage.getItem("ewb_user") || "{}");
  const isAdmin = storedUser.role === "admin" || new URLSearchParams(location.search).get("role") === "admin";

  const menuItems = [
    { label: "Dashboard", value: "overview", icon: "📊" },
    ...(isAdmin
      ? [{ label: "Admin Panel", value: "admin", icon: "🛡️" }]
      : []),
    { label: "Settings", value: "settings", icon: "⚙️" },
  ];

  return (
    <div
      style={{
        width: "260px",
        background: "#004848",
        color: "white",
        padding: "30px 20px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* TOP SECTION */}

      <div>
        <h2
          style={{
            marginBottom: "40px",
            fontSize: "24px",
          }}
        >
          E-Way Intelligence
        </h2>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {menuItems.map((item) => (
            <button
              key={item.value}
              onClick={() => setActiveSection(item.value)}
              style={{
                background:
                  activeSection === item.value
                    ? "#007A7A"
                    : "#005F5F",
                border: "none",
                color: "white",
                padding: "16px",
                borderRadius: "12px",
                textAlign: "left",
                cursor: "pointer",
                fontSize: "16px",
                transition: "background 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* BOTTOM SECTION */}

      <div
        style={{
          background: "#005F5F",
          padding: "16px",
          borderRadius: "12px",
          textAlign: "center",
          fontSize: "14px",
          fontWeight: "bold",
          color: "#FFFFCC",
          border: "1px solid #007A7A"
        }}
      >
        🟢 System Online
      </div>
    </div>
  );
}

export default Sidebar;

