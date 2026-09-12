import { useEffect, useState } from "react";

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);

useEffect(() => {
  fetch("/api/dashboard")
    .then((response) => response.json())
    .then((result) => {
      if (result.success) {
        setDashboardData(result.data);
      }
    })
    .catch((error) => {
      console.error("Dashboard API error:", error);
    });
}, []);

const riskScore = Number(
  dashboardData?.risk_zones?.maximum_risk_score ?? 0
);

  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let current = 0;

    const interval = setInterval(() => {
      current += 1;

      if (current >= riskScore) {
        current = riskScore;
        clearInterval(interval);
      }

      setAnimatedScore(current);
    }, 20);

    return () => clearInterval(interval);
  }, [riskScore]);

  let riskColor;
  let riskBackground;
  let riskBorder;
  let riskLabel;

   if (riskScore >= 75) {
  riskColor = "#D3968C";
  riskBackground =
    "linear-gradient(145deg, rgba(120,45,40,0.92), rgba(65,25,25,0.98))";
  riskBorder = "rgba(211,150,140,0.55)";
  riskLabel = "VERY HIGH";
} else if (riskScore >= 50) {
  riskColor = "#D9A441";
  riskBackground =
    "linear-gradient(145deg, rgba(110,80,25,0.9), rgba(55,45,20,0.98))";
  riskBorder = "rgba(217,164,65,0.5)";
  riskLabel = "HIGH";
} else if (riskScore >= 25) {
  riskColor = "#D9A441";
  riskBackground =
    "linear-gradient(145deg, rgba(110,80,25,0.9), rgba(55,45,20,0.98))";
  riskBorder = "rgba(217,164,65,0.5)";
  riskLabel = "MODERATE";
} else {
  riskColor = "#839958";
  riskBackground =
    "linear-gradient(145deg, rgba(55,85,40,0.9), rgba(20,50,30,0.98))";
  riskBorder = "rgba(131,153,88,0.5)";
  riskLabel = "LOW";
}
  const stats = [
    {
      icon: "🌍",
      value:  dashboardData?.risk_zones?.total ?? 0,
      label: "Areas Monitored",
      description: "GIS monitored regions",
    },
    {
      icon: "🚨",
      value:  dashboardData?.active_alerts ?? 0,
      label: "Active Alerts",
      description: "Requires attention",
    },
    {
      icon: "🔴",
      value: dashboardData?.risk_zones?.very_high?? 0,
      label: "Critical Zones",
      description: "Immediate monitoring",
    },
  ];

  return (
    <section
      style={{
        minHeight: "calc(100vh - 80px)",
        padding: "70px 7% 80px",
        background:
          "radial-gradient(circle at 85% 15%, rgba(131,153,88,0.13), transparent 28%), linear-gradient(135deg, #071F17 0%, #0A3323 48%, #105666 100%)",
        color: "#F7F4D5",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background decoration */}
      <div
        style={{
          position: "absolute",
          width: "350px",
          height: "350px",
          borderRadius: "50%",
          border: "1px solid rgba(131,153,88,0.12)",
          right: "-120px",
          top: "-100px",
        }}
      />

      <div
        style={{
          position: "absolute",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          border: "1px solid rgba(247,244,213,0.05)",
          right: "-200px",
          top: "-170px",
        }}
      />

      {/* Main content */}
      <div
        style={{
          maxWidth: "1250px",
          margin: "0 auto",
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "42px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "9px",
              padding: "8px 15px",
              borderRadius: "30px",
              background: "rgba(131,153,88,0.13)",
              border: "1px solid rgba(131,153,88,0.35)",
              color: "#B8C3A0",
              fontSize: "12px",
              fontWeight: "700",
              letterSpacing: "1.4px",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#839958",
                boxShadow: "0 0 12px rgba(131,153,88,0.9)",
              }}
            />
            LIVE AUTHORITY MONITORING
          </div>

          <p
            style={{
              margin: "24px 0 8px",
              color: "#839958",
              fontSize: "13px",
              fontWeight: "800",
              letterSpacing: "2px",
            }}
          >
            LANDSLIDE MONITORING SYSTEM
          </p>

          <h1
            style={{
              margin: 0,
              fontSize: "clamp(38px, 5vw, 64px)",
              lineHeight: "1.05",
              fontWeight: "800",
              letterSpacing: "-2px",
            }}
          >
            Authority{" "}
            <span style={{ color: "#D3968C" }}>Command Center</span>
          </h1>

          <p
            style={{
              maxWidth: "720px",
              marginTop: "18px",
              color: "#B8C3A0",
              fontSize: "17px",
              lineHeight: "1.7",
            }}
          >
            AI-powered landslide monitoring, risk prediction and emergency
            response intelligence for faster and safer decision-making.
          </p>
        </div>

        {/* Command center grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.15fr 0.85fr",
            gap: "22px",
            marginBottom: "22px",
          }}
        >
          {/* Risk card */}
          <div
            style={{
              padding: "32px",
              borderRadius: "24px",
              background: riskBackground,
              border: `1px solid ${riskBorder}`,
              boxShadow: "0 20px 55px rgba(0,0,0,0.25)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: "220px",
                height: "220px",
                borderRadius: "50%",
                border: `1px solid ${riskBorder}`,
                right: "-80px",
                top: "-90px",
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "20px",
                position: "relative",
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    color: "#B8C3A0",
                    fontSize: "12px",
                    fontWeight: "800",
                    letterSpacing: "1.5px",
                  }}
                >
                  CURRENT RISK STATUS
                </p>

                <h2
                  style={{
                    margin: "10px 0 6px",
                    fontSize: "30px",
                  }}
                >
                  Landslide Risk
                </h2>

                <p
                  style={{
                    margin: 0,
                    color: "#D8DCCB",
                    fontSize: "14px",
                  }}
                >
                  Overall regional assessment
                </p>
              </div>

              <div
                style={{
                  padding: "7px 14px",
                  borderRadius: "20px",
                  background: "rgba(0,0,0,0.22)",
                  color: riskColor,
                  border: `1px solid ${riskBorder}`,
                  fontSize: "12px",
                  fontWeight: "800",
                  letterSpacing: "1px",
                }}
              >
                {riskLabel}
              </div>
            </div>

            {/* Score */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "30px",
                marginTop: "32px",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: "150px",
                  height: "150px",
                  borderRadius: "50%",
                  background: `conic-gradient(${riskColor} ${
                    animatedScore * 3.6
                  }deg, rgba(255,255,255,0.09) 0deg)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: `0 0 35px ${riskColor}35`,
                }}
              >
                <div
                  style={{
                    width: "116px",
                    height: "116px",
                    borderRadius: "50%",
                    background: "#102A23",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <strong
                    style={{
                      fontSize: "38px",
                      lineHeight: 1,
                      color: riskColor,
                    }}
                  >
                    {animatedScore}
                  </strong>

                  <span
                    style={{
                      marginTop: "7px",
                      color: "#B8C3A0",
                      fontSize: "11px",
                    }}
                  >
                    / 100
                  </span>
                </div>
              </div>

              <div>
                <div
                  style={{
                    color: riskColor,
                    fontSize: "20px",
                    fontWeight: "800",
                  }}
                >
                  {riskLabel} RISK
                </div>

                <p
                  style={{
                    color: "#D8DCCB",
                    fontSize: "14px",
                    lineHeight: "1.7",
                    marginTop: "10px",
                    maxWidth: "360px",
                  }}
                >
                  Current environmental conditions indicate elevated
                  landslide probability. Immediate monitoring of critical
                  zones is recommended.
                </p>

                <div
                  style={{
                    marginTop: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#B8C3A0",
                    fontSize: "12px",
                  }}
                >
                  <span>↗</span>
                  Risk trend increasing
                </div>
              </div>
            </div>
          </div>

          {/* AI status */}
          <div
            style={{
              padding: "30px",
              borderRadius: "24px",
              background:
                "linear-gradient(145deg, rgba(16,86,102,0.9), rgba(10,51,35,0.95))",
              border: "1px solid rgba(131,153,88,0.3)",
              boxShadow: "0 20px 55px rgba(0,0,0,0.22)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  color: "#B8C3A0",
                  fontSize: "12px",
                  fontWeight: "800",
                  letterSpacing: "1.3px",
                }}
              >
                AI MONITORING ENGINE
              </span>

              <span
                style={{
                  color: "#839958",
                  fontSize: "11px",
                  fontWeight: "800",
                }}
              >
                ● ACTIVE
              </span>
            </div>

            <h2
              style={{
                fontSize: "27px",
                margin: "24px 0 10px",
              }}
            >
              Intelligent Risk Analysis
            </h2>

            <p
              style={{
                color: "#B8C3A0",
                fontSize: "14px",
                lineHeight: "1.7",
              }}
            >
              LANDGUARD AI continuously evaluates environmental and terrain
              indicators to identify emerging landslide threats.
            </p>

            <div
              style={{
                marginTop: "28px",
                padding: "18px",
                borderRadius: "16px",
                background: "rgba(0,0,0,0.18)",
                border: "1px solid rgba(247,244,213,0.08)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                }}
              >
                <span
                  style={{
                    color: "#D8DCCB",
                    fontSize: "12px",
                  }}
                >
                  Model Confidence
                </span>

                <strong
                  style={{
                    color: "#F7F4D5",
                    fontSize: "13px",
                  }}
                >
                  91%
                </strong>
              </div>

              <div
                style={{
                  height: "7px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.09)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: "91%",
                    height: "100%",
                    borderRadius: "10px",
                    background: "#839958",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "20px",
                color: "#B8C3A0",
                fontSize: "11px",
              }}
            >
              <span>Last update</span>
              <span>2 min ago</span>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "18px",
          }}
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              style={{
                padding: "24px",
                borderRadius: "20px",
                background: "rgba(247,244,213,0.055)",
                border: "1px solid rgba(247,244,213,0.1)",
                backdropFilter: "blur(10px)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <span style={{ fontSize: "27px" }}>{stat.icon}</span>

                <span
                  style={{
                    color: "#839958",
                    fontSize: "10px",
                    fontWeight: "800",
                    letterSpacing: "1px",
                  }}
                >
                  LIVE
                </span>
              </div>

              <div
                style={{
                  marginTop: "20px",
                  fontSize: "34px",
                  fontWeight: "800",
                  color: "#F7F4D5",
                }}
              >
                {stat.value}
              </div>

              <div
                style={{
                  marginTop: "4px",
                  fontSize: "15px",
                  fontWeight: "700",
                }}
              >
                {stat.label}
              </div>

              <div
                style={{
                  marginTop: "7px",
                  color: "#8F9D82",
                  fontSize: "12px",
                }}
              >
                {stat.description}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom monitoring strip */}
        <div
          style={{
            marginTop: "20px",
            padding: "18px 22px",
            borderRadius: "18px",
            background: "rgba(0,0,0,0.16)",
            border: "1px solid rgba(131,153,88,0.2)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <span
              style={{
                color: "#839958",
                fontWeight: "800",
                fontSize: "12px",
              }}
            >
              ● SYSTEM OPERATIONAL
            </span>

            <span
              style={{
                color: "#8F9D82",
                fontSize: "12px",
                marginLeft: "15px",
              }}
            >
              Environmental data monitoring active
            </span>
          </div>

          <div
            style={{
              color: "#B8C3A0",
              fontSize: "12px",
            }}
          >
            Last system sync: <strong>2 min ago</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Dashboard;