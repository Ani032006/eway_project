import { useNavigate } from "react-router-dom";

function Overview() {
  const navigate = useNavigate();

  const mockData = [
    {
      vehicle: "HR26AB1200",
      seller: "GST998877",
      buyer: "GST445566",
      place: "Gurgaon",
      date: "2026-06-01",
    },
    {
      vehicle: "HR29ZX9011",
      seller: "GST443322",
      buyer: "GST778899",
      place: "Faridabad",
      date: "2026-06-02",
    },
    {
      vehicle: "HR12XY4567",
      seller: "GST123456",
      buyer: "GST888999",
      place: "Panipat",
      date: "2026-06-03",
    },
  ];

  return (
    <div>
      {/* HEADER */}

      <div
        style={{
          marginBottom: "30px",
        }}
      >
        <h1
          style={{
            fontSize: "32px",
            marginBottom: "10px",
          }}
        >
          Officer Dashboard
        </h1>

        <p
          style={{
            color: "#333",
          }}
        >
          Jurisdiction State:
          <span
            style={{
              color: "#005F5F",
              marginLeft: "8px",
            }}
          >
            Haryana
          </span>
        </p>
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
        <h2
          style={{
            marginBottom: "20px",
          }}
        >
          Filters
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          <input
            placeholder="District / Place"
            style={inputStyle}
          />

          <input
            placeholder="Vehicle Number"
            style={inputStyle}
          />

          <input
            placeholder="Seller GSTIN"
            style={inputStyle}
          />

          <input
            placeholder="Buyer GSTIN"
            style={inputStyle}
          />

          <input
            type="date"
            style={inputStyle}
          />

          <input
            type="date"
            style={inputStyle}
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: "20px",
          }}
        >
          <button style={buttonStyle}>
            Apply Filters
          </button>

          <button style={resetStyle}>
            Reset
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
        <h2
          style={{
            marginBottom: "20px",
          }}
        >
          E-Way Bill Records
        </h2>

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
              <th>Vehicle No</th>
              <th>Seller GSTIN</th>
              <th>Buyer GSTIN</th>
              <th>Place</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>
            {mockData.map((row, index) => (
              <tr
                key={index}
                onClick={() =>
                  navigate(`/vehicle/${row.vehicle}`)
                }
                style={{
                  background: "#fff",
                  color: "#000",
                  cursor: "pointer",
                }}
              >
                <td style={cellStyle}>
                  {row.vehicle}
                </td>

                <td style={cellStyle}>
                  {row.seller}
                </td>

                <td style={cellStyle}>
                  {row.buyer}
                </td>

                <td style={cellStyle}>
                  {row.place}
                </td>

                <td style={cellStyle}>
                  {row.date}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

const buttonStyle = {
  background: "#FFFFCC",
  color: "#000",
  border: "none",
  padding: "14px 20px",
  borderRadius: "12px",
  cursor: "pointer",
  fontWeight: "bold",
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

export default Overview;
