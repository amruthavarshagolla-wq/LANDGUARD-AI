// AlertNotifications.js
//
// FIELD REPORTING MODULE — Member 5 (Web version, rebuilt)
// SIH26001 LandGuard AI — Vite + React 19 web application
//
// Browser-compatible in-app alert/notification system. No Expo, no React
// Native, no expo-notifications, no push/SMS/WhatsApp/Firebase — this is
// purely an in-memory alert store + a React hook + a display component.
//
// This module does NOT fetch anything itself. Any other part of the app
// (a backend poller, a WebSocket handler, another component) can feed it
// alerts by calling addAlert(). Until something does that, the alert list
// is simply empty — except for the clearly-labelled demo trigger below,
// included specifically for hackathon demonstration purposes.

import React, { useState, useEffect } from 'react';

// ------------------------------------------------------------------
// MODULE-LEVEL STORE
// ------------------------------------------------------------------
// Deliberately NOT React Context, per project decision — a simple
// module-level array + subscriber list, so any component can import
// useAlerts() without needing a <Provider> wrapped around the app.

let alerts = [];
const listeners = new Set();

function notifyListeners() {
  const snapshot = [...alerts];
  listeners.forEach((listener) => listener(snapshot));
}

const VALID_RISK_LEVELS = ['LOW', 'MODERATE', 'HIGH', 'VERY_HIGH'];
const VALID_STATUSES = ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'];

// ------------------------------------------------------------------
// PUBLIC STORE API
// ------------------------------------------------------------------

// alertData = {
//   alert_id (required, unique),
//   location, risk_score, risk_level, trigger (or `reason`), affected_area,
//   time, recommended_action
// }
// New alerts always start as status 'ACTIVE'. If an alert with the same
// alert_id already exists, it is replaced (so re-delivering the same
// backend alert doesn't create duplicates).
export function addAlert(alertData) {
  if (!alertData || !alertData.alert_id) {
    throw new Error('addAlert: alertData must include an alert_id.');
  }

  const riskLevel = VALID_RISK_LEVELS.includes(alertData.risk_level)
    ? alertData.risk_level
    : 'LOW';

  const newAlert = {
    alert_id: alertData.alert_id,
    location: alertData.location ?? 'Unknown location',
    risk_score: alertData.risk_score ?? null,
    risk_level: riskLevel,
    trigger: alertData.trigger ?? alertData.reason ?? '',
    affected_area: alertData.affected_area ?? '',
    time: alertData.time ?? new Date().toISOString(),
    recommended_action: alertData.recommended_action ?? '',
    status: 'ACTIVE',
    isDemo: Boolean(alertData.isDemo),
  };

  alerts = [newAlert, ...alerts.filter((a) => a.alert_id !== newAlert.alert_id)];
  notifyListeners();
  return newAlert;
}

export function acknowledgeAlert(alertId) {
  alerts = alerts.map((a) =>
    a.alert_id === alertId ? { ...a, status: 'ACKNOWLEDGED' } : a
  );
  notifyListeners();
}

export function resolveAlert(alertId) {
  alerts = alerts.map((a) =>
    a.alert_id === alertId ? { ...a, status: 'RESOLVED' } : a
  );
  notifyListeners();
}

// filter (optional) = { status?, risk_level? }
export function getAlerts(filter) {
  if (!filter) return [...alerts];
  return alerts.filter((a) => {
    if (filter.status && a.status !== filter.status) return false;
    if (filter.risk_level && a.risk_level !== filter.risk_level) return false;
    return true;
  });
}

// ------------------------------------------------------------------
// REACT HOOK
// ------------------------------------------------------------------

