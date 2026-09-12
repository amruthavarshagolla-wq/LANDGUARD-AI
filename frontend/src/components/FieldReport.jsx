import { useState } from "react";

const API_BASE = "http://localhost:5000";

const severityConfig = {
  LOW: {
    color: "#839958",
    background: "rgba(131,153,88,0.12)",
    border: "rgba(131,153,88,0.35)",
  },

  MEDIUM: {
    color: "#D9A441",
    background: "rgba(217,164,65,0.12)",
    border: "rgba(217,164,65,0.35)",
  },

  HIGH: {
    color: "#D3968C",
    background: "rgba(211,150,140,0.12)",
    border: "rgba(211,150,140,0.4)",
  },

  CRITICAL: {
    color: "#E07B70",
    background: "rgba(224,123,112,0.16)",
    border: "rgba(224,123,112,0.5)",
  },
};

function FieldReport() {
  const [formData, setFormData] = useState({
    location: "",
    severity: "MEDIUM",
    weather: "Clear",
    description: "",
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [submitted, setSubmitted] = useState(false);
  const [reportId, setReportId] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [automaticAlert, setAutomaticAlert] =
    useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setSubmitted(false);
    setError("");
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setImage(file);
    setImagePreview(URL.createObjectURL(file));

    setSubmitted(false);
    setError("");
  };

  const uploadImage = async () => {
    if (!image) {
      return null;
    }

    const imageData = new FormData();

    imageData.append("image", image);

    const response = await fetch(
      `${API_BASE}/api/reports/upload`,
      {
        method: "POST",
        body: imageData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
          data.message ||
          "Image upload failed."
      );
    }

    const result =
      data.data && typeof data.data === "object"
        ? data.data
        : data;

    return (
      result.image_url ||
      result.url ||
      result.path ||
      null
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSubmitted(false);
    setAutomaticAlert(false);

    try {
      /*
       * First upload the image if one was selected.
       */
      let imageUrl = null;

      if (image) {
        imageUrl = await uploadImage();
      }

      /*
       * The current form asks for a location name.
       * Latitude/longitude are optional in the backend,
       * so we safely leave them null here.
       */
      const requestBody = {
        report_type: "FIELD_OBSERVATION",

        hazard_type: "LANDSLIDE",

        description:
          `Location: ${formData.location}\n\n${formData.description}`,

        latitude: null,

        longitude: null,

        severity: formData.severity,

        weather: formData.weather,

        image_url: imageUrl,

        user_id: "FIELD_USER",
      };

      console.log(
        "LANDGUARD field report request:",
        requestBody
      );

      const response = await fetch(
        `${API_BASE}/api/reports`,
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
        "LANDGUARD field report response:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Field report submission failed."
        );
      }

      const result =
        data.data && typeof data.data === "object"
          ? data.data
          : data;

      /*
       * Backend-generated report ID.
       */
      const serverReportId =
        result.report_id ||
        result.id ||
        result.server_report_id;

      if (!serverReportId) {
        throw new Error(
          "Report was submitted but no report ID was returned."
        );
      }

      setReportId(
        String(serverReportId)
      );

      setAutomaticAlert(
        Boolean(
          result.automatic_alert_created
        )
      );

      setSubmitted(true);

      /*
       * Keep the form information visible after submission.
       * Clear only the image so the user can submit another
       * report if needed.
       */
      setImage(null);
      setImagePreview(null);
    } catch (err) {
      console.error(
        "LANDGUARD field report error:",
        err
      );

      setError(
        err.message ||
          "Unable to submit the field report."
      );
    } finally {
      setLoading(false);
    }
  };

  const currentSeverity =
    severityConfig[formData.severity];

  return (
    <section
      id="reports"
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
          marginBottom: "24px",
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
          FIELD OPERATIONS
        </p>

        <h2
          style={{
            color: "#F7F4D5",
            fontSize: "30px",
            margin: 0,
            fontWeight: "800",
          }}
        >
          Field Report
        </h2>

        <p
          style={{
            color: "#B8C3A0",
            marginTop: "7px",
            fontSize: "15px",
          }}
        >
          Submit real-time observations and
          evidence from affected locations.
        </p>
      </div>

      {/* MAIN GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "1.25fr 0.75fr",
          gap: "20px",
          alignItems: "start",
        }}
      >
        {/* FORM */}
        <div
          style={{
            background:
              "linear-gradient(145deg, #105666, #0A3323)",
            border:
              "1px solid rgba(131,153,88,0.25)",
            borderRadius: "22px",
            padding: "28px",
            boxShadow:
              "0 18px 45px rgba(0,0,0,0.2)",
          }}
        >
          {/* FORM HEADER */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "15px",
              marginBottom: "24px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h3
                style={{
                  color: "#F7F4D5",
                  margin: 0,
                  fontSize: "20px",
                }}
              >
                New Incident Report
              </h3>

              <p
                style={{
                  color: "#9FAC8E",
                  fontSize: "12px",
                  margin: "5px 0 0",
                }}
              >
                Record field observations for
                authority review.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                borderRadius: "999px",
                background:
                  "rgba(131,153,88,0.1)",
                border:
                  "1px solid rgba(131,153,88,0.25)",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: loading
                    ? "#D9A441"
                    : "#839958",
                  boxShadow:
                    "0 0 10px rgba(131,153,88,0.8)",
                }}
              />

              <span
                style={{
                  color: loading
                    ? "#D9A441"
                    : "#839958",
                  fontSize: "11px",
                  fontWeight: "800",
                }}
              >
                {loading
                  ? "SUBMITTING..."
                  : "READY TO SUBMIT"}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* LOCATION */}
            <label
              style={{
                display: "block",
                color: "#F7F4D5",
                fontSize: "13px",
                fontWeight: "800",
                marginBottom: "8px",
              }}
            >
              Location
            </label>

            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Enter affected location"
              required
              style={inputStyle}
            />

            {/* TWO COLUMNS */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: "16px",
                marginTop: "18px",
              }}
            >
              {/* SEVERITY */}
              <div>
                <label
                  style={labelStyle}
                >
                  Severity
                </label>

                <select
                  name="severity"
                  value={formData.severity}
                  onChange={handleChange}
                  style={{
                    ...inputStyle,
                    border:
                      `1px solid ${currentSeverity.border}`,
                    color:
                      currentSeverity.color,
                    fontWeight: "800",
                    cursor: "pointer",
                  }}
                >
                  <option value="LOW">
                    LOW
                  </option>

                  <option value="MEDIUM">
                    MEDIUM
                  </option>

                  <option value="HIGH">
                    HIGH
                  </option>

                  <option value="CRITICAL">
                    CRITICAL
                  </option>
                </select>
              </div>

              {/* WEATHER */}
              <div>
                <label
                  style={labelStyle}
                >
                  Weather
                </label>

                <select
                  name="weather"
                  value={formData.weather}
                  onChange={handleChange}
                  style={{
                    ...inputStyle,
                    cursor: "pointer",
                  }}
                >
                  <option value="Clear">
                    Clear
                  </option>

                  <option value="Cloudy">
                    Cloudy
                  </option>

                  <option value="Light Rain">
                    Light Rain
                  </option>

                  <option value="Heavy Rain">
                    Heavy Rain
                  </option>

                  <option value="Storm">
                    Storm
                  </option>
                </select>
              </div>
            </div>

            {/* SEVERITY INDICATOR */}
            <div
              style={{
                marginTop: "15px",
                marginBottom: "18px",
                padding: "11px 13px",
                borderRadius: "10px",
                background:
                  currentSeverity.background,
                border:
                  `1px solid ${currentSeverity.border}`,
              }}
            >
              <span
                style={{
                  color: "#9FAC8E",
                  fontSize: "11px",
                }}
              >
                SELECTED REPORT SEVERITY
              </span>

              <strong
                style={{
                  color:
                    currentSeverity.color,
                  marginLeft: "8px",
                  fontSize: "12px",
                }}
              >
                {formData.severity}
              </strong>
            </div>

            {/* DESCRIPTION */}
            <label
              style={labelStyle}
            >
              Location Status
            </label>

            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what you observed at the location..."
              required
              rows={6}
              style={{
                ...inputStyle,
                resize: "vertical",
                lineHeight: "1.5",
              }}
            />

            {/* IMAGE */}
            <div
              style={{
                marginTop: "18px",
              }}
            >
              <label
                style={labelStyle}
              >
                Evidence Image
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{
                  width: "100%",
                  color: "#B8C3A0",
                  fontSize: "12px",
                  marginTop: "5px",
                }}
              />

              {imagePreview && (
                <div
                  style={{
                    marginTop: "12px",
                  }}
                >
                  <img
                    src={imagePreview}
                    alt="Field evidence preview"
                    style={{
                      width: "100%",
                      maxHeight: "240px",
                      objectFit: "cover",
                      borderRadius: "12px",
                      border:
                        "1px solid rgba(131,153,88,0.3)",
                    }}
                  />
                </div>
              )}
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
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
                ? "SUBMITTING REPORT..."
                : "SUBMIT FIELD REPORT"}
            </button>
          </form>

          {/* ERROR */}
          {error && (
            <div
              style={{
                marginTop: "15px",
                padding: "13px",
                borderRadius: "10px",
                background:
                  "rgba(184,58,58,0.15)",
                border:
                  "1px solid rgba(184,58,58,0.45)",
                color: "#F0B4B4",
                fontSize: "12px",
                lineHeight: "1.5",
              }}
            >
              <strong>
                Submission failed:
              </strong>{" "}
              {error}
            </div>
          )}
        </div>

        {/* RIGHT SIDE */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "15px",
          }}
        >
          {/* LOCATION STATUS */}
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
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h3
                style={{
                  color: "#F7F4D5",
                  margin: 0,
                  fontSize: "18px",
                }}
              >
                Location Status
              </h3>

              <span
                style={{
                  color: "#839958",
                  fontSize: "10px",
                  fontWeight: "900",
                  background:
                    "rgba(131,153,88,0.1)",
                  padding: "5px 8px",
                  borderRadius: "999px",
                }}
              >
                READY
              </span>
            </div>

            <div
              style={{
                padding: "14px",
                background:
                  "rgba(10,51,35,0.5)",
                borderRadius: "12px",
                border:
                  "1px solid rgba(247,244,213,0.08)",
              }}
            >
              <span
                style={{
                  color: "#84927A",
                  fontSize: "11px",
                }}
              >
                REPORT LOCATION
              </span>

              <p
                style={{
                  color: formData.location
                    ? "#F7F4D5"
                    : "#697763",
                  fontSize: "13px",
                  margin: "6px 0 0",
                }}
              >
                {formData.location ||
                  "Location will appear here"}
              </p>
            </div>

            <div
              style={{
                marginTop: "12px",
                padding: "14px",
                background:
                  "rgba(10,51,35,0.5)",
                borderRadius: "12px",
                border:
                  "1px solid rgba(247,244,213,0.08)",
              }}
            >
              <span
                style={{
                  color: "#84927A",
                  fontSize: "11px",
                }}
              >
                WEATHER
              </span>

              <p
                style={{
                  color: "#F7F4D5",
                  fontSize: "13px",
                  margin: "6px 0 0",
                }}
              >
                {formData.weather}
              </p>
            </div>
          </div>

          {/* SUBMISSION RESULT */}
          {submitted && (
            <div
              style={{
                background:
                  "linear-gradient(145deg, rgba(39,68,48,0.95), rgba(19,52,40,0.98))",
                border:
                  "1px solid rgba(131,153,88,0.5)",
                borderRadius: "20px",
                padding: "22px",
              }}
            >
              <div
                style={{
                  fontSize: "30px",
                  marginBottom: "8px",
                }}
              >
                ✓
              </div>

              <h3
                style={{
                  color: "#F7F4D5",
                  margin: "0 0 6px",
                  fontSize: "18px",
                }}
              >
                Report Submitted
              </h3>

              <p
                style={{
                  color: "#B8C3A0",
                  fontSize: "12px",
                  lineHeight: "1.5",
                  margin: "0 0 12px",
                }}
              >
                Your field report has been
                recorded successfully and is
                ready for authority review.
              </p>

              <div
                style={{
                  display: "inline-block",
                  background:
                    "rgba(131,153,88,0.12)",
                  border:
                    "1px solid rgba(131,153,88,0.3)",
                  borderRadius: "8px",
                  padding: "7px 10px",
                  color: "#839958",
                  fontSize: "11px",
                  fontWeight: "900",
                }}
              >
                REPORT ID: {reportId}
              </div>

              {automaticAlert && (
                <div
                  style={{
                    marginTop: "14px",
                    padding: "10px",
                    borderRadius: "9px",
                    background:
                      "rgba(224,123,112,0.12)",
                    border:
                      "1px solid rgba(224,123,112,0.35)",
                    color: "#E07B70",
                    fontSize: "11px",
                    fontWeight: "800",
                  }}
                >
                  AUTOMATIC CRITICAL ALERT CREATED
                </div>
              )}
            </div>
          )}

          {/* HOW IT WORKS */}
          <div
            style={{
              background:
                "rgba(10,51,35,0.55)",
              border:
                "1px solid rgba(131,153,88,0.18)",
              borderRadius: "16px",
              padding: "20px",
            }}
          >
            <h3
              style={{
                color: "#F7F4D5",
                margin: "0 0 12px",
                fontSize: "16px",
              }}
            >
              How It Works
            </h3>

            <div
              style={{
                color: "#9FAC8E",
                fontSize: "12px",
                lineHeight: "1.7",
              }}
            >
              <div>
                1. Record the affected location.
              </div>

              <div>
                2. Select severity and weather.
              </div>

              <div>
                3. Add field observations.
              </div>

              <div>
                4. Attach evidence if available.
              </div>

              <div>
                5. Submit to LANDGUARD backend.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER STATUS */}
      <p
        style={{
          color: "#7F8C72",
          fontSize: "11px",
          marginTop: "14px",
          textAlign: "right",
        }}
      >
        Connected to LANDGUARD field reporting
        service.
      </p>

      <style>
        {`
          @keyframes reportAppear {
            from {
              opacity: 0;
              transform: translateY(8px);
            }

            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </section>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "13px 14px",
  borderRadius: "11px",
  border:
    "1px solid rgba(131,153,88,0.3)",
  background: "#0A3323",
  color: "#F7F4D5",
  outline: "none",
  fontSize: "13px",
};

const labelStyle = {
  display: "block",
  color: "#F7F4D5",
  fontSize: "13px",
  fontWeight: "800",
  marginBottom: "8px",
};

export default FieldReport;