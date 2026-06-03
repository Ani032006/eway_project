function KPISection() {
  const cards = [
    "Suspicious Vehicles",
    "High Risk Buyers",
    "High Risk Sellers",
    "Risk Alerts",
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(4,1fr)",
        gap: "20px",
        marginBottom: "30px",
      }}
    >
      {cards.map((item) => (
        <div
          key={item}
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
            }}
          >
            {item}
          </p>

          <h1>1243</h1>

          <p style={{ color: "#005F5F" }}>
            +12% this week
          </p>
        </div>
      ))}
    </div>
  );
}

export default KPISection;
