import { useState } from "react";

// =====================================================
// DEMO EARLY WARNING DATA
// =====================================================

const warningData = {
  ZONE_10452: {
    riskScore: 92,
    riskLevel: "CRITICAL",
    lastCheck: "2 min ago",
    confidence: 94,
    responsePriority: "CRITICAL",

    conditions: [
      {
        icon: "🌧️",
        title: "Heavy Rainfall",
        value: "210 mm",
        description:
          "Very heavy rainfall detected during the last 24 hours.",
      },
      {
        icon: "💧",
        title: "Soil Moisture",
        value: "84%",
        description:
          "Ground saturation is critically above the safe threshold.",
      },
      {
        icon: "⛰️",
        title: "Slope Instability",
        value: "42°",
        description:
          "Highly steep terrain increases landslide susceptibility.",
      },
    ],

    warningMessage:
      "Environmental conditions indicate a critical probability of landslide activity. Immediate monitoring and emergency preparedness are strongly recommended.",

    action:
      "Activate emergency monitoring and prepare response teams.",

    actionDetails:
      "Authorities should verify field conditions immediately and remain prepared for possible evacuation measures.",
  },

  ZONE_10453: {
    riskScore: 78,
    riskLevel: "HIGH",
    lastCheck: "4 min ago",
    confidence: 91,
    responsePriority: "HIGH",

    conditions: [
      {
        icon: "🌧️",
        title: "Heavy Rainfall",
        value: "165 mm",
        description:
          "Heavy rainfall detected during the last 24 hours.",
      },
      {
        icon: "💧",
        title: "Soil Moisture",
        value: "72%",
        description:
          "Ground saturation is above the safe threshold.",
      },
      {
        icon: "⛰️",
        title: "Slope Instability",
        value: "36°",
        description:
          "Steep terrain increases landslide susceptibility.",
      },
    ],

    warningMessage:
      "Environmental conditions indicate a high probability of landslide activity. Enhanced monitoring and response preparedness are recommended.",

    action:
      "Increase monitoring and keep response teams prepared.",

    actionDetails:
      "Authorities should continue observing field conditions and remain prepared for escalation if environmental conditions worsen.",
  },

  ZONE_10454: {
    riskScore: 28,
    riskLevel: "LOW",
    lastCheck: "6 min ago",
    confidence: 88,
    responsePriority: "NORMAL",

    conditions: [
      {
        icon: "🌧️",
        title: "Rainfall",
        value: "62 mm",
        description:
          "Rainfall remains within a relatively safe range.",
      },
      {
        icon: "💧",
        title: "Soil Moisture",
        value: "42%",
        description:
          "Ground moisture remains within the normal range.",
      },
      {
        icon: "⛰️",
        title: "Slope Stability",
        value: "18°",
        description:
          "Terrain conditions currently show lower instability.",
      },
    ],

    warningMessage:
      "Current environmental conditions indicate a low landslide risk. Continue routine monitoring of the affected area.",

    action:
      "Continue routine monitoring of environmental conditions.",

    actionDetails:
      "No immediate emergency action is required based on the current risk assessment.",
  },
};

// =====================================================
// DEFAULT DEMO DATA
// =====================================================

const defaultWarning = {
  riskScore: 82,
  riskLevel: "HIGH",
  lastCheck: "2 min ago",
  confidence: 91,
  responsePriority: "CRITICAL",

  conditions: [
    {
      icon: "🌧️",
      title: "Heavy Rainfall",
      value: "185 mm",
      description:
        "High rainfall detected during the last 24 hours.",
    },
    {
      icon: "💧",
      title: "Soil Moisture",
      value: "78%",
      description:
        "Ground saturation is above the safe threshold.",
    },
    {
      icon: "⛰️",
      title: "Slope Instability",
      value: "38°",
      description:
        "Steep terrain increases landslide susceptibility.",
    },
  ],

  warningMessage:
    "Environmental conditions indicate a high probability of landslide activity. Immediate monitoring and emergency preparedness are recommended.",

  action:
    "Increase monitoring and prepare emergency response teams.",

  actionDetails:
    "Authorities should verify field conditions and remain prepared for possible evacuation measures.",
};

// =====================================================
// EARLY WARNING
// =====================================================

