import { useState, useEffect } from "react";
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
import { getRiskCurrent } from "../lib/api";

function RiskMap() {
  const [selectedZone, setSelectedZone] = useState(null);
  const [zones, setZones] = useState([
    {
      id: "EKH_08421",
      name: "Zone EKH_08421",
      level: "CRITICAL",
      score: 82,
      rainfall: "210 mm",
      soilMoisture: "84%",
      coordinates: [25.50, 91.89],
      color: "#e74c3c",
      radius: 900,
    },

    {
      id: "EKH_06120",
      name: "Zone EKH_06120",
      level: "HIGH",
      score: 68,
      rainfall: "175 mm",
      soilMoisture: "74%",
      coordinates: [25.42, 91.82],
      color: "#e67e22",
      radius: 900,
    },

    {
      id: "EKH_03410",
      name: "Zone EKH_03410",
      level: "LOW",
      score: 22,
      rainfall: "80 mm",
      soilMoisture: "38%",
      coordinates: [25.57, 91.95],
      color: "#839958",
      radius: 900,
    },
  ]);

  useEffect(() => {
    getRiskCurrent("HIGH,VERY_HIGH")
      .then((res) => {
        if (res && res.features && res.features.length > 0) {
          const mapped = res.features.slice(0, 35).map((f, i) => {
            const props = f.properties || {};
            const coords = f.geometry?.coordinates?.[0] || [[91.89, 25.50]];
            const avgLon = coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
            const avgLat = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;
            const cat = props.risk_category || "HIGH";
            const color = cat === "VERY_HIGH" ? "#e74c3c" : "#e67e22";

            return {
              id: props.zone_id || `Z-${i}`,
              name: `Zone ${props.zone_id || i}`,
              level: cat === "VERY_HIGH" ? "CRITICAL" : "HIGH",
              score: Math.round(props.risk_score || 75),
              rainfall: "Heavy",
              soilMoisture: "Elevated",
              coordinates: [avgLat, avgLon],
              color: color,
              radius: 950,
            };
          });
          if (mapped.length > 0) {
            setZones(mapped);
          }
        }
      })
      .catch((err) => console.warn("Live risk zones fetch failed, keeping baseline:", err));
  }, []);

  // ===================================================
  // SELECT ZONE
  // ===================================================

  const handleZoneSelect = (zone) => {
    if (!onZoneSelect) {
      return;
    }

    if (selectedZone?.id === zone.id) {
      return;
    }

    onZoneSelect(zone);
  };

  // ===================================================
  // MARKER ICON
  // ===================================================

  const getMarkerIcon = (level) => {
    if (level === "CRITICAL") {
      return criticalIcon;
    }

    if (level === "HIGH") {
      return highIcon;
    }

    return lowIcon;
  };

  // ===================================================
  // GO TO AI PREDICTION
  // ===================================================

  const goToPrediction = () => {
    const predictionSection =
      document.getElementById("risk-prediction");

    if (predictionSection) {
      predictionSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <section
      id="risk-map"
      style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "20px 40px 60px",
        scrollMarginTop: "95px",
      }}
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <div style={{ marginBottom: "25px" }}>
        <p
          style={{
            color: "#839958",
            fontSize: "13px",
            fontWeight: "900",
            letterSpacing: "2px",
            margin: "0 0 7px",
          }}
        >
          LIVE GIS RISK MONITORING
        </p>

        <h2
          style={{
            color: "#F7F4D5",
            fontSize: "30px",
            margin: 0,
            fontWeight: "800",
          }}
        >
          Risk Map
        </h2>

        <p
          style={{
            color: "#B8C3A0",
            fontSize: "15px",
            marginTop: "7px",
          }}
        >
          Explore monitored zones and their current
          landslide risk levels.
        </p>
      </div>

      {/* =================================================
          MAP
      ================================================= */}

      <div
        style={{
          position: "relative",
          borderRadius: "22px",
          overflow: "hidden",
          border:
            "1px solid rgba(131,153,88,0.25)",
          boxShadow:
            "0 12px 35px rgba(0,0,0,0.25)",
        }}
      >
        <MapContainer
          center={[25.50, 91.89]}
          zoom={10}
          zoomControl={false}
          style={{
            height: "550px",
            width: "100%",
          }}
        >
          <ZoomControl position="topright" />

          {/* =================================================
              MAP LAYERS
          ================================================= */}

          <LayersControl position="topright">
            <LayersControl.BaseLayer
              checked
              name="Standard"
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
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
                attribution="OpenTopoMap"
                url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          {/* =================================================
              ZONES
          ================================================= */}

          {zones.map((zone) => {
            const isSelected =
              selectedZone?.id === zone.id;

            return (
              <div key={zone.id}>
                <Circle
                  center={zone.coordinates}
                  radius={zone.radius}
                  pathOptions={{
                    color: zone.color,
                    fillColor: zone.color,
                    fillOpacity: isSelected
                      ? 0.30
                      : 0.15,
                    weight: isSelected ? 4 : 2,
                  }}
                  eventHandlers={{
                    click: () => {
                      handleZoneSelect(zone);
                    },
                  }}
                />

                <Marker
                  position={zone.coordinates}
                  icon={getMarkerIcon(zone.level)}
                  eventHandlers={{
                    click: () => {
                      handleZoneSelect(zone);
                    },
                  }}
                >
                  <Popup>
                    <div
                      style={{
                        minWidth: "210px",
                        fontFamily:
                          "Arial, sans-serif",
                      }}
                    >
                      <h3
                        style={{
                          margin: "0 0 10px",
                          fontSize: "18px",
                        }}
                      >
                        {zone.name}
                      </h3>

                      <p style={{ margin: "5px 0" }}>
                        <strong>Zone ID:</strong>{" "}
                        {zone.id}
                      </p>

                      <p style={{ margin: "5px 0" }}>
                        <strong>Risk Level:</strong>{" "}
                        {zone.level}
                      </p>

                      <p style={{ margin: "5px 0" }}>
                        <strong>AI Risk Score:</strong>{" "}
                        {zone.score}/100
                      </p>

                      <p style={{ margin: "5px 0" }}>
                        <strong>Rainfall:</strong>{" "}
                        {zone.rainfall}
                      </p>

                      <p style={{ margin: "5px 0" }}>
                        <strong>Soil Moisture:</strong>{" "}
                        {zone.soilMoisture}
                      </p>

                      <p style={{ margin: "5px 0" }}>
                        <strong>Status:</strong>{" "}
                        {zone.status}
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          handleZoneSelect(zone)
                        }
                        style={{
                          width: "100%",
                          marginTop: "10px",
                          padding: "9px",
                          border: "none",
                          borderRadius: "7px",
                          background: "#0A3323",
                          color: "#F7F4D5",
                          cursor: "pointer",
                          fontWeight: "700",
                        }}
                      >
                        Analyze This Zone
                      </button>
                    </div>
                  </Popup>
                </Marker>
              </div>
            );
          })}
        </MapContainer>

        {/* =================================================
            ZONE INTELLIGENCE PANEL
        ================================================= */}

        {selectedZone ? (
          <div
            style={{
              position: "absolute",
              left: "20px",
              bottom: "20px",
              zIndex: 1000,
              width: "310px",
              padding: "20px",
              borderRadius: "18px",
              background:
                "rgba(10,51,35,0.95)",
              border:
                `1px solid ${selectedZone.color}`,
              boxShadow:
                "0 12px 35px rgba(0,0,0,0.40)",
              backdropFilter: "blur(8px)",
            }}
          >
            {/* Panel heading */}

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <span
                style={{
                  color: "#839958",
                  fontSize: "10px",
                  fontWeight: "900",
                  letterSpacing: "1.5px",
                }}
              >
                ZONE INTELLIGENCE
              </span>

              <span
                style={{
                  width: "9px",
                  height: "9px",
                  borderRadius: "50%",
                  background:
                    selectedZone.color,
                  boxShadow:
                    `0 0 10px ${selectedZone.color}`,
                }}
              />
            </div>

            {/* Zone */}

            <div
              style={{
                color: "#F7F4D5",
                fontSize: "20px",
                fontWeight: "800",
              }}
            >
              {selectedZone.name}
            </div>

            {/* Zone ID */}

            <div
              style={{
                color: "#B8C3A0",
                fontSize: "11px",
                marginTop: "3px",
                letterSpacing: "0.5px",
              }}
            >
              {selectedZone.id}
            </div>

            {/* Risk */}

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                marginTop: "15px",
                padding:
                  "6px 10px",
                borderRadius: "20px",
                background:
                  "rgba(255,255,255,0.08)",
              }}
            >
              <span
                style={{
                  color:
                    selectedZone.color,
                  fontSize: "12px",
                  fontWeight: "900",
                }}
              >
                {selectedZone.level} RISK
              </span>

              <span
                style={{
                  color: "#F7F4D5",
                  fontSize: "12px",
                  fontWeight: "800",
                }}
              >
                {selectedZone.score}/100
              </span>
            </div>

            {/* Action */}

            <div
              style={{
                marginTop: "15px",
                color: "#F7F4D5",
                fontSize: "13px",
                fontWeight: "800",
              }}
            >
              {selectedZone.action}
            </div>

            {/* Message */}

            <p
              style={{
                color: "#B8C3A0",
                fontSize: "11px",
                lineHeight: "1.6",
                margin:
                  "7px 0 14px",
              }}
            >
              {selectedZone.message}
            </p>

            {/* AI button */}

            <button
              type="button"
              onClick={goToPrediction}
              style={{
                width: "100%",
                padding: "9px 12px",
                border: "none",
                borderRadius: "8px",
                background:
                  selectedZone.color,
                color: "#FFFFFF",
                cursor: "pointer",
                fontSize: "11px",
                fontWeight: "900",
                transition:
                  "transform 0.2s ease",
              }}
            >
              VIEW AI PREDICTION →
            </button>
          </div>
        ) : (
          /* =================================================
             NO ZONE SELECTED
          ================================================= */

          <div
            style={{
              position: "absolute",
              left: "20px",
              bottom: "20px",
              zIndex: 1000,
              padding:
                "13px 16px",
              borderRadius: "12px",
              background:
                "rgba(10,51,35,0.92)",
              border:
                "1px solid rgba(131,153,88,0.3)",
              color: "#B8C3A0",
              fontSize: "11px",
            }}
          >
            Click a zone to view its intelligence
          </div>
        )}
      </div>

      {/* =================================================
          LEGEND
      ================================================= */}

      <div
        style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
          marginTop: "15px",
        }}
      >
        {[
          ["CRITICAL", RISK_COLORS.CRITICAL],
          ["HIGH", RISK_COLORS.HIGH],
          ["LOW", RISK_COLORS.LOW],
        ].map(([label, color]) => (
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
                boxShadow:
                  `0 0 7px ${color}`,
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
        ))}
      </div>
    </section>
  );
}

export default RiskMap;