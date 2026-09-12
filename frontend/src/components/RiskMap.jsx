import { useEffect, useState } from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  LayersControl,
  ZoomControl,
} from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

// =====================================================
// RISK COLORS
// =====================================================

const RISK_COLORS = {
  CRITICAL: "#B83A3A",
  HIGH: "#E07A32",
  MODERATE: "#D6A84F",
  LOW: "#5C8D45",
};

// =====================================================
// MARKER ICON
// =====================================================

const createRiskIcon = (color) =>
  L.divIcon({
    className: "",
    html: `<div style="width:18px;height:18px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 0 14px ${color};"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

const criticalIcon = createRiskIcon(RISK_COLORS.CRITICAL);
const highIcon = createRiskIcon(RISK_COLORS.HIGH);
const moderateIcon = createRiskIcon(RISK_COLORS.MODERATE);
const lowIcon = createRiskIcon(RISK_COLORS.LOW);

// =====================================================
// RISK HELPERS
// =====================================================

const getRiskLevel = (riskLevel, score) => {
  const level = String(riskLevel || "").toUpperCase();

  if (level === "CRITICAL") return "CRITICAL";
  if (level === "HIGH") return "HIGH";

  if (level === "MODERATE" || level === "MEDIUM") {
    return "MODERATE";
  }

  if (level === "LOW") return "LOW";

  const numericScore = Number(score) || 0;

  if (numericScore >= 75) return "CRITICAL";
  if (numericScore >= 50) return "HIGH";
  if (numericScore >= 25) return "MODERATE";

  return "LOW";
};

const getRiskColor = (level) => {
  return RISK_COLORS[level] || RISK_COLORS.LOW;
};

const getRadius = (level) => {
  if (level === "CRITICAL") return 18000;
  if (level === "HIGH") return 15000;
  if (level === "MODERATE") return 13500;

  return 12000;
};

const getStatus = (level) => {
  if (level === "CRITICAL" || level === "HIGH") {
    return "ACTIVE";
  }

  return "MONITORING";
};

const getAction = (level) => {
  if (level === "CRITICAL") {
    return "Immediate attention required";
  }

  if (level === "HIGH") {
    return "Enhanced monitoring required";
  }

  if (level === "MODERATE") {
    return "Regular monitoring required";
  }

  return "Routine monitoring";
};

const getMessage = (level) => {
  if (level === "CRITICAL") {
    return "AI analysis indicates severe landslide conditions. Maintain continuous monitoring and prepare emergency response.";
  }

  if (level === "HIGH") {
    return "Environmental conditions show elevated landslide susceptibility. Continue close monitoring of this zone.";
  }

  if (level === "MODERATE") {
    return "Environmental conditions indicate moderate landslide susceptibility. Continue regular monitoring.";
  }

  return "Current environmental conditions remain relatively stable. Continue regular monitoring.";
};

const getIcon = (level) => {
  if (level === "CRITICAL") return criticalIcon;
  if (level === "HIGH") return highIcon;
  if (level === "MODERATE") return moderateIcon;

  return lowIcon;
};

// =====================================================
// RISK MAP
// =====================================================

function RiskMap({ selectedZone, onZoneSelect }) {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ===================================================
  // LOAD REAL RISK ZONES FROM BACKEND
  // ===================================================

  useEffect(() => {
    let isMounted = true;

    const loadRiskZones = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/risk-zones");

        if (!response.ok) {
          throw new Error(`Backend returned ${response.status}`);
        }

        const result = await response.json();

        const backendZones = Array.isArray(result)
          ? result
          : Array.isArray(result.data)
          ? result.data
          : [];

        const formattedZones = backendZones
          .map((zone) => {
            const riskLevel = getRiskLevel(
              zone.risk_level,
              zone.risk_score
            );

            const latitude = Number(zone.latitude);
            const longitude = Number(zone.longitude);

            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
              return null;
            }

            return {
              id: String(zone.id),
              name: zone.name || `Zone ${zone.id}`,
              level: riskLevel,
              score: Number(zone.risk_score) || 0,
              rainfall: Number(zone.rainfall) || 0,
              soilMoisture: Number(zone.soil_moisture) || 0,
              position: [latitude, longitude],
              color: getRiskColor(riskLevel),
              radius: getRadius(riskLevel),
              status: getStatus(riskLevel),
              action: getAction(riskLevel),
              message: getMessage(riskLevel),
            };
          })
          .filter(Boolean);

        if (isMounted) {
          setZones(formattedZones);
        }
      } catch (err) {
        console.error("Failed to load risk zones:", err);

        if (isMounted) {
          setError(
            "Unable to load risk zones. Please make sure the backend is running."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadRiskZones();

    return () => {
      isMounted = false;
    };
  }, []);

  // ===================================================
  // MAP CENTER
  // ===================================================

  const defaultCenter = [16.5062, 80.648];

  const mapCenter =
    zones.length > 0 ? zones[0].position : defaultCenter;

  // ===================================================
  // SELECTED ZONE
  // ===================================================

  const selectedZoneData = zones.find(
    (zone) => String(zone.id) === String(selectedZone)
  );

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <section
      style={{
        width: "100%",
        padding: "30px",
        boxSizing: "border-box",
        background: "#101712",
        borderRadius: "20px",
        color: "white",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: "28px",
              fontWeight: "800",
            }}
          >
            Landslide Risk Map
          </h2>

          <p
            style={{
              marginTop: "8px",
              marginBottom: 0,
              color: "#AEB9A5",
              fontSize: "14px",
            }}
          >
            AI-powered risk zones from the LANDGUARD backend
          </p>
        </div>

        <div
          style={{
            padding: "8px 14px",
            borderRadius: "20px",
            background: "#1B261D",
            color: "#B8C3A0",
            fontSize: "12px",
            fontWeight: "700",
          }}
        >
          {loading
            ? "LOADING..."
            : `${zones.length} RISK ZONE${zones.length === 1 ? "" : "S"}`}
        </div>
      </div>

      {/* MAP CONTAINER */}

      <div
        style={{
          position: "relative",
          width: "100%",
          height: "620px",
          borderRadius: "18px",
          overflow: "hidden",
          border: "1px solid #304033",
        }}
      >
        <MapContainer
          center={mapCenter}
          zoom={8}
          zoomControl={false}
          style={{
            width: "100%",
            height: "100%",
          }}
        >
          {/* MAP LAYERS */}

          <LayersControl position="topright">
            <LayersControl.BaseLayer
              checked
              name="Standard"
            >
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>

            <LayersControl.BaseLayer name="Satellite">
              <TileLayer
                attribution="Tiles &copy; Esri"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
            </LayersControl.BaseLayer>

            <LayersControl.BaseLayer name="Terrain">
              <TileLayer
                attribution="&copy; OpenTopoMap contributors"
                url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          <ZoomControl position="bottomright" />

          {/* RISK ZONES */}

          {zones.map((zone) => (
            <div key={zone.id}>
              <Circle
                center={zone.position}
                radius={zone.radius}
                pathOptions={{
                  color: zone.color,
                  fillColor: zone.color,
                  fillOpacity: 0.18,
                  weight: 2,
                }}
              />

              <Marker
                position={zone.position}
                icon={getIcon(zone.level)}
                eventHandlers={{
                  click: () => {
                    if (onZoneSelect) {
                      onZoneSelect(zone.id);
                    }
                  },
                }}
              >
                <Popup>
                  <div
                    style={{
                      minWidth: "220px",
                      color: "#182018",
                    }}
                  >
                    <h3
                      style={{
                        marginTop: 0,
                        marginBottom: "8px",
                      }}
                    >
                      {zone.name}
                    </h3>

                    <p>
                      <strong>Risk:</strong>{" "}
                      {zone.level}
                    </p>

                    <p>
                      <strong>Risk Score:</strong>{" "}
                      {zone.score}
                    </p>

                    <p>
                      <strong>Rainfall:</strong>{" "}
                      {zone.rainfall} mm
                    </p>

                    <p>
                      <strong>Soil Moisture:</strong>{" "}
                      {zone.soilMoisture}%
                    </p>

                    <p>
                      <strong>Status:</strong>{" "}
                      {zone.status}
                    </p>
                  </div>
                </Popup>
              </Marker>
            </div>
          ))}
        </MapContainer>

        {/* LOADING MESSAGE */}

        {loading && (
          <div
            style={{
              position: "absolute",
              top: "20px",
              left: "20px",
              zIndex: 1000,
              padding: "12px 16px",
              borderRadius: "10px",
              background: "rgba(16,23,18,0.92)",
              color: "#DCE6D2",
              fontSize: "13px",
              fontWeight: "700",
            }}
          >
            Loading risk zones...
          </div>
        )}

        {/* ERROR MESSAGE */}

        {!loading && error && (
          <div
            style={{
              position: "absolute",
              top: "20px",
              left: "20px",
              right: "20px",
              zIndex: 1000,
              padding: "14px 18px",
              borderRadius: "10px",
              background: "rgba(70,30,30,0.95)",
              color: "#FFD7D7",
              fontSize: "13px",
              fontWeight: "700",
            }}
          >
            {error}
          </div>
        )}

        {/* EMPTY STATE */}

        {!loading && !error && zones.length === 0 && (
          <div
            style={{
              position: "absolute",
              top: "20px",
              left: "20px",
              right: "20px",
              zIndex: 1000,
              padding: "14px 18px",
              borderRadius: "10px",
              background: "rgba(16,23,18,0.92)",
              color: "#DCE6D2",
              fontSize: "13px",
              fontWeight: "700",
            }}
          >
            No risk zones are available in the database.
          </div>
        )}
      </div>

      {/* INTELLIGENCE PANEL */}

      <div
        style={{
          marginTop: "20px",
          padding: "20px",
          borderRadius: "16px",
          background: "#172019",
          border: "1px solid #304033",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "15px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                color: "#B8C3A0",
                fontSize: "11px",
                fontWeight: "800",
                letterSpacing: "1px",
                marginBottom: "7px",
              }}
            >
              AI RISK INTELLIGENCE
            </div>

            <div
              style={{
                fontSize: "20px",
                fontWeight: "800",
              }}
            >
              {selectedZoneData
                ? selectedZoneData.name
                : "Select a risk zone"}
            </div>
          </div>

          {selectedZoneData && (
            <div
              style={{
                padding: "8px 14px",
                borderRadius: "20px",
                background: selectedZoneData.color,
                color: "white",
                fontSize: "12px",
                fontWeight: "900",
              }}
            >
              {selectedZoneData.level}
            </div>
          )}
        </div>

        {selectedZoneData ? (
          <div style={{ marginTop: "18px" }}>
            <p
              style={{
                color: "#C6D0C0",
                lineHeight: "1.6",
                marginTop: 0,
              }}
            >
              {selectedZoneData.message}
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "12px",
                marginTop: "16px",
              }}
            >
              <div
                style={{
                  padding: "14px",
                  background: "#101712",
                  borderRadius: "10px",
                }}
              >
                <div
                  style={{
                    color: "#8F9B8B",
                    fontSize: "11px",
                  }}
                >
                  RISK SCORE
                </div>

                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: "800",
                    marginTop: "5px",
                  }}
                >
                  {selectedZoneData.score}
                </div>
              </div>

              <div
                style={{
                  padding: "14px",
                  background: "#101712",
                  borderRadius: "10px",
                }}
              >
                <div
                  style={{
                    color: "#8F9B8B",
                    fontSize: "11px",
                  }}
                >
                  RAINFALL
                </div>

                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: "800",
                    marginTop: "5px",
                  }}
                >
                  {selectedZoneData.rainfall} mm
                </div>
              </div>

              <div
                style={{
                  padding: "14px",
                  background: "#101712",
                  borderRadius: "10px",
                }}
              >
                <div
                  style={{
                    color: "#8F9B8B",
                    fontSize: "11px",
                  }}
                >
                  SOIL MOISTURE
                </div>

                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: "800",
                    marginTop: "5px",
                  }}
                >
                  {selectedZoneData.soilMoisture}%
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: "16px",
                padding: "12px 14px",
                borderLeft: `4px solid ${selectedZoneData.color}`,
                background: "#101712",
                color: "#D5DED0",
                fontSize: "13px",
                fontWeight: "700",
              }}
            >
              Recommended action:{" "}
              {selectedZoneData.action}
            </div>
          </div>
        ) : (
          <p
            style={{
              color: "#8F9B8B",
              marginBottom: 0,
              lineHeight: "1.6",
            }}
          >
            Click a zone on the map to view its AI risk
            assessment and recommended action.
          </p>
        )}
      </div>

      {/* LEGEND */}

      <div
        style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
          marginTop: "18px",
          padding: "14px 4px",
        }}
      >
        {Object.entries(RISK_COLORS).map(
          ([label, color]) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
              }}
            >
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: color,
                  boxShadow: `0 0 7px ${color}`,
                }}
              />

              <span
                style={{
                  color: "#B8C3A0",
                  fontSize: "10px",
                  fontWeight: "800",
                }}
              >
                {label}
              </span>
            </div>
          )
        )}
      </div>
    </section>
  );
}

export default RiskMap;