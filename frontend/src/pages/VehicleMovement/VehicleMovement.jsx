import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBillById } from "../../services/api";

function BillDetail() {
  const { id, vehicleId } = useParams();
  const navigate = useNavigate();
  const billId = id || vehicleId;

  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBill = async () => {
      try {
        const data = await getBillById(billId);
        setBill(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (billId) fetchBill();
  }, [billId]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#f5f5f5",
        }}
      >
        <h2 style={{ color: "#005F5F" }}>Loading bill details...</h2>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "#f5f5f5",
          gap: "20px",
        }}
      >
        <h2 style={{ color: "#C62828" }}>
          {error || "Bill not found"}
        </h2>
        <button
          onClick={() => navigate("/dashboard")}
          style={backBtnStyle}
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  const formatDate = (dt) => {
    if (!dt) return "—";
    return new Date(dt).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
        padding: "40px",
        color: "#111",
      }}
    >
      {/* BACK BUTTON */}
      <button
        onClick={() => navigate("/dashboard")}
        style={{
          ...backBtnStyle,
          marginBottom: "20px",
        }}
      >
        ← Back to Dashboard
      </button>

      {/* PAGE TITLE */}
      <h1
        style={{
          fontSize: "34px",
          marginBottom: "10px",
          color: "#005F5F",
        }}
      >
        E-Way Bill Details
      </h1>

      <p style={{ color: "#333", marginBottom: "30px" }}>
        EWB No:
        <span
          style={{
            color: "#005F5F",
            marginLeft: "10px",
            fontWeight: "bold",
            fontSize: "18px",
          }}
        >
          {bill.ewb_no}
        </span>

        {bill.suspicious && (
          <span
            style={{
              background: "#C62828",
              color: "#fff",
              padding: "4px 12px",
              borderRadius: "8px",
              marginLeft: "14px",
              fontSize: "13px",
              fontWeight: "bold",
            }}
          >
            ⚠ SUSPICIOUS
          </span>
        )}
      </p>

      {/* BILL INFORMATION */}
      <div
        style={{
          background: "#005F5F",
          borderRadius: "20px",
          padding: "30px",
          marginBottom: "30px",
          color: "#fff",
        }}
      >
        <h2 style={{ marginBottom: "20px" }}>
          Bill Information
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: "20px",
          }}
        >
          <InfoItem label="EWB Number" value={bill.ewb_no} />
          <InfoItem
            label="Vehicle Number"
            value={bill.vehicle_number || "—"}
          />
          <InfoItem
            label="EWB Date"
            value={formatDate(bill.ewb_dt)}
          />
          <InfoItem
            label="Valid Until"
            value={formatDate(bill.ewb_final_valid_dt)}
          />
          <InfoItem
            label="From Pincode"
            value={bill.from_pin}
          />
          <InfoItem
            label="To Pincode"
            value={bill.to_pin}
          />
        </div>
      </div>

      {/* DISTANCE & GEOGRAPHY */}
      <div
        style={{
          background: "#005F5F",
          borderRadius: "20px",
          padding: "30px",
          marginBottom: "30px",
          color: "#fff",
        }}
      >
        <h2 style={{ marginBottom: "20px" }}>
          Distance & Geography
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: "20px",
          }}
        >
          <InfoItem
            label="Declared Distance"
            value={
              bill.travel_distance
                ? `${bill.travel_distance} km`
                : "—"
            }
          />
          <InfoItem
            label="Actual Distance (Haversine)"
            value={
              bill.actual_distance
                ? `${bill.actual_distance.toFixed(1)} km`
                : "—"
            }
          />
          <InfoItem
            label="Distance Ratio"
            value={
              bill.distance_ratio
                ? `${bill.distance_ratio.toFixed(2)}x`
                : "—"
            }
            highlight={
              bill.distance_ratio && bill.distance_ratio > 1.5
            }
          />
          <InfoItem
            label="From Coordinates"
            value={
              bill.from_lat && bill.from_lng
                ? `${bill.from_lat.toFixed(4)}, ${bill.from_lng.toFixed(4)}`
                : "—"
            }
          />
          <InfoItem
            label="To Coordinates"
            value={
              bill.to_lat && bill.to_lng
                ? `${bill.to_lat.toFixed(4)}, ${bill.to_lng.toFixed(4)}`
                : "—"
            }
          />
          <InfoItem
            label="Bearing"
            value={
              bill.ideal_bearing
                ? `${bill.ideal_bearing.toFixed(1)}°`
                : "—"
            }
          />
        </div>
      </div>

      {/* TAX INFORMATION */}
      <div
        style={{
          background: "#005F5F",
          borderRadius: "20px",
          padding: "30px",
          marginBottom: "30px",
          color: "#fff",
        }}
      >
        <h2 style={{ marginBottom: "20px" }}>
          Tax Information
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: "20px",
          }}
        >
          <InfoItem
            label="Assessable Amount"
            value={
              bill.ewb_ass_amt
                ? `₹${bill.ewb_ass_amt.toLocaleString()}`
                : "—"
            }
          />
          <InfoItem
            label="CGST"
            value={
              bill.cgst_amt
                ? `₹${bill.cgst_amt.toLocaleString()}`
                : "₹0"
            }
          />
          <InfoItem
            label="SGST"
            value={
              bill.sgst_amt
                ? `₹${bill.sgst_amt.toLocaleString()}`
                : "₹0"
            }
          />
          <InfoItem
            label="IGST"
            value={
              bill.igst_amt
                ? `₹${bill.igst_amt.toLocaleString()}`
                : "₹0"
            }
          />
        </div>
      </div>

      {/* SUSPICIOUS REASONS */}
      {bill.suspicious &&
        bill.suspicious_reasons?.length > 0 && (
          <div
            style={{
              background: "#C62828",
              borderRadius: "20px",
              padding: "30px",
              color: "#fff",
            }}
          >
            <h2 style={{ marginBottom: "20px" }}>
              ⚠ Suspicious Reasons
            </h2>

            <ul
              style={{
                listStyle: "none",
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {bill.suspicious_reasons.map(
                (reason, i) => (
                  <li
                    key={i}
                    style={{
                      background: "rgba(255,255,255,0.15)",
                      padding: "16px 20px",
                      borderRadius: "12px",
                      fontSize: "15px",
                    }}
                  >
                    ❗ {reason}
                  </li>
                )
              )}
            </ul>
          </div>
        )}
    </div>
  );
}

function InfoItem({ label, value, highlight }) {
  return (
    <div>
      <p
        style={{
          color: "#E0E0E0",
          marginBottom: "6px",
          fontSize: "13px",
        }}
      >
        {label}
      </p>
      <h3
        style={{
          color: highlight ? "#FF8A80" : "#fff",
          fontWeight: highlight ? "bold" : "normal",
          fontSize: "18px",
        }}
      >
        {value}
      </h3>
    </div>
  );
}

const backBtnStyle = {
  background: "#005F5F",
  color: "#fff",
  border: "none",
  padding: "12px 24px",
  borderRadius: "12px",
  cursor: "pointer",
  fontSize: "15px",
};

export default BillDetail;
