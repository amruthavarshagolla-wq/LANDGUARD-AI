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

  const createRiskIcon = (zone) => {
    const pulseClass =
      zone.level === "CRITICAL"
        ? "critical-pulse"
        : zone.level === "HIGH"
        ? "high-pulse"
        : "";

    return L.divIcon({
      className: "landguard-marker-wrapper",
      html: `
        <div
          class="risk-marker ${pulseClass}"
          style="--marker-color: ${zone.color};"
        >
          <div class="risk-marker-inner">
            ${zone.id}
          </div>
        </div>
      `,
      iconSize: [52, 52],
      iconAnchor: [26, 26],
      popupAnchor: [0, -25],
    });
  };

  const handleZoneSelect = (zone) => {
    setSelectedZone(zone);
  };

  return (
    <section
      style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "20px 40px 50px",
        scrollMarginTop: "95px",
      }}
    >
      {/* Marker Animation Styles */}
      <style>
        {`
          .landguard-marker-wrapper {
            background: transparent !important;
            border: none !important;
          }

          .risk-marker {
            width: 52px;
            height: 52px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
          }

          .risk-marker::before,
          .risk-marker::after {
            content: "";
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            border: 2px solid var(--marker-color);
            opacity: 0;
          }

          .critical-pulse::before {
            animation: landguardPulse 2s infinite;
          }

          .critical-pulse::after {
            animation: landguardPulse 2s infinite 1s;
          }

          .high-pulse::before {
            animation: landguardPulse 2.5s infinite;
          }

          @keyframes landguardPulse {
            0% {
              transform: scale(0.8);
              opacity: 0.8;
            }

            70% {
              transform: scale(1.8);
              opacity: 0;
            }

            100% {
              transform: scale(1.8);
              opacity: 0;
            }
          }

          .risk-marker-inner {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: var(--marker-color);
            border: 4px solid #F7F4D5;
            box-shadow:
              0 0 0 5px rgba(247,244,213,0.25),
              0 8px 20px rgba(0,0,0,0.45);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #0A3323;
            font-size: 14px;
            font-weight: 900;
            font-family: Arial, sans-serif;
            position: relative;
            z-index: 2;
          }

          .leaflet-popup-content-wrapper {
            border-radius: 14px;
          }

          .leaflet-popup-tip {
            background: white;
          }
        `}
      </style>

      {/* Section Heading */}
      <div style={{ marginBottom: "22px" }}>
        <p
          style={{
            color: "#839958",
            fontSize: "13px",
            fontWeight: "800",
            letterSpacing: "2px",
            marginBottom: "7px",
          }}
        >
          GEOSPATIAL INTELLIGENCE
        </p>

        <h2
          style={{
            color: "#F7F4D5",
            fontSize: "30px",
            margin: 0,
            fontWeight: "800",
          }}
        >
          🗺️ LANDGUARD Risk Map
        </h2>

        <p
          style={{
            color: "#B8C3A0",
            marginTop: "7px",
            fontSize: "15px",
          }}
        >
          Real-time geographic visualization of landslide-prone areas and AI
          risk levels.
        </p>
      </div>

      {/* Main Map */}
      <div
        style={{
          position: "relative",
          height: "600px",
          borderRadius: "22px",
          overflow: "hidden",
          border: "1px solid rgba(131,153,88,0.45)",
          boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
          background: "#0A3323",
        }}
      >
        <MapContainer
          center={[25.50, 91.89]}
          zoom={10}
          zoomControl={false}
          style={{
            width: "100%",
            height: "100%",
          }}
        >
          <LayersControl position="topright">
            {/* Standard Map */}
            <LayersControl.BaseLayer checked name="🗺️ Standard Map">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>

            {/* Satellite */}
            <LayersControl.BaseLayer name="🛰️ Satellite">
              <TileLayer
                attribution="Tiles &copy; Esri"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
            </LayersControl.BaseLayer>

            {/* Terrain */}
            <LayersControl.BaseLayer name="🏔️ Terrain">
              <TileLayer
                attribution='Map data &copy; OpenStreetMap contributors, SRTM | Map style &copy; OpenTopoMap'
                url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          <ZoomControl position="bottomright" />

          {/* Risk Zones */}
          {zones.map((zone) => (
            <div key={zone.id}>
              {/* Outer Glow */}
              <Circle
                center={zone.coordinates}
                radius={zone.radius * 1.35}
                pathOptions={{
                  color: zone.color,
                  fillColor: zone.color,
                  fillOpacity: 0.05,
                  weight: 1,
                  opacity: 0.35,
                }}
                eventHandlers={{
                  click: () => handleZoneSelect(zone),
                }}
              />

              {/* Main Risk Area */}
              <Circle
                center={zone.coordinates}
                radius={zone.radius}
                pathOptions={{
                  color: zone.color,
                  fillColor: zone.color,
                  fillOpacity:
                    zone.level === "CRITICAL"
                      ? 0.24
                      : zone.level === "HIGH"
                      ? 0.18
                      : 0.12,
                  weight: 2,
                  opacity: 0.75,
                }}
                eventHandlers={{
                  click: () => handleZoneSelect(zone),
                }}
              />

              {/* Risk Marker */}
              <Marker
                position={zone.coordinates}
                icon={createRiskIcon(zone)}
                eventHandlers={{
                  click: () => handleZoneSelect(zone),
                }}
              >
                <Popup>
                  <div
                    style={{
                      minWidth: "205px",
                      fontFamily: "Arial, sans-serif",
                    }}
                  >
                    <div
                      style={{
                        color: "#839958",
                        fontSize: "10px",
                        fontWeight: "800",
                        letterSpacing: "1px",
                        marginBottom: "4px",
                      }}
                    >
                      LANDGUARD AI
                    </div>

                    <div
                      style={{
                        fontSize: "19px",
                        fontWeight: "800",
                        color: "#0A3323",
                        marginBottom: "7px",
                      }}
                    >
                      {zone.name}
                    </div>

                    <div
                      style={{
                        display: "inline-block",
                        padding: "5px 10px",
                        borderRadius: "20px",
                        background: zone.color,
                        color: "#0A3323",
                        fontWeight: "900",
                        fontSize: "11px",
                        marginBottom: "13px",
                      }}
                    >
                      {zone.level} RISK
                    </div>

                    <div
                      style={{
                        borderTop: "1px solid #ddd",
                        paddingTop: "10px",
                        lineHeight: "1.9",
                        fontSize: "13px",
                        color: "#24352d",
                      }}
                    >
                      <div>
                        <strong>AI Risk Score:</strong>{" "}
                        {zone.score}/100
                      </div>

                      <div>
                        <strong>Rainfall:</strong>{" "}
                        {zone.rainfall}
                      </div>

                      <div>
                        <strong>Soil Moisture:</strong>{" "}
                        {zone.soilMoisture}
                      </div>

                      <div>
                        <strong>Status:</strong>{" "}
                        <span style={{ color: "#105666" }}>
                          Monitoring
                        </span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </div>
          ))}
        </MapContainer>

        {/* Live Monitoring Badge */}
        <div
          style={{
            position: "absolute",
            top: "18px",
            left: "18px",
            zIndex: 500,
            padding: "13px 17px",
            borderRadius: "15px",
            background: "rgba(10,51,35,0.93)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(247,244,213,0.22)",
            boxShadow: "0 8px 25px rgba(0,0,0,0.3)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "9px",
            }}
          >
            <span
              style={{
                width: "9px",
                height: "9px",
                borderRadius: "50%",
                background: "#839958",
                boxShadow: "0 0 12px #839958",
              }}
            />

            <span
              style={{
                color: "#F7F4D5",
                fontSize: "12px",
                fontWeight: "800",
              }}
            >
              LIVE GIS MONITORING
            </span>
          </div>

          <div
            style={{
              color: "#B8C3A0",
              fontSize: "10px",
              marginTop: "5px",
            }}
          >
            Risk intelligence system active
          </div>
        </div>

        {/* Open GIS Badge */}
        <div
          style={{
            position: "absolute",
            top: "18px",
            right: "70px",
            zIndex: 500,
            background: "rgba(247,244,213,0.95)",
            color: "#0A3323",
            padding: "8px 12px",
            borderRadius: "11px",
            fontSize: "10px",
            fontWeight: "900",
            boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
          }}
        >
          OPEN GIS
        </div>

        {/* Legend */}
        <div
          style={{
            position: "absolute",
            left: "18px",
            bottom: "18px",
            zIndex: 500,
            background: "rgba(10,51,35,0.94)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(247,244,213,0.2)",
            borderRadius: "16px",
            padding: "15px 18px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
            minWidth: "175px",
          }}
        >
          <div
            style={{
              color: "#F7F4D5",
              fontSize: "12px",
              fontWeight: "800",
              marginBottom: "11px",
              letterSpacing: "0.7px",
            }}
          >
            RISK INTENSITY
          </div>

          {[
            ["#D3968C", "CRITICAL", "Immediate attention"],
            ["#C47F72", "HIGH", "Close monitoring"],
            ["#839958", "LOW", "Normal monitoring"],
          ].map(([color, label, description]) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "9px",
                marginBottom: "9px",
              }}
            >
              <span
                style={{
                  width: "11px",
                  height: "11px",
                  borderRadius: "50%",
                  background: color,
                  boxShadow: `0 0 8px ${color}`,
                  flexShrink: 0,
                }}
              />

              <div>
                <div
                  style={{
                    color: "#F7F4D5",
                    fontSize: "11px",
                    fontWeight: "800",
                  }}
                >
                  {label}
                </div>

                <div
                  style={{
                    color: "#B8C3A0",
                    fontSize: "9px",
                  }}
                >
                  {description}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Risk Zone Counter */}
        <div
          style={{
            position: "absolute",
            right: "18px",
            bottom: "18px",
            zIndex: 500,
            background: "rgba(16,86,102,0.94)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(247,244,213,0.2)",
            borderRadius: "15px",
            padding: "13px 16px",
            color: "#F7F4D5",
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              color: "#B8C3A0",
              fontWeight: "700",
            }}
          >
            MONITORED ZONES
          </div>

          <div
            style={{
              fontSize: "24px",
              fontWeight: "900",
              marginTop: "2px",
            }}
          >
            {zones.length}
          </div>
        </div>
      </div>

      {/* Selected Zone Panel */}
      {selectedZone && (
        <div
          style={{
            marginTop: "18px",
            padding: "22px",
            borderRadius: "18px",
            background:
              "linear-gradient(145deg, #105666, #0A3323)",
            border: `1px solid ${selectedZone.color}66`,
            boxShadow: "0 12px 35px rgba(0,0,0,0.25)",
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
                  letterSpacing: "1.5px",
                  marginBottom: "6px",
                }}
              >
                SELECTED RISK ZONE
              </div>

              <h3
                style={{
                  margin: 0,
                  color: "#F7F4D5",
                  fontSize: "24px",
                }}
              >
                {selectedZone.name}
              </h3>
            </div>

            <div
              style={{
                padding: "8px 14px",
                borderRadius: "25px",
                background: selectedZone.color,
                color: "#0A3323",
                fontSize: "12px",
                fontWeight: "900",
              }}
            >
              {selectedZone.level}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "12px",
              marginTop: "18px",
            }}
          >
            <div
              style={{
                padding: "14px",
                borderRadius: "12px",
                background: "rgba(247,244,213,0.08)",
              }}
            >
              <div
                style={{
                  color: "#B8C3A0",
                  fontSize: "11px",
                }}
              >
                AI RISK SCORE
              </div>

              <div
                style={{
                  color: "#F7F4D5",
                  fontSize: "22px",
                  fontWeight: "800",
                  marginTop: "4px",
                }}
              >
                {selectedZone.score}/100
              </div>
            </div>

            <div
              style={{
                padding: "14px",
                borderRadius: "12px",
                background: "rgba(247,244,213,0.08)",
              }}
            >
              <div
                style={{
                  color: "#B8C3A0",
                  fontSize: "11px",
                }}
              >
                RAINFALL
              </div>

              <div
                style={{
                  color: "#F7F4D5",
                  fontSize: "18px",
                  fontWeight: "800",
                  marginTop: "5px",
                }}
              >
                {selectedZone.rainfall}
              </div>
            </div>

            <div
              style={{
                padding: "14px",
                borderRadius: "12px",
                background: "rgba(247,244,213,0.08)",
              }}
            >
              <div
                style={{
                  color: "#B8C3A0",
                  fontSize: "11px",
                }}
              >
                SOIL MOISTURE
              </div>

              <div
                style={{
                  color: "#F7F4D5",
                  fontSize: "18px",
                  fontWeight: "800",
                  marginTop: "5px",
                }}
              >
                {selectedZone.soilMoisture}
              </div>
            </div>

            <div
              style={{
                padding: "14px",
                borderRadius: "12px",
                background: "rgba(247,244,213,0.08)",
              }}
            >
              <div
                style={{
                  color: "#B8C3A0",
                  fontSize: "11px",
                }}
              >
                STATUS
              </div>

              <div
                style={{
                  color: "#839958",
                  fontSize: "18px",
                  fontWeight: "800",
                  marginTop: "5px",
                }}
              >
                ACTIVE
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Demo Notice */}
      <div
        style={{
          marginTop: "12px",
          color: "#839958",
          fontSize: "11px",
          textAlign: "right",
        }}
      >
        * Risk locations currently use demonstration GIS coordinates.
      </div>
    </section>
  );
}

export default RiskMap;