import { useEffect, useState } from "react";

const API_BASE = "http://localhost:5000";

function ImpactAnalysis() {
  const [impactData, setImpactData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("ALL");

  const fetchImpactData = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/api/impact`
      );

      const data = await response.json();

      console.log(
        "LANDGUARD impact response:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Unable to load impact data."
        );
      }

      const result =
        data.data &&
        typeof data.data === "object"
          ? data.data
          : data;

      setImpactData(result);
    } catch (err) {
      console.error(
        "LANDGUARD impact error:",
        err
      );

      setError(
        err.message ||
          "Unable to connect to impact analysis service."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImpactData();
  }, []);

  const population =
    Number(
      impactData?.population_exposed
    ) || 0;

  const villages =
    Number(
      impactData?.villages_affected
    ) || 0;

  const infrastructure =
    impactData?.infrastructure || {};

  const hospitals =
    Number(infrastructure.hospitals) || 0;

  const bridges =
    Number(infrastructure.bridges) || 0;

  const schools =
    Number(infrastructure.schools) || 0;

  const roads =
    Number(infrastructure.roads) || 0;

  const infrastructureTotal =
    Number(infrastructure.total) || 0;

  const fieldReports =
    impactData?.field_reports || {};

  const totalReports =
    Number(fieldReports.total) || 0;

  const criticalReports =
    Number(fieldReports.critical) || 0;

  const verifiedReports =
    Number(fieldReports.verified) || 0;

  const riskZones =
    impactData?.risk_zones || {};

  const totalRiskZones =
    Number(riskZones.total) || 0;

  const criticalRiskZones =
    Number(riskZones.critical) || 0;

  const maximumRiskScore =
    Number(
      riskZones.maximum_risk_score
    ) || 0;

  const activeAlerts =
    Number(
      impactData?.active_alerts
    ) || 0;

  const priorityResults =
    Number(
      impactData?.priority_results
    ) || 0;

  const populationScore =
    Number(
      impactData?.population_score
    ) || 0;

  const villageScore =
    Number(
      impactData?.village_score
    ) || 0;

  const infrastructureScore =
    Number(
      impactData?.infrastructure_score
    ) || 0;

  /*
   * Build cards from REAL backend data.
   */
  const categories = [
    {
      key: "population",
      label: "Population",
      icon: "👥",
      value: population.toLocaleString(),
      description:
        "People potentially exposed",
      percentage: populationScore,
    },

    {
      key: "villages",
      label: "Villages",
      icon: "🏘️",
      value: villages.toLocaleString(),
      description:
        "Villages within monitored area",
      percentage: villageScore,
    },

    {
      key: "infrastructure",
      label: "Infrastructure",
      icon: "🏥",
      value:
        infrastructureTotal.toLocaleString(),
      description:
        "Critical assets and roads",
      percentage: infrastructureScore,
    },

    {
      key: "risk",
      label: "Risk Zones",
      icon: "⚠️",
      value:
        totalRiskZones.toLocaleString(),
      description:
        "Monitored landslide risk zones",
      percentage:
        totalRiskZones > 0
          ? Math.min(
              (criticalRiskZones /
                totalRiskZones) *
                100,
              100
            )
          : 0,
    },
  ];

  /*
   * These response actions are generated
   * from the real backend numbers.
   */
  const responseActions = [];

  if (criticalRiskZones > 0) {
    responseActions.push({
      priority: "CRITICAL",
      title:
        "Review Critical Risk Zones",
      description:
        `${criticalRiskZones} high-priority risk zone(s) require immediate monitoring and response planning.`,
      icon: "🚨",
    });
  }

  if (activeAlerts > 0) {
    responseActions.push({
      priority: "CRITICAL",
      title:
        "Review Active Alerts",
      description:
        `${activeAlerts} active alert(s) are currently recorded in the LANDGUARD system.`,
      icon: "🔔",
    });
  }

  if (infrastructureTotal > 0) {
    responseActions.push({
      priority: "HIGH",
      title:
        "Monitor Critical Infrastructure",
      description:
        `${infrastructureTotal} infrastructure asset(s) and road segment(s) are included in the current impact assessment.`,
      icon: "🏥",
    });
  }

  if (roads > 0) {
    responseActions.push({
      priority: "HIGH",
      title:
        "Review Transportation Routes",
      description:
        `${roads} road record(s) are available for transportation impact assessment.`,
      icon: "🛣️",
    });
  }

  if (totalReports > 0) {
    responseActions.push({
      priority: "MEDIUM",
      title:
        "Continue Field Monitoring",
      description:
        `${totalReports} field report(s) have been submitted. ${verifiedReports} report(s) are verified.`,
      icon: "📡",
    });
  }

  if (priorityResults > 0) {
    responseActions.push({
      priority: "HIGH",
      title:
        "Review Response Priorities",
      description:
        `${priorityResults} priority result(s) are available for decision support.`,
      icon: "📋",
    });
  }

  const visibleActions =
    selectedCategory === "ALL"
      ? responseActions
      : responseActions.filter(
          (action) =>
            action.priority ===
            selectedCategory
        );

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
      {/* HEADER */}
      <div
        style={{
          marginBottom: "25px",
        }}
      >
        <p
          style={{
            color: "#839958",
            fontSize: "13px",
            fontWeight: "900",
            letterSpacing: "2px",
            margin: "0 0 7px",
          }}
        >
          IMPACT ASSESSMENT
        </p>

        <h2
          style={{
            color: "#F7F4D5",
            fontSize: "30px",
            margin: 0,
            fontWeight: "800",
          }}
        >
          Community & Infrastructure Impact
        </h2>

        <p
          style={{
            color: "#B8C3A0",
            marginTop: "7px",
            fontSize: "15px",
          }}
        >
          Understand the people, villages and
          infrastructure potentially affected by
          landslide risk.
        </p>
      </div>

      {/* LOADING */}
      {loading && (
        <div
          style={{
            padding: "30px",
            borderRadius: "18px",
            background:
              "rgba(10,51,35,0.75)",
            border:
              "1px solid rgba(131,153,88,0.25)",
            color: "#B8C3A0",
            textAlign: "center",
          }}
        >
          Loading real impact data from
          LANDGUARD backend...
        </div>
      )}

      {/* ERROR */}
      {!loading && error && (
        <div
          style={{
            padding: "18px",
            borderRadius: "12px",
            background:
              "rgba(184,58,58,0.14)",
            border:
              "1px solid rgba(184,58,58,0.4)",
            color: "#F0B4B4",
            fontSize: "13px",
          }}
        >
          <strong>
            Impact data unavailable:
          </strong>{" "}
          {error}
        </div>
      )}

      {/* DATA */}
      {!loading && !error && impactData && (
        <>
          {/* CATEGORY CARDS */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(4, minmax(0, 1fr))",
              gap: "15px",
            }}
          >
            {categories.map((category) => {
              const isSelected =
                selectedCategory ===
                category.key;

              return (
                <button
                  key={category.key}
                  type="button"
                  onClick={() =>
                    setSelectedCategory(
                      isSelected
                        ? "ALL"
                        : category.key
                    )
                  }
                  style={{
                    textAlign: "left",
                    cursor: "pointer",
                    padding: "20px",
                    borderRadius: "16px",
                    border: isSelected
                      ? "1px solid rgba(131,153,88,0.7)"
                      : "1px solid rgba(131,153,88,0.2)",
                    background:
                      isSelected
                        ? "rgba(131,153,88,0.12)"
                        : "rgba(10,51,35,0.72)",
                    color: "#F7F4D5",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "22px",
                      }}
                    >
                      {category.icon}
                    </span>

                    <span
                      style={{
                        color: "#839958",
                        fontSize: "10px",
                        fontWeight: "900",
                      }}
                    >
                      {Math.round(
                        category.percentage
                      )}
                      %
                    </span>
                  </div>

                  <div
                    style={{
                      color: "#9FAC8E",
                      fontSize: "11px",
                      fontWeight: "800",
                      marginTop: "13px",
                    }}
                  >
                    {category.label}
                  </div>

                  <div
                    style={{
                      color: "#F7F4D5",
                      fontSize: "28px",
                      fontWeight: "900",
                      marginTop: "4px",
                    }}
                  >
                    {category.value}
                  </div>

                  <div
                    style={{
                      color: "#7F8C72",
                      fontSize: "10px",
                      marginTop: "3px",
                    }}
                  >
                    {category.description}
                  </div>

                  {/* PROGRESS */}
                  <div
                    style={{
                      height: "5px",
                      background:
                        "rgba(247,244,213,0.08)",
                      borderRadius: "999px",
                      overflow: "hidden",
                      marginTop: "15px",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(
                          Math.max(
                            category.percentage,
                            0
                          ),
                          100
                        )}%`,
                        height: "100%",
                        background:
                          "#839958",
                        borderRadius:
                          "999px",
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* DETAIL PANEL */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr",
              gap: "20px",
              marginTop: "20px",
            }}
          >
            {/* EXPOSURE DETAILS */}
            <div
              style={{
                background:
                  "linear-gradient(145deg, #105666, #0A3323)",
                border:
                  "1px solid rgba(131,153,88,0.25)",
                borderRadius: "20px",
                padding: "25px",
              }}
            >
              <h3
                style={{
                  color: "#F7F4D5",
                  fontSize: "19px",
                  margin: "0 0 18px",
                }}
              >
                Exposure Details
              </h3>

              <DetailRow
                label="Population Exposed"
                value={population.toLocaleString()}
              />

              <DetailRow
                label="Villages Affected"
                value={villages.toLocaleString()}
              />

              <DetailRow
                label="Hospitals"
                value={hospitals}
              />

              <DetailRow
                label="Bridges"
                value={bridges}
              />

              <DetailRow
                label="Schools"
                value={schools}
              />

              <DetailRow
                label="Roads"
                value={roads}
              />

              <DetailRow
                label="Total Infrastructure"
                value={infrastructureTotal}
              />
            </div>

            {/* SYSTEM STATUS */}
            <div
              style={{
                background:
                  "linear-gradient(145deg, #105666, #0A3323)",
                border:
                  "1px solid rgba(131,153,88,0.25)",
                borderRadius: "20px",
                padding: "25px",
              }}
            >
              <h3
                style={{
                  color: "#F7F4D5",
                  fontSize: "19px",
                  margin: "0 0 18px",
                }}
              >
                LANDGUARD Situation
              </h3>

              <DetailRow
                label="Total Risk Zones"
                value={totalRiskZones}
              />

              <DetailRow
                label="High/Critical Zones"
                value={criticalRiskZones}
              />

              <DetailRow
                label="Maximum Risk Score"
                value={`${maximumRiskScore}/100`}
              />

              <DetailRow
                label="Active Alerts"
                value={activeAlerts}
              />

              <DetailRow
                label="Field Reports"
                value={totalReports}
              />

              <DetailRow
                label="Verified Reports"
                value={verifiedReports}
              />

              <DetailRow
                label="Priority Results"
                value={priorityResults}
              />
            </div>
          </div>

          {/* RESPONSE ACTIONS */}
          <div
            style={{
              marginTop: "20px",
              background:
                "rgba(10,51,35,0.72)",
              border:
                "1px solid rgba(131,153,88,0.2)",
              borderRadius: "20px",
              padding: "25px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                gap: "15px",
                marginBottom: "18px",
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
                  Recommended Response Actions
                </h3>

                <p
                  style={{
                    color: "#7F8C72",
                    fontSize: "11px",
                    margin:
                      "5px 0 0",
                  }}
                >
                  Actions based on current
                  LANDGUARD system data.
                </p>
              </div>

              {/* FILTER */}
              <div
                style={{
                  display: "flex",
                  gap: "6px",
                }}
              >
                {[
                  "ALL",
                  "CRITICAL",
                  "HIGH",
                  "MEDIUM",
                ].map((priority) => (
                  <button
                    key={priority}
                    type="button"
                    onClick={() =>
                      setSelectedCategory(
                        priority
                      )
                    }
                    style={{
                      padding:
                        "7px 10px",
                      borderRadius:
                        "8px",
                      border:
                        "1px solid rgba(131,153,88,0.25)",
                      background:
                        selectedCategory ===
                        priority
                          ? "rgba(131,153,88,0.2)"
                          : "transparent",
                      color:
                        selectedCategory ===
                        priority
                          ? "#F7F4D5"
                          : "#7F8C72",
                      fontSize: "9px",
                      fontWeight: "900",
                      cursor: "pointer",
                    }}
                  >
                    {priority}
                  </button>
                ))}
              </div>
            </div>

            {/* ACTION LIST */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {visibleActions.map(
                (action, index) => (
                  <div
                    key={`${action.title}-${index}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      padding: "15px",
                      borderRadius: "12px",
                      background:
                        "rgba(0,0,0,0.12)",
                      border:
                        "1px solid rgba(247,244,213,0.07)",
                    }}
                  >
                    <div
                      style={{
                        width: "42px",
                        height: "42px",
                        flexShrink: 0,
                        borderRadius:
                          "10px",
                        display: "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        background:
                          action.priority ===
                          "CRITICAL"
                            ? "rgba(211,150,140,0.12)"
                            : action.priority ===
                              "HIGH"
                            ? "rgba(217,164,65,0.1)"
                            : "rgba(131,153,88,0.1)",
                        fontSize: "18px",
                      }}
                    >
                      {action.icon}
                    </div>

                    <div
                      style={{
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "center",
                          gap: "10px",
                        }}
                      >
                        <strong
                          style={{
                            color:
                              "#F7F4D5",
                            fontSize:
                              "12px",
                          }}
                        >
                          {action.title}
                        </strong>

                        <span
                          style={{
                            color:
                              action.priority ===
                              "CRITICAL"
                                ? "#D3968C"
                                : action.priority ===
                                  "HIGH"
                                ? "#D9A441"
                                : "#839958",
                            fontSize:
                              "9px",
                            fontWeight:
                              "900",
                          }}
                        >
                          {
                            action.priority
                          }
                        </span>
                      </div>

                      <p
                        style={{
                          color:
                            "#89977C",
                          fontSize:
                            "10px",
                          lineHeight:
                            "1.5",
                          margin:
                            "5px 0 0",
                        }}
                      >
                        {
                          action.description
                        }
                      </p>
                    </div>
                  </div>
                )
              )}

              {visibleActions.length ===
                0 && (
                <div
                  style={{
                    padding:
                      "25px",
                    textAlign:
                      "center",
                    color:
                      "#7F8C72",
                    fontSize:
                      "12px",
                  }}
                >
                  No response actions
                  found for this
                  category.
                </div>
              )}
            </div>
          </div>

          {/* DATA SOURCE */}
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              marginTop: "15px",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                color: "#839958",
                fontSize: "10px",
                fontWeight: "800",
              }}
            >
              ● LIVE BACKEND DATA
            </span>

            <span
              style={{
                color: "#7F8C72",
                fontSize: "10px",
              }}
            >
              Source: LANDGUARD PostgreSQL /
              PostGIS
            </span>
          </div>
        </>
      )}
    </section>
  );
}

/* =====================================================
   DETAIL ROW
===================================================== */

function DetailRow({
  label,
  value,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent:
          "space-between",
        alignItems: "center",
        gap: "15px",
        padding: "12px 0",
        borderBottom:
          "1px solid rgba(247,244,213,0.07)",
      }}
    >
      <span
        style={{
          color: "#8C997F",
          fontSize: "11px",
        }}
      >
        {label}
      </span>

      <strong
        style={{
          color: "#F7F4D5",
          fontSize: "12px",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

export default ImpactAnalysis;