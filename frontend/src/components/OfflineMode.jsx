import { useState } from "react";

function OfflineMode() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState("10 minutes ago");
  const [pendingReports, setPendingReports] = useState(3);

  // Handle Sync button
  const handleSync = () => {
    if (!isOnline) {
      alert("You are currently offline. Please connect to the internet.");
      return;
    }

    setIsSyncing(true);

    // Simulate synchronization
    setTimeout(() => {
      setIsSyncing(false);
      setLastSync("Just now");
      setPendingReports(0);
    }, 2000);
  };

  return (
    <section
      style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "20px 40px 50px",
      }}
    >
      {/* ================= HEADER ================= */}

      <div style={{ marginBottom: "25px" }}>
        <p
          style={{
            color: "#4ade80",
            fontSize: "13px",
            fontWeight: "bold",
            letterSpacing: "2px",
            marginBottom: "6px",
          }}
        >
          FIELD CONNECTIVITY
        </p>

        <h2
          style={{
            color: "#ffffff",
            fontSize: "28px",
            marginBottom: "6px",
          }}
        >
          📡 Offline Mode
        </h2>

        <p
          style={{
            color: "#a7f3d0",
            fontSize: "14px",
          }}
        >
          Continue field operations even when network connectivity is limited.
        </p>
      </div>

      {/* ================= MAIN CARD ================= */}

      <div
        style={{
          background:
            "linear-gradient(145deg, rgba(6,78,59,0.8), rgba(5,46,22,0.95))",
          borderRadius: "22px",
          border: "1px solid rgba(74,222,128,0.2)",
          boxShadow: "0 12px 35px rgba(0,0,0,0.3)",
          padding: "30px",
        }}
      >
        {/* ================= STATUS HEADER ================= */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
            flexWrap: "wrap",
            marginBottom: "25px",
          }}
        >
          <div>
            <h3
              style={{
                color: "#ffffff",
                fontSize: "21px",
                marginBottom: "5px",
              }}
            >
              🌐 Connectivity Status
            </h3>

            <p
              style={{
                color: "#86efac",
                fontSize: "12px",
              }}
            >
              Network and synchronization information
            </p>
          </div>

          {/* Online / Offline Toggle */}

          <button
            onClick={() => setIsOnline(!isOnline)}
            style={{
              border: isOnline
                ? "1px solid rgba(74,222,128,0.4)"
                : "1px solid rgba(248,113,113,0.4)",
              backgroundColor: isOnline
                ? "rgba(34,197,94,0.12)"
                : "rgba(239,68,68,0.12)",
              color: isOnline ? "#86efac" : "#fca5a5",
              padding: "9px 16px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {isOnline ? "🟢 ONLINE" : "🔴 OFFLINE"}
          </button>
        </div>

        {/* ================= STATUS CARDS ================= */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "18px",
          }}
        >
          {/* Network Status */}

          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.04)",
              borderRadius: "16px",
              padding: "22px",
              border: "1px solid rgba(167,243,208,0.1)",
            }}
          >
            <p
              style={{
                color: "#a7f3d0",
                fontSize: "12px",
                marginBottom: "10px",
              }}
            >
              📶 Network Status
            </p>

            <h3
              style={{
                color: isOnline ? "#4ade80" : "#f87171",
                fontSize: "25px",
                margin: 0,
              }}
            >
              {isOnline ? "Online" : "Offline"}
            </h3>

            <p
              style={{
                color: isOnline ? "#86efac" : "#fca5a5",
                fontSize: "11px",
                marginTop: "6px",
              }}
            >
              {isOnline
                ? "Internet connection available"
                : "Working in offline mode"}
            </p>
          </div>

          {/* Last Sync */}

          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.04)",
              borderRadius: "16px",
              padding: "22px",
              border: "1px solid rgba(167,243,208,0.1)",
            }}
          >
            <p
              style={{
                color: "#a7f3d0",
                fontSize: "12px",
                marginBottom: "10px",
              }}
            >
              🔄 Last Data Sync
            </p>

            <h3
              style={{
                color: "#ffffff",
                fontSize: "22px",
                margin: 0,
              }}
            >
              {lastSync}
            </h3>

            <p
              style={{
                color: "#86efac",
                fontSize: "11px",
                marginTop: "6px",
              }}
            >
              Data synchronization status
            </p>
          </div>

          {/* Pending Reports */}

          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.04)",
              borderRadius: "16px",
              padding: "22px",
              border: "1px solid rgba(167,243,208,0.1)",
            }}
          >
            <p
              style={{
                color: "#a7f3d0",
                fontSize: "12px",
                marginBottom: "10px",
              }}
            >
              📋 Pending Reports
            </p>

            <h3
              style={{
                color: pendingReports > 0 ? "#fbbf24" : "#4ade80",
                fontSize: "25px",
                margin: 0,
              }}
            >
              {pendingReports}
            </h3>

            <p
              style={{
                color: pendingReports > 0 ? "#fcd34d" : "#86efac",
                fontSize: "11px",
                marginTop: "6px",
              }}
            >
              {pendingReports > 0
                ? "Reports waiting for sync"
                : "All reports synchronized"}
            </p>
          </div>
        </div>

        {/* ================= OFFLINE OPERATION ================= */}

        <div
          style={{
            marginTop: "25px",
            background:
              "linear-gradient(145deg, rgba(30,64,175,0.25), rgba(23,37,84,0.35))",
            borderRadius: "18px",
            padding: "25px",
            border: "1px solid rgba(147,197,253,0.15)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "15px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "13px",
                backgroundColor: "rgba(59,130,246,0.15)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: "22px",
                flexShrink: 0,
              }}
            >
              📱
            </div>

            <div>
              <h3
                style={{
                  color: "#ffffff",
                  fontSize: "19px",
                  marginBottom: "6px",
                }}
              >
                Field Operations Mode
              </h3>

              <p
                style={{
                  color: "#bfdbfe",
                  fontSize: "13px",
                  lineHeight: "1.7",
                }}
              >
                Field workers can continue recording landslide observations
                even when internet connectivity is unavailable. Reports can
                be stored locally and synchronized when the network becomes
                available.
              </p>
            </div>
          </div>
        </div>

        {/* ================= SYNC SECTION ================= */}

        <div
          style={{
            marginTop: "25px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                color: "#d1fae5",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              🔄 Data Synchronization
            </p>

            <p
              style={{
                color: "#86efac",
                fontSize: "12px",
                marginTop: "4px",
              }}
            >
              Sync pending field reports with the central system.
            </p>
          </div>

          <button
            onClick={handleSync}
            disabled={isSyncing}
            style={{
              padding: "13px 25px",
              border: "none",
              borderRadius: "11px",
              background: isSyncing
                ? "#166534"
                : "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "#052e16",
              fontWeight: "bold",
              fontSize: "14px",
              cursor: isSyncing ? "not-allowed" : "pointer",
              boxShadow: "0 6px 20px rgba(34,197,94,0.25)",
              opacity: isSyncing ? 0.7 : 1,
            }}
          >
            {isSyncing ? "⏳ Syncing..." : "🔄 Sync Data"}
          </button>
        </div>
      </div>
    </section>
  );
}

export default OfflineMode;