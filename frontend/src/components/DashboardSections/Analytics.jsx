import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllBills, getStats } from "../../services/api";

function Analytics() {
  const navigate = useNavigate();

  const [bills, setBills] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    suspicious: 0,
    clean: 0,
    top_reasons: [],
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterSuspicious, setFilterSuspicious] = useState("");
  const [searchVehicle, setSearchVehicle] = useState("");
  const [searchEwb, setSearchEwb] = useState("");

  const fetchBills = async (pg = page) => {
    setLoading(true);
    try {
      const params = { page: pg, limit: 20 };
      if (filterSuspicious !== "") {
        params.suspicious = filterSuspicious;
      }
      if (searchVehicle) {
        params.vehicle = searchVehicle;
      }
      if (searchEwb) {
        params.ewb = searchEwb;
      }
      const data = await getAllBills(params);
      setBills(data.data || []);
      setTotalPages(data.pages || 1);
    } catch (err) {
      console.error("Failed to fetch:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills(page);
  }, [page, filterSuspicious, searchVehicle, searchEwb]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getStats();
        setStats(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  const filteredBills = bills;

  const getRiskLevel = (bill) => {
    if (!bill.suspicious) return { label: "Safe", pct: "0%", color: "#2E7D32" };
    const reasons = bill.suspicious_reasons?.length || 0;
    if (reasons >= 3)
      return { label: "High Risk", pct: `${Math.min(95, 70 + reasons * 8)}%`, color: "#C62828" };
    if (reasons >= 2)
      return { label: "Suspicious", pct: `${50 + reasons * 13}%`, color: "#EF6C00" };
    return { label: "Warning", pct: `${30 + reasons * 15}%`, color: "#F9A825" };
  };

  return (
    <div>
      <h1 style={{ marginBottom: "25px", fontSize: "30px" }}>
        Vehicle Analytics
      </h1>

      {/* TOP REASONS */}
      {stats.top_reasons?.length > 0 && (
        <div
          style={{
            background: "#005F5F",
            padding: "30px",
            borderRadius: "20px",
            marginBottom: "30px",
            color: "#fff",
          }}
        >
          <h2 style={{ marginBottom: "20px" }}>
            Top Suspicious Reasons
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2,1fr)",
              gap: "14px",
            }}
          >
            {stats.top_reasons.map((r, i) => (
              <div
                key={i}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  padding: "16px 20px",
                  borderRadius: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{r.reason}</span>
                <span
                  style={{
                    background: "#FFFFCC",
                    color: "#000",
                    padding: "4px 12px",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    fontSize: "14px",
                  }}
                >
                  {r.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FILTER PANEL */}
      <div
        style={{
          background: "#005F5F",
          padding: "30px",
          borderRadius: "20px",
          marginBottom: "30px",
          color: "#fff",
        }}
      >
        <h2 style={{ marginBottom: "20px" }}>Filters</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          <input
            placeholder="Vehicle Number"
            value={searchVehicle}
            onChange={(e) => {
              setSearchVehicle(e.target.value);
              setPage(1);
            }}
            style={inputStyle}
          />

          <input
            placeholder="E-Way Bill No"
            value={searchEwb}
            onChange={(e) => {
              setSearchEwb(e.target.value);
              setPage(1);
            }}
            style={inputStyle}
          />

          <select
            value={filterSuspicious}
            onChange={(e) => {
              setFilterSuspicious(e.target.value);
              setPage(1);
            }}
            style={inputStyle}
          >
            <option value="">All Records</option>
            <option value="true">Suspicious Only</option>
            <option value="false">Clean Only</option>
          </select>

          <button
            onClick={() => {
              setFilterSuspicious("");
              setSearchVehicle("");
              setSearchEwb("");
              setPage(1);
            }}
            style={resetStyle}
          >
            Reset
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div
        style={{
          background: "#005F5F",
          padding: "30px",
          borderRadius: "20px",
          color: "#fff",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <h2>Vehicle Records</h2>
          <span style={{ color: "#E0E0E0" }}>
            Page {page} / {totalPages}
          </span>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", padding: "40px" }}>
            Loading...
          </p>
        ) : filteredBills.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              padding: "40px",
              color: "#E0E0E0",
            }}
          >
            No records found.
          </p>
        ) : (
          <>
            <table
              style={{
                width: "100%",
                borderCollapse: "separate",
                borderSpacing: "0 10px",
              }}
            >
              <thead>
                <tr
                  style={{
                    textAlign: "left",
                    color: "#FFFFCC",
                  }}
                >
                  <th>Vehicle</th>
                  <th>EWB No</th>
                  <th>Total Vehicle GST (₹)</th>
                  <th>Risk</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredBills.map((bill) => {
                  const risk = getRiskLevel(bill);
                  return (
                    <tr
                      key={bill._id}
                      onClick={() =>
                        navigate(`/bill/${bill._id}`)
                      }
                      style={{
                        background: "#fff",
                        color: "#000",
                        cursor: "pointer",
                      }}
                    >
                      <td style={cellStyle}>
                        {bill.vehicle_number || "—"}
                      </td>
                      <td style={cellStyle}>
                        {bill.ewb_no}
                      </td>
                      <td style={cellStyle}>
                        {bill.total_vehicle_gst != null
                          ? `₹${bill.total_vehicle_gst.toLocaleString()}`
                          : "—"}
                      </td>
                      <td style={cellStyle}>
                        {risk.pct}
                      </td>
                      <td style={cellStyle}>
                        <span
                          style={{
                            padding: "8px 14px",
                            borderRadius: "10px",
                            color: "#fff",
                            fontWeight: "bold",
                            fontSize: "13px",
                            background: risk.color,
                          }}
                        >
                          {risk.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* PAGINATION */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "10px",
                marginTop: "20px",
              }}
            >
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                style={{
                  ...paginationBtn,
                  opacity: page <= 1 ? 0.4 : 1,
                }}
              >
                ← Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                style={{
                  ...paginationBtn,
                  opacity:
                    page >= totalPages ? 0.4 : 1,
                }}
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
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

const resetStyle = {
  background: "#E0E0E0",
  border: "none",
  color: "#000",
  padding: "14px 20px",
  borderRadius: "12px",
  cursor: "pointer",
};

const cellStyle = {
  padding: "18px",
};

const paginationBtn = {
  background: "#007A7A",
  border: "none",
  color: "#fff",
  padding: "10px 20px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "bold",
};

export default Analytics;