function Sidebar({ setActiveSection }) {
  const menuItems = [
    {
      label: "Dashboard",
      value: "overview",
    },
    {
      label: "Settings",
      value: "settings",
    },
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
        justifyContent:
          "space-between",
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
            gap: "16px",
          }}
        >
          {menuItems.map(
            (item) => (
              <button
                key={item.value}
                onClick={() =>
                  setActiveSection(
                    item.value
                  )
                }
                style={{
                  background:
                    "#005F5F",
                  border: "none",
                  color:
                    "white",
                  padding:
                    "16px",
                  borderRadius:
                    "12px",
                  textAlign:
                    "left",
                  cursor:
                    "pointer",
                  fontSize:
                    "16px",
                }}
              >
                {item.label}
              </button>
            )
          )}
        </div>
      </div>

      {/* BOTTOM SECTION */}

      <button
        style={{
          background: "#C62828",
          border: "none",
          color: "white",
          padding: "16px",
          borderRadius: "12px",
          cursor: "pointer",
          fontSize: "16px",
        }}
      >
        Logout
      </button>
    </div>
  );
}

export default Sidebar;
