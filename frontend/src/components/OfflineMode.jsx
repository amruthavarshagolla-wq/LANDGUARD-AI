import { useEffect, useState } from "react";

const API_BASE = "http://localhost:5000";

const STORAGE_KEY = "landguard_offline_reports";

function OfflineMode() {
  const [isOnline, setIsOnline] = useState(
    navigator.onLine
  );

  const [serverStatus, setServerStatus] =
    useState(null);

  const [offlineReports, setOfflineReports] =
    useState([]);

  const [syncing, setSyncing] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  /*
   * Load reports saved locally.
   */
  const loadOfflineReports = () => {
    try {
      const stored =
        localStorage.getItem(STORAGE_KEY);

      if (!stored) {
        setOfflineReports([]);
        return;
      }

      const reports = JSON.parse(stored);

      if (Array.isArray(reports)) {
        setOfflineReports(reports);
      } else {
        setOfflineReports([]);
      }
    } catch (err) {
      console.error(
        "Unable to load offline reports:",
        err
      );

      setOfflineReports([]);
    }
  };

  /*
   * Save reports to browser storage.
   */
  const saveOfflineReports = (reports) => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(reports)
    );

    setOfflineReports(reports);
  };

  /*
   * Check LANDGUARD backend.
   */
  const checkServerStatus = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/sync/status`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Server status request failed."
        );
      }

      const result =
        data.data &&
        typeof data.data === "object"
          ? data.data
          : data;

      setServerStatus(result);
      setError("");

      return true;
    } catch (err) {
      console.error(
        "LANDGUARD server status error:",
        err
      );

      setServerStatus({
        server_online: false,
        sync_status: "OFFLINE",
        total_reports: 0,
        pending_reports: 0,
        verified_reports: 0,
      });

      return false;
    }
  };

  /*
   * Browser online/offline detection.
   */
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setMessage(
        "Internet connection restored."
      );
      checkServerStatus();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setMessage(
        "You are offline. Reports can be stored locally."
      );
    };

    window.addEventListener(
      "online",
      handleOnline
    );

    window.addEventListener(
      "offline",
      handleOffline
    );

    loadOfflineReports();
    checkServerStatus();

    return () => {
      window.removeEventListener(
        "online",
        handleOnline
      );

      window.removeEventListener(
        "offline",
        handleOffline
      );
    };
  }, []);

  /*
   * Add a demo offline report.
   *
   * This demonstrates how a field report can
   * be stored locally when the connection is
   * unavailable.
   */
  const addOfflineTestReport = () => {
    const newReport = {
      local_id:
        `OFFLINE-${Date.now()}`,

      report_type:
        "FIELD_OBSERVATION",

      hazard_type:
        "LANDSLIDE",

      description:
        "Offline field observation recorded by LANDGUARD.",

      latitude: null,

      longitude: null,

      severity: "HIGH",

      weather: "Heavy Rain",

      image_url: null,

      user_id: "FIELD_USER",

      created_at:
        new Date().toISOString(),
    };

    const updatedReports = [
      ...offlineReports,
      newReport,
    ];

    saveOfflineReports(updatedReports);

    setMessage(
      "Field report saved locally and waiting for synchronization."
    );

    setError("");
  };

  /*
   * Synchronize local reports with backend.
   */
  const syncReports = async () => {
    if (offlineReports.length === 0) {
      setMessage(
        "There are no offline reports waiting for synchronization."
      );

      return;
    }

    setSyncing(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${API_BASE}/api/sync`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            reports: offlineReports,
          }),
        }
      );

      const data = await response.json();

      console.log(
        "LANDGUARD sync response:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Synchronization failed."
        );
      }

      const result =
        data.data &&
        typeof data.data === "object"
          ? data.data
          : data;

      const synced =
        Number(result.synced) || 0;

      const failed =
        Number(result.failed) || 0;

      /*
       * Remove successfully synchronized
       * reports from local storage.
       *
       * The backend returns the index of each
       * successfully synchronized report.
       */
      const failedIndexes = new Set(
        Array.isArray(result.results)
          ? result.results
              .filter(
                (item) =>
                  item.status === "FAILED"
              )
              .map(
                (item) =>
                  Number(item.index)
              )
          : []
      );

      const remainingReports =
        offlineReports.filter(
          (_, index) =>
            failedIndexes.has(index)
        );

      saveOfflineReports(
        remainingReports
      );

      setMessage(
        `Synchronization complete: ${synced} report(s) synced, ${failed} failed.`
      );

      await checkServerStatus();
    } catch (err) {
      console.error(
        "LANDGUARD synchronization error:",
        err
      );

      setError(
        err.message ||
          "Unable to synchronize reports."
      );
    } finally {
      setSyncing(false);
    }
  };

  const clearLocalReports = () => {
    if (offlineReports.length === 0) {
      return;
    }

    const confirmed =
      window.confirm(
        "Clear all locally stored offline reports?"
      );

    if (!confirmed) {
      return;
    }

    saveOfflineReports([]);

    setMessage(
      "Local offline reports cleared."
    );

    setError("");
  };

  const serverOnline =
    serverStatus?.server_online === true;

  return (
    <section
      id="offline-mode"
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
          RESILIENT FIELD OPERATIONS
        </p>

        <h2
          style={{
            color: "#F7F4D5",
            fontSize: "30px",
            margin: 0,
            fontWeight: "800",
          }}
        >
          Offline Mode
        </h2>

        <p
          style={{
            color: "#B8C3A0",
            marginTop: "7px",
            fontSize: "15px",
          }}
        >
          Continue recording field observations
          even when network connectivity is
          unavailable.
        </p>
      </div>

      {/* STATUS CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
          gap: "15px",
          marginBottom: "20px",
        }}
      >
        {/* INTERNET */}
        <StatusCard
          title="Internet"
          value={
            isOnline
              ? "ONLINE"
              : "OFFLINE"
          }
          description={
            isOnline
              ? "Browser connection available"
              : "Local storage mode active"
          }
          active={isOnline}
        />

        {/* SERVER */}
        <StatusCard
          title="LANDGUARD Server"
          value={
            serverOnline
              ? "CONNECTED"
              : "UNAVAILABLE"
          }
          description={
            serverOnline
              ? serverStatus?.sync_status ||
                "Ready for synchronization"
              : "Waiting for backend connection"
          }
          active={serverOnline}
        />

        {/* LOCAL QUEUE */}
        <StatusCard
          title="Offline Queue"
          value={
            String(offlineReports.length)
          }
          description={
            offlineReports.length === 1
              ? "Report waiting"
              : "Reports waiting"
          }
          active={
            offlineReports.length > 0
          }
        />
      </div>

      {/* MAIN CARD */}
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
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "1fr 1fr",
            gap: "22px",
          }}
        >
          {/* LEFT */}
          <div>
            <h3
              style={{
                color: "#F7F4D5",
                margin: "0 0 8px",
                fontSize: "20px",
              }}
            >
              Field Data Synchronization
            </h3>

            <p
              style={{
                color: "#9FAC8E",
                fontSize: "12px",
                lineHeight: "1.6",
                marginTop: 0,
              }}
            >
              Reports created while offline are
              stored temporarily in this browser.
              When connectivity returns, they can
              be sent to the LANDGUARD backend.
            </p>

            {/* LOCAL QUEUE */}
            <div
              style={{
                marginTop: "20px",
                padding: "18px",
                borderRadius: "14px",
                background:
                  "rgba(0,0,0,0.18)",
                border:
                  "1px solid rgba(247,244,213,0.08)",
              }}
            >
              <div
                style={{
                  color: "#839958",
                  fontSize: "11px",
                  fontWeight: "900",
                  letterSpacing: "1px",
                }}
              >
                LOCAL REPORT QUEUE
              </div>

              <div
                style={{
                  color: "#F7F4D5",
                  fontSize: "36px",
                  fontWeight: "900",
                  marginTop: "5px",
                }}
              >
                {offlineReports.length}
              </div>

              <div
                style={{
                  color: "#9FAC8E",
                  fontSize: "11px",
                }}
              >
                report(s) waiting to sync
              </div>
            </div>

            {/* BUTTONS */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: "12px",
                marginTop: "18px",
              }}
            >
              <button
                type="button"
                onClick={syncReports}
                disabled={
                  syncing ||
                  offlineReports.length === 0 ||
                  !serverOnline
                }
                style={{
                  padding: "13px",
                  border: "none",
                  borderRadius: "10px",
                  background:
                    syncing ||
                    offlineReports.length === 0 ||
                    !serverOnline
                      ? "#596344"
                      : "#839958",
                  color: "#FFFFFF",
                  cursor:
                    syncing ||
                    offlineReports.length === 0 ||
                    !serverOnline
                      ? "not-allowed"
                      : "pointer",
                  fontSize: "12px",
                  fontWeight: "900",
                }}
              >
                {syncing
                  ? "SYNCING..."
                  : "SYNC NOW"}
              </button>

              <button
                type="button"
                onClick={
                  addOfflineTestReport
                }
                style={{
                  padding: "13px",
                  borderRadius: "10px",
                  border:
                    "1px solid rgba(131,153,88,0.4)",
                  background:
                    "rgba(131,153,88,0.08)",
                  color: "#F7F4D5",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "900",
                }}
              >
                SAVE TEST REPORT
              </button>
            </div>

            <button
              type="button"
              onClick={
                clearLocalReports
              }
              disabled={
                offlineReports.length === 0
              }
              style={{
                width: "100%",
                marginTop: "10px",
                padding: "11px",
                borderRadius: "10px",
                border:
                  "1px solid rgba(224,123,112,0.3)",
                background:
                  "transparent",
                color:
                  offlineReports.length === 0
                    ? "#596344"
                    : "#D9A09A",
                cursor:
                  offlineReports.length === 0
                    ? "not-allowed"
                    : "pointer",
                fontSize: "11px",
                fontWeight: "800",
              }}
            >
              CLEAR LOCAL QUEUE
            </button>
          </div>

          {/* RIGHT */}
          <div>
            <h3
              style={{
                color: "#F7F4D5",
                margin: "0 0 15px",
                fontSize: "18px",
              }}
            >
              Server Information
            </h3>

            <InfoRow
              label="Server"
              value={
                serverOnline
                  ? "ONLINE"
                  : "OFFLINE"
              }
            />

            <InfoRow
              label="Sync Status"
              value={
                serverStatus?.sync_status ||
                "UNKNOWN"
              }
            />

            <InfoRow
              label="Total Reports"
              value={
                serverStatus?.total_reports ??
                0
              }
            />

            <InfoRow
              label="Pending Reports"
              value={
                serverStatus?.pending_reports ??
                0
              }
            />

            <InfoRow
              label="Verified Reports"
              value={
                serverStatus?.verified_reports ??
                0
              }
            />

            <InfoRow
              label="Last Report Received"
              value={
                serverStatus?.last_report_received
                  ? formatDate(
                      serverStatus.last_report_received
                    )
                  : "No reports yet"
              }
            />

            <div
              style={{
                marginTop: "18px",
                padding: "15px",
                borderRadius: "12px",
                background:
                  "rgba(131,153,88,0.09)",
                border:
                  "1px solid rgba(131,153,88,0.2)",
              }}
            >
              <div
                style={{
                  color: "#839958",
                  fontSize: "11px",
                  fontWeight: "900",
                }}
              >
                RESILIENT DESIGN
              </div>

              <p
                style={{
                  color: "#9FAC8E",
                  fontSize: "11px",
                  lineHeight: "1.6",
                  marginBottom: 0,
                }}
              >
                Field teams can continue collecting
                observations during connectivity
                interruptions. Data remains queued
                locally until synchronization is
                available.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MESSAGE */}
      {message && (
        <div
          style={{
            marginTop: "15px",
            padding: "13px 15px",
            borderRadius: "10px",
            background:
              "rgba(131,153,88,0.1)",
            border:
              "1px solid rgba(131,153,88,0.3)",
            color: "#B8C3A0",
            fontSize: "12px",
          }}
        >
          ✓ {message}
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div
          style={{
            marginTop: "15px",
            padding: "13px 15px",
            borderRadius: "10px",
            background:
              "rgba(184,58,58,0.14)",
            border:
              "1px solid rgba(184,58,58,0.4)",
            color: "#F0B4B4",
            fontSize: "12px",
          }}
        >
          {error}
        </div>
      )}

      <p
        style={{
          color: "#7F8C72",
          fontSize: "11px",
          marginTop: "14px",
          textAlign: "right",
        }}
      >
        Connected to LANDGUARD synchronization
        service.
      </p>
    </section>
  );
}

/* =====================================================
   STATUS CARD
===================================================== */

function StatusCard({
  title,
  value,
  description,
  active,
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
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: active
              ? "#839958"
              : "#B83A3A",
            boxShadow: active
              ? "0 0 9px rgba(131,153,88,0.8)"
              : "none",
          }}
        />

        <span
          style={{
            color: "#9FAC8E",
            fontSize: "10px",
            fontWeight: "800",
            letterSpacing: "1px",
          }}
        >
          {title}
        </span>
      </div>

      <div
        style={{
          color: "#F7F4D5",
          fontSize: "21px",
          fontWeight: "900",
          marginTop: "10px",
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
   INFO ROW
===================================================== */

function InfoRow({
  label,
  value,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "15px",
        padding: "12px 0",
        borderBottom:
          "1px solid rgba(247,244,213,0.07)",
      }}
    >
      <span
        style={{
          color: "#84927A",
          fontSize: "11px",
        }}
      >
        {label}
      </span>

      <span
        style={{
          color: "#F7F4D5",
          fontSize: "11px",
          fontWeight: "800",
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}

/* =====================================================
   DATE FORMAT
===================================================== */

function formatDate(value) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

export default OfflineMode;