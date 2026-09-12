import { useEffect, useState } from "react";

const API_BASE = "http://localhost:5000";

function Priority() {
  const [priorities, setPriorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPriorities = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/api/priorities`
      );

      const result = await response.json();

      console.log(
        "LANDGUARD priority response:",
        result
      );

      if (!response.ok) {
        throw new Error(
          result.error ||
            result.message ||
            "Unable to load priority data."
        );
      }

      let data = [];

      if (Array.isArray(result)) {
        data = result;
      } else if (Array.isArray(result.data)) {
        data = result.data;
      } else if (
        result.data &&
        Array.isArray(result.data.priorities)
      ) {
        data = result.data.priorities;
      } else if (Array.isArray(result.priorities)) {
        data = result.priorities;
      }

      setPriorities(data);
    } catch (err) {
      console.error(
        "LANDGUARD priority error:",
        err
      );

      setError(
        err.message ||
          "Unable to connect to priority service."
      );

      setPriorities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriorities();

    const interval = setInterval(
      fetchPriorities,
      30000
    );

    return () => {
      clearInterval(interval);
    };
  }, []);

  const getBand = (priority) => {
    const band = String(
      priority.priority_band ||
        priority.priority_level ||
        priority.band ||
        ""
    ).toUpperCase();

    if (band.includes("CRITICAL")) {
      return "CRITICAL";
    }

    if (band.includes("VERY HIGH")) {
      return "VERY HIGH";
    }

    if (band.includes("HIGH")) {
      return "HIGH";
    }

    if (
      band.includes("MEDIUM") ||
      band.includes("MODERATE")
    ) {
      return "MEDIUM";
    }

    if (band.includes("LOW")) {
      return "LOW";
    }

    const score = Number(
      priority.priority_score
    );

    if (score >= 75) {
      return "VERY HIGH";
    }

    if (score >= 50) {
      return "HIGH";
    }

    if (score >= 25) {
      return "MEDIUM";
    }

    return "LOW";
  };

  const getColor = (band) => {
    if (band === "CRITICAL") {
      return "#B83A3A";
    }

    if (band === "VERY HIGH") {
      return "#C65A35";
    }

    if (band === "HIGH") {
      return "#E07A32";
    }

    if (band === "MEDIUM") {
      return "#D9A441";
    }

    return "#839958";
  };

  const numberValue = (value) => {
    const number = Number(value);

    return Number.isFinite(number)
      ? number
      : 0;
  };

  const formatScore = (value) => {
    const number = numberValue(value);

    return Number.isInteger(number)
      ? number
      : number.toFixed(1);
  };

  const getZone = (priority) => {
    return (
      priority.zone_id ||
      priority.zone ||
      priority.zone_name ||
      "Unknown Zone"
    );
  };

  const getAction = (priority) => {
    return (
      priority.recommended_action ||
      "Continue monitoring and review the area."
    );
  };

  const getExplanation = (priority) => {
    return (
      priority.explanation ||
      "Priority is based on risk and impact indicators."
    );
  };

  const getAffectedSummary = (priority) => {
    const summary =
      priority.affected_summary;

    if (!summary) {
      return null;
    }

    if (typeof summary === "string") {
      return summary;
    }

    const values = [];

    Object.entries(summary).forEach(
      ([key, value]) => {
        if (
          value !== null &&
          value !== undefined &&
          value !== ""
        ) {
          const label = key
            .replace(/_/g, " ")
            .replace(
              /\b\w/g,
              (letter) =>
                letter.toUpperCase()
            );

          values.push(
            `${label}: ${value}`
          );
        }
      }
    );

    return values.length > 0
      ? values.join(" • ")
      : null;
  };

  const sortedPriorities = [
    ...priorities,
  ].sort((a, b) => {
    const rankA = Number(
      a.priority_rank
    );
    const rankB = Number(
      b.priority_rank
    );

    if (
      Number.isFinite(rankA) &&
      Number.isFinite(rankB)
    ) {
      return rankA - rankB;
    }

    return (
      numberValue(b.priority_score) -
      numberValue(a.priority_score)
    );
  });

  const criticalCount =
    priorities.filter((item) => {
      const band = getBand(item);

      return (
        band === "CRITICAL" ||
        band === "VERY HIGH"
      );
    }).length;

  const highCount =
    priorities.filter(
      (item) =>
        getBand(item) === "HIGH"
    ).length;

  const totalPriorities =
    priorities.length;

  return (
    <section
      id="priority"
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
          DECISION SUPPORT SYSTEM
        </p>

        <h2
          style={{
            color: "#F7F4D5",
            fontSize: "30px",
            margin: 0,
            fontWeight: "800",
          }}
        >
          Priority & Response Planning
        </h2>

        <p
          style={{
            color: "#B8C3A0",
            marginTop: "7px",
            fontSize: "15px",
          }}
        >
          Ranks monitored areas so response
          teams can focus on the locations
          requiring the most attention.
        </p>
      </div>

      {/* SUMMARY */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
          gap: "15px",
          marginBottom: "20px",
        }}
      >
        <SummaryCard
          title="PRIORITY AREAS"
          value={totalPriorities}
          description="Areas with priority results"
        />

        <SummaryCard
          title="VERY HIGH / CRITICAL"
          value={criticalCount}
          description="Immediate attention"
        />

        <SummaryCard
          title="HIGH"
          value={highCount}
          description="Enhanced response"
        />
      </div>

      {/* MAIN PANEL */}
      <div
        style={{
          background:
            "linear-gradient(145deg, #105666, #0A3323)",
          border:
            "1px solid rgba(131,153,88,0.25)",
          borderRadius: "22px",
          padding: "25px",
        }}
      >
        {/* TITLE */}
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: "15px",
            flexWrap: "wrap",
            marginBottom: "20px",
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
              Ranked Response Priorities
            </h3>

            <p
              style={{
                color: "#7F8C72",
                fontSize: "11px",
                margin:
                  "5px 0 0",
              }}
            >
              Sorted by priority rank and
              priority score.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchPriorities}
            style={{
              padding:
                "9px 14px",
              borderRadius: "8px",
              border:
                "1px solid rgba(131,153,88,0.35)",
              background:
                "rgba(131,153,88,0.12)",
              color: "#F7F4D5",
              cursor: "pointer",
              fontSize: "10px",
              fontWeight: "900",
            }}
          >
            REFRESH
          </button>
        </div>

        {/* LOADING */}
        {loading && (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: "#B8C3A0",
              background:
                "rgba(0,0,0,0.12)",
              borderRadius: "15px",
            }}
          >
            Loading priority results
            from LANDGUARD backend...
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
              fontSize: "12px",
            }}
          >
            <strong>
              Priority service unavailable:
            </strong>{" "}
            {error}
          </div>
        )}

        {/* EMPTY */}
        {!loading &&
          !error &&
          sortedPriorities.length === 0 && (
            <div
              style={{
                padding: "45px 20px",
                textAlign: "center",
                background:
                  "rgba(0,0,0,0.12)",
                borderRadius: "15px",
              }}
            >
              <div
                style={{
                  color: "#F7F4D5",
                  fontSize: "16px",
                  fontWeight: "800",
                }}
              >
                No priority results available
              </div>

              <p
                style={{
                  color: "#7F8C72",
                  fontSize: "11px",
                }}
              >
                Priority results will appear
                here when they are available
                in the backend.
              </p>
            </div>
          )}

        {/* PRIORITY CARDS */}
        {!loading &&
          !error &&
          sortedPriorities.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection:
                  "column",
                gap: "14px",
              }}
            >
              {sortedPriorities.map(
                (priority, index) => {
                  const band =
                    getBand(priority);

                  const color =
                    getColor(band);

                  const rank =
                    numberValue(
                      priority.priority_rank
                    ) ||
                    index + 1;

                  const riskScore =
                    numberValue(
                      priority.risk_score
                    );

                  const exposureScore =
                    numberValue(
                      priority.exposure_score
                    );

                  const vulnerabilityScore =
                    numberValue(
                      priority.vulnerability_score
                    );

                  const criticalityScore =
                    numberValue(
                      priority.criticality_score
                    );

                  const priorityScore =
                    numberValue(
                      priority.priority_score
                    );

                  const affected =
                    getAffectedSummary(
                      priority
                    );

                  return (
                    <div
                      key={
                        priority.id ??
                        `${getZone(
                          priority
                        )}-${index}`
                      }
                      style={{
                        background:
                          "rgba(10,51,35,0.72)",
                        border:
                          `1px solid ${color}55`,
                        borderRadius:
                          "16px",
                        overflow:
                          "hidden",
                      }}
                    >
                      {/* TOP */}
                      <div
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "space-between",
                          gap: "15px",
                          padding:
                            "16px 18px",
                          flexWrap:
                            "wrap",
                        }}
                      >
                        <div
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap: "13px",
                          }}
                        >
                          <div
                            style={{
                              width:
                                "42px",
                              height:
                                "42px",
                              borderRadius:
                                "11px",
                              background:
                                `${color}22`,
                              border:
                                `1px solid ${color}66`,
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              color:
                                color,
                              fontSize:
                                "16px",
                              fontWeight:
                                "900",
                            }}
                          >
                            #{rank}
                          </div>

                          <div>
                            <div
                              style={{
                                color:
                                  "#F7F4D5",
                                fontSize:
                                  "14px",
                                fontWeight:
                                  "900",
                              }}
                            >
                              {getZone(
                                priority
                              )}
                            </div>

                            <div
                              style={{
                                color:
                                  "#8F9C80",
                                fontSize:
                                  "10px",
                                marginTop:
                                  "4px",
                              }}
                            >
                              Priority
                              rank{" "}
                              {rank}
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap: "10px",
                            flexWrap:
                              "wrap",
                          }}
                        >
                          <span
                            style={{
                              padding:
                                "6px 10px",
                              borderRadius:
                                "7px",
                              background:
                                `${color}22`,
                              color:
                                color,
                              fontSize:
                                "9px",
                              fontWeight:
                                "900",
                            }}
                          >
                            {band}
                          </span>

                          <span
                            style={{
                              color:
                                "#F7F4D5",
                              fontSize:
                                "18px",
                              fontWeight:
                                "900",
                            }}
                          >
                            {formatScore(
                              priorityScore
                            )}
                            /100
                          </span>
                        </div>
                      </div>

                      {/* SCORES */}
                      <div
                        style={{
                          display:
                            "grid",
                          gridTemplateColumns:
                            "repeat(4, minmax(0, 1fr))",
                          gap: "10px",
                          padding:
                            "0 18px 15px",
                        }}
                      >
                        <ScoreBox
                          label="RISK"
                          value={
                            riskScore
                          }
                        />

                        <ScoreBox
                          label="EXPOSURE"
                          value={
                            exposureScore
                          }
                        />

                        <ScoreBox
                          label="VULNERABILITY"
                          value={
                            vulnerabilityScore
                          }
                        />

                        <ScoreBox
                          label="CRITICALITY"
                          value={
                            criticalityScore
                          }
                        />
                      </div>

                      {/* ACTION */}
                      <div
                        style={{
                          margin:
                            "0 18px 15px",
                          padding:
                            "13px",
                          borderRadius:
                            "10px",
                          background:
                            `${color}12`,
                          border:
                            `1px solid ${color}33`,
                        }}
                      >
                        <div
                          style={{
                            color:
                              color,
                            fontSize:
                              "9px",
                            fontWeight:
                              "900",
                            letterSpacing:
                              "1px",
                          }}
                        >
                          RECOMMENDED ACTION
                        </div>

                        <div
                          style={{
                            color:
                              "#B8C3A0",
                            fontSize:
                              "11px",
                            lineHeight:
                              "1.5",
                            marginTop:
                              "5px",
                          }}
                        >
                          {getAction(
                            priority
                          )}
                        </div>
                      </div>

                      {/* EXPLANATION */}
                      <div
                        style={{
                          padding:
                            "0 18px 16px",
                        }}
                      >
                        <div
                          style={{
                            color:
                              "#839958",
                            fontSize:
                              "9px",
                            fontWeight:
                              "900",
                            letterSpacing:
                              "1px",
                            marginBottom:
                              "5px",
                          }}
                        >
                          WHY THIS AREA IS PRIORITIZED
                        </div>

                        <div
                          style={{
                            color:
                              "#9EAB90",
                            fontSize:
                              "10px",
                            lineHeight:
                              "1.55",
                          }}
                        >
                          {getExplanation(
                            priority
                          )}
                        </div>

                        {affected && (
                          <div
                            style={{
                              marginTop:
                                "9px",
                              padding:
                                "9px 10px",
                              borderRadius:
                                "8px",
                              background:
                                "rgba(0,0,0,0.12)",
                              color:
                                "#7F8C72",
                              fontSize:
                                "9px",
                              lineHeight:
                                "1.5",
                            }}
                          >
                            <strong
                              style={{
                                color:
                                  "#839958",
                              }}
                            >
                              Affected:
                            </strong>{" "}
                            {affected}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
      </div>

      {/* FOOTER */}
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          marginTop: "15px",
          flexWrap: "wrap",
          gap: "10px",
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
          LANDGUARD PostgreSQL / PostGIS
        </span>
      </div>
    </section>
  );
}

/* =====================================================
   SUMMARY CARD
===================================================== */

function SummaryCard({
  title,
  value,
  description,
}) {
  return (
    <div
      style={{
        background:
          "rgba(10,51,35,0.75)",
        border:
          "1px solid rgba(131,153,88,0.22)",
        borderRadius: "15px",
        padding: "18px",
      }}
    >
      <div
        style={{
          color: "#839958",
          fontSize: "10px",
          fontWeight: "900",
          letterSpacing: "1px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          color: "#F7F4D5",
          fontSize: "28px",
          fontWeight: "900",
          marginTop: "8px",
        }}
      >
        {value}
      </div>

      <div
        style={{
          color: "#7F8C72",
          fontSize: "10px",
          marginTop: "3px",
        }}
      >
        {description}
      </div>
    </div>
  );
}

/* =====================================================
   SCORE BOX
===================================================== */

function ScoreBox({
  label,
  value,
}) {
  return (
    <div
      style={{
        padding: "11px",
        borderRadius: "9px",
        background:
          "rgba(0,0,0,0.12)",
      }}
    >
      <div
        style={{
          color: "#7F8C72",
          fontSize: "8px",
          fontWeight: "900",
        }}
      >
        {label}
      </div>

      <div
        style={{
          color: "#F7F4D5",
          fontSize: "12px",
          fontWeight: "900",
          marginTop: "4px",
        }}
      >
        {formatNumber(value)}/100
      </div>
    </div>
  );
}

function formatNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return Number.isInteger(number)
    ? number
    : number.toFixed(1);
}

export default Priority;