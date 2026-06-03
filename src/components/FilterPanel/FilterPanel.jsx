function FilterPanel() {
  const inputStyle = {
    background: "#fff",
    border: "1px solid #ccc",
    padding: "16px",
    borderRadius: "12px",
    color: "#000",
  };

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
      <h2 style={{ marginBottom: "20px" }}>
        Filters
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4,1fr)",
          gap: "20px",
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
          placeholder="Date From"
          style={inputStyle}
        />
        <input
          placeholder="Date To"
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
      </div>
    </div>
  );
}

export default FilterPanel;
