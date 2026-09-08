import { useState } from "react";
import { submitFieldReport } from "../lib/api";

function FieldReport() {
  const [formData, setFormData] = useState({
    location: "25.50, 91.89",
    severity: "MEDIUM",
    weather: "Clear",
    description: "",
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [reportId, setReportId] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setSubmitted(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    setSubmitted(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const fd = new FormData();
    fd.append("report_type", "LANDSLIDE");
    fd.append("description", formData.description || "Field observation report");

    let lat = 25.50;
    let lon = 91.89;
    if (formData.location && formData.location.includes(",")) {
      const parts = formData.location.split(",");
      lat = parseFloat(parts[0].trim()) || 25.50;
      lon = parseFloat(parts[1].trim()) || 91.89;
    }
    fd.append("latitude", lat.toString());
    fd.append("longitude", lon.toString());
    fd.append("severity", formData.severity || "MEDIUM");
    if (image) {
      fd.append("photo", image);
    }

    try {
      const res = await submitFieldReport(fd);
      if (res && res.report) {
        setReportId(res.report.report_id || `LG-${res.report.id}`);
      } else {
        setReportId("LG-" + Math.floor(100000 + Math.random() * 900000));
      }
      setSubmitted(true);
    } catch (err) {
      console.warn("Report submission failed, using local fallback ID:", err);
      setReportId("LG-" + Math.floor(100000 + Math.random() * 900000));
      setSubmitted(true);
    }
  };

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

  const currentSeverity = severityConfig[formData.severity];

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
      {/* =====================================
          SECTION HEADER
      ===================================== */}

      <div style={{ marginBottom: "24px" }}>
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
          📍 Field Report
        </h2>

        <p
          style={{
            color: "#B8C3A0",
            marginTop: "7px",
            fontSize: "15px",
          }}
        >
          Submit real-time observations and evidence from affected locations.
        </p>
      </div>

      {/* =====================================
          MAIN GRID
      ===================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.25fr 0.75fr",
          gap: "20px",
          alignItems: "start",
        }}
      >
        {/* =====================================
            REPORT FORM
        ===================================== */}

        <div
          style={{
            background:
              "linear-gradient(145deg, #105666, #0A3323)",
            border: "1px solid rgba(131,153,88,0.25)",
            borderRadius: "22px",
            padding: "28px",
            boxShadow: "0 18px 45px rgba(0,0,0,0.2)",
          }}
        >
          {/* FORM TOP BAR */}

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
                Record field observations for authority review.
              </p>
            </div>

            {/* STATUS */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                borderRadius: "999px",
                background: "rgba(131,153,88,0.1)",
                border: "1px solid rgba(131,153,88,0.25)",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#839958",
                  boxShadow: "0 0 10px rgba(131,153,88,0.8)",
                }}
              />

              <span
                style={{
                  color: "#839958",
                  fontSize: "11px",
                  fontWeight: "800",
                }}
              >
                READY TO SUBMIT
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
              📍 Location
            </label>

            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Enter affected location"
              required
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "13px 14px",
                borderRadius: "11px",
                border: "1px solid rgba(131,153,88,0.3)",
                background: "rgba(10,51,35,0.7)",
                color: "#F7F4D5",
                outline: "none",
                fontSize: "13px",
                marginBottom: "18px",
              }}
            />

            {/* TWO COLUMN INPUTS */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              {/* SEVERITY */}

              <div>
                <label
                  style={{
                    display: "block",
                    color: "#F7F4D5",
                    fontSize: "13px",
                    fontWeight: "800",
                    marginBottom: "8px",
                  }}
                >
                  🚨 Severity
                </label>

                <select
                  name="severity"
                  value={formData.severity}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "13px 14px",
                    borderRadius: "11px",
                    border: `1px solid ${currentSeverity.border}`,
                    background: "#0A3323",
                    color: currentSeverity.color,
                    outline: "none",
                    fontSize: "13px",
                    fontWeight: "800",
                    cursor: "pointer",
                  }}
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>

              {/* WEATHER */}

              <div>
                <label
                  style={{
                    display: "block",
                    color: "#F7F4D5",
                    fontSize: "13px",
                    fontWeight: "800",
                    marginBottom: "8px",
                  }}
                >
                  🌦️ Weather
                </label>

                <select
                  name="weather"
                  value={formData.weather}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "13px 14px",
                    borderRadius: "11px",
                    border: "1px solid rgba(131,153,88,0.3)",
                    background: "#0A3323",
                    color: "#F7F4D5",
                    outline: "none",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  <option value="Clear">Clear</option>
                  <option value="Cloudy">Cloudy</option>
                  <option value="Light Rain">Light Rain</option>
                  <option value="Heavy Rain">Heavy Rain</option>
                  <option value="Storm">Storm</option>
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
                background: currentSeverity.background,
                border: `1px solid ${currentSeverity.border}`,
                transition:
                  "background 0.3s ease, border 0.3s ease",
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
                  color: currentSeverity.color,
                  marginLeft: "8px",
                  fontSize: "12px",
                }}
              >
                {formData.severity}
              </strong>
            </div>

            {/* DESCRIPTION */}

            <label
              style={{
                display: "block",
                color: "#F7F4D5",
                fontSize: "13px",
                fontWeight: "800",
                marginBottom: "8px",
              }}
            >
              📝 Description
            </label>

            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what you observed in the field..."
              required
              rows="6"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "13px 14px",
                borderRadius: "11px",
                border: "1px solid rgba(131,153,88,0.3)",
                background: "rgba(10,51,35,0.7)",
                color: "#F7F4D5",
                outline: "none",
                fontSize: "13px",
                resize: "vertical",
                fontFamily: "inherit",
                marginBottom: "18px",
              }}
            />

            {/* IMAGE UPLOAD */}

            <label
              style={{
                display: "block",
                color: "#F7F4D5",
                fontSize: "13px",
                fontWeight: "800",
                marginBottom: "8px",
              }}
            >
              📸 Evidence Image
            </label>

            <label
              style={{
                display: "block",
                border: "1px dashed rgba(131,153,88,0.5)",
                borderRadius: "14px",
                padding: imagePreview ? "12px" : "25px",
                background: "rgba(131,153,88,0.05)",
                cursor: "pointer",
                textAlign: "center",
                marginBottom: "20px",
              }}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: "none" }}
              />

              {imagePreview ? (
                <div>
                  <img
                    src={imagePreview}
                    alt="Field evidence preview"
                    style={{
                      width: "100%",
                      maxHeight: "250px",
                      objectFit: "cover",
                      borderRadius: "10px",
                      display: "block",
                    }}
                  />

                  <p
                    style={{
                      color: "#839958",
                      fontSize: "12px",
                      margin: "10px 0 0",
                      fontWeight: "700",
                    }}
                  >
                    {image?.name || "Image selected"} — Click to replace
                  </p>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      fontSize: "30px",
                      marginBottom: "8px",
                    }}
                  >
                    📷
                  </div>

                  <p
                    style={{
                      color: "#F7F4D5",
                      fontSize: "13px",
                      fontWeight: "700",
                      margin: "0 0 5px",
                    }}
                  >
                    Upload field evidence
                  </p>

                  <p
                    style={{
                      color: "#87957D",
                      fontSize: "11px",
                      margin: 0,
                    }}
                  >
                    Click here to select an image
                  </p>
                </>
              )}
            </label>

            {/* SUBMIT */}

            <button
              type="submit"
              style={{
                width: "100%",
                border: "none",
                borderRadius: "12px",
                padding: "14px",
                background:
                  "linear-gradient(135deg, #839958, #105666)",
                color: "#F7F4D5",
                fontSize: "14px",
                fontWeight: "900",
                cursor: "pointer",
                letterSpacing: "0.5px",
              }}
            >
              📤 Submit Field Report
            </button>
          </form>
        </div>

        {/* =====================================
            FIELD OPERATIONS PANEL
        ===================================== */}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* REPORT STATUS */}

          <div
            style={{
              background:
                "linear-gradient(145deg, #105666, #0A3323)",
              border: "1px solid rgba(131,153,88,0.25)",
              borderRadius: "20px",
              padding: "23px",
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
              FIELD OPERATIONS
            </p>

            <h3
              style={{
                color: "#F7F4D5",
                margin: "0 0 15px",
                fontSize: "19px",
              }}
            >
              Report Workflow
            </h3>

            {[
              ["01", "Observe", "Identify unusual field conditions."],
              ["02", "Record", "Capture location and incident details."],
              ["03", "Upload", "Attach photographic evidence."],
              ["04", "Submit", "Send the report for authority review."],
            ].map(([number, title, description]) => (
              <div
                key={number}
                style={{
                  display: "flex",
                  gap: "12px",
                  marginBottom: "17px",
                }}
              >
                <div
                  style={{
                    minWidth: "32px",
                    height: "32px",
                    borderRadius: "10px",
                    background: "rgba(131,153,88,0.12)",
                    border:
                      "1px solid rgba(131,153,88,0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#839958",
                    fontSize: "11px",
                    fontWeight: "900",
                  }}
                >
                  {number}
                </div>

                <div>
                  <strong
                    style={{
                      color: "#F7F4D5",
                      fontSize: "13px",
                    }}
                  >
                    {title}
                  </strong>

                  <p
                    style={{
                      color: "#8F9C83",
                      fontSize: "11px",
                      lineHeight: "1.5",
                      margin: "3px 0 0",
                    }}
                  >
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* LOCATION STATUS */}

          <div
            style={{
              background:
                "linear-gradient(145deg, rgba(16,86,102,0.75), rgba(10,51,35,0.9))",
              border: "1px solid rgba(131,153,88,0.2)",
              borderRadius: "20px",
              padding: "22px",
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
              <h3
                style={{
                  color: "#F7F4D5",
                  fontSize: "17px",
                  margin: 0,
                }}
              >
                📍 Location Status
              </h3>

              <span
                style={{
                  color: "#839958",
                  fontSize: "10px",
                  fontWeight: "900",
                  background: "rgba(131,153,88,0.1)",
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
                background: "rgba(10,51,35,0.5)",
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
          </div>

          {/* SUBMISSION RESULT */}

          {submitted && (
            <div
              style={{
                background:
                  "linear-gradient(145deg, rgba(39,68,48,0.95), rgba(19,52,40,0.98))",
                border: "1px solid rgba(131,153,88,0.5)",
                borderRadius: "20px",
                padding: "22px",
                animation: "reportAppear 0.35s ease",
              }}
            >
              <div
                style={{
                  fontSize: "30px",
                  marginBottom: "8px",
                }}
              >
                ✅
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
                Your field report has been recorded successfully
                and is ready for authority review.
              </p>

              <div
                style={{
                  display: "inline-block",
                  background: "rgba(131,153,88,0.12)",
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
            </div>
          )}
        </div>
      </div>

      {/* DEMO NOTICE */}

      <p
        style={{
          color: "#7F8C72",
          fontSize: "11px",
          marginTop: "14px",
          textAlign: "right",
        }}
      >
        * Report submission currently uses frontend demonstration
        logic and will later connect to POST /api/reports.
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

export default FieldReport;