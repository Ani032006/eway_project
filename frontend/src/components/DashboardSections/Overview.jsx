import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllBills, getStats, getStates, getDistricts } from "../../services/api";

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

function Overview() {
  const navigate = useNavigate();

  const [bills, setBills] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    suspicious: 0,
    clean: 0,
    top_reasons: [],
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterSuspicious, setFilterSuspicious] = useState("");
  const [filterReason, setFilterReason] = useState("");
  const [searchVehicle, setSearchVehicle] = useState("");
  const [searchEwb, setSearchEwb] = useState("");

  const [jurisdiction, setJurisdiction] = useState("National"); // "National", "State", "District"
  const [statesList, setStatesList] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [districtsList, setDistrictsList] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState("");

  const fetchBills = async (pg = page) => {
    setLoading(true);
    try {
      const params = { page: pg, limit: 20 };
      if (filterSuspicious !== "") {
        params.suspicious = filterSuspicious;
      }
      if (filterReason !== "") {
        params.reason = filterReason;
      }
      if (jurisdiction === "State" && selectedState) {
        params.state = selectedState;
      } else if (jurisdiction === "District" && selectedState && selectedDistrict) {
        params.state = selectedState;
        params.district = selectedDistrict;
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
      console.error("Failed to fetch bills:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = {};
      if (jurisdiction === "State" && selectedState) {
        params.state = selectedState;
      } else if (jurisdiction === "District" && selectedState && selectedDistrict) {
        params.state = selectedState;
        params.district = selectedDistrict;
      }
      const data = await getStats(params);
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  useEffect(() => {
    fetchBills(page);
  }, [page, filterSuspicious, filterReason, searchVehicle, searchEwb, jurisdiction, selectedState, selectedDistrict]);

  useEffect(() => {
    fetchStats();
  }, [jurisdiction, selectedState, selectedDistrict]);

  useEffect(() => {
    const loadStates = async () => {
      try {
        const list = await getStates();
        setStatesList(list);
      } catch (err) {
        console.error("Failed to load states:", err);
      }
    };
    loadStates();
  }, []);

  useEffect(() => {
    const loadDistricts = async () => {
      if (!selectedState) {
        setDistrictsList([]);
        setSelectedDistrict("");
        return;
      }
      try {
        const list = await getDistricts(selectedState);
        setDistrictsList(list);
        setSelectedDistrict("");
      } catch (err) {
        console.error("Failed to load districts:", err);
      }
    };
    loadDistricts();
  }, [selectedState]);

  const filteredBills = bills;

  return (
    <div>
      {/* HEADER */}
      <div style={{ marginBottom: "30px" }}>
        <h1 style={{ fontSize: "32px", marginBottom: "10px" }}>
          Officer Dashboard
        </h1>
        <p style={{ color: "#333" }}>
          Real-time E-Way Bill monitoring and verification dashboard
        </p>
      </div>

      {/* JURISDICTION SELECTOR */}
      <div
        style={{
          background: "#005F5F",
          padding: "25px",
          borderRadius: "20px",
          marginBottom: "30px",
          color: "#fff",
        }}
      >
        <h2 style={{ marginBottom: "15px", display: "flex", alignItems: "center", gap: "10px", fontSize: "20px" }}>
          🌐 Select Jurisdiction
        </h2>
        
        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "center" }}>
          {/* Level Dropdown */}
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ fontSize: "12px", color: "#FFFFCC" }}>Level</label>
            <select
              value={jurisdiction}
              onChange={(e) => {
                setJurisdiction(e.target.value);
                setPage(1);
                if (e.target.value === "National") {
                  setSelectedState("");
                  setSelectedDistrict("");
                }
              }}
              style={{ ...inputStyle, width: "200px" }}
            >
              <option value="National">National (All India)</option>
              <option value="State">State Level</option>
              <option value="District">District Level</option>
            </select>
          </div>

          {/* State Selector */}
          {(jurisdiction === "State" || jurisdiction === "District") && (
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontSize: "12px", color: "#FFFFCC" }}>State</label>
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setPage(1);
                }}
                style={{ ...inputStyle, width: "220px" }}
              >
                <option value="">-- Choose State --</option>
                {statesList.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* District Selector */}
          {jurisdiction === "District" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontSize: "12px", color: "#FFFFCC" }}>District</label>
              <select
                value={selectedDistrict}
                onChange={(e) => {
                  setSelectedDistrict(e.target.value);
                  setPage(1);
                }}
                disabled={!selectedState}
                style={{
                  ...inputStyle,
                  width: "250px",
                  opacity: selectedState ? 1 : 0.6,
                  cursor: selectedState ? "pointer" : "not-allowed"
                }}
              >
                <option value="">-- Choose District --</option>
                {districtsList.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reset button */}
          <div style={{ display: "flex", alignSelf: "flex-end", height: "48px", alignItems: "center" }}>
            <button
              onClick={() => {
                setJurisdiction("National");
                setSelectedState("");
                setSelectedDistrict("");
                setFilterSuspicious("");
                setSearchVehicle("");
                setPage(1);
              }}
              style={resetStyle}
            >
              Reset to National
            </button>
          </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        <KPICard
          title="Total Bills"
          value={stats.total}
          color="#005F5F"
        />
        <KPICard
          title="Suspicious Bills"
          value={stats.suspicious}
          color="#C62828"
        />
        <KPICard
          title="Clean Bills"
          value={stats.clean}
          color="#2E7D32"
        />
        <KPICard
          title="Top Reason"
          value={stats.top_reasons?.length > 0 ? stats.top_reasons[0].reason : "None"}
          color="#E65100"
          small
        />
      </div>

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
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          <input
            placeholder="Search Vehicle Number"
            value={searchVehicle}
            onChange={(e) => {
              setSearchVehicle(e.target.value);
              setPage(1);
            }}
            style={inputStyle}
          />

          <input
            placeholder="Search E-Way Bill No"
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
            <option value="">All Statuses</option>
            <option value="true">Suspicious Only</option>
            <option value="false">Clean Only</option>
          </select>

          <select
            value={filterReason}
            onChange={(e) => {
              setFilterReason(e.target.value);
              setPage(1);
            }}
            style={inputStyle}
            disabled={filterSuspicious === "false"}
          >
            <option value="">All Suspicious Types</option>
            <option value="No toll data available for this trip">No Toll Data</option>
            <option value="Toll triggered significantly outside of the expected path">Out of Path</option>
            <option value="Vehicle passed through the same toll plaza multiple times during this trip">Duplicate Tolls</option>
            <option value="Overlapping">Overlapping Bills</option>
          </select>

          <button
            onClick={() => {
              setFilterSuspicious("");
              setFilterReason("");
              setSearchVehicle("");
              setSearchEwb("");
              setPage(1);
            }}
            style={resetStyle}
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* E-WAY BILL TABLE */}
      <div
        style={{
          background: "#005F5F",
          padding: "30px",
          borderRadius: "20px",
          color: "#fff",
        }}
      >
        <h2 style={{ marginBottom: "20px" }}>
          E-Way Bill Records
          <span
            style={{
              fontSize: "14px",
              fontWeight: "normal",
              marginLeft: "12px",
              color: "#E0E0E0",
            }}
          >
            Page {page} of {totalPages}
          </span>
        </h2>

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
            No bills found.
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
                  <th>EWB No</th>
                  <th>Vehicle</th>
                  <th>From Pin</th>
                  <th>To Pin</th>
                  <th>Distance (km)</th>
                  <th>Bearing</th>
                  <th>Assessed Value (₹)</th>
                  <th>Total Vehicle GST (₹)</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredBills.map((bill) => (
                  <tr
                    key={bill._id}
                    onClick={() =>
                      navigate(`/bill/${bill._id}`)
                    }
                    style={{
                      background: "#fff",
                      color: "#000",
                      cursor: "pointer",
                      transition: "transform 0.1s",
                    }}
                  >
                    <td style={cellStyle}>
                      {bill.ewb_no}
                    </td>
                    <td style={cellStyle}>
                      {bill.vehicle_number || "—"}
                    </td>
                    <td style={cellStyle}>
                      {bill.from_pin}
                    </td>
                    <td style={cellStyle}>
                      {bill.to_pin}
                    </td>
                    <td style={cellStyle}>
                      {bill.travel_distance ?? "—"}
                    </td>
                    <td style={cellStyle}>
                      {bill.ideal_bearing != null
                        ? `${bill.ideal_bearing.toFixed(1)}°`
                        : "—"}
                      {bill.bearing_deviation != null && (
                        <span style={{
                          marginLeft: "6px",
                          fontSize: "11px",
                          color: bill.bearing_deviation > 30 ? "#C62828" : "#2E7D32",
                          fontWeight: "bold"
                        }}>
                          (Δ{bill.bearing_deviation.toFixed(1)}°)
                        </span>
                      )}
                    </td>
                    <td style={cellStyle}>
                      {bill.ewb_ass_amt
                        ? `₹${bill.ewb_ass_amt.toLocaleString()}`
                        : "—"}
                    </td>
                    <td style={cellStyle}>
                      {bill.total_vehicle_gst != null
                        ? `₹${bill.total_vehicle_gst.toLocaleString()}`
                        : "—"}
                    </td>
                    <td style={cellStyle}>
                      <span
                        style={{
                          padding: "6px 14px",
                          borderRadius: "10px",
                          fontSize: "13px",
                          fontWeight: "bold",
                          background: bill.suspicious ? "#C62828" : "#2E7D32",
                          color: "#fff",
                        }}
                      >
                        {bill.suspicious ? "⚠ Suspicious" : "✓ Clean"}
                      </span>
                    </td>
                  </tr>
                ))}
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
              <span
                style={{
                  padding: "10px 20px",
                  color: "#FFFFCC",
                }}
              >
                {page} / {totalPages}
              </span>
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

function KPICard({ title, value, color, small }) {
  return (
    <div
      style={{
        background: "#FFFFCC",
        padding: "30px",
        borderRadius: "20px",
        color: "#000",
      }}
    >
      <p
        style={{
          color: "#333",
          marginBottom: "15px",
          fontSize: "14px",
        }}
      >
        {title}
      </p>
      <h1 style={{ color, fontSize: small ? "18px" : "36px" }}>{value}</h1>
    </div>
  );
}

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

export default Overview;