// Subscribes the calling component to live alert state. Re-renders
// whenever addAlert/acknowledgeAlert/resolveAlert changes the store.
export function useAlerts() {
  const [snapshot, setSnapshot] = useState(() => getAlerts());

  useEffect(() => {
    const listener = (updated) => setSnapshot(updated);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  return snapshot;
}

// ------------------------------------------------------------------
// DEMO / TEST ALERT TRIGGER
// ------------------------------------------------------------------
// Clearly labelled as a demo — never mistaken for a real backend-generated
// emergency alert. Safe to remove or disable later by deleting this
// function and the "Trigger Test Alert" button in AlertList below.
export function triggerDemoAlert() {
  return addAlert({
    alert_id: `demo_${Date.now()}`,
    location: 'Demo Zone (Test Data)',
    risk_score: 78,
    risk_level: 'HIGH',
    trigger: 'This is a TEST alert generated for demonstration purposes only.',
    affected_area: 'No real area — demo data',
    time: new Date().toISOString(),
    recommended_action: 'No action needed — this is a demo alert, not a real emergency.',
    isDemo: true,
  });
}

// ------------------------------------------------------------------
// DISPLAY COMPONENTS
// ------------------------------------------------------------------

const RISK_LEVEL_COLORS = {
  LOW: '#27ae60',
  MODERATE: '#e67e22',
  HIGH: '#d35400',
  VERY_HIGH: '#c0392b',
};

function AlertCard({ alert }) {
  const levelColor = RISK_LEVEL_COLORS[alert.risk_level] || RISK_LEVEL_COLORS.LOW;

  return (
    <div style={{ ...styles.card, borderLeftColor: levelColor }}>
      {alert.isDemo && (
        <div style={styles.demoTag}>TEST / DEMO ALERT — not a real emergency</div>
      )}

      <div style={styles.cardHeader}>
        <span style={{ ...styles.levelBadge, backgroundColor: levelColor }}>
          {alert.risk_level.replace('_', ' ')}
        </span>
        <span style={styles.statusBadge}>{alert.status}</span>
      </div>

      <p style={styles.row}><strong>Location:</strong> {alert.location}</p>
      {alert.risk_score !== null && (
        <p style={styles.row}><strong>Risk Score:</strong> {alert.risk_score}</p>
      )}
      {alert.trigger && (
        <p style={styles.row}><strong>Reason:</strong> {alert.trigger}</p>
      )}
      {alert.affected_area && (
        <p style={styles.row}><strong>Affected Area:</strong> {alert.affected_area}</p>
      )}
      <p style={styles.row}><strong>Time:</strong> {new Date(alert.time).toLocaleString()}</p>
      {alert.recommended_action && (
        <p style={styles.row}><strong>Recommended Action:</strong> {alert.recommended_action}</p>
      )}

      {alert.status === 'ACTIVE' && (
        <div style={styles.actions}>
          <button type="button" style={styles.ackButton} onClick={() => acknowledgeAlert(alert.alert_id)}>
            Acknowledge
          </button>
          <button type="button" style={styles.resolveButton} onClick={() => resolveAlert(alert.alert_id)}>
            Resolve
          </button>
        </div>
      )}
      {alert.status === 'ACKNOWLEDGED' && (
        <div style={styles.actions}>
          <button type="button" style={styles.resolveButton} onClick={() => resolveAlert(alert.alert_id)}>
            Resolve
          </button>
        </div>
      )}
    </div>
  );
}

// Ready-to-drop-in alert list, backed by useAlerts(). Includes the
// clearly-labelled demo trigger button so this module can be demonstrated
// even before any real alert source is wired up.
export function AlertList() {
  const alertList = useAlerts();

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.heading}>Alerts</h2>
        <button type="button" style={styles.demoButton} onClick={triggerDemoAlert}>
          + Trigger Test Alert (DEMO)
        </button>
      </div>

      {alertList.length === 0 ? (
        <p style={styles.empty}>No active alerts.</p>
      ) : (
        alertList.map((alert) => <AlertCard key={alert.alert_id} alert={alert} />)
      )}
    </div>
  );
}

// ---- Inline styles ----
const styles = {
  container: {
    maxWidth: 480,
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  heading: {
    fontSize: '20px',
    fontWeight: 700,
    margin: 0,
  },
  demoButton: {
    backgroundColor: '#7f8c8d',
    color: '#fff',
    padding: '8px 12px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  empty: {
    color: '#888',
    fontSize: '14px',
    textAlign: 'center',
    marginTop: '30px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '14px',
    marginBottom: '12px',
    borderLeft: '5px solid #ccc',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  demoTag: {
    display: 'inline-block',
    backgroundColor: '#fff3e0',
    color: '#7a4a00',
    fontSize: '11px',
    fontWeight: 700,
    padding: '4px 8px',
    borderRadius: '6px',
    marginBottom: '10px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  levelBadge: {
    color: '#fff',
    fontSize: '12px',
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: '12px',
  },
  statusBadge: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#555',
    backgroundColor: '#f0f0f0',
    padding: '4px 10px',
    borderRadius: '12px',
  },
  row: {
    fontSize: '14px',
    color: '#333',
    margin: '4px 0',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
  },
  ackButton: {
    backgroundColor: '#2c3e50',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  resolveButton: {
    backgroundColor: '#27ae60',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