function EarlyWarning({ selectedZone }) {
  const [showDetails, setShowDetails] = useState(false);

  // ===================================================
  // SELECT WARNING DATA
  // ===================================================

  const warning =
    warningData[selectedZone?.id] || defaultWarning;

  const riskScore = warning.riskScore;
  const warningLevel = warning.riskLevel;

  // ===================================================
  // DYNAMIC RISK COLORS
  // ===================================================

  let warningColor;
  let warningBackground;
  let warningBorder;
  let warningGlow;

  if (warningLevel === "CRITICAL") {
    warningColor = "#B83A3A";

    warningBackground =
      "linear-gradient(135deg, #4A2525 0%, #351D22 45%, #0A3323 100%)";

    warningBorder = "rgba(184,58,58,0.7)";
    warningGlow = "rgba(184,58,58,0.28)";
  } else if (warningLevel === "HIGH") {
    warningColor = "#E07A32";

    warningBackground =
      "linear-gradient(135deg, #4A3020 0%, #35401F 45%, #0A3323 100%)";

    warningBorder = "rgba(224,122,50,0.7)";
    warningGlow = "rgba(224,122,50,0.25)";
  } else {
    warningColor = "#5C8D45";

    warningBackground =
      "linear-gradient(135deg, #24442F 0%, #183C31 45%, #0A3323 100%)";

    warningBorder = "rgba(92,141,69,0.7)";
    warningGlow = "rgba(92,141,69,0.22)";
  }

  // ===================================================
  // WARNING LABEL
  // ===================================================

  const warningLabel =
    warningLevel === "CRITICAL"
      ? "CRITICAL WARNING"
      : warningLevel === "HIGH"
      ? "ACTIVE WARNING"
      : "NORMAL MONITORING";

  const warningTitle =
    warningLevel === "CRITICAL"
      ? "Critical Landslide Risk Detected"
      : warningLevel === "HIGH"
      ? "High Landslide Risk Detected"
      : "Low Landslide Risk Detected";

  return (
    <section
      style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "20px 40px 60px",
        scrollMarginTop: "95px",
      }}
    >
      {/* =================================================
          SECTION HEADING
      ================================================= */}

      <div style={{ marginBottom: "22px" }}>
        <p
          style={{
            color: warningColor,
            fontSize: "13px",
            fontWeight: "800",
            letterSpacing: "2px",
            marginBottom: "7px",
          }}
        >
          EMERGENCY RESPONSE
        </p>

        <h2
          style={{
            color: "#F7F4D5",
            fontSize: "30px",
            margin: 0,
            fontWeight: "800",
          }}
        >
          🚨 Early Warning System
        </h2>

        <p
          style={{
            color: "#B8C3A0",
            marginTop: "7px",
            fontSize: "15px",
          }}
        >
          Real-time risk alerts designed to support faster disaster response.
        </p>

        {/* SELECTED ZONE */}

        {selectedZone && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              marginTop: "14px",
              padding: "8px 14px",
              borderRadius: "10px",
              background: "rgba(131,153,88,0.12)",
              border: "1px solid rgba(131,153,88,0.3)",
            }}
          >
            <span
              style={{
                color: "#F7F4D5",
                fontSize: "12px",
                fontWeight: "800",
              }}
            >
              WARNING FOR: {selectedZone.name}
            </span>

            <span
              style={{
                color: "#839958",
                fontSize: "11px",
                fontWeight: "800",
              }}
            >
              {selectedZone.id}
            </span>
          </div>
        )}
      </div>

      {/* =================================================
          MAIN WARNING CARD
      ================================================= */}

      <div
        style={{
          background: warningBackground,
          border: `1px solid ${warningBorder}`,
          borderRadius: "22px",
          padding: "28px",
          boxShadow: `0 18px 45px rgba(0,0,0,0.22), 0 0 35px ${warningGlow}`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Dynamic Glow */}

        <div
          style={{
            position: "absolute",
            width: "280px",
            height: "280px",
            borderRadius: "50%",
            background: warningGlow,
            right: "-90px",
            top: "-120px",
            filter: "blur(15px)",
          }}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 0.6fr",
            gap: "30px",
            alignItems: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* =================================================
              LEFT SIDE
          ================================================= */}

          <div>
            {/* Warning Badge */}

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                background: `${warningColor}18`,
                border: `1px solid ${warningColor}66`,
                padding: "9px 14px",
                borderRadius: "999px",
                marginBottom: "18px",
              }}
            >
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: warningColor,
                  boxShadow: `0 0 14px ${warningColor}`,
                  animation:
                    warningLevel !== "LOW"
                      ? "warningPulse 1.5s infinite"
                      : "none",
                }}
              />

              <span
                style={{
                  color: warningColor,
                  fontWeight: "900",
                  fontSize: "12px",
                  letterSpacing: "1.4px",
                }}
              >
                {warningLabel}
              </span>
            </div>

            {/* Title */}

            <h3
              style={{
                color: "#F7F4D5",
                fontSize: "28px",
                margin: "0 0 10px",
                fontWeight: "850",
              }}
            >
              {warningTitle}
            </h3>

            {/* Message */}

            <p
              style={{
                color: "#D2D7C5",
                lineHeight: "1.7",
                fontSize: "15px",
                maxWidth: "700px",
                marginBottom: "22px",
              }}
            >
              {warning.warningMessage}
            </p>

            {/* =================================================
                WARNING METADATA
            ================================================= */}

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              {/* Affected Area */}

              <div
                style={{
                  background: "rgba(247,244,213,0.07)",
                  border:
                    "1px solid rgba(247,244,213,0.12)",
                  borderRadius: "12px",
                  padding: "11px 15px",
                }}
              >
                <span
                  style={{
                    color: "#839958",
                    fontSize: "11px",
                    fontWeight: "800",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  AFFECTED AREA
                </span>

                <strong
                  style={{
                    color: "#F7F4D5",
                    fontSize: "14px",
                  }}
                >
                  {selectedZone?.name || "Zone A"}
                </strong>
              </div>

              {/* Zone ID */}

              <div
                style={{
                  background: "rgba(247,244,213,0.07)",
                  border:
                    "1px solid rgba(247,244,213,0.12)",
                  borderRadius: "12px",
                  padding: "11px 15px",
                }}
              >
                <span
                  style={{
                    color: "#839958",
                    fontSize: "11px",
                    fontWeight: "800",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  ZONE ID
                </span>

                <strong
                  style={{
                    color: "#F7F4D5",
                    fontSize: "14px",
                  }}
                >
                  {selectedZone?.id || "ZONE_10452"}
                </strong>
              </div>

              {/* Status */}

              <div
                style={{
                  background: "rgba(247,244,213,0.07)",
                  border:
                    "1px solid rgba(247,244,213,0.12)",
                  borderRadius: "12px",
                  padding: "11px 15px",
                }}
              >
                <span
                  style={{
                    color: "#839958",
                    fontSize: "11px",
                    fontWeight: "800",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  STATUS
                </span>

                <strong
                  style={{
                    color: warningColor,
                    fontSize: "14px",
                  }}
                >
                  {warningLevel} RISK
                </strong>
              </div>

              {/* Last Check */}

              <div
                style={{
                  background: "rgba(247,244,213,0.07)",
                  border:
                    "1px solid rgba(247,244,213,0.12)",
                  borderRadius: "12px",
                  padding: "11px 15px",
                }}
              >
                <span
                  style={{
                    color: "#839958",
                    fontSize: "11px",
                    fontWeight: "800",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  LAST CHECK
                </span>

                <strong
                  style={{
                    color: "#F7F4D5",
                    fontSize: "14px",
                  }}
                >
                  {warning.lastCheck}
                </strong>
              </div>
            </div>
          </div>

          {/* =================================================
              RISK SCORE
          ================================================= */}

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: "190px",
                height: "190px",
                borderRadius: "50%",
                background: `conic-gradient(
                  ${warningColor} ${riskScore * 3.6}deg,
                  rgba(247,244,213,0.08) ${riskScore * 3.6}deg
                )`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 0 35px ${warningGlow}`,
              }}
            >
              <div
                style={{
                  width: "150px",
                  height: "150px",
                  borderRadius: "50%",
                  background: "#0A3323",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  border:
                    "1px solid rgba(247,244,213,0.1)",
                }}
              >
                <span
                  style={{
                    color: "#839958",
                    fontSize: "12px",
                    fontWeight: "800",
                    letterSpacing: "1px",
                  }}
                >
                  RISK SCORE
                </span>

                <span
                  style={{
                    color: "#F7F4D5",
                    fontSize: "45px",
                    fontWeight: "900",
                    lineHeight: "1",
                    marginTop: "7px",
                  }}
                >
                  {riskScore}
                </span>

                <span
                  style={{
                    color: warningColor,
                    fontSize: "13px",
                    fontWeight: "900",
                    marginTop: "7px",
                  }}
                >
                  {warningLevel}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          DETECTED CONDITIONS
      ================================================= */}

      <div style={{ marginTop: "22px" }}>
        <h3
          style={{
            color: "#F7F4D5",
            fontSize: "20px",
            marginBottom: "15px",
          }}
        >
          Detected Conditions
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(3, 1fr)",
            gap: "16px",
          }}
        >
          {warning.conditions.map((condition) => (
            <div
              key={condition.title}
              style={{
                background:
                  "linear-gradient(145deg, rgba(16,86,102,0.88), rgba(10,51,35,0.94))",
                border:
                  "1px solid rgba(131,153,88,0.25)",
                borderRadius: "17px",
                padding: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "15px",
                }}
              >
                <span style={{ fontSize: "26px" }}>
                  {condition.icon}
                </span>

                <strong
                  style={{
                    color: warningColor,
                    fontSize: "20px",
                  }}
                >
                  {condition.value}
                </strong>
              </div>

              <h4
                style={{
                  color: "#F7F4D5",
                  fontSize: "16px",
                  margin: "0 0 7px",
                }}
              >
                {condition.title}
              </h4>

              <p
                style={{
                  color: "#AEB99B",
                  fontSize: "13px",
                  lineHeight: "1.5",
                  margin: 0,
                }}
              >
                {condition.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* =================================================
          ACTION AREA
      ================================================= */}

      <div
        style={{
          marginTop: "22px",
          background: `${warningColor}10`,
          border: `1px solid ${warningColor}35`,
          borderRadius: "18px",
          padding: "22px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                color: warningColor,
                fontSize: "11px",
                fontWeight: "900",
                letterSpacing: "1.5px",
                margin: "0 0 7px",
              }}
            >
              RECOMMENDED ACTION
            </p>

            <h3
              style={{
                color: "#F7F4D5",
                margin: "0 0 6px",
                fontSize: "18px",
              }}
            >
              {warning.action}
            </h3>

            <p
              style={{
                color: "#B8C3A0",
                margin: 0,
                fontSize: "13px",
              }}
            >
              {warning.actionDetails}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowDetails(!showDetails)
            }
            style={{
              border: "none",
              borderRadius: "12px",
              padding: "12px 18px",
              background:
                "linear-gradient(135deg, #839958, #105666)",
              color: "#F7F4D5",
              fontWeight: "800",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            {showDetails
              ? "Hide Details ↑"
              : "View Warning Details ↓"}
          </button>
        </div>

        {/* =================================================
            EXPANDABLE DETAILS
        ================================================= */}

        {showDetails && (
          <div
            style={{
              marginTop: "20px",
              paddingTop: "20px",
              borderTop:
                "1px solid rgba(247,244,213,0.12)",
              display: "grid",
              gridTemplateColumns:
                "repeat(3, 1fr)",
              gap: "14px",
            }}
          >
            <div>
              <span
                style={{
                  color: "#839958",
                  fontSize: "11px",
                  fontWeight: "800",
                }}
              >
                ALERT SOURCE
              </span>

              <p
                style={{
                  color: "#F7F4D5",
                  fontSize: "14px",
                  margin: "5px 0 0",
                }}
              >
                LANDGUARD AI Prediction Engine
              </p>
            </div>

            <div>
              <span
                style={{
                  color: "#839958",
                  fontSize: "11px",
                  fontWeight: "800",
                }}
              >
                CONFIDENCE
              </span>

              <p
                style={{
                  color: "#F7F4D5",
                  fontSize: "14px",
                  margin: "5px 0 0",
                }}
              >
                {warning.confidence}%
              </p>
            </div>

            <div>
              <span
                style={{
                  color: "#839958",
                  fontSize: "11px",
                  fontWeight: "800",
                }}
              >
                RESPONSE PRIORITY
              </span>

              <p
                style={{
                  color: warningColor,
                  fontSize: "14px",
                  fontWeight: "800",
                  margin: "5px 0 0",
                }}
              >
                {warning.responsePriority}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* =================================================
          ANIMATION
      ================================================= */}

      <style>
        {`
          @keyframes warningPulse {
            0% {
              transform: scale(1);
              opacity: 1;
            }

            50% {
              transform: scale(1.45);
              opacity: 0.55;
            }

            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}
      </style>
    </section>
  );
}

export default EarlyWarning;