import { useEffect, useState } from "react";

function EarlyWarning() {
  const [showDetails, setShowDetails] = useState(false);
  const [warningData, setWarningData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadWarning = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/warnings");

        if (!response.ok) {
          throw new Error(`Backend returned ${response.status}`);
        }

        const result = await response.json();

        if (result && result.data) {
          setWarningData(result.data);
        } else {
          setWarningData(result);
        }
      } catch (err) {
        console.error("Early Warning API error:", err);
        setError("Unable to load live warning data.");
      } finally {
        setLoading(false);
      }
    };

    loadWarning();
  }, []);

  /*
   * Safe fallback values.
   * This keeps the page visible even if the backend
   * temporarily cannot be reached.
   */
  const data = warningData || {
    risk_score: 0,
    risk_level: "LOW",
    zone: "Loading...",
    rainfall: 0,
    soil_moisture: 0,
    active_alerts: 0,
    warning_message:
      "Loading the latest environmental risk information.",
    recommended_action:
      "Please wait while LANDGUARD retrieves the latest warning data.",
  };

  const riskScore = Math.max(
    0,
    Math.min(100, Number(data.risk_score) || 0)
  );

  /*
   * LANDGUARD risk classification
   * 0-24   LOW
   * 25-49  MODERATE
   * 50-74  HIGH
   * 75-100 VERY HIGH
   */
  let warningLevel;
  let warningColor;
  let warningBackground;
  let warningBorder;
  let warningGlow;
  let warningMessage;

  if (riskScore >= 75) {
    warningLevel = "VERY HIGH";
    warningColor = "#D3968C";

    warningBackground =
      "linear-gradient(135deg, #4A2525 0%, #351D22 45%, #0A3323 100%)";

    warningBorder = "rgba(211,150,140,0.65)";
    warningGlow = "rgba(211,150,140,0.25)";

    warningMessage =
      data.warning_message ||
      "Environmental conditions indicate a very high probability of landslide activity. Immediate monitoring and emergency preparedness are recommended.";
  } else if (riskScore >= 50) {
    warningLevel = "HIGH";
    warningColor = "#D9A441";

    warningBackground =
      "linear-gradient(135deg, #4A3A1D 0%, #35401F 45%, #0A3323 100%)";

    warningBorder = "rgba(217,164,65,0.65)";
    warningGlow = "rgba(217,164,65,0.22)";

    warningMessage =
      data.warning_message ||
      "Environmental conditions indicate a high possibility of landslide activity. Authorities should continue close monitoring.";
  } else if (riskScore >= 25) {
    warningLevel = "MODERATE";
    warningColor = "#D9A441";

    warningBackground =
      "linear-gradient(135deg, #4A3A1D 0%, #35401F 45%, #0A3323 100%)";

    warningBorder = "rgba(217,164,65,0.65)";
    warningGlow = "rgba(217,164,65,0.22)";

    warningMessage =
      data.warning_message ||
      "Environmental conditions indicate a moderate possibility of landslide activity. Authorities should continue monitoring the affected area.";
  } else {
    warningLevel = "LOW";
    warningColor = "#839958";

    warningBackground =
      "linear-gradient(135deg, #24442F 0%, #183C31 45%, #0A3323 100%)";

    warningBorder = "rgba(131,153,88,0.65)";
    warningGlow = "rgba(131,153,88,0.22)";

    warningMessage =
      data.warning_message ||
      "Current environmental conditions indicate a low landslide risk. Continue routine monitoring.";
  }

  /*
   * Safely get zone name from backend.
   * Backend may return zone as either a string or object.
   */
  let zoneName = "Risk Zone";

  if (typeof data.zone === "string") {
    zoneName = data.zone;
  } else if (data.zone && typeof data.zone === "object") {
    zoneName =
      data.zone.name ||
      data.zone.zone_name ||
      data.zone.id ||
      "Risk Zone";
  } else if (data.zone_name) {
    zoneName = data.zone_name;
  }

  const rainfall = Number(data.rainfall) || 0;
  const soilMoisture = Number(data.soil_moisture) || 0;
  const activeAlerts = Number(data.active_alerts) || 0;

  const recommendedAction =
    data.recommended_action ||
    (riskScore >= 75
      ? "Increase monitoring and prepare emergency response teams."
      : riskScore >= 50
      ? "Continue close monitoring and keep response teams prepared."
      : riskScore >= 25
      ? "Continue monitoring environmental conditions."
      : "Continue routine monitoring of environmental conditions.");

  const conditions = [
    {
      icon: "🌧️",
      title: "Heavy Rainfall",
      value: `${rainfall} mm`,
      description:
        rainfall >= 150
          ? "High rainfall detected during the recent monitoring period."
          : "Rainfall is being monitored as part of the risk assessment.",
    },
    {
      icon: "💧",
      title: "Soil Moisture",
      value: `${soilMoisture}%`,
      description:
        soilMoisture >= 70
          ? "Ground saturation is above the safe threshold."
          : "Soil moisture is currently being monitored.",
    },
    {
      icon: "⚠️",
      title: "Active Alerts",
      value: `${activeAlerts}`,
      description:
        activeAlerts > 0
          ? "Active alerts require attention from response teams."
          : "No additional active alerts are currently reported.",
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

      {/* ERROR MESSAGE */}
      {error && (
        <div
          style={{
            marginBottom: "18px",
            padding: "12px 16px",
            borderRadius: "10px",
            background: "rgba(217,164,65,0.12)",
            border: "1px solid rgba(217,164,65,0.3)",
            color: "#D9A441",
            fontSize: "13px",
          }}
        >
          {error}
        </div>
      )}

      {/* MAIN WARNING CARD */}
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
          {/* LEFT SIDE */}
          <div>
            {/* WARNING BADGE */}
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
                    riskScore >= 75
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
                {riskScore >= 75
                  ? "ACTIVE WARNING"
                  : riskScore >= 50
                  ? "HIGH RISK ALERT"
                  : riskScore >= 25
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
              {warningLevel === "VERY HIGH"
                ? "Very High Landslide Risk Detected"
                : warningLevel === "HIGH"
                ? "High Landslide Risk Detected"
                : warningLevel === "MODERATE"
                ? "Moderate Landslide Risk Detected"
                : "Low Landslide Risk Detected"}
            </h3>

            {/* MESSAGE */}
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
                  {zoneName}
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
                  {loading ? "LOADING" : `${warningLevel} RISK`}
                </strong>
              </div>

              {/* DATA SOURCE */}
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
                  DATA SOURCE
                </span>

                <strong
                  style={{
                    color: "#F7F4D5",
                    fontSize: "14px",
                  }}
                >
                  LANDGUARD AI
                </strong>
              </div>
            </div>
          </div>

          {/* RISK SCORE CIRCLE */}
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
                  {Math.round(riskScore)}
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

      {/* DETECTED CONDITIONS */}
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

      {/* ACTION AREA */}
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
              {recommendedAction}
            </h3>

            <p
              style={{
                color: "#B8C3A0",
                margin: 0,
                fontSize: "13px",
              }}
            >
              {riskScore >= 75
                ? "Authorities should verify field conditions and remain prepared for emergency response."
                : riskScore >= 50
                ? "Authorities should continue observing rainfall, soil moisture and slope conditions."
                : "Continue routine monitoring based on the current risk assessment."}
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

        {/* EXPANDABLE DETAILS */}
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
                ACTIVE ALERTS
              </span>

              <p
                style={{
                  color: "#F7F4D5",
                  fontSize: "14px",
                  margin: "5px 0 0",
                }}
              >
                {activeAlerts}
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
                {riskScore >= 75
                  ? "CRITICAL"
                  : riskScore >= 50
                  ? "HIGH"
                  : riskScore >= 25
                  ? "MEDIUM"
                  : "NORMAL"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* CONNECTION NOTICE */}
      <p
        style={{
          color: "#7F8C72",
          fontSize: "11px",
          marginTop: "14px",
          textAlign: "right",
        }}
      >
        {loading
          ? "Loading live warning data from LANDGUARD backend..."
          : error
          ? "Backend connection needs attention."
          : "✓ Live warning data connected to LANDGUARD backend."}
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

          @media (max-width: 900px) {
            section {
              padding-left: 20px !important;
              padding-right: 20px !important;
            }
          }
        `}
      </style>
    </section>
  );
}

export default EarlyWarning;