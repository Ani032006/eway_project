import { useState, useEffect } from "react";
import { getStats } from "../../services/api";

function KPISection() {
  const [stats, setStats] = useState({
    total: 0,
    suspicious: 0,
    clean: 0,
    top_reasons: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getStats();
        setStats(data);
      } catch (err) {
        console.error("Failed to load stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    {
      title: "Total Bills",
      value: stats.total,
      color: "#005F5F",
    },
    {
      title: "Suspicious Bills",
      value: stats.suspicious,
      color: "#C62828",
    },
    {
      title: "Clean Bills",
      value: stats.clean,
      color: "#2E7D32",
    },
    {
      title: "Risk Categories",
      value: stats.top_reasons?.length || 0,
      color: "#EF6C00",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4,1fr)",
        gap: "20px",
        marginBottom: "30px",
      }}
    >
      {cards.map((item) => (
        <div
          key={item.title}
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
            {item.title}
          </p>

          <h1
            style={{
              color: item.color,
              fontSize: "36px",
            }}
          >
            {loading ? "..." : item.value}
          </h1>
        </div>
      ))}
    </div>
  );
}

export default KPISection;
