import { useEffect, useState } from "react";

function RiskPrediction() {
  const riskScore = 82;

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
    }, 18);

    return () => clearInterval(interval);
  }, []);

  const riskFactors = [
    {
      name: "Rainfall",
      value: "185 mm",
      contribution: 32,
      description: "Heavy rainfall detected",
      icon: "🌧️",
    },
    {
      name: "Soil Moisture",
      value: "78%",
      contribution: 25,
      description: "High ground saturation",
      icon: "💧",
    },
    {
      name: "Slope",
      value: "38°",
      contribution: 20,
      description: "Steep terrain detected",
      icon: "⛰️",
    },
    {
      name: "Historical Events",
      value: "12",
      contribution: 12,
      description: "Past landslide activity",
      icon: "📜",
    },
    {
      name: "Elevation",
      value: "1,240 m",
      contribution: 7,
      description: "High elevation terrain",
      icon: "🏔️",
    },
    {
      name: "Temperature",
      value: "24°C",
      contribution: 4,
      description: "Current temperature",
      icon: "🌡️",
    },
  ];

  return (
    <section
      style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "20px 40px 50px",
      }}
    >
      {/* Header */}
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
          ARTIFICIAL INTELLIGENCE
        </p>

        <h2
          style={{
            color: "#F7F4D5",
            fontSize: "30px",
            margin: 0,
            fontWeight: "800",
          }}
        >
          🤖 AI Risk Intelligence
        </h2>

        <p
          style={{
            color: "#B8C3A0",
            marginTop: "7px",
            fontSize: "15px",
          }}
        >
          Explainable AI analysis of environmental and geographical risk
          factors.
        </p>
      </div>

      {/* Main AI Panel */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          gap: "20px",
        }}
      >
        {/* Risk Score Card */}
        <div
          style={{
            borderRadius: "22px",
            padding: "28px",
            background:
              "linear-gradient(145deg, #105666, #0A3323)",
            border: "1px solid rgba(211,150,140,0.45)",
            boxShadow: "0 18px 45px rgba(0,0,0,0.3)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "410px",
          }}
        >
          <div
            style={{
              color: "#B8C3A0",
              fontSize: "11px",
              fontWeight: "800",
              letterSpacing: "1.5px",
              marginBottom: "20px",
            }}
          >
            CURRENT AI RISK SCORE
          </div>

          {/* Circular Score */}
          <div
            style={{
              width: "205px",
              height: "205px",
              borderRadius: "50%",
              background: `conic-gradient(
                #D3968C ${animatedScore * 3.6}deg,
                rgba(247,244,213,0.12) 0deg
              )`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              boxShadow:
                "0 0 35px rgba(211,150,140,0.25)",
            }}
          >
            <div
              style={{
                width: "165px",
                height: "165px",
                borderRadius: "50%",
                background: "#0A3323",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  color: "#F7F4D5",
                  fontSize: "48px",
                  lineHeight: 1,
                  fontWeight: "900",
                }}
              >
                {animatedScore}
              </div>

              <div
                style={{
                  color: "#B8C3A0",
                  fontSize: "12px",
                  marginTop: "5px",
                }}
              >
                OUT OF 100
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: "22px",
              padding: "9px 20px",
              borderRadius: "30px",
              background: "#D3968C",
              color: "#0A3323",
              fontSize: "13px",
              fontWeight: "900",
              letterSpacing: "0.5px",
            }}
          >
            HIGH RISK
          </div>

          <div
            style={{
              marginTop: "18px",
              color: "#839958",
              fontSize: "11px",
              fontWeight: "700",
            }}
          >
            ● AI ANALYSIS ACTIVE
          </div>
        </div>

        {/* Risk Factors */}
        <div
          style={{
            borderRadius: "22px",
            padding: "25px",
            background:
              "linear-gradient(145deg, #105666, #0A3323)",
            border: "1px solid rgba(131,153,88,0.4)",
            boxShadow: "0 18px 45px rgba(0,0,0,0.3)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
              marginBottom: "20px",
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  color: "#F7F4D5",
                  fontSize: "20px",
                }}
              >
                Risk Factor Analysis
              </h3>

              <p
                style={{
                  margin: "5px 0 0",
                  color: "#B8C3A0",
                  fontSize: "12px",
                }}
              >
                Factors influencing the current AI prediction
              </p>
            </div>

            <div
              style={{
                padding: "7px 11px",
                borderRadius: "20px",
                background: "rgba(131,153,88,0.15)",
                border: "1px solid rgba(131,153,88,0.35)",
                color: "#839958",
                fontSize: "10px",
                fontWeight: "800",
              }}
            >
              EXPLAINABLE AI
            </div>
          </div>

          {/* Factors */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "13px",
            }}
          >
            {riskFactors.map((factor) => (
              <div
                key={factor.name}
                style={{
                  padding: "15px",
                  borderRadius: "15px",
                  background: "rgba(247,244,213,0.06)",
                  border: "1px solid rgba(247,244,213,0.1)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "10px",
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
                        fontSize: "21px",
                      }}
                    >
                      {factor.icon}
                    </span>

                    <div>
                      <div
                        style={{
                          color: "#F7F4D5",
                          fontSize: "13px",
                          fontWeight: "800",
                        }}
                      >
                        {factor.name}
                      </div>

                      <div
                        style={{
                          color: "#B8C3A0",
                          fontSize: "10px",
                          marginTop: "2px",
                        }}
                      >
                        {factor.description}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      color: "#F7F4D5",
                      fontSize: "16px",
                      fontWeight: "900",
                    }}
                  >
                    {factor.value}
                  </div>
                </div>

                {/* Contribution */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginTop: "13px",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      height: "7px",
                      background:
                        "rgba(247,244,213,0.12)",
                      borderRadius: "10px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${factor.contribution * 3.125}%`,
                        height: "100%",
                        borderRadius: "10px",
                        background:
                          factor.contribution >= 25
                            ? "#D3968C"
                            : factor.contribution >= 15
                            ? "#C47F72"
                            : "#839958",
                        transition: "width 1s ease",
                      }}
                    />
                  </div>

                  <span
                    style={{
                      color: "#839958",
                      fontSize: "10px",
                      fontWeight: "800",
                      minWidth: "35px",
                      textAlign: "right",
                    }}
                  >
                    {factor.contribution}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* AI Explanation */}
          <div
            style={{
              marginTop: "18px",
              padding: "16px",
              borderRadius: "15px",
              background:
                "linear-gradient(135deg, rgba(211,150,140,0.12), rgba(16,86,102,0.25))",
              border:
                "1px solid rgba(211,150,140,0.25)",
            }}
          >
            <div
              style={{
                color: "#D3968C",
                fontSize: "11px",
                fontWeight: "900",
                letterSpacing: "1px",
                marginBottom: "6px",
              }}
            >
              🧠 AI EXPLANATION
            </div>

            <p
              style={{
                color: "#F7F4D5",
                fontSize: "13px",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              The current risk level is primarily driven by heavy rainfall,
              elevated soil moisture, and steep terrain. These conditions
              increase slope instability and indicate a significantly higher
              probability of landslide activity.
            </p>
          </div>
        </div>
      </div>

      {/* Confidence / Status Row */}
      <div
        style={{
          marginTop: "18px",
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "15px",
        }}
      >
        <div
          style={{
            padding: "18px",
            borderRadius: "17px",
            background: "#0A3323",
            border: "1px solid rgba(131,153,88,0.3)",
          }}
        >
          <div
            style={{
              color: "#B8C3A0",
              fontSize: "10px",
              fontWeight: "700",
            }}
          >
            MODEL CONFIDENCE
          </div>

          <div
            style={{
              color: "#F7F4D5",
              fontSize: "24px",
              fontWeight: "900",
              marginTop: "5px",
            }}
          >
            91%
          </div>

          <div
            style={{
              marginTop: "8px",
              height: "5px",
              borderRadius: "10px",
              background: "rgba(247,244,213,0.1)",
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
            padding: "18px",
            borderRadius: "17px",
            background: "#0A3323",
            border: "1px solid rgba(131,153,88,0.3)",
          }}
        >
          <div
            style={{
              color: "#B8C3A0",
              fontSize: "10px",
              fontWeight: "700",
            }}
          >
            PREDICTION STATUS
          </div>

          <div
            style={{
              color: "#839958",
              fontSize: "18px",
              fontWeight: "900",
              marginTop: "8px",
            }}
          >
            ● ACTIVE
          </div>

          <div
            style={{
              color: "#B8C3A0",
              fontSize: "10px",
              marginTop: "4px",
            }}
          >
            Continuous monitoring enabled
          </div>
        </div>

        <div
          style={{
            padding: "18px",
            borderRadius: "17px",
            background: "#0A3323",
            border: "1px solid rgba(131,153,88,0.3)",
          }}
        >
          <div
            style={{
              color: "#B8C3A0",
              fontSize: "10px",
              fontWeight: "700",
            }}
          >
            LAST MODEL UPDATE
          </div>

          <div
            style={{
              color: "#F7F4D5",
              fontSize: "18px",
              fontWeight: "900",
              marginTop: "8px",
            }}
          >
            2 min ago
          </div>

          <div
            style={{
              color: "#B8C3A0",
              fontSize: "10px",
              marginTop: "4px",
            }}
          >
            Environmental data refreshed
          </div>
        </div>
      </div>
    </section>
  );
}

export default RiskPrediction;