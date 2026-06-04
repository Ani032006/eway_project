import { useState, useEffect } from "react";
import {
  getPendingRegistrations,
  approveUser,
  getAllOfficers,
  getStats,
} from "../../services/api";

function AdminPanel() {
  const [pending, setPending] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    suspicious: 0,
    clean: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [pendingData, officerData, statsData] =
          await Promise.all([
            getPendingRegistrations(),
            getAllOfficers(),
            getStats(),
          ]);
        setPending(pendingData);
        setOfficers(officerData);
        setStats(statsData);
      } catch (err) {
        console.error("Admin fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleApprove = async (userId) => {
    try {
      await approveUser(userId);
      setPending((prev) =>
        prev.filter((u) => u._id !== userId)
      );
      const updatedOfficers = await getAllOfficers();
      setOfficers(updatedOfficers);
    } catch (err) {
      console.error("Approve error:", err);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2 style={{ color: "#005F5F" }}>Loading admin panel...</h2>
      </div>
    );
  }

  return (
    <div>
      <h1
        style={{
          fontSize: "32px",
          marginBottom: "30px",
        }}
      >
        Admin Dashboard
      </h1>

      {/* KPI CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        <Card
          title="Total Officers"
          value={officers.length}
        />
        <Card
          title="Pending Approvals"
          value={pending.length}
        />
        <Card
          title="Total Bills"
          value={stats.total}
        />
        <Card
          title="Suspicious Bills"
          value={stats.suspicious}
        />
      </div>

      {/* PENDING REGISTRATIONS */}
      <TableContainer title="Pending Registrations">
        {pending.length === 0 ? (
          <p style={{ color: "#E0E0E0", padding: "20px" }}>
            No pending registrations.
          </p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr style={headStyle}>
                <th>Name</th>
                <th>Email</th>
                <th>State</th>
                <th>Registered</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {pending.map((user) => (
                <tr key={user._id} style={rowStyle}>
                  <td style={cellStyle}>
                    {user.name}
                  </td>
                  <td style={cellStyle}>
                    {user.email}
                  </td>
                  <td style={cellStyle}>
                    {user.state || "—"}
                  </td>
                  <td style={cellStyle}>
                    {new Date(
                      user.createdAt
                    ).toLocaleDateString()}
                  </td>
                  <td style={cellStyle}>
                    <button
                      onClick={() =>
                        handleApprove(user._id)
                      }
                      style={approveStyle}
                    >
                      ✅ Approve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableContainer>

      {/* ALL OFFICERS */}
      <TableContainer title="All Officers">
        {officers.length === 0 ? (
          <p style={{ color: "#E0E0E0", padding: "20px" }}>
            No officers registered yet.
          </p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr style={headStyle}>
                <th>Name</th>
                <th>Email</th>
                <th>State</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {officers.map((user) => (
                <tr key={user._id} style={rowStyle}>
                  <td style={cellStyle}>
                    {user.name}
                  </td>
                  <td style={cellStyle}>
                    {user.email}
                  </td>
                  <td style={cellStyle}>
                    {user.state || "—"}
                  </td>
                  <td style={cellStyle}>
                    <span
                      style={{
                        padding: "6px 12px",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: "bold",
                        color: "#fff",
                        background: user.approved
                          ? "#2E7D32"
                          : "#EF6C00",
                      }}
                    >
                      {user.approved
                        ? "Approved"
                        : "Pending"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableContainer>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div
      style={{
        background: "#FFFFCC",
        padding: "25px",
        borderRadius: "20px",
        color: "#000",
      }}
    >
      <p
        style={{
          color: "#333",
          marginBottom: "10px",
        }}
      >
        {title}
      </p>

      <h1 style={{ color: "#005F5F" }}>{value}</h1>
    </div>
  );
}

function TableContainer({ title, children }) {
  return (
    <div
      style={{
        background: "#005F5F",
        padding: "30px",
        borderRadius: "20px",
        marginBottom: "30px",
        color: "#fff",
      }}
    >
      <h2 style={{ marginBottom: "20px" }}>{title}</h2>
      {children}
    </div>
  );
}

const tableStyle = {
  width: "100%",
  borderCollapse: "separate",
  borderSpacing: "0 10px",
};

const headStyle = {
  textAlign: "left",
  color: "#FFFFCC",
};

const rowStyle = {
  background: "#fff",
  color: "#000",
};

const cellStyle = {
  padding: "18px",
};

const approveStyle = {
  background: "#2E7D32",
  border: "none",
  color: "#fff",
  padding: "10px 16px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "bold",
};

export default AdminPanel;