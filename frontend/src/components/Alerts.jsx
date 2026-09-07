import { useState } from "react";

function Alerts({ selectedZone }) {
  const [filter, setFilter] = useState("ALL");

  // Demo alert data.
  // Later this will come from the backend API.
  //
  // IMPORTANT:
  // These zone IDs are the same IDs used by the GIS map,
  // Risk Prediction and Early Warning modules.

  const alerts = [
    {
      id: 1,
      title: "Heavy Rainfall Detected",
      severity: "CRITICAL",
      zone: "Zone A",
      zoneId: "ZONE_10452",
      score: 92,
      message:
        "Heavy rainfall has been detected in a high-risk region. Immediate monitoring is required.",
      time: "2 min ago",
      status: "ACTIVE",
    },

    {
      id: 2,
      title: "High Soil Moisture",
      severity: "HIGH",
      zone: "Zone B",
      zoneId: "ZONE_10453",
      score: 84,
      message:
        "Ground saturation is significantly elevated and may contribute to slope instability.",
      time: "8 min ago",
      status: "ACTIVE",
    },

    {
      id: 3,
      title: "Slope Instability Detected",
      severity: "MEDIUM",
      zone: "Zone C",
      zoneId: "ZONE_10454",
      score: 64,
      message:
        "Terrain analysis indicates increasing slope instability. Continue field observation.",
      time: "15 min ago",
      status: "MONITORING",
    },

    {
      id: 4,
      title: "Rainfall Increasing",
      severity: "HIGH",
      zone: "Zone A",
      zoneId: "ZONE_10452",
      score: 79,
      message:
        "Rainfall intensity is increasing and requires continued observation.",
      time: "35 min ago",
      status: "ACTIVE",
    },

    {
      id: 5,
      title: "Ground Saturation Rising",
      severity: "MEDIUM",
      zone: "Zone B",
      zoneId: "ZONE_10453",
      score: 58,
      message:
        "Soil moisture levels are gradually increasing across the monitored region.",
      time: "42 min ago",
      status: "MONITORING",
    },

    {
      id: 6,
      title: "Stable Conditions",
      severity: "LOW",
      zone: "Zone C",
      zoneId: "ZONE_10454",
      score: 21,
      message:
        "No significant environmental changes have been detected.",
      time: "1 hr ago",
      status: "NORMAL",
    },

    {
      id: 7,
      title: "Terrain Movement Detected",
      severity: "CRITICAL",
      zone: "Zone B",
      zoneId: "ZONE_10453",
      score: 95,
      message:
        "Potential ground movement has been detected. Field verification is recommended immediately.",
      time: "1 hr ago",
      status: "ACTIVE",
    },
  ];

  // -----------------------------------------
  // DYNAMIC SEVERITY CONFIGURATION
  // -----------------------------------------

  const getSeverityConfig = (severity) => {
    switch (severity) {
      case "CRITICAL":
        return {
          color: "#D3968C",
          background:
            "linear-gradient(145deg, rgba(90,38,38,0.95), rgba(53,29,34,0.98))",
          border: "rgba(211,150,140,0.55)",
          glow: "rgba(211,150,140,0.18)",
          icon: "🚨",
        };

      case "HIGH":
        return {
          color: "#D9A441",
          background:
            "linear-gradient(145deg, rgba(82,65,27,0.95), rgba(48,43,23,0.98))",
          border: "rgba(217,164,65,0.5)",
          glow: "rgba(217,164,65,0.14)",
          icon: "⚠️",
        };

      case "MEDIUM":
        return {
          color: "#C7B65A",
          background:
            "linear-gradient(145deg, rgba(67,69,32,0.95), rgba(38,50,29,0.98))",
          border: "rgba(199,182,90,0.45)",
          glow: "rgba(199,182,90,0.12)",
          icon: "🟡",
        };

      default:
        return {
          color: "#839958",
          background:
            "linear-gradient(145deg, rgba(39,68,48,0.95), rgba(19,52,40,0.98))",
          border: "rgba(131,153,88,0.4)",
          glow: "rgba(131,153,88,0.1)",
          icon: "✓",
        };
    }
  };

  // -----------------------------------------
  // SELECT ALERTS FOR CURRENT ZONE
  // -----------------------------------------

  const zoneAlerts = selectedZone
    ? alerts.filter((alert) => alert.zoneId === selectedZone.id)
    : alerts;

  // -----------------------------------------
  // FILTER BY ZONE + SEVERITY
  // -----------------------------------------

  const filteredAlerts =
    filter === "ALL"
      ? zoneAlerts
      : zoneAlerts.filter((alert) => alert.severity === filter);

  // -----------------------------------------
  // SUMMARY COUNTS
  // -----------------------------------------

  const criticalCount = zoneAlerts.filter(
    (alert) => alert.severity === "CRITICAL"
  ).length;

  const highCount = zoneAlerts.filter(
    (alert) => alert.severity === "HIGH"
  ).length;

  const mediumCount = zoneAlerts.filter(
    (alert) => alert.severity === "MEDIUM"
  ).length;

  const lowCount = zoneAlerts.filter(
    (alert) => alert.severity === "LOW"
  ).length;

  const activeAlerts = zoneAlerts.filter(
    (alert) => alert.status === "ACTIVE"
  );

  const activeCount = activeAlerts.length;

  // Unique Zone IDs among active alerts
  const activeZoneIds = [
    ...new Set(activeAlerts.map((alert) => alert.zoneId)),
  ];

  return (
    <section
      id="alerts"
      style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "20px 40px 60px",
        scrollMarginTop: "95px",
      }}
    >
      {/* =====================================
          SECTION HEADER
      ===================================== */}

      <div
        style={{
          marginBottom: "24px",
        }}
      >
        <p
          style={{
            color: "#D3968C",
            fontSize: "13px",
            fontWeight: "800",
            letterSpacing: "2px",
            marginBottom: "7px",
          }}
        >
          AUTHORITY CONTROL CENTER
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2
              style={{
                color: "#F7F4D5",
                fontSize: "30px",
                margin: 0,
                fontWeight: "800",
              }}
            >
              🔔 Active Alerts
            </h2>

            <p
              style={{
                color: "#B8C3A0",
                marginTop: "7px",
                fontSize: "15px",
              }}
            >
              Monitor, prioritize and respond to landslide-related alerts.
            </p>

            {/* SELECTED ZONE */}

            {selectedZone && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "9px",
                  marginTop: "12px",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    color: "#839958",
                    fontSize: "11px",
                    fontWeight: "900",
                    letterSpacing: "1px",
                  }}
                >
                  ALERTS FOR:
                </span>

                <span
                  style={{
                    color: "#F7F4D5",
                    fontSize: "13px",
                    fontWeight: "800",
                  }}
                >
                  {selectedZone.name}
                </span>

                <span
                  style={{
                    color: "#839958",
                    background: "rgba(131,153,88,0.12)",
                    border: "1px solid rgba(131,153,88,0.3)",
                    padding: "4px 8px",
                    borderRadius: "7px",
                    fontSize: "10px",
                    fontWeight: "800",
                    letterSpacing: "0.5px",
                  }}
                >
                  {selectedZone.id}
                </span>
              </div>
            )}
          </div>

          {/* LIVE STATUS */}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "9px",
              background: "rgba(131,153,88,0.1)",
              border: "1px solid rgba(131,153,88,0.3)",
              padding: "9px 14px",
              borderRadius: "999px",
            }}
          >
            <span
              style={{
                width: "9px",
                height: "9px",
                borderRadius: "50%",
                background: "#839958",
                boxShadow: "0 0 12px rgba(131,153,88,0.8)",
              }}
            />

            <span
              style={{
                color: "#839958",
                fontWeight: "800",
                fontSize: "12px",
                letterSpacing: "1px",
              }}
            >
              LIVE MONITORING
            </span>
          </div>
        </div>
      </div>

      {/* =====================================
          SUMMARY CARDS
      ===================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "14px",
          marginBottom: "24px",
        }}
      >
        {/* ACTIVE */}

        <div
          style={{
            background:
              "linear-gradient(145deg, #105666, #0A3323)",
            border: "1px solid rgba(247,244,213,0.1)",
            borderRadius: "16px",
            padding: "18px",
          }}
        >
          <span
            style={{
              color: "#839958",
              fontSize: "11px",
              fontWeight: "800",
              letterSpacing: "1px",
            }}
          >
            ACTIVE
          </span>

          <div
            style={{
              color: "#F7F4D5",
              fontSize: "30px",
              fontWeight: "900",
              marginTop: "6px",
            }}
          >
            {activeCount}

            {/* ACTIVE ZONE IDS */}

            {activeZoneIds.length > 0 && (
              <div
                style={{
                  marginTop: "8px",
                  color: "#B8C3A0",
                  fontSize: "9px",
                  lineHeight: "1.6",
                  fontWeight: "700",
                  wordBreak: "break-word",
                }}
              >
                {activeZoneIds.join(" • ")}
              </div>
            )}
          </div>
        </div>

        {/* CRITICAL */}

        <div
          style={{
            background:
              "linear-gradient(145deg, rgba(90,38,38,0.95), rgba(53,29,34,0.98))",
            border: "1px solid rgba(211,150,140,0.35)",
            borderRadius: "16px",
            padding: "18px",
          }}
        >
          <span
            style={{
              color: "#D3968C",
              fontSize: "11px",
              fontWeight: "800",
              letterSpacing: "1px",
            }}
          >
            CRITICAL
          </span>

          <div
            style={{
              color: "#F7F4D5",
              fontSize: "30px",
              fontWeight: "900",
              marginTop: "6px",
            }}
          >
            {criticalCount}
          </div>
        </div>

        {/* HIGH */}

        <div
          style={{
            background:
              "linear-gradient(145deg, rgba(82,65,27,0.95), rgba(48,43,23,0.98))",
            border: "1px solid rgba(217,164,65,0.3)",
            borderRadius: "16px",
            padding: "18px",
          }}
        >
          <span
            style={{
              color: "#D9A441",
              fontSize: "11px",
              fontWeight: "800",
              letterSpacing: "1px",
            }}
          >
            HIGH
          </span>

          <div
            style={{
              color: "#F7F4D5",
              fontSize: "30px",
              fontWeight: "900",
              marginTop: "6px",
            }}
          >
            {highCount}
          </div>
        </div>

        {/* MEDIUM */}

        <div
          style={{
            background:
              "linear-gradient(145deg, rgba(67,69,32,0.95), rgba(38,50,29,0.98))",
            border: "1px solid rgba(199,182,90,0.25)",
            borderRadius: "16px",
            padding: "18px",
          }}
        >
          <span
            style={{
              color: "#C7B65A",
              fontSize: "11px",
              fontWeight: "800",
              letterSpacing: "1px",
            }}
          >
            MEDIUM
          </span>

          <div
            style={{
              color: "#F7F4D5",
              fontSize: "30px",
              fontWeight: "900",
              marginTop: "6px",
            }}
          >
            {mediumCount}
          </div>
        </div>

        {/* LOW */}

        <div
          style={{
            background:
              "linear-gradient(145deg, rgba(39,68,48,0.95), rgba(19,52,40,0.98))",
            border: "1px solid rgba(131,153,88,0.25)",
            borderRadius: "16px",
            padding: "18px",
          }}
        >
          <span
            style={{
              color: "#839958",
              fontSize: "11px",
              fontWeight: "800",
              letterSpacing: "1px",
            }}
          >
            LOW
          </span>

          <div
            style={{
              color: "#F7F4D5",
              fontSize: "30px",
              fontWeight: "900",
              marginTop: "6px",
            }}
          >
            {lowCount}
          </div>
        </div>
      </div>

      {/* =====================================
          FILTER BAR
      ===================================== */}

      <div
        style={{
          display: "flex",
          gap: "9px",
          flexWrap: "wrap",
          marginBottom: "18px",
        }}
      >
        {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map(
          (level) => {
            const isSelected = filter === level;

            return (
              <button
                key={level}
                onClick={() => setFilter(level)}
                style={{
                  border: isSelected
                    ? "1px solid #839958"
                    : "1px solid rgba(247,244,213,0.13)",
                  background: isSelected
                    ? "rgba(131,153,88,0.16)"
                    : "rgba(16,86,102,0.45)",
                  color: isSelected
                    ? "#F7F4D5"
                    : "#AEB99B",
                  borderRadius: "10px",
                  padding: "9px 15px",
                  fontSize: "12px",
                  fontWeight: "800",
                  cursor: "pointer",
                  letterSpacing: "0.5px",
                }}
              >
                {level}
              </button>
            );
          }
        )}
      </div>

      {/* =====================================
          ALERT LIST
      ===================================== */}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "13px",
        }}
      >
        {filteredAlerts.map((alert) => {
          const config = getSeverityConfig(alert.severity);

          return (
            <div
              key={alert.id}
              style={{
                background: config.background,
                border: `1px solid ${config.border}`,
                borderRadius: "17px",
                padding: "20px",
                boxShadow: `0 10px 28px ${config.glow}`,
                transition:
                  "transform 0.2s ease, box-shadow 0.2s ease",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "55px 1fr auto",
                  gap: "16px",
                  alignItems: "center",
                }}
              >
                {/* ICON */}

                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "15px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: `${config.color}18`,
                    border: `1px solid ${config.border}`,
                    fontSize: "22px",
                  }}
                >
                  {config.icon}
                </div>

                {/* ALERT INFORMATION */}

                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "9px",
                      flexWrap: "wrap",
                      marginBottom: "6px",
                    }}
                  >
                    <h3
                      style={{
                        color: "#F7F4D5",
                        fontSize: "17px",
                        margin: 0,
                        fontWeight: "800",
                      }}
                    >
                      {alert.title}
                    </h3>

                    <span
                      style={{
                        color: config.color,
                        background: `${config.color}18`,
                        border: `1px solid ${config.border}`,
                        padding: "4px 8px",
                        borderRadius: "999px",
                        fontSize: "10px",
                        fontWeight: "900",
                      }}
                    >
                      {alert.severity}
                    </span>
                  </div>

                  <p
                    style={{
                      color: "#B8C3A0",
                      fontSize: "13px",
                      lineHeight: "1.5",
                      margin: "0 0 10px",
                    }}
                  >
                    {alert.message}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "8px",
                    }}
                  >
                    {/* ZONE NAME */}

                    <span
                      style={{
                        color: "#839958",
                        fontSize: "11px",
                        background: "rgba(247,244,213,0.06)",
                        padding: "5px 8px",
                        borderRadius: "7px",
                      }}
                    >
                      📍 {alert.zone}
                    </span>

                    {/* ZONE ID */}

                    <span
                      style={{
                        color: "#839958",
                        fontSize: "11px",
                        background: "rgba(131,153,88,0.1)",
                        border: "1px solid rgba(131,153,88,0.18)",
                        padding: "5px 8px",
                        borderRadius: "7px",
                        fontWeight: "800",
                      }}
                    >
                      ID: {alert.zoneId}
                    </span>

                    {/* TIME */}

                    <span
                      style={{
                        color: "#839958",
                        fontSize: "11px",
                        background: "rgba(247,244,213,0.06)",
                        padding: "5px 8px",
                        borderRadius: "7px",
                      }}
                    >
                      🕒 {alert.time}
                    </span>

                    {/* STATUS */}

                    <span
                      style={{
                        color: config.color,
                        fontSize: "11px",
                        background: `${config.color}12`,
                        padding: "5px 8px",
                        borderRadius: "7px",
                        fontWeight: "800",
                      }}
                    >
                      {alert.status}
                    </span>
                  </div>
                </div>

                {/* RISK SCORE */}

                <div
                  style={{
                    textAlign: "center",
                    minWidth: "85px",
                  }}
                >
                  <span
                    style={{
                      color: "#839958",
                      fontSize: "10px",
                      fontWeight: "800",
                      display: "block",
                      letterSpacing: "1px",
                    }}
                  >
                    RISK
                  </span>

                  <strong
                    style={{
                      color: config.color,
                      fontSize: "28px",
                      fontWeight: "900",
                    }}
                  >
                    {alert.score}
                  </strong>

                  <span
                    style={{
                      color: "#839958",
                      fontSize: "10px",
                    }}
                  >
                    /100
                  </span>
                </div>
              </div>

              {/* RISK PROGRESS */}

              <div
                style={{
                  marginTop: "16px",
                  height: "5px",
                  background: "rgba(247,244,213,0.08)",
                  borderRadius: "999px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${alert.score}%`,
                    height: "100%",
                    background: config.color,
                    borderRadius: "999px",
                    boxShadow: `0 0 10px ${config.color}`,
                    transition: "width 0.6s ease",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* =====================================
          EMPTY STATE
      ===================================== */}

      {filteredAlerts.length === 0 && (
        <div
          style={{
            padding: "45px",
            textAlign: "center",
            background:
              "linear-gradient(145deg, #105666, #0A3323)",
            borderRadius: "18px",
            border: "1px solid rgba(131,153,88,0.2)",
          }}
        >
          <div style={{ fontSize: "35px", marginBottom: "10px" }}>
            ✓
          </div>

          <h3
            style={{
              color: "#F7F4D5",
              margin: "0 0 7px",
            }}
          >
            No alerts found
          </h3>

          <p
            style={{
              color: "#AEB99B",
              margin: 0,
              fontSize: "13px",
            }}
          >
            {selectedZone
              ? `There are no alerts for ${selectedZone.name} (${selectedZone.id}) matching the selected severity.`
              : "There are no alerts matching the selected severity."}
          </p>
        </div>
      )}
    </section>
  );
}

export default Alerts;