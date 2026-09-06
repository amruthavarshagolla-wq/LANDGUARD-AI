import { useState } from "react";

function EarlyWarning() {
  const [showDetails, setShowDetails] = useState(false);

  // Demo value for now.
  // Later this will come from the backend / ML model.
  const riskScore = 82;

  // -----------------------------------------
  // DYNAMIC RISK CONFIGURATION
  // -----------------------------------------

  let warningLevel;
  let warningColor;
  let warningBackground;
  let warningBorder;
  let warningGlow;
  let warningMessage;

  if (riskScore >= 70) {
    // HIGH RISK
    warningLevel = "HIGH";
    warningColor = "#D3968C";

    warningBackground =
      "linear-gradient(135deg, #4A2525 0%, #351D22 45%, #0A3323 100%)";

    warningBorder = "rgba(211,150,140,0.65)";
    warningGlow = "rgba(211,150,140,0.25)";

    warningMessage =
      "Environmental conditions indicate a high probability of landslide activity. Immediate monitoring and emergency preparedness are recommended.";
  } else if (riskScore >= 40) {
    // MEDIUM RISK
    warningLevel = "MEDIUM";
    warningColor = "#D9A441";

    warningBackground =
      "linear-gradient(135deg, #4A3A1D 0%, #35401F 45%, #0A3323 100%)";

    warningBorder = "rgba(217,164,65,0.65)";
    warningGlow = "rgba(217,164,65,0.22)";

    warningMessage =
      "Environmental conditions indicate a moderate possibility of landslide activity. Authorities should continue monitoring the affected area.";
  } else {
    // LOW RISK
    warningLevel = "LOW";
    warningColor = "#839958";

    warningBackground =
      "linear-gradient(135deg, #24442F 0%, #183C31 45%, #0A3323 100%)";

    warningBorder = "rgba(131,153,88,0.65)";
    warningGlow = "rgba(131,153,88,0.22)";

    warningMessage =
      "Current environmental conditions indicate a low landslide risk. Continue routine monitoring.";
  }

  const conditions = [
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
  ];

  return (
    <section
      style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "20px 40px 60px",
      }}
    >
      {/* SECTION HEADING */}
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
      </div>

      {/* =====================================
          MAIN DYNAMIC WARNING CARD
      ===================================== */}

      <div
        style={{
          background: warningBackground,
          border: `1px solid ${warningBorder}`,
          borderRadius: "22px",
          padding: "28px",
          boxShadow: `0 18px 45px rgba(0,0,0,0.22), 0 0 35px ${warningGlow}`,
          position: "relative",
          overflow: "hidden",
          transition:
            "background 0.6s ease, border 0.5s ease, box-shadow 0.5s ease",
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
            transition: "background 0.5s ease",
          }}
        />

        {/* Second Glow */}
        <div
          style={{
            position: "absolute",
            width: "180px",
            height: "180px",
            borderRadius: "50%",
            background: warningGlow,
            left: "-100px",
            bottom: "-100px",
            filter: "blur(20px)",
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
          {/* LEFT SIDE */}
          <div>
            {/* ACTIVE WARNING BADGE */}
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
                transition:
                  "background 0.4s ease, border 0.4s ease",
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
                    riskScore >= 70
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
                {warningLevel === "HIGH"
                  ? "ACTIVE WARNING"
                  : warningLevel === "MEDIUM"
                  ? "MONITORING ALERT"
                  : "NORMAL MONITORING"}
              </span>
            </div>

            {/* TITLE */}
            <h3
              style={{
                color: "#F7F4D5",
                fontSize: "28px",
                margin: "0 0 10px",
                fontWeight: "850",
              }}
            >
              {warningLevel === "HIGH"
                ? "High Landslide Risk Detected"
                : warningLevel === "MEDIUM"
                ? "Moderate Landslide Risk Detected"
                : "Low Landslide Risk Detected"}
            </h3>

            {/* DYNAMIC MESSAGE */}
            <p
              style={{
                color: "#D2D7C5",
                lineHeight: "1.7",
                fontSize: "15px",
                maxWidth: "700px",
                marginBottom: "22px",
              }}
            >
              {warningMessage}
            </p>

            {/* WARNING METADATA */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              {/* AFFECTED AREA */}
              <div
                style={{
                  background: "rgba(247,244,213,0.07)",
                  border: "1px solid rgba(247,244,213,0.12)",
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
                  Zone A
                </strong>
              </div>

              {/* STATUS */}
              <div
                style={{
                  background: "rgba(247,244,213,0.07)",
                  border: "1px solid rgba(247,244,213,0.12)",
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

              {/* LAST CHECK */}
              <div
                style={{
                  background: "rgba(247,244,213,0.07)",
                  border: "1px solid rgba(247,244,213,0.12)",
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
                  2 min ago
                </strong>
              </div>
            </div>
          </div>

          {/* =====================================
              RISK SCORE CIRCLE
          ===================================== */}

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
                transition:
                  "background 0.5s ease, box-shadow 0.5s ease",
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
                  border: "1px solid rgba(247,244,213,0.1)",
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

      {/* =====================================
          DETECTED CONDITIONS
      ===================================== */}

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
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "16px",
          }}
        >
          {conditions.map((condition) => (
            <div
              key={condition.title}
              style={{
                background:
                  "linear-gradient(145deg, rgba(16,86,102,0.88), rgba(10,51,35,0.94))",
                border: "1px solid rgba(131,153,88,0.25)",
                borderRadius: "17px",
                padding: "20px",
                transition:
                  "transform 0.25s ease, border 0.25s ease",
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
                    transition: "color 0.4s ease",
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

      {/* =====================================
          ACTION AREA
      ===================================== */}

      <div
        style={{
          marginTop: "22px",
          background: `${warningColor}10`,
          border: `1px solid ${warningColor}35`,
          borderRadius: "18px",
          padding: "22px",
          transition:
            "background 0.5s ease, border 0.5s ease",
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
              {warningLevel === "HIGH"
                ? "Increase monitoring and prepare emergency response teams."
                : warningLevel === "MEDIUM"
                ? "Continue close monitoring and keep response teams prepared."
                : "Continue routine monitoring of environmental conditions."}
            </h3>

            <p
              style={{
                color: "#B8C3A0",
                margin: 0,
                fontSize: "13px",
              }}
            >
              {warningLevel === "HIGH"
                ? "Authorities should verify field conditions and remain prepared for possible evacuation measures."
                : warningLevel === "MEDIUM"
                ? "Authorities should continue observing rainfall, soil moisture and slope conditions."
                : "No immediate emergency action is required based on the current risk assessment."}
            </p>
          </div>

          <button
            onClick={() => setShowDetails(!showDetails)}
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

        {/* =====================================
            EXPANDABLE DETAILS
        ===================================== */}

        {showDetails && (
          <div
            style={{
              marginTop: "20px",
              paddingTop: "20px",
              borderTop:
                "1px solid rgba(247,244,213,0.12)",
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
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
                91%
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
                {warningLevel === "HIGH"
                  ? "CRITICAL"
                  : warningLevel === "MEDIUM"
                  ? "HIGH"
                  : "NORMAL"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* DEMO NOTICE */}
      <p
        style={{
          color: "#7F8C72",
          fontSize: "11px",
          marginTop: "14px",
          textAlign: "right",
        }}
      >
        * Warning values currently use demonstration data and
        will be connected to the backend prediction service.
      </p>

      {/* ANIMATION */}
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