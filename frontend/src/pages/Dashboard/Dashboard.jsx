import { useState } from "react";
import { useLocation } from "react-router-dom";

import Sidebar from "../../components/Sidebar/Sidebar";
import Navbar from "../../components/Navbar/Navbar";

import Overview from "../../components/DashboardSections/Overview";
import AdminPanel from "../../components/DashboardSections/AdminPanel";
import Settings from "../../components/DashboardSections/Settings";

function Dashboard() {
  const [activeSection, setActiveSection] = useState("overview");
  const location = useLocation();

  const storedUser = JSON.parse(localStorage.getItem("ewb_user") || "{}");
  const isAdmin = storedUser.role === "admin" || new URLSearchParams(location.search).get("role") === "admin";

  const renderSection = () => {
    switch (activeSection) {
      case "admin":
        return isAdmin ? <AdminPanel /> : <Overview />;
      case "settings":
        return <Settings />;
      default:
        return <Overview />;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
      }}
    >
      <Sidebar
        setActiveSection={setActiveSection}
        activeSection={activeSection}
      />

      <div style={{ flex: 1 }}>
        <Navbar />

        <main
          style={{
            padding: "20px",
          }}
        >
          {renderSection()}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;

