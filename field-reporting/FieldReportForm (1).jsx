// FieldReportForm.jsx
//
// FIELD REPORTING MODULE — Member 5 (Web version, rebuilt)
// SIH26001 LandGuard AI — Vite + React 19 web application
//
// Mobile-friendly hazard report form using only native browser APIs:
// navigator.geolocation for GPS, an <input type="file" capture="environment">
// for the camera. All submission/offline logic lives in offlineReportSync.js —
// this component calls submitReport() and renders whatever it returns. It
// does NOT implement its own fetch() call.

import React, { useState, useEffect, useRef } from 'react';
import { submitReport } from './offlineReportSync';

// ---- Fixed option lists (matches backend's expected values exactly) ----
const HAZARD_TYPES = ['CRACK', 'ROCKFALL', 'DEBRIS', 'ROAD_BLOCKAGE', 'LANDSLIDE', 'OTHER'];
const SEVERITY_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export default function FieldReportForm() {
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

  // ---- Submission state ----
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  // result is whatever submitReport() returned:
  //   { mode: 'submitted', report: {...} }  — real backend confirmation
  //   { mode: 'offline', localId, savedAt } — saved on this device, pending sync
  const [result, setResult] = useState(null);

  const fileInputRef = useRef(null);

  // Clean up the object URL used for the photo preview so we don't leak
  // memory when a new photo is chosen or the component unmounts.
  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  // ---- GPS: "Get My Location" button handler ----
  function handleGetLocation() {
    setLocating(true);
    setLocationError(null);

    if (!('geolocation' in navigator)) {
      setLocationError('Geolocation is not supported by this browser.');
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Real device GPS position — never fabricated.
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocating(false);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError('Location permission denied. Please allow location access in your browser settings.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setLocationError('Location unavailable. Make sure GPS/location services are turned on.');
        } else if (error.code === error.TIMEOUT) {
          setLocationError('Getting your location timed out. Please try again.');
        } else {
          setLocationError('Could not get GPS location. Please try again.');
        }
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  // ---- Photo: file input change handler ----
  function handlePhotoChange(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoFile(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
  }

  function handleRetakePhoto() {
    fileInputRef.current?.click();
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

  function resetFormFields() {
    setReportType(null);
    setDescription('');
    setSeverity(null);
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoFile(null);
    setPhotoPreviewUrl(null);
    setLatitude(null);
    setLongitude(null);
  }

  // ---- Submit: delegate entirely to submitReport() ----
  async function handleSubmit() {
    setSubmitError(null);
    if (!validate()) return;

    setSubmitting(true);
    setResult(null);

    try {
      const outcome = await submitReport({
        report_type: reportType,
        description: description.trim(),
        latitude,
        longitude,
        severity,
        photo: photoFile, // browser File object, or null
      });

      setResult(outcome);
      resetFormFields();
    } catch (err) {
      // Genuine failure (e.g. missing fields caught late, or IndexedDB
      // itself failing) — never a fabricated success.
      setSubmitError(err.message || 'Could not submit or save report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmitAnother() {
    setResult(null);
    setSubmitError(null);
  }

  // ---- Result view ----
  if (result) {
    const isOffline = result.mode === 'offline';
    return (
      <div style={styles.container}>
        <h2 style={styles.heading}>{isOffline ? 'Saved Offline' : 'Report Submitted'}</h2>

        {isOffline ? (
          <>
            <p style={styles.pendingNote}>
              No internet connection right now (or the upload didn't go through). Your report is
              safely saved on this device and will upload automatically once you're back online.
            </p>
            <div style={{ ...styles.resultCard, ...styles.pendingCard }}>
              <p style={styles.resultRow}><strong>Local Reference:</strong> {result.localId}</p>
              <p style={styles.resultRow}><strong>Saved At:</strong> {new Date(result.savedAt).toLocaleString()}</p>
              <p style={styles.resultRow}><strong>Status:</strong> PENDING_SYNC</p>
            </div>
          </>
        ) : (
          <div style={styles.resultCard}>
            <p style={styles.resultRow}><strong>Report ID:</strong> {result.report.id}</p>
            <p style={styles.resultRow}><strong>Type:</strong> {result.report.report_type}</p>
            <p style={styles.resultRow}><strong>Severity:</strong> {result.report.severity}</p>
            <p style={styles.resultRow}>
              <strong>Location:</strong> {Number(result.report.latitude).toFixed(6)}, {Number(result.report.longitude).toFixed(6)}
            </p>
            <p style={styles.resultRow}>
              <strong>Created:</strong> {result.report.created_at ? new Date(result.report.created_at).toLocaleString() : 'Unknown'}
            </p>
            <p style={styles.resultRow}><strong>Status:</strong> {result.report.status}</p>
          </div>
        )}

        <button type="button" style={styles.submitButton} onClick={handleSubmitAnother}>
          Submit Another Report
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Field Hazard Report</h2>

      {/* Hazard type selector */}
      <label style={styles.label}>Hazard Type *</label>
      <div style={styles.chipRow}>
        {HAZARD_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            style={{ ...styles.chip, ...(reportType === type ? styles.chipActive : {}) }}
            onClick={() => setReportType(type)}
          >
            {type.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Description */}
      <label style={styles.label}>Description *</label>
      <textarea
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
            key={level}
            type="button"
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
      <label style={styles.label}>Photo (optional)</label>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoChange}
        style={styles.fileInput}
      />
      {photoPreviewUrl && (
        <div>
          <img src={photoPreviewUrl} alt="Report preview" style={styles.preview} />
          <button type="button" style={styles.photoButton} onClick={handleRetakePhoto}>
            Retake Photo
          </button>
        </div>
      )}

      {/* Submit error — real failure, report was NOT submitted */}
      {submitError && (
        <div style={styles.errorBox}>
          <p style={styles.errorBoxText}>{submitError}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="button"
        style={{ ...styles.submitButton, ...(submitting ? styles.submitDisabled : {}) }}
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? 'Submitting…' : 'Submit Report'}
      </button>
    </div>
  );
}

// ---- Inline styles ----
// Plain style objects (no CSS framework dependency assumed) so the
// component is fully self-contained. Move these into a .css file to match
// your project's conventions if you'd prefer.
const styles = {
  container: {
    maxWidth: 480,
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh',
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
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    fontSize: '14px',
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
    fontSize: '14px',
  },
  errorText: {
    marginTop: '8px',
    color: '#c0392b',
    fontSize: '14px',
  },
  fileInput: {
    display: 'block',
    width: '100%',
    marginTop: '4px',
  },
  photoButton: {
    backgroundColor: '#fff',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontWeight: 600,
    color: '#333',
    marginTop: '8px',
    cursor: 'pointer',
  },
  preview: {
    width: '100%',
    maxHeight: '250px',
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
  resultCard: {
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
  resultRow: {
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
