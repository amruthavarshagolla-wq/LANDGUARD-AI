import { useState } from "react";

function RiskTimeline() {
  const [selectedPoint, setSelectedPoint] = useState(null);

  // Demo historical monitoring data.
  // Later this can come from the backend.
  const timelineData = [
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

  const currentData = timelineData[timelineData.length - 1];
  const previousData = timelineData[timelineData.length - 2];

  const riskIncrease = currentData.risk - previousData.risk;

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

  /*
   * Convert the data into SVG coordinates.
   * This gives us a lightweight chart without
   * installing another chart library.
   */
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
    if (timelineData.length === 1) return leftPadding;

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
                color: "#D3968C",
                fontSize: "31px",
              }}
            >
              {currentData.risk}
            </strong>

            <span
              style={{
                color: "#D3968C",
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
              background: "rgba(211,150,140,0.12)",
              color: "#D3968C",
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
              color: "#D3968C",
              fontSize: "28px",
            }}
          >
            +{riskIncrease}
          </strong>

          <p
            style={{
              color: "#89977C",
              fontSize: "10px",
              margin: "7px 0 0",
            }}
          >
            Risk score increase since last reading
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
            {/* =================================
                GRID LINES
            ================================= */}

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

            {/* =================================
                HIGH-RISK AREA
            ================================= */}

            <rect
              x={leftPadding}
              y={getY(100)}
              width={usableWidth}
              height={getY(70) - getY(100)}
              fill="rgba(211,150,140,0.05)"
              rx="4"
            />

            {/* =================================
                AREA UNDER LINE
            ================================= */}

            <polygon
              points={areaPoints}
              fill="rgba(131,153,88,0.08)"
            />

            {/* =================================
                RISK LINE
            ================================= */}

            <polyline
              points={points}
              fill="none"
              stroke="#839958"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* =================================
                DATA POINTS
            ================================= */}

            {timelineData.map((item, index) => {
              const x = getX(index);
              const y = getY(item.risk);
              const isSelected =
                selectedPoint?.time === item.time;

              return (
                <g key={item.time}>
                  {/* Outer glow */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 9 : 6}
                    fill="rgba(211,150,140,0.12)"
                  />

                  {/* Point */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 5 : 4}
                    fill={getRiskColor(item.risk)}
                    stroke="#0A3323"
                    strokeWidth="2"
                    style={{
                      cursor: "pointer",
                    }}
                    onClick={() =>
                      setSelectedPoint(item)
                    }
                  />

                  {/* Time */}
                  <text
                    x={x}
                    y={chartHeight - 14}
                    textAnchor="middle"
                    fill="#89977C"
                    fontSize="10"
                  >
                    {item.time}
                  </text>
                </g>
              );
            })}

            {/* CURRENT LABEL */}

            <text
              x={getX(timelineData.length - 1)}
              y={getY(currentData.risk) - 16}
              textAnchor="middle"
              fill="#D3968C"
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
              justifyContent: "space-between",
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
                Rain {selectedPoint.rainfall} mm
              </span>

              <span
                style={{
                  color: "#B8C3A0",
                  fontSize: "11px",
                }}
              >
                Soil {selectedPoint.soil}%
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
            ⚠️ Risk is increasing
          </h3>

          <p
            style={{
              color: "#9FAC8E",
              fontSize: "12px",
              lineHeight: "1.7",
              margin: 0,
            }}
          >
            The risk score has increased from{" "}
            <strong style={{ color: "#F7F4D5" }}>
              {timelineData[0].risk}
            </strong>{" "}
            to{" "}
            <strong style={{ color: "#D3968C" }}>
              {currentData.risk}
            </strong>
            . Rising rainfall and increasing soil moisture
            are contributing to the upward risk trend.
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
              Maintain enhanced monitoring and be prepared
              to activate emergency response procedures.
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
              value: currentData.rainfall,
              unit: "mm",
              status: "RISING",
              color: "#D3968C",
            },
            {
              label: "Soil Moisture",
              value: currentData.soil,
              unit: "%",
              status: "HIGH",
              color: "#D9A441",
            },
            {
              label: "Risk Score",
              value: currentData.risk,
              unit: "/100",
              status: "HIGH",
              color: "#D3968C",
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
                  justifyContent: "space-between",
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
                  alignItems: "baseline",
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
        * Timeline values currently use demonstration data
        and will later connect to historical backend data.
      </p>
    </section>
  );
}

export default RiskTimeline;