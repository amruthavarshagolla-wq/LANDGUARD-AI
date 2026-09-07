import { useState, useEffect } from "react";

function RiskTimeline({ selectedZone }) {
  const [selectedPoint, setSelectedPoint] = useState(null);

  // --------------------------------------------------
  // DEMO TIMELINE DATA BY ZONE
  // Later this will come from:
  // GET /api/timeline?zoneId=ZONE_10452
  // --------------------------------------------------

  const timelineDataByZone = {
    ZONE_10452: [
      {
        time: "06:00",
        risk: 58,
        rainfall: 76,
        soil: 68,
        event: "Rainfall Increasing",
      },
      {
        time: "08:00",
        risk: 64,
        rainfall: 102,
        soil: 72,
        event: "Risk Rising",
      },
      {
        time: "10:00",
        risk: 71,
        rainfall: 128,
        soil: 76,
        event: "High Risk",
      },
      {
        time: "12:00",
        risk: 78,
        rainfall: 154,
        soil: 80,
        event: "Heavy Rainfall",
      },
      {
        time: "14:00",
        risk: 84,
        rainfall: 178,
        soil: 82,
        event: "Warning Triggered",
      },
      {
        time: "16:00",
        risk: 89,
        rainfall: 198,
        soil: 84,
        event: "Critical Risk",
      },
      {
        time: "18:00",
        risk: 92,
        rainfall: 210,
        soil: 84,
        event: "Current",
      },
    ],

    ZONE_10453: [
      {
        time: "06:00",
        risk: 45,
        rainfall: 55,
        soil: 60,
        event: "Normal",
      },
      {
        time: "08:00",
        risk: 51,
        rainfall: 72,
        soil: 63,
        event: "Rainfall Increasing",
      },
      {
        time: "10:00",
        risk: 59,
        rainfall: 96,
        soil: 66,
        event: "Risk Rising",
      },
      {
        time: "12:00",
        risk: 66,
        rainfall: 120,
        soil: 69,
        event: "Moderate Risk",
      },
      {
        time: "14:00",
        risk: 71,
        rainfall: 140,
        soil: 71,
        event: "High Risk",
      },
      {
        time: "16:00",
        risk: 75,
        rainfall: 154,
        soil: 72,
        event: "Warning Triggered",
      },
      {
        time: "18:00",
        risk: 78,
        rainfall: 165,
        soil: 72,
        event: "Current",
      },
    ],

    ZONE_10454: [
      {
        time: "06:00",
        risk: 22,
        rainfall: 35,
        soil: 38,
        event: "Normal",
      },
      {
        time: "08:00",
        risk: 23,
        rainfall: 40,
        soil: 39,
        event: "Stable Conditions",
      },
      {
        time: "10:00",
        risk: 24,
        rainfall: 46,
        soil: 40,
        event: "Normal",
      },
      {
        time: "12:00",
        risk: 25,
        rainfall: 52,
        soil: 41,
        event: "Slight Increase",
      },
      {
        time: "14:00",
        risk: 26,
        rainfall: 55,
        soil: 41,
        event: "Stable",
      },
      {
        time: "16:00",
        risk: 27,
        rainfall: 59,
        soil: 42,
        event: "Monitoring",
      },
      {
        time: "18:00",
        risk: 28,
        rainfall: 62,
        soil: 42,
        event: "Current",
      },
    ],
  };

  // --------------------------------------------------
  // DEFAULT DATA
  // --------------------------------------------------

  const defaultTimelineData = [
    {
      time: "06:00",
      risk: 48,
      rainfall: 42,
      soil: 55,
      event: "Normal",
    },
    {
      time: "08:00",
      risk: 53,
      rainfall: 58,
      soil: 59,
      event: "Rainfall Increasing",
    },
    {
      time: "10:00",
      risk: 61,
      rainfall: 82,
      soil: 65,
      event: "Risk Rising",
    },
    {
      time: "12:00",
      risk: 68,
      rainfall: 105,
      soil: 69,
      event: "High Rainfall",
    },
    {
      time: "14:00",
      risk: 74,
      rainfall: 132,
      soil: 73,
      event: "High Risk",
    },
    {
      time: "16:00",
      risk: 79,
      rainfall: 158,
      soil: 76,
      event: "Warning Triggered",
    },
    {
      time: "18:00",
      risk: 82,
      rainfall: 185,
      soil: 78,
      event: "Current",
    },
  ];

  // --------------------------------------------------
  // SELECT TIMELINE DATA USING ZONE ID
  // --------------------------------------------------

  const timelineData =
    timelineDataByZone[selectedZone?.id] ||
    defaultTimelineData;

  // --------------------------------------------------
  // RESET SELECTED POINT WHEN ZONE CHANGES
  // --------------------------------------------------

  useEffect(() => {
    setSelectedPoint(null);
  }, [selectedZone?.id]);

  const currentData =
    timelineData[timelineData.length - 1];

  const previousData =
    timelineData[timelineData.length - 2];

  const riskIncrease =
    currentData.risk - previousData.risk;

  // --------------------------------------------------
  // RISK HELPERS
  // --------------------------------------------------

  const getRiskColor = (score) => {
    if (score >= 70) return "#D3968C";
    if (score >= 40) return "#D9A441";
    return "#839958";
  };

  const getRiskLabel = (score) => {
    if (score >= 70) return "HIGH";
    if (score >= 40) return "MEDIUM";
    return "LOW";
  };

  // --------------------------------------------------
  // CHART CALCULATIONS
  // --------------------------------------------------

  const chartWidth = 760;
  const chartHeight = 260;

  const leftPadding = 55;
  const rightPadding = 25;
  const topPadding = 25;
  const bottomPadding = 45;

  const usableWidth =
    chartWidth - leftPadding - rightPadding;

  const usableHeight =
    chartHeight - topPadding - bottomPadding;

  const getX = (index) => {
    if (timelineData.length === 1) {
      return leftPadding;
    }

    return (
      leftPadding +
      (index / (timelineData.length - 1)) *
        usableWidth
    );
  };

  const getY = (score) => {
    return (
      topPadding +
      usableHeight -
      (score / 100) * usableHeight
    );
  };

  const points = timelineData
    .map((item, index) => {
      return `${getX(index)},${getY(item.risk)}`;
    })
    .join(" ");

  const areaPoints = `
    ${leftPadding},${topPadding + usableHeight}
    ${points}
    ${getX(timelineData.length - 1)},${topPadding + usableHeight}
  `;

  return (
    <section
      id="risk-timeline"
      style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "20px 40px 60px",
        scrollMarginTop: "95px",
      }}
    >
      {/* =====================================
          HEADER
      ===================================== */}

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
          HISTORICAL RISK INTELLIGENCE
        </p>

        <h2
          style={{
            color: "#F7F4D5",
            fontSize: "30px",
            margin: 0,
            fontWeight: "800",
          }}
        >
          Risk Timeline
        </h2>

        <p
          style={{
            color: "#B8C3A0",
            fontSize: "15px",
            marginTop: "7px",
          }}
        >
          Track how environmental conditions and landslide
          risk have changed over time.
        </p>

        {/* SELECTED ZONE */}

        {selectedZone && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "9px",
              flexWrap: "wrap",
              marginTop: "13px",
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
              ANALYZING ZONE:
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
                background:
                  "rgba(131,153,88,0.12)",
                border:
                  "1px solid rgba(131,153,88,0.3)",
                padding: "4px 9px",
                borderRadius: "7px",
                fontSize: "10px",
                fontWeight: "900",
                letterSpacing: "0.5px",
              }}
            >
              ZONE ID: {selectedZone.id}
            </span>
          </div>
        )}
      </div>

      {/* =====================================
          TOP SUMMARY
      ===================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
          gap: "15px",
          marginBottom: "20px",
        }}
      >
        {/* CURRENT RISK */}

        <div
          style={{
            background:
              "linear-gradient(145deg, #105666, #0A3323)",
            border:
              "1px solid rgba(211,150,140,0.3)",
            borderRadius: "18px",
            padding: "20px",
          }}
        >
          <p
            style={{
              color: "#84927A",
              fontSize: "10px",
              fontWeight: "900",
              margin: "0 0 8px",
              letterSpacing: "1px",
            }}
          >
            CURRENT RISK
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "8px",
            }}
          >
            <strong
              style={{
                color: getRiskColor(
                  currentData.risk
                ),
                fontSize: "31px",
              }}
            >
              {currentData.risk}
            </strong>

            <span
              style={{
                color: getRiskColor(
                  currentData.risk
                ),
                fontSize: "11px",
                fontWeight: "900",
              }}
            >
              / 100
            </span>
          </div>

          <span
            style={{
              display: "inline-block",
              marginTop: "8px",
              padding: "5px 8px",
              borderRadius: "6px",
              background: `${getRiskColor(
                currentData.risk
              )}20`,
              color: getRiskColor(
                currentData.risk
              ),
              fontSize: "9px",
              fontWeight: "900",
            }}
          >
            {getRiskLabel(currentData.risk)}
          </span>
        </div>

        {/* RISK CHANGE */}

        <div
          style={{
            background:
              "linear-gradient(145deg, #105666, #0A3323)",
            border:
              "1px solid rgba(131,153,88,0.22)",
            borderRadius: "18px",
            padding: "20px",
          }}
        >
          <p
            style={{
              color: "#84927A",
              fontSize: "10px",
              fontWeight: "900",
              margin: "0 0 8px",
              letterSpacing: "1px",
            }}
          >
            RECENT CHANGE
          </p>

          <strong
            style={{
              color:
                riskIncrease > 0
                  ? "#D3968C"
                  : "#839958",
              fontSize: "28px",
            }}
          >
            {riskIncrease >= 0 ? "+" : ""}
            {riskIncrease}
          </strong>

          <p
            style={{
              color: "#89977C",
              fontSize: "10px",
              margin: "7px 0 0",
            }}
          >
            Risk score change since last reading
          </p>
        </div>

        {/* RAINFALL */}

        <div
          style={{
            background:
              "linear-gradient(145deg, #105666, #0A3323)",
            border:
              "1px solid rgba(131,153,88,0.22)",
            borderRadius: "18px",
            padding: "20px",
          }}
        >
          <p
            style={{
              color: "#84927A",
              fontSize: "10px",
              fontWeight: "900",
              margin: "0 0 8px",
              letterSpacing: "1px",
            }}
          >
            RAINFALL
          </p>

          <strong
            style={{
              color: "#F7F4D5",
              fontSize: "28px",
            }}
          >
            {currentData.rainfall}
          </strong>

          <span
            style={{
              color: "#839958",
              fontSize: "11px",
              marginLeft: "5px",
              fontWeight: "800",
            }}
          >
            mm
          </span>

          <p
            style={{
              color: "#89977C",
              fontSize: "10px",
              margin: "7px 0 0",
            }}
          >
            Recorded environmental rainfall
          </p>
        </div>

        {/* SOIL MOISTURE */}

        <div
          style={{
            background:
              "linear-gradient(145deg, #105666, #0A3323)",
            border:
              "1px solid rgba(131,153,88,0.22)",
            borderRadius: "18px",
            padding: "20px",
          }}
        >
          <p
            style={{
              color: "#84927A",
              fontSize: "10px",
              fontWeight: "900",
              margin: "0 0 8px",
              letterSpacing: "1px",
            }}
          >
            SOIL MOISTURE
          </p>

          <strong
            style={{
              color: "#F7F4D5",
              fontSize: "28px",
            }}
          >
            {currentData.soil}
          </strong>

          <span
            style={{
              color: "#839958",
              fontSize: "11px",
              marginLeft: "3px",
              fontWeight: "800",
            }}
          >
            %
          </span>

          <p
            style={{
              color: "#89977C",
              fontSize: "10px",
              margin: "7px 0 0",
            }}
          >
            Current ground saturation level
          </p>
        </div>
      </div>

      {/* =====================================
          SELECTED ZONE INFO
      ===================================== */}

      {selectedZone && (
        <div
          style={{
            marginBottom: "15px",
            padding: "12px 16px",
            borderRadius: "12px",
            background:
              "rgba(131,153,88,0.08)",
            border:
              "1px solid rgba(131,153,88,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "15px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <span
              style={{
                color: "#839958",
                fontSize: "9px",
                fontWeight: "900",
                letterSpacing: "1.5px",
              }}
            >
              TIMELINE FOR ZONE
            </span>

            <div
              style={{
                color: "#F7F4D5",
                fontSize: "15px",
                fontWeight: "800",
                marginTop: "3px",
              }}
            >
              {selectedZone.name}
            </div>
          </div>

          <div
            style={{
              color: "#839958",
              background:
                "rgba(131,153,88,0.12)",
              border:
                "1px solid rgba(131,153,88,0.3)",
              padding: "7px 12px",
              borderRadius: "7px",
              fontSize: "11px",
              fontWeight: "900",
              letterSpacing: "0.7px",
            }}
          >
            ZONE ID: {selectedZone.id}
          </div>
        </div>
      )}

      {/* =====================================
          CHART
      ===================================== */}

      <div
        style={{
          background:
            "linear-gradient(145deg, #105666, #0A3323)",
          border:
            "1px solid rgba(131,153,88,0.22)",
          borderRadius: "22px",
          padding: "25px",
          marginBottom: "20px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "18px",
            gap: "15px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h3
              style={{
                color: "#F7F4D5",
                fontSize: "19px",
                margin: 0,
              }}
            >
              📈 Risk Progression
            </h3>

            <p
              style={{
                color: "#7F8C72",
                fontSize: "11px",
                margin: "5px 0 0",
              }}
            >
              AI risk score measured throughout the day
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
            }}
          >
            <span
              style={{
                width: "9px",
                height: "9px",
                borderRadius: "50%",
                background: "#D3968C",
                boxShadow:
                  "0 0 10px rgba(211,150,140,0.7)",
              }}
            />

            <span
              style={{
                color: "#D3968C",
                fontSize: "10px",
                fontWeight: "900",
              }}
            >
              RISK SCORE
            </span>
          </div>
        </div>

        <div
          style={{
            width: "100%",
            overflowX: "auto",
          }}
        >
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            width="100%"
            style={{
              minWidth: "650px",
              display: "block",
            }}
          >
            {/* GRID LINES */}

            {[0, 20, 40, 60, 80, 100].map(
              (value) => {
                const y = getY(value);

                return (
                  <g key={value}>
                    <line
                      x1={leftPadding}
                      y1={y}
                      x2={chartWidth - rightPadding}
                      y2={y}
                      stroke="rgba(247,244,213,0.08)"
                      strokeWidth="1"
                    />

                    <text
                      x="5"
                      y={y + 4}
                      fill="#75836D"
                      fontSize="10"
                    >
                      {value}
                    </text>
                  </g>
                );
              }
            )}

            {/* HIGH-RISK AREA */}

            <rect
              x={leftPadding}
              y={getY(100)}
              width={usableWidth}
              height={
                getY(70) -
                getY(100)
              }
              fill="rgba(211,150,140,0.05)"
              rx="4"
            />

            {/* AREA UNDER LINE */}

            <polygon
              points={areaPoints}
              fill="rgba(131,153,88,0.08)"
            />

            {/* RISK LINE */}

            <polyline
              points={points}
              fill="none"
              stroke="#839958"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* DATA POINTS */}

            {timelineData.map(
              (item, index) => {
                const x = getX(index);
                const y = getY(item.risk);

                const isSelected =
                  selectedPoint?.time ===
                  item.time;

                return (
                  <g key={item.time}>
                    <circle
                      cx={x}
                      cy={y}
                      r={
                        isSelected
                          ? 9
                          : 6
                      }
                      fill="rgba(211,150,140,0.12)"
                    />

                    <circle
                      cx={x}
                      cy={y}
                      r={
                        isSelected
                          ? 5
                          : 4
                      }
                      fill={getRiskColor(
                        item.risk
                      )}
                      stroke="#0A3323"
                      strokeWidth="2"
                      style={{
                        cursor:
                          "pointer",
                      }}
                      onClick={() =>
                        setSelectedPoint(
                          item
                        )
                      }
                    />

                    <text
                      x={x}
                      y={
                        chartHeight -
                        14
                      }
                      textAnchor="middle"
                      fill="#89977C"
                      fontSize="10"
                    >
                      {item.time}
                    </text>
                  </g>
                );
              }
            )}

            {/* CURRENT LABEL */}

            <text
              x={getX(
                timelineData.length - 1
              )}
              y={
                getY(
                  currentData.risk
                ) - 16
              }
              textAnchor="middle"
              fill={getRiskColor(
                currentData.risk
              )}
              fontSize="10"
              fontWeight="bold"
            >
              CURRENT
            </text>
          </svg>
        </div>

        {/* SELECTED POINT */}

        {selectedPoint && (
          <div
            style={{
              marginTop: "10px",
              padding: "14px",
              borderRadius: "12px",
              background:
                "rgba(131,153,88,0.08)",
              border:
                "1px solid rgba(131,153,88,0.2)",
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: "15px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <span
                style={{
                  color: "#839958",
                  fontSize: "10px",
                  fontWeight: "900",
                }}
              >
                {selectedPoint.time}
              </span>

              <p
                style={{
                  color: "#F7F4D5",
                  margin: "5px 0 0",
                  fontSize: "12px",
                  fontWeight: "700",
                }}
              >
                {selectedPoint.event}
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: "20px",
              }}
            >
              <span
                style={{
                  color: "#D3968C",
                  fontSize: "11px",
                  fontWeight: "900",
                }}
              >
                Risk {selectedPoint.risk}
              </span>

              <span
                style={{
                  color: "#B8C3A0",
                  fontSize: "11px",
                }}
              >
                Rain{" "}
                {selectedPoint.rainfall} mm
              </span>

              <span
                style={{
                  color: "#B8C3A0",
                  fontSize: "11px",
                }}
              >
                Soil{" "}
                {selectedPoint.soil}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* =====================================
          TREND ANALYSIS
      ===================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
        }}
      >
        {/* AI INTERPRETATION */}

        <div
          style={{
            background:
              "linear-gradient(145deg, #105666, #0A3323)",
            border:
              "1px solid rgba(131,153,88,0.22)",
            borderRadius: "20px",
            padding: "24px",
          }}
        >
          <p
            style={{
              color: "#839958",
              fontSize: "10px",
              fontWeight: "900",
              letterSpacing: "1.5px",
              margin: "0 0 8px",
            }}
          >
            AI TREND INTERPRETATION
          </p>

          <h3
            style={{
              color: "#F7F4D5",
              fontSize: "19px",
              margin: "0 0 12px",
            }}
          >
            {riskIncrease > 0
              ? "⚠️ Risk is increasing"
              : "✓ Risk is stable"}
          </h3>

          <p
            style={{
              color: "#9FAC8E",
              fontSize: "12px",
              lineHeight: "1.7",
              margin: 0,
            }}
          >
            The risk score has changed from{" "}
            <strong
              style={{
                color: "#F7F4D5",
              }}
            >
              {timelineData[0].risk}
            </strong>{" "}
            to{" "}
            <strong
              style={{
                color:
                  getRiskColor(
                    currentData.risk
                  ),
              }}
            >
              {currentData.risk}
            </strong>
            . Environmental conditions
            including rainfall and soil
            moisture are contributing to the
            current risk trend.
          </p>

          <div
            style={{
              marginTop: "17px",
              padding: "12px",
              borderRadius: "10px",
              background:
                "rgba(211,150,140,0.08)",
              border:
                "1px solid rgba(211,150,140,0.2)",
            }}
          >
            <span
              style={{
                color: "#D3968C",
                fontSize: "10px",
                fontWeight: "900",
              }}
            >
              RECOMMENDATION
            </span>

            <p
              style={{
                color: "#B8C3A0",
                fontSize: "11px",
                lineHeight: "1.5",
                margin: "5px 0 0",
              }}
            >
              {currentData.risk >= 70
                ? "Maintain enhanced monitoring and be prepared to activate emergency response procedures."
                : currentData.risk >= 40
                ? "Continue close monitoring of environmental conditions and prepare for possible escalation."
                : "Continue routine monitoring and collect additional environmental observations."}
            </p>
          </div>
        </div>

        {/* MONITORING STATUS */}

        <div
          style={{
            background:
              "linear-gradient(145deg, #105666, #0A3323)",
            border:
              "1px solid rgba(131,153,88,0.22)",
            borderRadius: "20px",
            padding: "24px",
          }}
        >
          <p
            style={{
              color: "#839958",
              fontSize: "10px",
              fontWeight: "900",
              letterSpacing: "1.5px",
              margin: "0 0 8px",
            }}
          >
            MONITORING STATUS
          </p>

          <h3
            style={{
              color: "#F7F4D5",
              fontSize: "19px",
              margin: "0 0 17px",
            }}
          >
            Live Environmental Signals
          </h3>

          {[
            {
              label: "Rainfall",
              value:
                currentData.rainfall,
              unit: "mm",
              status:
                currentData.rainfall >=
                150
                  ? "HIGH"
                  : currentData.rainfall >=
                    80
                  ? "RISING"
                  : "NORMAL",
              color:
                currentData.rainfall >=
                150
                  ? "#D3968C"
                  : currentData.rainfall >=
                    80
                  ? "#D9A441"
                  : "#839958",
            },

            {
              label: "Soil Moisture",
              value:
                currentData.soil,
              unit: "%",
              status:
                currentData.soil >=
                75
                  ? "HIGH"
                  : currentData.soil >=
                    50
                  ? "RISING"
                  : "NORMAL",
              color:
                currentData.soil >=
                75
                  ? "#D3968C"
                  : currentData.soil >=
                    50
                  ? "#D9A441"
                  : "#839958",
            },

            {
              label: "Risk Score",
              value:
                currentData.risk,
              unit: "/100",
              status:
                getRiskLabel(
                  currentData.risk
                ),
              color:
                getRiskColor(
                  currentData.risk
                ),
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                marginBottom: "13px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                  marginBottom: "6px",
                }}
              >
                <span
                  style={{
                    color: "#AAB69A",
                    fontSize: "11px",
                  }}
                >
                  {item.label}
                </span>

                <span
                  style={{
                    color: item.color,
                    fontSize: "9px",
                    fontWeight: "900",
                  }}
                >
                  {item.status}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems:
                    "baseline",
                  gap: "5px",
                }}
              >
                <strong
                  style={{
                    color: "#F7F4D5",
                    fontSize: "19px",
                  }}
                >
                  {item.value}
                </strong>

                <span
                  style={{
                    color: "#7F8C72",
                    fontSize: "10px",
                  }}
                >
                  {item.unit}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =====================================
          NOTICE
      ===================================== */}

      <p
        style={{
          color: "#7F8C72",
          fontSize: "11px",
          marginTop: "14px",
          textAlign: "right",
        }}
      >
        * Timeline values currently use
        demonstration data and will later
        connect to GET /api/timeline using
        the selected Zone ID.
      </p>
    </section>
  );
}

export default RiskTimeline;