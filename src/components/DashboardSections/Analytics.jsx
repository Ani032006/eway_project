function Analytics() {
  const mockData = [
    {
      vehicle: "DL8CAF1234",
      seller: "GST123456",
      buyer: "GST887766",
      risk: "91%",
      status: "High Risk",
    },
    {
      vehicle: "HR26AA9088",
      seller: "GST443322",
      buyer: "GST229900",
      risk: "15%",
      status: "Safe",
    },
    {
      vehicle: "UP14DD1200",
      seller: "GST999888",
      buyer: "GST555444",
      risk: "76%",
      status: "Suspicious",
    },
  ];

  return (
    <div>
      <h1
        style={{
          marginBottom: "25px",
          fontSize: "30px",
        }}
      >
        Vehicle Analytics
      </h1>

      {/* FILTER PANEL */}

      <div
        style={{
          background: "#102A43",
          padding: "30px",
          borderRadius: "20px",
          marginBottom: "30px",
        }}
      >
        <h2 style={{ marginBottom: "20px" }}>
          Filters
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4,1fr)",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
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
            placeholder="Risk Level"
            style={inputStyle}
          />

          <input
            placeholder="Region"
            style={inputStyle}
          />

          <input
            placeholder="Vehicle Type"
            style={inputStyle}
          />

          <input
            placeholder="Date From"
            style={inputStyle}
          />

          <input
            placeholder="Date To"
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

      {/* TABLE */}

      <div
        style={{
          background: "#102A43",
          padding: "30px",
          borderRadius: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            marginBottom: "20px",
          }}
        >
          <h2>Vehicle Records</h2>

          <input
            placeholder="Search vehicle..."
            style={{
              ...inputStyle,
              width: "250px",
            }}
          />
        </div>

        <table
          style={{
            width: "100%",
            borderCollapse:
              "separate",
            borderSpacing:
              "0 10px",
          }}
        >
          <thead>
            <tr
              style={{
                textAlign: "left",
                color: "#B0BEC5",
              }}
            >
              <th>Vehicle</th>
              <th>Seller</th>
              <th>Buyer</th>
              <th>Risk</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {mockData.map(
              (row, index) => (
                <tr
                  key={index}
                  style={{
                    background:
                      "#163B5C",
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
                    {row.risk}
                  </td>

                  <td style={cellStyle}>
                    <span
                      style={{
                        padding:
                          "8px 14px",
                        borderRadius:
                          "10px",
                        background:
                          row.status ===
                          "High Risk"
                            ? "#dd3442"
                            : row.status ===
                              "Suspicious"
                            ? "#EF6C00"
                            : "#2E7D32",
                      }}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const inputStyle = {
  background: "#163B5C",
  border: "none",
  padding: "16px",
  borderRadius: "12px",
  color: "white",
};

const buttonStyle = {
  background: "#00D4FF",
  border: "none",
  padding: "14px 20px",
  borderRadius: "12px",
  cursor: "pointer",
};

const resetStyle = {
  background: "#37474F",
  border: "none",
  padding: "14px 20px",
  borderRadius: "12px",
  color: "white",
  cursor: "pointer",
};

const cellStyle = {
  padding: "18px",
};

export default Analytics;