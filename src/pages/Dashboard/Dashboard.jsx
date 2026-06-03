import { useState } from "react";

import Sidebar from "../../components/Sidebar/Sidebar";
import Navbar from "../../components/Navbar/Navbar";

import Overview from "../../components/DashboardSections/Overview";
import Settings from "../../components/DashboardSections/Settings";

function Dashboard() {
  const [activeSection,
    setActiveSection] =
    useState("overview");

  const renderSection = () => {
    switch (
      activeSection
    ) {
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
        setActiveSection={
          setActiveSection
        }
      />

      <div
        style={{
          flex: 1,
        }}
      >
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
