import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBillById, getBillTollRoute } from "../../services/api";

// Helper for decoding Mappls/Google polyline
const decodePolyline = (str, precision = 5) => {
  let index = 0, lat = 0, lng = 0, coordinates = [];
  const factor = Math.pow(10, precision);
  while (index < str.length) {
    let b, shift = 0, result = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;
    shift = 0;
    result = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;
    coordinates.push({ lat: lat / factor, lng: lng / factor });
  }
  return coordinates;
};

// Returns distance in meters
const haversineDist = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) *
    Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
};

function BillDetail() {
  const { id, vehicleId } = useParams();
  const navigate = useNavigate();
  const billId = id || vehicleId;

  const [bill, setBill] = useState(null);
  const [tollRoute, setTollRoute] = useState([]);
  const [bearingAnalysis, setBearingAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tollLoading, setTollLoading] = useState(false);
  const [error, setError] = useState("");
  const [relatedBills, setRelatedBills] = useState([]);
  const [selectedRelatedBills, setSelectedRelatedBills] = useState([]);
  const [roadGeometry, setRoadGeometry] = useState([]);
  const [mapVersion, setMapVersion] = useState(0);
  const [offRouteTollIds, setOffRouteTollIds] = useState(new Set());
  const [tollFrequency, setTollFrequency] = useState([]);
  const [destinationTollIndex, setDestinationTollIndex] = useState(-1);

  useEffect(() => {
    setSelectedRelatedBills([]);
  }, [billId]);

  useEffect(() => {
    setMapVersion((v) => v + 1);
  }, [billId, tollRoute, selectedRelatedBills, roadGeometry]);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setTollLoading(true);
      setError("");
      try {
        const [billData, routeData] = await Promise.all([
          getBillById(billId),
          getBillTollRoute(billId)
        ]);

        setBill(billData);
        setTollRoute(routeData.route || []);
        setRoadGeometry(routeData.roadGeometry || []);
        setBearingAnalysis(routeData.bearingAnalysis || null);
        setRelatedBills(routeData.relatedBills || []);
        setTollFrequency(routeData.tollFrequency || []);
        setDestinationTollIndex(routeData.destinationTollIndex ?? -1);
      } catch (err) {
        console.error("Error fetching E-Way Bill page data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
        setTollLoading(false);
      }
    };

    if (billId) {
      fetchAllData();
    }
  }, [billId]);

  useEffect(() => {
    if (!bill || mapVersion === 0) return;

    let mapInstance = null;
    let isMounted = true;

    const initMap = async () => {
      if (!bill.from_lat || !bill.from_lng || !bill.to_lat || !bill.to_lng) {
        console.warn("Coordinates missing for plotting route.");
        return;
      }

      try {
        // Load Mappls SDK core first
        await loadScript("https://apis.mappls.com/advancedmaps/api/9a61c7e2-4e34-4c3a-b464-e05e7590d49c/map_sdk?v=3.0&layer=vector");
        // Load plugins after core SDK is ready
        await loadScript("https://apis.mappls.com/advancedmaps/api/9a61c7e2-4e34-4c3a-b464-e05e7590d49c/map_sdk_plugins?v=3.0&libraries=direction");

        if (!isMounted) return;

        if (!window.mappls) {
          console.error("Mappls SDK is not available.");
          return;
        }

        const currentId = `mappls-route-map-${mapVersion}`;
        const mapContainer = document.getElementById(currentId);
        if (!mapContainer) return;

        // Initialize Map on versioned container
        mapInstance = new window.mappls.Map(currentId, {
          center: { lat: bill.from_lat, lng: bill.from_lng },
          zoom: 8,
        });

        if (!isMounted) {
          if (mapInstance && typeof mapInstance.remove === "function") {
            mapInstance.remove();
          }
          return;
        }

        mapInstance.addListener("load", () => {
          if (!isMounted) return;

          // 1. Draw optimal and alternate routes (blue/grey)
          if (window.mappls.direction) {
            window.mappls.direction({
              map: mapInstance,
              start: `${bill.from_lat},${bill.from_lng}`,
              end: `${bill.to_lat},${bill.to_lng}`,
              alternatives: true,
              fitbounds: true,
              callback: function (data) {
                if (data && data.routes && Array.isArray(data.routes)) {
                  // Collect all coordinates from all possible routes
                  let allPossibleCoords = [];
                  data.routes.forEach(route => {
                    if (route.geometry) {
                      const decoded = decodePolyline(route.geometry);
                      allPossibleCoords = allPossibleCoords.concat(decoded);
                    }
                  });

                  if (allPossibleCoords.length > 0 && tollRoute.length > 0) {
                    const newOffRouteSet = new Set();
                    tollRoute.forEach(toll => {
                      let minD = Infinity;
                      const tLat = parseFloat(toll.lat);
                      const tLng = parseFloat(toll.lng);
                      if (isNaN(tLat) || isNaN(tLng)) return;

                      for (let i = 0; i < allPossibleCoords.length; i++) {
                        const d = haversineDist(tLat, tLng, allPossibleCoords[i].lat, allPossibleCoords[i].lng);
                        if (d < minD) minD = d;
                      }

                      // Tolerance: 5000 meters (5km)
                      if (minD > 5000) {
                        newOffRouteSet.add(toll._id || toll.toll_name);
                      }
                    });
                    setOffRouteTollIds(newOffRouteSet);
                  }
                }
              }
            });
          }

          // 2. Plot the actual road geometry (Mappls roads connecting tolls)
          if (roadGeometry && roadGeometry.length > 0 && window.mappls.Polyline) {
            new window.mappls.Polyline({
              map: mapInstance,
              path: roadGeometry,
              strokeColor: "#D32F2F", // Red for actual toll road route
              strokeWeight: 6,
              strokeOpacity: 0.9
            });
          }


          // 3. Place custom toll markers
          if (window.mappls.Marker) {
            tollRoute.forEach((toll, idx) => {
              const latVal = parseFloat(toll.lat);
              const lngVal = parseFloat(toll.lng);
              if (!isNaN(latVal) && !isNaN(lngVal) && isMounted) {
                const isSuspicious = offRouteTollIds.has(toll._id || toll.toll_name);
                const isPostDest = toll.isPostDestination;
                const isDestToll = toll.isDestinationToll;

                let markerBg;
                let markerEmoji = "";
                if (isPostDest) {
                  markerBg = "#7B1FA2"; // Purple — post-destination
                  markerEmoji = "";
                } else if (isDestToll) {
                  markerBg = "#2E7D32"; // Green — journey end
                  markerEmoji = "🏁";
                } else if (isSuspicious) {
                  markerBg = "#FF9800"; // Orange — off-route
                  markerEmoji = "";
                } else {
                  markerBg = "#D32F2F"; // Red — normal
                }

                let headerLabel;
                if (isPostDest) {
                  headerLabel = `Toll #${idx + 1} 🚨 POST-DESTINATION`;
                } else if (isDestToll) {
                  headerLabel = `Toll #${idx + 1} 🏁 JOURNEY END`;
                } else if (isSuspicious) {
                  headerLabel = `Toll Crossing #${idx + 1} 🚨 OFF-ROUTE`;
                } else {
                  headerLabel = `Toll Crossing #${idx + 1}`;
                }

                new window.mappls.Marker({
                  map: mapInstance,
                  position: { lat: latVal, lng: lngVal },
                  html: `
                    <div style="
                      background-color: ${markerBg};
                      color: white;
                      width: 28px;
                      height: 28px;
                      border-radius: 50%;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      font-weight: bold;
                      font-size: 11px;
                      border: 2px solid white;
                      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
                      cursor: pointer;
                    ">
                      ${isDestToll ? "🏁" : isPostDest ? "⚠" : idx + 1}
                    </div>
                  `,
                  popupHtml: `
                    <div style="font-family: sans-serif; padding: 10px; color: #000; min-width: 200px;">
                      <h4 style="margin: 0 0 8px 0; color: ${markerBg}; border-bottom: 1px solid #eee; padding-bottom: 5px; font-size: 14px;">${headerLabel}</h4>
                      <strong>Plaza:</strong> ${toll.toll_name}<br/>
                      <strong>Time:</strong> ${new Date(toll.timestamp).toLocaleString("en-IN")}<br/>
                      <strong>Highway:</strong> ${toll.highway_type || "National Highway"}<br/>
                      <strong>Location:</strong> ${latVal.toFixed(4)}, ${lngVal.toFixed(4)}
                    </div>
                  `,
                  popupOptions: {
                    openPopup: false,
                    autoClose: true
                  }
                });
              }
            });
          }

          // 4. Draw optimal routes for selected related bills in different colors
          const colors = ["#4CAF50", "#9C27B0", "#FF9800", "#009688", "#E91E63", "#3F51B5"];
          selectedRelatedBills.forEach((id) => {
            const relBill = relatedBills.find(rb => rb._id === id);
            if (relBill && relBill.from_lat && relBill.from_lng && relBill.to_lat && relBill.to_lng) {
              const idx = relatedBills.findIndex(rb => rb._id === id);
              const color = colors[idx % colors.length];

              const pathCoords = relBill.roadGeometry && relBill.roadGeometry.length > 0
                ? relBill.roadGeometry
                : [
                  { lat: relBill.from_lat, lng: relBill.from_lng },
                  { lat: relBill.to_lat, lng: relBill.to_lng }
                ];

              const PolylineClass = window.mappls.Polyline || window.mappls.polyline;
              if (PolylineClass && isMounted) {
                new PolylineClass({
                  map: mapInstance,
                  path: pathCoords,
                  strokeColor: color,
                  strokeWeight: 6,
                  strokeOpacity: 0.85
                });
              }

              if (window.mappls && window.mappls.Marker && isMounted) {
                new window.mappls.Marker({
                  map: mapInstance,
                  position: { lat: relBill.from_lat, lng: relBill.from_lng },
                  popupHtml: `
                    <div style="font-family: sans-serif; padding: 5px; color: #000;">
                      <h4 style="margin: 0 0 5px 0; color: ${color};">Start of EWB: ${relBill.ewb_no}</h4>
                      <strong>Pin:</strong> ${relBill.from_pin}<br/>
                      <strong>State:</strong> ${relBill.from_state || "—"}
                    </div>
                  `
                });

                new window.mappls.Marker({
                  map: mapInstance,
                  position: { lat: relBill.to_lat, lng: relBill.to_lng },
                  popupHtml: `
                    <div style="font-family: sans-serif; padding: 5px; color: #000;">
                      <h4 style="margin: 0 0 5px 0; color: ${color};">Destination of EWB: ${relBill.ewb_no}</h4>
                      <strong>Pin:</strong> ${relBill.to_pin}<br/>
                      <strong>State:</strong> ${relBill.to_state || "—"}
                    </div>
                  `
                });
              }
            }
          });
        });
      } catch (err) {
        console.error("Failed to initialize Mappls map:", err);
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstance && typeof mapInstance.remove === "function") {
        try {
          mapInstance.remove();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, [bill, tollRoute, selectedRelatedBills, roadGeometry, mapVersion]);

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

  // Format bearing to Quadrant/Reduced bearing (e.g. 300° -> 60° NW)
  const formatQuadrantBearing = (deg) => {
    if (deg === null || deg === undefined) return "—";
    const normalized = ((deg % 360) + 360) % 360;
    if (normalized >= 0 && normalized < 90) {
      return `${normalized.toFixed(1)}° NE`;
    } else if (normalized >= 90 && normalized < 180) {
      return `${(180 - normalized).toFixed(1)}° SE`;
    } else if (normalized >= 180 && normalized < 270) {
      return `${(normalized - 180).toFixed(1)}° SW`;
    } else {
      return `${(360 - normalized).toFixed(1)}° NW`;
    }
  };

  const getBearing = (lat1, lon1, lat2, lon2) => {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const toDeg = (rad) => (rad * 180) / Math.PI;
    const phi1 = toRad(lat1);
    const phi2 = toRad(lat2);
    const dLambda = toRad(lon2 - lon1);
    const x = Math.sin(dLambda) * Math.cos(phi2);
    const y =
      Math.cos(phi1) * Math.sin(phi2) -
      Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
    const theta = Math.atan2(x, y);
    return ((toDeg(theta) % 360) + 360) % 360;
  };

  const getBearingDeviation = (b1, b2) => {
    let diff = Math.abs(b1 - b2) % 360;
    if (diff > 180) diff = 360 - diff;
    return diff;
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

      <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "30px" }}>
        <p style={{ color: "#333", margin: 0 }}>
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
        </p>
        {bill.suspicious && (
          <span
            style={{
              background: "linear-gradient(135deg, #D32F2F, #B71C1C)",
              color: "#fff",
              padding: "6px 16px",
              borderRadius: "20px",
              fontSize: "13px",
              fontWeight: "bold",
              letterSpacing: "0.5px",
              boxShadow: "0 2px 8px rgba(211,47,47,0.3)",
              animation: "pulse 2s ease-in-out infinite",
            }}
          >
            ⚠ SUSPICIOUS — Flagged for Review
          </span>
        )}
      </div>

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
            label="Ideal Bearing (A→B)"
            value={formatQuadrantBearing(bill.ideal_bearing)}
          />
        </div>
      </div>

      {/* ═══ BEARING ANALYSIS (DYNAMIC & MINIMAL) ═══ */}
      <div
        style={{
          background: "#fff",
          color: "#000",
          borderRadius: "20px",
          padding: "30px",
          marginBottom: "30px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
          border: "1px solid #ddd",
        }}
      >
        <h2 style={{ margin: "0 0 15px 0", fontSize: "22px", color: "#005F5F" }}>
          🧭 Bearing Analysis (Overlapping E-Way Bills)
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px" }}>
          <p style={{ margin: 0 }}>
            <strong>This Bill's Destination Direction:</strong> {bill.ideal_bearing != null ? formatQuadrantBearing(bill.ideal_bearing) : "—"}
          </p>

          {selectedRelatedBills.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "10px" }}>
              {selectedRelatedBills.map((id) => {
                const rb = relatedBills.find(r => r._id === id);
                if (!rb || rb.to_lat === null || rb.to_lng === null) return null;

                const bearingToDest = getBearing(bill.from_lat, bill.from_lng, rb.to_lat, rb.to_lng);
                const deviation = getBearingDeviation(bill.ideal_bearing, bearingToDest);
                const isSuspicious = deviation > 30;

                return (
                  <div
                    key={id}
                    style={{
                      background: isSuspicious ? "#FADBD8" : "#D4EFDF",
                      color: isSuspicious ? "#78281F" : "#145A32",
                      borderRadius: "12px",
                      padding: "15px 20px",
                      border: `1px solid ${isSuspicious ? "#E6B0AA" : "#A9DFBF"}`,
                    }}
                  >
                    <p style={{ margin: "0 0 8px 0", fontWeight: "bold", fontSize: "15px" }}>
                      Comparison with EWB {rb.ewb_no}:
                    </p>
                    <p style={{ margin: "4px 0" }}>
                      <strong>Overlapping Destination Direction:</strong> {formatQuadrantBearing(bearingToDest)} (Pincode: {rb.to_pin})
                    </p>
                    <p style={{ margin: "4px 0" }}>
                      <strong>Direction Deviation:</strong> <span style={{ fontWeight: "bold" }}>{deviation.toFixed(1)}°</span> (Threshold: 30°)
                    </p>
                    <p style={{ margin: "10px 0 0 0", fontWeight: "bold", fontSize: "15px" }}>
                      {isSuspicious ? (
                        <span>🚨 FRAUD ALERT: Overlapping EWB {rb.ewb_no} destination is in a conflicting direction (deviates by {deviation.toFixed(1)}°).</span>
                      ) : (
                        <span>✅ Directions are aligned (deviation is within acceptable limit).</span>
                      )}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                marginTop: "10px",
                padding: "20px",
                background: "#f9f9f9",
                borderRadius: "12px",
                border: "1px dashed #ccc",
                color: "#555",
                fontSize: "14px",
              }}
            >
              Please tick one or more E-Way Bills in the checklist below to view their relative bearing angles and direction analysis.
            </div>
          )}
        </div>
      </div>

      {/* SUSPICIOUS REASONS (if any) */}
      {bill.suspicious && bill.suspicious_reasons && bill.suspicious_reasons.length > 0 && (
        <div
          style={{
            background: "linear-gradient(135deg, #4A1010, #6B1A1A)",
            borderRadius: "20px",
            padding: "30px",
            marginBottom: "30px",
            color: "#fff",
            border: "1px solid rgba(255,138,128,0.3)",
          }}
        >
          <h2 style={{ marginBottom: "15px", color: "#FF8A80" }}>
            ⚠ Suspicious Activity Flags
          </h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {bill.suspicious_reasons.map((reason, idx) => (
              <li
                key={idx}
                style={{
                  padding: "12px 18px",
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: "10px",
                  marginBottom: "8px",
                  fontSize: "14px",
                  borderLeft: "3px solid #FF8A80",
                  lineHeight: "1.4",
                }}
              >
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

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

      {/* RELATED E-WAY BILLS (IF ANY) */}
      {relatedBills.length > 0 && (
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
            🔗 Other E-Way Bills for Vehicle {bill.vehicle_number}
          </h2>
          <p style={{ fontSize: "14px", color: "#E0E0E0", marginBottom: "20px" }}>
            This vehicle is associated with multiple E-Way Bills. Toggle the checkboxes below to overlay their route paths on the map in distinct colors:
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
            {relatedBills.map((relBill, idx) => {
              const colors = ["#4CAF50", "#9C27B0", "#FF9800", "#009688", "#E91E63", "#3F51B5"];
              const color = colors[idx % colors.length];
              const isSelected = selectedRelatedBills.includes(relBill._id);

              return (
                <div
                  key={relBill._id}
                  style={{
                    background: "#fff",
                    color: "#000",
                    borderRadius: "15px",
                    padding: "20px",
                    borderLeft: `6px solid ${isSelected ? color : "#ccc"}`,
                    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                      <span style={{ fontSize: "16px", fontWeight: "bold", color: "#005F5F" }}>
                        EWB: {relBill.ewb_no}
                      </span>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          if (isSelected) {
                            setSelectedRelatedBills(prev => prev.filter(id => id !== relBill._id));
                          } else {
                            setSelectedRelatedBills(prev => [...prev, relBill._id]);
                          }
                        }}
                        style={{ width: "20px", height: "20px", cursor: "pointer" }}
                      />
                    </div>

                    <p style={{ margin: "4px 0", fontSize: "13px" }}>
                      <strong>Route:</strong> {relBill.from_pin} → {relBill.to_pin}
                    </p>
                    <p style={{ margin: "4px 0", fontSize: "13px" }}>
                      <strong>Direction:</strong> {relBill.ideal_bearing != null ? formatQuadrantBearing(relBill.ideal_bearing) : "—"}
                    </p>
                    {relBill.suspicious && (
                      <span
                        style={{
                          background: "#C62828",
                          color: "#fff",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "bold",
                          display: "inline-block",
                          marginTop: "8px",
                        }}
                      >
                        ⚠ Suspicious
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => navigate(`/bill/${relBill._id}`)}
                    style={{
                      background: "#005F5F",
                      color: "#fff",
                      border: "none",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "bold",
                      marginTop: "15px",
                      width: "100%",
                      textAlign: "center",
                    }}
                  >
                    View Details →
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ROUTE MAP */}
      <div
        style={{
          background: "#fff",
          borderRadius: "20px",
          padding: "30px",
          color: "#000",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "15px",
            marginBottom: "15px",
          }}
        >
          <h2 style={{ margin: 0, color: "#005F5F" }}>Route Mapping & Toll Verification</h2>

          {/* Legend */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "15px", background: "#f9f9f9", padding: "10px 15px", borderRadius: "10px", border: "1px solid #eee", fontSize: "13px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#D32F2F" }}></div>
              <span><strong>Toll Crossing (Red)</strong></span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#2E7D32" }}></div>
              <span><strong>Journey End / Destination (Green)</strong></span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#7B1FA2" }}></div>
              <span><strong>Post-Destination (Purple ⚠)</strong></span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#FF9800" }}></div>
              <span><strong>Off-Route (Orange 🚨)</strong></span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "2px", background: "#3bb2d0" }}></div>
              <span><strong>Optimal Route (Blue)</strong></span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "2px", background: "#888888" }}></div>
              <span><strong>Other Routes (Grey)</strong></span>
            </div>
            {selectedRelatedBills.map((id) => {
              const relBill = relatedBills.find(rb => rb._id === id);
              if (!relBill) return null;
              const idx = relatedBills.findIndex(rb => rb._id === id);
              const colors = ["#4CAF50", "#9C27B0", "#FF9800", "#009688", "#E91E63", "#3F51B5"];
              const color = colors[idx % colors.length];
              return (
                <div key={id} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "2px", background: color }}></div>
                  <span><strong>EWB {relBill.ewb_no} Route</strong></span>
                </div>
              );
            })}
          </div>
        </div>

        <p style={{ color: "#555", marginBottom: "20px" }}>
          This map visualizes the <strong>toll plaza locations</strong> triggered by this vehicle against the <strong>optimal routes</strong>.
          {tollLoading ? (
            <span style={{ color: "#005F5F", fontWeight: "bold" }}>
              {" "}Loading toll crossing details...
            </span>
          ) : tollRoute.length > 0 ? (
            <>
              <span style={{ color: "#2E7D32", fontWeight: "bold" }}>
                {" "}✓ {tollRoute.length} Toll plaza crossings matched for vehicle {bill.vehicle_number}.
              </span>
              {offRouteTollIds.size > 0 && (
                <span style={{ color: "#E65100", fontWeight: "bold", display: "block", marginTop: "10px", padding: "10px", background: "#FFF3E0", borderRadius: "8px", border: "1px solid #FFCC80" }}>
                  🚨 Warning: {offRouteTollIds.size} toll(s) have been flagged as suspicious because they do not lie on any of the possible route paths.
                </span>
              )}
            </>
          ) : (
            <span style={{ color: "#C62828" }}>
              {" "}✗ No Toll plaza crossings matched for vehicle {bill.vehicle_number} in the active window.
            </span>
          )}
        </p>

        {bill.from_lat && bill.from_lng && bill.to_lat && bill.to_lng ? (
          <div
            key={`mappls-route-map-${mapVersion}`}
            id={`mappls-route-map-${mapVersion}`}
            style={{
              width: "100%",
              height: "550px",
              borderRadius: "15px",
              border: "1px solid #ddd",
              background: "#eaeaea",
            }}
          />
        ) : (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              background: "#f9f9f9",
              borderRadius: "15px",
              color: "#999",
              border: "1px dashed #ccc",
            }}
          >
            No geographic coordinates available for pincodes {bill.from_pin} to {bill.to_pin} to plot the route.
          </div>
        )}

        {/* Toll Frequency Summary */}
        {!tollLoading && tollFrequency.length > 0 && (
          <div style={{ marginTop: "25px", marginBottom: "10px" }}>
            <h3 style={{ color: "#005F5F", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              📊 Toll Crossing Frequency
              <span style={{ fontSize: "13px", fontWeight: "normal", color: "#555" }}>— How many times the vehicle passed each plaza</span>
            </h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                <thead>
                  <tr style={{ background: "#005F5F", color: "#fff" }}>
                    <th style={{ padding: "10px 14px", textAlign: "left", borderRadius: "8px 0 0 0" }}>Toll Plaza</th>
                    <th style={{ padding: "10px 14px", textAlign: "center" }}>Times Triggered</th>
                    <th style={{ padding: "10px 14px", textAlign: "left" }}>First Seen</th>
                    <th style={{ padding: "10px 14px", textAlign: "left", borderRadius: "0 8px 0 0" }}>Last Seen</th>
                    <th style={{ padding: "10px 14px", textAlign: "center" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tollFrequency.map((tf, i) => {
                    const isDuplicate = tf.count > 1;
                    const rowBg = isDuplicate ? "#FFF3E0" : (i % 2 === 0 ? "#f5f7f8" : "#fff");
                    return (
                      <tr key={i} style={{ background: rowBg, borderBottom: "1px solid #e8e8e8" }}>
                        <td style={{ padding: "10px 14px", fontWeight: "600", color: isDuplicate ? "#E65100" : "#111" }}>
                          {tf.toll_name}
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "center" }}>
                          <span style={{
                            display: "inline-block",
                            background: isDuplicate ? (tf.count > 2 ? "#C62828" : "#FF9800") : "#2E7D32",
                            color: "#fff",
                            borderRadius: "20px",
                            padding: "3px 12px",
                            fontWeight: "bold",
                            fontSize: "13px",
                            minWidth: "36px",
                          }}>
                            {tf.count}×
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px", color: "#555", fontSize: "12px" }}>
                          {new Date(tf.firstSeen).toLocaleString("en-IN")}
                        </td>
                        <td style={{ padding: "10px 14px", color: "#555", fontSize: "12px" }}>
                          {tf.count > 1 ? new Date(tf.lastSeen).toLocaleString("en-IN") : "—"}
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "center" }}>
                          {isDuplicate ? (
                            <span style={{ color: "#E65100", fontWeight: "bold", fontSize: "12px" }}>
                              ⚠ {tf.count > 2 ? "HIGH FREQ" : "Duplicate"}
                            </span>
                          ) : (
                            <span style={{ color: "#2E7D32", fontSize: "12px" }}>✓ Normal</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Toll details list if any */}
        {!tollLoading && tollRoute.length > 0 && (
          <div style={{ marginTop: "25px" }}>
            <h3 style={{ color: "#005F5F", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              🗓 Chronological Toll Crossings
              {destinationTollIndex >= 0 && (
                <span style={{ fontSize: "13px", fontWeight: "normal", color: "#555" }}>
                  — Toll #{destinationTollIndex + 1} is closest to destination
                </span>
              )}
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "15px" }}>
              {tollRoute.map((t, idx) => {
                const isSuspicious = offRouteTollIds.has(t._id || t.toll_name);
                const isPostDest = t.isPostDestination;
                const isDestToll = t.isDestinationToll;

                let cardBg, cardBorder, cardHeaderColor, badgeText, badgeBg;
                if (isPostDest) {
                  cardBg = "#F3E5F5";
                  cardBorder = "2px solid #7B1FA2";
                  cardHeaderColor = "#4A148C";
                  badgeText = "⚠ POST-DESTINATION";
                  badgeBg = "#7B1FA2";
                } else if (isDestToll) {
                  cardBg = "#E8F5E9";
                  cardBorder = "2px solid #2E7D32";
                  cardHeaderColor = "#1B5E20";
                  badgeText = "🏁 JOURNEY END";
                  badgeBg = "#2E7D32";
                } else if (isSuspicious) {
                  cardBg = "#FFF3E0";
                  cardBorder = "2px solid #FF9800";
                  cardHeaderColor = "#E65100";
                  badgeText = "🚨 OFF-ROUTE";
                  badgeBg = "#FF9800";
                } else {
                  cardBg = "#f5f7f8";
                  cardBorder = "1px solid #e1e4e6";
                  cardHeaderColor = "#005F5F";
                  badgeText = null;
                  badgeBg = null;
                }

                return (
                  <div key={idx} style={{ padding: "15px", background: cardBg, borderRadius: "12px", border: cardBorder, fontSize: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <div style={{ color: cardHeaderColor, fontWeight: "bold" }}>#{idx + 1} {t.toll_name}</div>
                      {badgeText && (
                        <span style={{ background: badgeBg, color: "#fff", borderRadius: "6px", padding: "2px 8px", fontSize: "11px", fontWeight: "bold", whiteSpace: "nowrap", marginLeft: "8px" }}>
                          {badgeText}
                        </span>
                      )}
                    </div>
                    <div style={{ color: "#333", fontSize: "12px", marginBottom: "4px" }}><strong>Time:</strong> {new Date(t.timestamp).toLocaleString("en-IN")}</div>
                    <div style={{ color: "#666", fontSize: "12px", marginBottom: "4px" }}><strong>Highway:</strong> {t.highway_type || "National Highway"}</div>
                    {isPostDest && (
                      <div style={{ marginTop: "8px", padding: "6px 10px", background: "rgba(123,31,162,0.1)", borderRadius: "6px", fontSize: "12px", color: "#4A148C", fontStyle: "italic" }}>
                        ⚠ This toll was triggered after the vehicle reached its declared destination. Possible diversion or return journey.
                      </div>
                    )}
                    {isDestToll && (
                      <div style={{ marginTop: "8px", padding: "6px 10px", background: "rgba(46,125,50,0.1)", borderRadius: "6px", fontSize: "12px", color: "#1B5E20", fontStyle: "italic" }}>
                        🏁 Closest toll to the declared destination — journey considered complete here.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
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
