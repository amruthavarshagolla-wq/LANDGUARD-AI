// FieldReportForm.jsx
//
// FIELD REPORTING MODULE — Member 5 — SIH26001 LandGuard AI (Web version)
//
// Mobile-friendly React component for the existing Vite + React 19 web app.
// Uses only browser-native Web APIs — no Expo, no React Native, no new
// npm dependencies.
//
// IMPORTANT FOR INTEGRATION TEAMMATE:
// This component does NOT hard-code any backend URL — pass it in via the
// `apiBaseUrl` prop. See the bottom of this file for the full contract.

import { useState, useRef, useEffect } from 'react';
import { saveReportLocally } from './offlineReportSync';

// ---- Fixed option lists (matches backend's expected values exactly) ----
const HAZARD_TYPES = ['CRACK', 'ROCKFALL', 'DEBRIS', 'ROAD_BLOCKAGE', 'LANDSLIDE', 'OTHER'];
const SEVERITY_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

// apiBaseUrl: the backend's base URL (e.g. "https://landguard-backend.example.com").
// Not hardcoded here — the parent component/integration teammate supplies it.
export default function FieldReportForm({ apiBaseUrl = null, onSubmitReport }) {
  // ---- Form state ----
  const [reportType, setReportType] = useState(null);
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null);

  // ---- GPS state ----
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  // ---- Result state ----
  // submittedReport holds either a backend-confirmed report summary OR a
  // locally-saved PENDING_SYNC summary. submitError holds a real error
  // message. Never both at once, and never fabricated data.
  const [submittedReport, setSubmittedReport] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const fileInputRef = useRef(null);

  // Release the object URL used for the photo preview when it's replaced
  // or when the component unmounts, to avoid leaking memory.
  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  // ---- GPS: "Get My Location" button handler ----
  function handleGetLocation() {
    setLocationError(null);

    if (!('geolocation' in navigator)) {
      setLocationError('Geolocation is not supported by this browser.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Real device GPS coordinates — never fabricated.
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocating(false);
      },
      (error) => {
        let message = 'Could not get GPS location. Please try again.';
        if (error.code === error.PERMISSION_DENIED) {
          message = 'Location permission denied. Please allow location access in your browser settings.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = 'Location unavailable. Make sure GPS/location services are turned on.';
        } else if (error.code === error.TIMEOUT) {
          message = 'Getting your location timed out. Please try again.';
        }
        setLocationError(message);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  // ---- Photo: capture or pick an optional photo ----
  function handlePhotoChange(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoFile(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
  }

  // ---- Validation ----
  function validate() {
    if (!reportType) {
      setSubmitError('Please select a hazard type.');
      return false;
    }
    if (!description || description.trim().length === 0) {
      setSubmitError('Please enter a description.');
      return false;
    }
    if (!severity) {
      setSubmitError('Please select a severity level.');
      return false;
    }
    if (latitude === null || longitude === null) {
      setSubmitError('Please tap "Get My Location" before submitting.');
      return false;
    }
    return true;
  }

  // ---- Submit: online → POST directly; offline → save locally for later sync ----
  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    if (!apiBaseUrl) {
      // Fail loudly rather than pretending to submit — no fake success.
      setSubmitError('No backend URL configured. Pass an apiBaseUrl prop to FieldReportForm.');
      return;
    }

    setSubmittedReport(null);
    setSubmitting(true);

    // This is the shape both the direct API call AND local offline storage
    // use. Real GPS values only — never fabricated.
    const reportPayload = {
      report_type: reportType,
      description: description.trim(),
      latitude,
      longitude,
      severity,
      photo: photoFile, // browser File object, or null
    };

    try {
      const isOnline = typeof navigator === 'undefined' ? true : navigator.onLine;

      if (!isOnline) {
        // No connection at all — skip the network attempt entirely and
        // save locally. The report is safe in IndexedDB and will sync
        // automatically once connectivity returns (handled by
        // offlineReportSync.js's 'online' listener + retry interval).
        await saveReportLocally(reportPayload);
        showPendingSyncResult(reportPayload);
        return;
      }

      // Online: attempt the real submission.
      try {
        await submitDirectlyToBackend(reportPayload);
      } catch (onlineErr) {
        // We had a connection, but the request itself failed (server
        // error, timeout, dropped connection mid-request, etc). Rather
        // than losing the report, fall back to local storage so it will
        // retry automatically. This is NOT a fake success — the UI will
        // clearly show PENDING_SYNC, not a confirmed submission.
        console.warn('[FieldReportForm] Online submit failed, saving offline instead:', onlineErr.message);
        await saveReportLocally(reportPayload);
        showPendingSyncResult(reportPayload);
      }
    } catch (err) {
      // Genuine failure — even local storage didn't work. Do not pretend
      // anything succeeded.
      setSubmitError(err.message || 'Could not submit or save report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // Performs the actual POST to the backend and updates state on success.
  // Throws on any failure so the caller can decide whether to fall back
  // to offline storage.
  async function submitDirectlyToBackend(reportPayload) {
    const formData = new FormData();
    // Only fields the backend spec defines are sent.
    formData.append('report_type', reportPayload.report_type);
    formData.append('description', reportPayload.description);
    formData.append('latitude', String(reportPayload.latitude));
    formData.append('longitude', String(reportPayload.longitude));
    formData.append('severity', reportPayload.severity);

    if (reportPayload.photo) {
      formData.append('photo', reportPayload.photo, reportPayload.photo.name || 'report.jpg');
    }

    const response = await fetch(`${apiBaseUrl}/api/field-reports`, {
      method: 'POST',
      body: formData,
      // Do NOT set 'Content-Type' manually for multipart/form-data —
      // fetch generates the correct boundary automatically.
    });

    if (!response.ok) {
      const bodyText = await response.text().catch(() => '');
      throw new Error(
        bodyText || `Server responded with status ${response.status}. Please try again.`
      );
    }

    const result = await response.json();

    // The backend auto-generates report_id, user_id, created_at, status.
    // We display those from the response, falling back to the locally
    // submitted values only for fields the backend might not echo back.
    const summary = {
      report_id: result.report_id ?? result.id ?? 'Unknown',
      report_type: result.report_type ?? reportPayload.report_type,
      severity: result.severity ?? reportPayload.severity,
      latitude: result.latitude ?? reportPayload.latitude,
      longitude: result.longitude ?? reportPayload.longitude,
      created_at: result.created_at ?? null,
      status: result.status ?? 'PENDING_VERIFICATION',
    };

    setSubmittedReport(summary);

    // Optional extensibility hook — only fired on a confirmed backend
    // success, not on offline queueing. Wrapped so a bug in the caller's
    // callback can never turn this already-successful submission into a
    // false error.
    if (onSubmitReport) {
      try {
        const maybePromise = onSubmitReport(summary);
        if (maybePromise && typeof maybePromise.catch === 'function') {
          maybePromise.catch((hookErr) =>
            console.warn('onSubmitReport hook failed (report was still submitted):', hookErr)
          );
        }
      } catch (hookErr) {
        console.warn('onSubmitReport hook failed (report was still submitted):', hookErr);
      }
    }

    resetFormFields();
  }

  // Shows an honest "saved offline, will sync later" result — never a fake
  // backend confirmation. report_id is intentionally not a real ID since
  // the backend hasn't seen this report yet.
  function showPendingSyncResult(reportPayload) {
    setSubmittedReport({
      report_id: 'Assigned after sync',
      report_type: reportPayload.report_type,
      severity: reportPayload.severity,
      latitude: reportPayload.latitude,
      longitude: reportPayload.longitude,
      created_at: new Date().toISOString(),
      status: 'PENDING_SYNC',
    });
    resetFormFields();
  }

  function resetFormFields() {
    setReportType(null);
    setDescription('');
    setSeverity(null);
    setPhotoFile(null);
    setPhotoPreviewUrl(null);
    setLatitude(null);
    setLongitude(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // Clears the result so the officer can start a new report.
  function handleSubmitAnother() {
    setSubmittedReport(null);
    setSubmitError(null);
  }

  // ---- Result view: shown after either a confirmed backend submission
  // or a report being saved locally as PENDING_SYNC ----
  if (submittedReport) {
    const isPendingSync = submittedReport.status === 'PENDING_SYNC';
    return (
      <div style={styles.container}>
        <h2 style={styles.heading}>
          {isPendingSync ? 'Saved Offline' : 'Report Submitted'}
        </h2>
        {isPendingSync && (
          <p style={styles.pendingNote}>
            No internet connection right now (or the upload didn't go through). Your report is
            safely saved on this device and will upload automatically once you're back online.
          </p>
        )}
        <div style={{ ...styles.successCard, ...(isPendingSync ? styles.pendingCard : {}) }}>
          <p style={styles.successRow}>Report ID: {submittedReport.report_id}</p>
          <p style={styles.successRow}>Type: {submittedReport.report_type}</p>
          <p style={styles.successRow}>Severity: {submittedReport.severity}</p>
          <p style={styles.successRow}>
            Location: {Number(submittedReport.latitude).toFixed(6)}, {Number(submittedReport.longitude).toFixed(6)}
          </p>
          <p style={styles.successRow}>
            Created: {submittedReport.created_at ? new Date(submittedReport.created_at).toLocaleString() : 'Unknown'}
          </p>
          <p style={styles.successRow}>Status: {submittedReport.status}</p>
        </div>
        <button type="button" style={styles.submitButton} onClick={handleSubmitAnother}>
          Submit Another Report
        </button>
      </div>
    );
  }

  return (
    <form style={styles.container} onSubmit={handleSubmit}>
      <h2 style={styles.heading}>Field Hazard Report</h2>

      {/* Hazard type selector */}
      <label style={styles.label}>Hazard Type *</label>
      <div style={styles.chipRow}>
        {HAZARD_TYPES.map((type) => (
          <button
            type="button"
            key={type}
            style={{ ...styles.chip, ...(reportType === type ? styles.chipActive : {}) }}
            onClick={() => setReportType(type)}
          >
            {type.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Description */}
      <label style={styles.label} htmlFor="report-description">Description *</label>
      <textarea
        id="report-description"
        style={styles.textArea}
        placeholder="Describe what you observed..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      {/* Severity selector */}
      <label style={styles.label}>Severity *</label>
      <div style={styles.chipRow}>
        {SEVERITY_LEVELS.map((level) => (
          <button
            type="button"
            key={level}
            style={{ ...styles.chip, ...(severity === level ? styles.chipActive : {}) }}
            onClick={() => setSeverity(level)}
          >
            {level}
          </button>
        ))}
      </div>

      {/* GPS location */}
      <label style={styles.label}>Location *</label>
      <button
        type="button"
        style={styles.locationButton}
        onClick={handleGetLocation}
        disabled={locating}
      >
        {locating ? 'Getting location…' : '📍 Get My Location'}
      </button>

      {latitude !== null && longitude !== null && (
        <p style={styles.locationText}>
          Latitude: {latitude.toFixed(6)}&nbsp;&nbsp;Longitude: {longitude.toFixed(6)}
        </p>
      )}
      {locationError && <p style={styles.errorText}>{locationError}</p>}

      {/* Optional photo */}
      <label style={styles.label} htmlFor="report-photo">Photo (optional)</label>
      <input
        id="report-photo"
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoChange}
        style={styles.fileInput}
      />
      {photoPreviewUrl && (
        <img src={photoPreviewUrl} alt="Report preview" style={styles.preview} />
      )}

      {/* Submit error — real failure, report was NOT submitted */}
      {submitError && (
        <div style={styles.errorBox}>
          <p style={styles.errorBoxText}>{submitError}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        style={{ ...styles.submitButton, ...(submitting ? styles.submitDisabled : {}) }}
        disabled={submitting}
      >
        {submitting ? 'Submitting…' : 'Submit Report'}
      </button>
    </form>
  );
}

// ---- Inline styles: mobile-first, no external CSS/framework dependency ----
const styles = {
  container: {
    padding: '20px',
    maxWidth: '480px',
    margin: '0 auto',
    backgroundColor: '#f5f5f5',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    boxSizing: 'border-box',
  },
  heading: {
    fontSize: '20px',
    fontWeight: 700,
    marginBottom: '16px',
    textAlign: 'center',
  },
  label: {
    display: 'block',
    fontWeight: 700,
    marginTop: '14px',
    marginBottom: '6px',
    fontSize: '14px',
  },
  chipRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  chip: {
    padding: '8px 14px',
    borderRadius: '20px',
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    fontSize: '13px',
    color: '#333',
    cursor: 'pointer',
  },
  chipActive: {
    backgroundColor: '#c0392b',
    borderColor: '#c0392b',
    color: '#fff',
    fontWeight: 700,
  },
  textArea: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '12px',
    minHeight: '80px',
    border: '1px solid #ddd',
    fontSize: '14px',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  locationButton: {
    width: '100%',
    backgroundColor: '#2c3e50',
    color: '#fff',
    padding: '14px',
    borderRadius: '8px',
    border: 'none',
    fontWeight: 700,
    fontSize: '14px',
    cursor: 'pointer',
  },
  locationText: {
    marginTop: '8px',
    color: '#333',
    fontSize: '13px',
  },
  errorText: {
    marginTop: '8px',
    color: '#c0392b',
    fontSize: '13px',
  },
  fileInput: {
    display: 'block',
    width: '100%',
    padding: '10px 0',
    fontSize: '14px',
  },
  preview: {
    width: '100%',
    maxHeight: '260px',
    objectFit: 'cover',
    borderRadius: '8px',
    marginTop: '10px',
  },
  submitButton: {
    width: '100%',
    backgroundColor: '#c0392b',
    color: '#fff',
    padding: '16px',
    borderRadius: '10px',
    border: 'none',
    fontWeight: 700,
    fontSize: '16px',
    marginTop: '24px',
    marginBottom: '40px',
    cursor: 'pointer',
  },
  submitDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  successCard: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '16px',
    border: '1px solid #27ae60',
    marginBottom: '20px',
  },
  pendingCard: {
    borderColor: '#e67e22',
  },
  pendingNote: {
    fontSize: '13px',
    color: '#7a4a00',
    backgroundColor: '#fff3e0',
    borderRadius: '8px',
    padding: '10px',
    marginBottom: '14px',
  },
  successRow: {
    fontSize: '14px',
    color: '#333',
    marginBottom: '8px',
  },
  errorBox: {
    backgroundColor: '#fdecea',
    borderRadius: '8px',
    padding: '12px',
    border: '1px solid #c0392b',
    marginTop: '16px',
  },
  errorBoxText: {
    color: '#c0392b',
    fontSize: '13px',
    margin: 0,
  },
};

/*
 ============================================================
 NOTES FOR YOUR BACKEND / INTEGRATION TEAMMATE
 ============================================================

 THIS COMPONENT HANDLES ONLINE + OFFLINE SUBMISSION, BROWSER-ONLY.

 Flow on Submit:
   1. Check connectivity (navigator.onLine).
   2. ONLINE  → POST directly to `${apiBaseUrl}/api/field-reports` as
      multipart/form-data. On success, shows the backend-confirmed
      report_id/status.
   3. OFFLINE → skips the network attempt entirely and calls
      saveReportLocally() from offlineReportSync.js, which writes the
      report to IndexedDB with status PENDING_SYNC. The UI shows
      "Saved Offline" with status PENDING_SYNC — never a fake confirmation.
   4. ONLINE BUT THE REQUEST FAILS (server error, timeout, dropped
      connection) → also falls back to saveReportLocally(), so a flaky
      connection never loses a report.
   5. Once real connectivity returns, offlineReportSync.js's own 'online'
      event listener (+ 30s safety-net interval) automatically finds every
      PENDING_SYNC report and uploads it. This component does not need to
      do anything further for that to happen.

 Props:
 - `apiBaseUrl` (required) — e.g. <FieldReportForm apiBaseUrl="https://landguard-backend.example.com" />
   No URL is hardcoded.
 - `onSubmitReport` (optional) — called ONLY after a confirmed backend
   success (not when a report is queued offline), with the backend's
   confirmed report summary.

 Request body sent to POST /api/field-reports (multipart/form-data):
   report_type   (string, required)
   description   (string, required)
   latitude      (string of a number, required)
   longitude     (string of a number, required)
   severity      (string, required)
   photo         (file, optional)

 No client_id, weather, reportedBy, zone_id, or verified fields are ever
 sent — see offlineReportSync.js's uploadReport() for the exact same
 contract used during background sync.

 Example wiring in a parent component:

   import FieldReportForm from './FieldReportForm';

   function ReportPage() {
     return (
       <FieldReportForm
         apiBaseUrl="https://landguard-backend.example.com" // from your app config
       />
     );
   }

 Not yet implemented (by design, future step): SMS/WhatsApp/browser push
 notifications and the main alert system.
*/
