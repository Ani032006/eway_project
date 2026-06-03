import { useParams } from "react-router-dom";

function VehicleMovement() {
  const { vehicleId } = useParams();

  const movementData = [
    {
      timestamp: "09:45 AM",
      location: "Gurgaon",
      toll: "NH48 Toll Plaza",
      event: "Entry",
    },
    {
      timestamp: "11:15 AM",
      location: "Jaipur",
      toll: "Jaipur Toll",
      event: "Transit",
    },
    {
      timestamp: "01:10 PM",
      location: "Delhi Border",
      toll: "Delhi Toll",
      event: "Exit",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
        padding: "40px",
        color: "#111",
      }}
    >
      {/* PAGE TITLE */}

      <h1
        style={{
          fontSize: "34px",
          marginBottom: "10px",
          color: "#005F5F",
        }}
      >
        Vehicle Movement Details
      </h1>

      <p
        style={{
          color: "#333",
          marginBottom: "30px",
        }}
      >
        Vehicle Number:
        <span
          style={{
            color: "#005F5F",
            marginLeft: "10px",
          }}
        >
          {vehicleId}
        </span>
      </p>

      {/* VEHICLE DETAILS */}

      <div
        style={{
          background: "#005F5F",
          borderRadius: "20px",
          padding: "30px",
          marginBottom: "30px",
          color: "#fff",
        }}
      >
        <h2
          style={{
            marginBottom: "20px",
          }}
        >
          Vehicle Information
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2,1fr)",
            gap: "20px",
          }}
        >
          <p>
            Seller GSTIN:
            <strong>
              {" "}
              GST998877
            </strong>
          </p>

          <p>
            Buyer GSTIN:
            <strong>
              {" "}
              GST445566
            </strong>
          </p>

          <p>
            Jurisdiction State:
            <strong>
              {" "}
              Haryana
            </strong>
          </p>

          <p>
            Date:
            <strong>
              {" "}
              2026-06-01
            </strong>
          </p>
        </div>
      </div>

      {/* MOVEMENT TIMELINE */}

      <div
        style={{
          background: "#005F5F",
          borderRadius: "20px",
          padding: "30px",
          color: "#fff",
        }}
      >
        <h2
          style={{
            marginBottom: "20px",
          }}
        >
          Movement Timeline
        </h2>

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
                color: "#FFFFCC",
              }}
            >
              <th>Timestamp</th>
              <th>Location</th>
              <th>Toll Plaza</th>
              <th>Event Type</th>
            </tr>
          </thead>

          <tbody>
            {movementData.map(
              (item, index) => (
                <tr
                  key={index}
                  style={{
                    background:
                      "#fff",
                    color: "#000",
                  }}
                >
                  <td style={cellStyle}>
                    {
                      item.timestamp
                    }
                  </td>

                  <td style={cellStyle}>
                    {
                      item.location
                    }
                  </td>

                  <td style={cellStyle}>
                    {item.toll}
                  </td>

                  <td style={cellStyle}>
                    {
                      item.event
                    }
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

const cellStyle = {
  padding: "18px",
};

export default VehicleMovement;
