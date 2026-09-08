import { useState, useEffect } from "react";
import { getDashboardSummary } from "../lib/api";

function ImpactAnalysis() {
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const [categories, setCategories] = useState([
    {
      key: "population",
      label: "Population",
      icon: "👥",
      value: "22,240",
      description: "People potentially exposed",
      percentage: 78,
    },
    {
      key: "infrastructure",
      label: "Infrastructure",
      icon: "🏥",
      value: "74",
      description: "Critical facilities at risk",
      percentage: 65,
    },
    {
      key: "transportation",
      label: "Transportation",
      icon: "🛣️",
      value: "13,685",
      description: "Road segments monitored",
      percentage: 54,
    },
    {
      key: "agriculture",
      label: "Agriculture",
      icon: "🌾",
      value: "42%",
      description: "Agricultural exposure",
      percentage: 42,
    },
  ]);

  useEffect(() => {
    getDashboardSummary()
      .then((res) => {
        if (res && res.data) {
          const d = res.data;
          setCategories([
            {
              key: "population",
              label: "Population",
              icon: "👥",
              value: d.population_exposed ? d.population_exposed.toLocaleString() : "22,240",
              description: "People in high-risk zones",
              percentage: 78,
            },
            {
              key: "infrastructure",
              label: "Infrastructure",
              icon: "🏥",
              value: d.infrastructure ? d.infrastructure.total.toString() : "74",
              description: "Hospitals & schools monitored",
              percentage: 65,
            },
            {
              key: "transportation",
              label: "Transportation",
              icon: "🛣️",
              value: d.infrastructure ? d.infrastructure.road_segments.toLocaleString() : "13,685",
              description: "Road segments monitored",
              percentage: 54,
            },
            {
              key: "agriculture",
              label: "Agriculture",
              icon: "🌾",
              value: "42%",
              description: "Sloping agricultural terrain",
              percentage: 42,
            },
          ]);
        }
      })
      .catch((err) => console.warn("Could not fetch impact summary:", err));
  }, []);

  const responseActions = [
    {
      priority: "CRITICAL",
      title: "Prepare Emergency Response",
      description:
        "Activate emergency response teams and prepare evacuation resources for high-risk zones.",
      icon: "🚨",
    },
    {
      priority: "HIGH",
      title: "Monitor Critical Infrastructure",
      description:
        "Increase monitoring around hospitals, roads and other essential infrastructure.",
      icon: "🏥",
    },
    {
      priority: "HIGH",
      title: "Review Evacuation Routes",
      description:
        "Check alternate transportation routes in areas where roads are exposed to landslide risk.",
      icon: "🛣️",
    },
    {
      priority: "MEDIUM",
      title: "Continue Field Monitoring",
      description:
        "Collect additional field observations to improve situational awareness.",
      icon: "📡",
    },
  ];

  const visibleActions =
    selectedCategory === "ALL"
      ? responseActions
      : responseActions.filter((action) => {
          if (selectedCategory === "CRITICAL") {
            return action.priority === "CRITICAL";
          }

          if (selectedCategory === "HIGH") {
            return action.priority === "HIGH";
          }

          return action.priority === selectedCategory;
        });

  return (
    <section
      id="impact"
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
          DISASTER RESPONSE INTELLIGENCE
        </p>

        <h2
          style={{
            color: "#F7F4D5",
            fontSize: "30px",
            margin: 0,
            fontWeight: "800",
          }}
        >
          Impact & Response Analysis
        </h2>

        <p
          style={{
            color: "#B8C3A0",
            fontSize: "15px",
            marginTop: "7px",
          }}
        >
          Assess potential damage and prioritize emergency response actions.
        </p>
      </div>

      {/* =====================================
          TOP IMPACT SUMMARY
      ===================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.3fr 0.7fr",
          gap: "20px",
          marginBottom: "20px",
        }}
      >
        {/* IMPACT SCORE */}

        <div
          style={{
            position: "relative",
            overflow: "hidden",
            background:
              "linear-gradient(145deg, #105666, #0A3323)",
            border: "1px solid rgba(211,150,140,0.3)",
            borderRadius: "22px",
            padding: "28px",
            minHeight: "220px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: "220px",
              height: "220px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(211,150,140,0.13), transparent 70%)",
              right: "-60px",
              top: "-70px",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "20px",
              position: "relative",
              zIndex: 1,
            }}
          >
            <div>
              <p
                style={{
                  color: "#B8C3A0",
                  fontSize: "12px",
                  fontWeight: "800",
                  letterSpacing: "1.5px",
                  margin: "0 0 10px",
                }}
              >
                OVERALL IMPACT ASSESSMENT
              </p>

              <h3
                style={{
                  color: "#F7F4D5",
                  fontSize: "25px",
                  margin: "0 0 8px",
                }}
              >
                Very High Impact
              </h3>

              <p
                style={{
                  color: "#9FAC8E",
                  fontSize: "13px",
                  lineHeight: "1.6",
                  maxWidth: "480px",
                  margin: 0,
                }}
              >
                Multiple population, infrastructure and transportation
                assets are exposed to potential landslide impact.
              </p>

              <div
                style={{
                  marginTop: "18px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 12px",
                  borderRadius: "999px",
                  background: "rgba(211,150,140,0.13)",
                  border: "1px solid rgba(211,150,140,0.35)",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#D3968C",
                    boxShadow: "0 0 10px rgba(211,150,140,0.8)",
                  }}
                />

                <span
                  style={{
                    color: "#D3968C",
                    fontSize: "11px",
                    fontWeight: "900",
                  }}
                >
                  RESPONSE PRIORITY: CRITICAL
                </span>
              </div>
            </div>

            {/* SCORE CIRCLE */}

            <div
              style={{
                minWidth: "145px",
                height: "145px",
                borderRadius: "50%",
                background:
                  "conic-gradient(#D3968C 0deg 309.6deg, rgba(247,244,213,0.08) 309.6deg 360deg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 35px rgba(211,150,140,0.13)",
              }}
            >
              <div
                style={{
                  width: "113px",
                  height: "113px",
                  borderRadius: "50%",
                  background: "#0A3323",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <strong
                  style={{
                    color: "#F7F4D5",
                    fontSize: "35px",
                    lineHeight: 1,
                  }}
                >
                  86
                </strong>

                <span
                  style={{
                    color: "#D3968C",
                    fontSize: "10px",
                    fontWeight: "900",
                    marginTop: "6px",
                  }}
                >
                  IMPACT SCORE
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RESPONSE STATUS */}

        <div
          style={{
            background:
              "linear-gradient(145deg, rgba(16,86,102,0.9), rgba(10,51,35,0.98))",
            border: "1px solid rgba(131,153,88,0.25)",
            borderRadius: "22px",
            padding: "25px",
          }}
        >
          <p
            style={{
              color: "#839958",
              fontSize: "11px",
              fontWeight: "900",
              letterSpacing: "1.5px",
              margin: "0 0 10px",
            }}
          >
            RESPONSE STATUS
          </p>

          <h3
            style={{
              color: "#F7F4D5",
              margin: "0 0 18px",
              fontSize: "21px",
            }}
          >
            🚨 Critical Priority
          </h3>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "13px",
            }}
          >
            {[
              ["Population Exposure", "HIGH"],
              ["Infrastructure Risk", "HIGH"],
              ["Road Accessibility", "MEDIUM"],
              ["Agricultural Impact", "MEDIUM"],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingBottom: "10px",
                  borderBottom:
                    "1px solid rgba(247,244,213,0.07)",
                }}
              >
                <span
                  style={{
                    color: "#AAB69A",
                    fontSize: "11px",
                  }}
                >
                  {label}
                </span>

                <strong
                  style={{
                    color:
                      value === "HIGH"
                        ? "#D3968C"
                        : "#D9A441",
                    fontSize: "10px",
                  }}
                >
                  {value}
                </strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* =====================================
          EXPOSURE CARDS
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
        {categories.map((item) => (
          <div
            key={item.key}
            style={{
              background:
                "linear-gradient(145deg, #105666, #0A3323)",
              border: "1px solid rgba(131,153,88,0.22)",
              borderRadius: "18px",
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
              <span
                style={{
                  width: "38px",
                  height: "38px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "11px",
                  background: "rgba(131,153,88,0.1)",
                  fontSize: "19px",
                }}
              >
                {item.icon}
              </span>

              <span
                style={{
                  color: "#839958",
                  fontSize: "10px",
                  fontWeight: "900",
                }}
              >
                {item.percentage}% EXPOSURE
              </span>
            </div>

            <p
              style={{
                color: "#91A087",
                fontSize: "11px",
                margin: "0 0 4px",
              }}
            >
              {item.label}
            </p>

            <strong
              style={{
                color: "#F7F4D5",
                fontSize: "26px",
              }}
            >
              {item.value}
            </strong>

            <p
              style={{
                color: "#7F8C72",
                fontSize: "10px",
                margin: "5px 0 13px",
              }}
            >
              {item.description}
            </p>

            <div
              style={{
                height: "5px",
                background: "rgba(247,244,213,0.08)",
                borderRadius: "999px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${item.percentage}%`,
                  height: "100%",
                  borderRadius: "999px",
                  background:
                    item.percentage >= 70
                      ? "#D3968C"
                      : item.percentage >= 50
                      ? "#D9A441"
                      : "#839958",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* =====================================
          IMPACT BREAKDOWN + RESPONSE ACTIONS
      ===================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "0.9fr 1.1fr",
          gap: "20px",
        }}
      >
        {/* BREAKDOWN */}

        <div
          style={{
            background:
              "linear-gradient(145deg, #105666, #0A3323)",
            border: "1px solid rgba(131,153,88,0.22)",
            borderRadius: "20px",
            padding: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "22px",
            }}
          >
            <div>
              <h3
                style={{
                  color: "#F7F4D5",
                  fontSize: "18px",
                  margin: 0,
                }}
              >
                Impact Breakdown
              </h3>

              <p
                style={{
                  color: "#7F8C72",
                  fontSize: "11px",
                  margin: "5px 0 0",
                }}
              >
                Relative exposure across sectors
              </p>
            </div>

            <span
              style={{
                color: "#839958",
                fontSize: "10px",
                fontWeight: "900",
              }}
            >
              LIVE MODEL
            </span>
          </div>

          {categories.map((item) => (
            <div
              key={item.key}
              style={{
                marginBottom: "19px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "7px",
                }}
              >
                <span
                  style={{
                    color: "#C0C8B1",
                    fontSize: "12px",
                  }}
                >
                  {item.icon} {item.label}
                </span>

                <strong
                  style={{
                    color: "#F7F4D5",
                    fontSize: "12px",
                  }}
                >
                  {item.percentage}%
                </strong>
              </div>

              <div
                style={{
                  height: "8px",
                  background: "rgba(247,244,213,0.07)",
                  borderRadius: "999px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${item.percentage}%`,
                    height: "100%",
                    borderRadius: "999px",
                    background:
                      item.percentage >= 70
                        ? "#D3968C"
                        : item.percentage >= 50
                        ? "#D9A441"
                        : "#839958",
                  }}
                />
              </div>
            </div>
          ))}

          <div
            style={{
              marginTop: "25px",
              padding: "13px",
              borderRadius: "11px",
              background: "rgba(131,153,88,0.07)",
              border:
                "1px solid rgba(131,153,88,0.16)",
            }}
          >
            <p
              style={{
                color: "#839958",
                fontSize: "10px",
                fontWeight: "900",
                margin: "0 0 5px",
              }}
            >
              ANALYSIS
            </p>

            <p
              style={{
                color: "#9FAC8E",
                fontSize: "11px",
                lineHeight: "1.5",
                margin: 0,
              }}
            >
              Population exposure is currently the dominant
              impact factor, followed by critical infrastructure
              and transportation accessibility.
            </p>
          </div>
        </div>

        {/* RESPONSE ACTIONS */}

        <div
          style={{
            background:
              "linear-gradient(145deg, #105666, #0A3323)",
            border: "1px solid rgba(131,153,88,0.22)",
            borderRadius: "20px",
            padding: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
              marginBottom: "18px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h3
                style={{
                  color: "#F7F4D5",
                  fontSize: "18px",
                  margin: 0,
                }}
              >
                Recommended Response
              </h3>

              <p
                style={{
                  color: "#7F8C72",
                  fontSize: "11px",
                  margin: "5px 0 0",
                }}
              >
                AI-assisted authority action priorities
              </p>
            </div>

            {/* FILTERS */}

            <div
              style={{
                display: "flex",
                gap: "5px",
                flexWrap: "wrap",
              }}
            >
              {["ALL", "CRITICAL", "HIGH"].map((filter) => (
                <button
                  key={filter}
                  onClick={() =>
                    setSelectedCategory(filter)
                  }
                  style={{
                    border:
                      selectedCategory === filter
                        ? "1px solid rgba(131,153,88,0.6)"
                        : "1px solid rgba(247,244,213,0.08)",
                    background:
                      selectedCategory === filter
                        ? "rgba(131,153,88,0.15)"
                        : "rgba(247,244,213,0.03)",
                    color:
                      selectedCategory === filter
                        ? "#839958"
                        : "#87957D",
                    borderRadius: "7px",
                    padding: "6px 9px",
                    fontSize: "9px",
                    fontWeight: "900",
                    cursor: "pointer",
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {visibleActions.map((action, index) => (
              <div
                key={`${action.title}-${index}`}
                style={{
                  display: "flex",
                  gap: "13px",
                  padding: "13px",
                  borderRadius: "12px",
                  background:
                    "rgba(10,51,35,0.48)",
                  border:
                    "1px solid rgba(247,244,213,0.06)",
                }}
              >
                <div
                  style={{
                    minWidth: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      action.priority === "CRITICAL"
                        ? "rgba(211,150,140,0.12)"
                        : "rgba(217,164,65,0.1)",
                    fontSize: "17px",
                  }}
                >
                  {action.icon}
                </div>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "10px",
                      alignItems: "center",
                    }}
                  >
                    <strong
                      style={{
                        color: "#F7F4D5",
                        fontSize: "12px",
                      }}
                    >
                      {action.title}
                    </strong>

                    <span
                      style={{
                        color:
                          action.priority === "CRITICAL"
                            ? "#D3968C"
                            : "#D9A441",
                        fontSize: "9px",
                        fontWeight: "900",
                      }}
                    >
                      {action.priority}
                    </span>
                  </div>

                  <p
                    style={{
                      color: "#89977C",
                      fontSize: "10px",
                      lineHeight: "1.5",
                      margin: "5px 0 0",
                    }}
                  >
                    {action.description}
                  </p>
                </div>
              </div>
            ))}

            {visibleActions.length === 0 && (
              <div
                style={{
                  padding: "25px",
                  textAlign: "center",
                  color: "#7F8C72",
                  fontSize: "12px",
                }}
              >
                No response actions found.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =====================================
          DATA NOTICE
      ===================================== */}

      <p
        style={{
          color: "#7F8C72",
          fontSize: "11px",
          marginTop: "14px",
          textAlign: "right",
        }}
      >
        * Impact values currently use demonstration data and
        will later be connected to GET /api/impact.
      </p>
    </section>
  );
}

export default ImpactAnalysis;