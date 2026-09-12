import { useEffect, useState } from "react";

const API_BASE = "http://localhost:5000";

const getRiskLevel = (score) => {
  if (score >= 75) return "VERY HIGH";
  if (score >= 50) return "HIGH";
  if (score >= 25) return "MODERATE";
  return "LOW";
};

const getRiskColor = (level) => {
  if (level === "VERY HIGH") return "#B83A3A";
  if (level === "HIGH") return "#E07A32";
  if (level === "MODERATE") return "#D5A83A";
  return "#5C8D45";
};

const toNumber = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};

function RiskPrediction({ selectedZone }) {
  const [formData, setFormData] = useState({
    elevation_m: 1200,
    slope_deg: 35,
    rainfall_mm: 180,
    soil_clay_percent: 30,
    soil_sand_percent: 45,
    land_cover: "1",
    distance_to_road_m: 500,
    aspect_deg: 180,
    built_up_percent: 10,
    forest_loss_percent: 15,
    distance_to_stream_m: 300,
    drainage_density: 2,
    earthquake_distance_km: 40,
  });

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedZone) return;

    setFormData((previous) => ({
      ...previous,
      rainfall_mm:
        toNumber(
          selectedZone.rainfall,
          previous.rainfall_mm
        ),
    }));

    setPrediction(null);
    setError("");
  }, [selectedZone]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const runPrediction = async () => {
    setLoading(true);
    setError("");
    setPrediction(null);

    try {
      const requestBody = {
        zone_id:
          selectedZone?.id ||
          selectedZone?.name ||
          "LANDGUARD_ZONE",

        elevation_m:
          toNumber(formData.elevation_m),

        slope_deg:
          toNumber(formData.slope_deg),

        aspect_deg:
          toNumber(formData.aspect_deg),

        rainfall_mm:
          toNumber(formData.rainfall_mm),

        soil_clay_percent:
          toNumber(formData.soil_clay_percent),

        soil_sand_percent:
          toNumber(formData.soil_sand_percent),

        land_cover:
          toNumber(formData.land_cover, 1),

        distance_to_road_m:
          toNumber(formData.distance_to_road_m),

        built_up_percent:
          toNumber(formData.built_up_percent),

        forest_loss_percent:
          toNumber(formData.forest_loss_percent),

        distance_to_stream_m:
          toNumber(formData.distance_to_stream_m),

        drainage_density:
          toNumber(formData.drainage_density),

        earthquake_distance_km:
          toNumber(formData.earthquake_distance_km),
      };

      console.log(
        "LANDGUARD AI request:",
        requestBody
      );

      const response = await fetch(
        `${API_BASE}/api/predict`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();

      console.log(
        "LANDGUARD AI response:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Prediction request failed."
        );
      }

      /*
       * IMPORTANT:
       * LANDGUARD backend uses:
       *
       * {
       *   success: true,
       *   data: {
       *     risk_score: ...,
       *     risk_category: ...
       *   }
       * }
       *
       * Therefore we read data.data first.
       */
      const result =
        data &&
        data.data &&
        typeof data.data === "object"
          ? data.data
          : data;

      let score = toNumber(
        result.risk_score,
        NaN
      );

      if (!Number.isFinite(score)) {
        score = toNumber(
          result.riskScore,
          NaN
        );
      }

      if (!Number.isFinite(score)) {
        score = toNumber(
          result.score,
          NaN
        );
      }

      if (!Number.isFinite(score)) {
        const probability = toNumber(
          result.landslide_probability,
          NaN
        );

        if (Number.isFinite(probability)) {
          score =
            probability <= 1
              ? probability * 100
              : probability;
        }
      }

      if (!Number.isFinite(score)) {
        const probability = toNumber(
          result.probability,
          NaN
        );

        if (Number.isFinite(probability)) {
          score =
            probability <= 1
              ? probability * 100
              : probability;
        }
      }

      if (!Number.isFinite(score)) {
        throw new Error(
          "AI backend returned no valid risk score."
        );
      }

      score = Math.max(
        0,
        Math.min(100, score)
      );

      const category =
        result.risk_category ||
        result.risk_level ||
        getRiskLevel(score);

      const predictionValue =
        Number(result.prediction);

      setPrediction({
        score:
          Math.round(score * 100) / 100,

        level:
          String(category).toUpperCase(),

        prediction:
          predictionValue === 1
            ? "LANDSLIDE RISK DETECTED"
            : "LOW LANDSLIDE RISK",

        status:
          result.status ||
          "CONNECTED",
      });
    } catch (err) {
      console.error(
        "LANDGUARD AI prediction error:",
        err
      );

      setError(
        err.message ||
          "Unable to connect to the AI backend."
      );
    } finally {
      setLoading(false);
    }
  };

  const riskColor = prediction
    ? getRiskColor(prediction.level)
    : "#839958";

  return (
    <section
      style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "20px 40px 50px",
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
          AI Risk Intelligence
        </h2>

        <p
          style={{
            color: "#B8C3A0",
            marginTop: "7px",
            fontSize: "15px",
          }}
        >
          Run the LANDGUARD machine-learning
          model using environmental and
          geographical conditions.
        </p>
      </div>

      {/* SELECTED ZONE */}
      {selectedZone && (
        <div
          style={{
            padding: "14px 18px",
            marginBottom: "20px",
            borderRadius: "12px",
            background:
              "rgba(131,153,88,0.12)",
            border:
              "1px solid rgba(131,153,88,0.3)",
          }}
        >
          <div
            style={{
              color: "#839958",
              fontSize: "11px",
              fontWeight: "800",
              letterSpacing: "1px",
            }}
          >
            SELECTED ZONE
          </div>

          <div
            style={{
              color: "#F7F4D5",
              fontSize: "20px",
              fontWeight: "800",
              marginTop: "4px",
            }}
          >
            {selectedZone.name ||
              selectedZone.id ||
              "Selected Zone"}
          </div>
        </div>
      )}

      {/* MAIN GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(300px, 1fr) minmax(300px, 1fr)",
          gap: "22px",
        }}
      >
        {/* INPUT CARD */}
        <div
          style={{
            background:
              "rgba(10,51,35,0.75)",
            border:
              "1px solid rgba(131,153,88,0.25)",
            borderRadius: "16px",
            padding: "22px",
          }}
        >
          <h3
            style={{
              color: "#F7F4D5",
              marginTop: 0,
              marginBottom: "18px",
              fontSize: "19px",
            }}
          >
            Environmental Inputs
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",
              gap: "14px",
            }}
          >
            <InputField
              label="Elevation (m)"
              name="elevation_m"
              value={formData.elevation_m}
              onChange={handleChange}
            />

            <InputField
              label="Slope (°)"
              name="slope_deg"
              value={formData.slope_deg}
              onChange={handleChange}
            />

            <InputField
              label="Rainfall (mm)"
              name="rainfall_mm"
              value={formData.rainfall_mm}
              onChange={handleChange}
            />

            <InputField
              label="Soil Clay (%)"
              name="soil_clay_percent"
              value={formData.soil_clay_percent}
              onChange={handleChange}
            />

            <InputField
              label="Soil Sand (%)"
              name="soil_sand_percent"
              value={formData.soil_sand_percent}
              onChange={handleChange}
            />

            <InputField
              label="Road Distance (m)"
              name="distance_to_road_m"
              value={formData.distance_to_road_m}
              onChange={handleChange}
            />

            <InputField
              label="Aspect (°)"
              name="aspect_deg"
              value={formData.aspect_deg}
              onChange={handleChange}
            />

            <InputField
              label="Built-up (%)"
              name="built_up_percent"
              value={formData.built_up_percent}
              onChange={handleChange}
            />

            <InputField
              label="Forest Loss (%)"
              name="forest_loss_percent"
              value={formData.forest_loss_percent}
              onChange={handleChange}
            />

            <InputField
              label="Stream Distance (m)"
              name="distance_to_stream_m"
              value={formData.distance_to_stream_m}
              onChange={handleChange}
            />

            <InputField
              label="Drainage Density"
              name="drainage_density"
              value={formData.drainage_density}
              onChange={handleChange}
            />

            <InputField
              label="Earthquake Distance (km)"
              name="earthquake_distance_km"
              value={formData.earthquake_distance_km}
              onChange={handleChange}
            />

            {/* LAND COVER */}
            <div
              style={{
                gridColumn: "1 / -1",
              }}
            >
              <label
                style={{
                  display: "block",
                  color: "#B8C3A0",
                  fontSize: "12px",
                  fontWeight: "700",
                  marginBottom: "6px",
                }}
              >
                Land Cover
              </label>

              <select
                name="land_cover"
                value={formData.land_cover}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="1">
                  Forest
                </option>

                <option value="2">
                  Agriculture
                </option>

                <option value="3">
                  Built-up
                </option>

                <option value="4">
                  Grassland
                </option>

                <option value="5">
                  Bare land
                </option>
              </select>
            </div>
          </div>

          {/* RUN BUTTON */}
          <button
            type="button"
            onClick={runPrediction}
            disabled={loading}
            style={{
              width: "100%",
              marginTop: "22px",
              padding: "14px",
              border: "none",
              borderRadius: "10px",
              background: loading
                ? "#596344"
                : "#839958",
              color: "#FFFFFF",
              cursor: loading
                ? "not-allowed"
                : "pointer",
              fontSize: "14px",
              fontWeight: "900",
            }}
          >
            {loading
              ? "RUNNING AI MODEL..."
              : "RUN AI RISK PREDICTION"}
          </button>

          {/* ERROR */}
          {error && (
            <div
              style={{
                marginTop: "15px",
                padding: "12px",
                borderRadius: "9px",
                background:
                  "rgba(184,58,58,0.15)",
                border:
                  "1px solid rgba(184,58,58,0.4)",
                color: "#F0B4B4",
                fontSize: "12px",
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* RESULT CARD */}
        <div
          style={{
            background:
              "rgba(10,51,35,0.75)",
            border:
              "1px solid rgba(131,153,88,0.25)",
            borderRadius: "16px",
            padding: "22px",
          }}
        >
          <h3
            style={{
              color: "#F7F4D5",
              marginTop: 0,
              fontSize: "19px",
            }}
          >
            AI Prediction Result
          </h3>

          {/* EMPTY STATE */}
          {!prediction && !loading && (
            <div
              style={{
                minHeight: "300px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                color: "#B8C3A0",
                fontSize: "14px",
                padding: "20px",
              }}
            >
              <div>
                Enter environmental conditions
                <br />
                and click
                <strong
                  style={{
                    color: "#F7F4D5",
                    marginLeft: "4px",
                  }}
                >
                  RUN AI RISK PREDICTION
                </strong>
              </div>
            </div>
          )}

          {/* LOADING */}
          {loading && (
            <div
              style={{
                minHeight: "300px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#B8C3A0",
                fontSize: "15px",
              }}
            >
              Connecting to LANDGUARD AI...
            </div>
          )}

          {/* RESULT */}
          {prediction && !loading && (
            <div>
              {/* SCORE */}
              <div
                style={{
                  textAlign: "center",
                  padding: "20px 0",
                }}
              >
                <div
                  style={{
                    color: "#B8C3A0",
                    fontSize: "12px",
                    fontWeight: "800",
                    letterSpacing: "1px",
                  }}
                >
                  PREDICTED RISK SCORE
                </div>

                <div
                  style={{
                    fontSize: "64px",
                    fontWeight: "900",
                    color: riskColor,
                    lineHeight: 1.1,
                    marginTop: "8px",
                  }}
                >
                  {prediction.score}
                </div>

                <div
                  style={{
                    color: "#839958",
                    fontSize: "13px",
                  }}
                >
                  OUT OF 100
                </div>
              </div>

              {/* CATEGORY */}
              <div
                style={{
                  padding: "18px",
                  borderRadius: "12px",
                  background:
                    "rgba(255,255,255,0.04)",
                  border:
                    `1px solid ${riskColor}`,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    color: "#B8C3A0",
                    fontSize: "11px",
                    fontWeight: "800",
                  }}
                >
                  RISK CATEGORY
                </div>

                <div
                  style={{
                    color: riskColor,
                    fontSize: "25px",
                    fontWeight: "900",
                    marginTop: "5px",
                  }}
                >
                  {prediction.level}
                </div>
              </div>

              {/* MODEL DECISION */}
              <div
                style={{
                  marginTop: "15px",
                  padding: "15px",
                  borderRadius: "10px",
                  background:
                    "rgba(131,153,88,0.1)",
                }}
              >
                <div
                  style={{
                    color: "#839958",
                    fontSize: "11px",
                    fontWeight: "800",
                  }}
                >
                  MODEL DECISION
                </div>

                <div
                  style={{
                    color: "#F7F4D5",
                    fontSize: "16px",
                    fontWeight: "800",
                    marginTop: "5px",
                  }}
                >
                  {prediction.prediction}
                </div>
              </div>

              {/* CONNECTION */}
              <div
                style={{
                  marginTop: "15px",
                  color: "#8FC47A",
                  fontSize: "12px",
                  fontWeight: "700",
                  textAlign: "center",
                }}
              >
                ● AI MODEL CONNECTED
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODEL INFO */}
      <div
        style={{
          marginTop: "18px",
          padding: "14px 18px",
          borderRadius: "10px",
          background:
            "rgba(131,153,88,0.08)",
          color: "#B8C3A0",
          fontSize: "11px",
          lineHeight: 1.6,
        }}
      >
        <strong
          style={{
            color: "#F7F4D5",
          }}
        >
          LANDGUARD AI:
        </strong>{" "}
        Prediction is generated by the trained
        Random Forest landslide-risk model using
        environmental, terrain, land-cover and
        seismic features.
      </div>
    </section>
  );
}

function InputField({
  label,
  name,
  value,
  onChange,
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          color: "#B8C3A0",
          fontSize: "12px",
          fontWeight: "700",
          marginBottom: "6px",
        }}
      >
        {label}
      </label>

      <input
        type="number"
        name={name}
        value={value}
        onChange={onChange}
        style={inputStyle}
      />
    </div>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 11px",
  borderRadius: "8px",
  border:
    "1px solid rgba(131,153,88,0.3)",
  background: "rgba(0,0,0,0.2)",
  color: "#F7F4D5",
  outline: "none",
  fontSize: "13px",
};

export default RiskPrediction;