function ChartSection() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(2,1fr)",
        gap: "20px",
      }}
    >
      <div
        style={{
          background: "#102A43",
          borderRadius: "20px",
          height: "300px",
          padding: "20px",
        }}
      >
        Chart 1
      </div>

      <div
        style={{
          background: "#102A43",
          borderRadius: "20px",
          height: "300px",
          padding: "20px",
        }}
      >
        Chart 2
      </div>
    </div>
  );
}

export default ChartSection;