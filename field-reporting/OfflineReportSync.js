// OfflineReportSync.js
//
// FIELD REPORTING MODULE — Part 2: OFFLINE STORAGE & AUTOMATIC SYNC
// SIH26001 LandGuard AI
//
// This file is completely self-contained. It does NOT know about
// FieldReportForm.js directly — your teammate connects the two by calling
// saveReportLocally(reportData) with the object FieldReportForm produces.
//
// WHAT THIS FILE DOES:
//   1. Saves a submitted report into local SQLite immediately (status: PENDING_SYNC)
//   2. Watches network connectivity (NetInfo)
//   3. When online, automatically uploads all PENDING_SYNC reports to the backend
//   4. Marks each report SYNCED only after the server confirms success
//   5. Never deletes a report until the server has confirmed it
//
// WHAT THIS FILE DOES NOT DO (on purpose, per current scope):
//   - No alerts / push notifications / Firebase / FCM
//   - No UI — this is a plain logic module
//   - No hard-coded backend URL — you provide it via initializeOfflineSync()

import * as SQLite from 'expo-sqlite';
import NetInfo from '@react-native-community/netinfo';

// ------------------------------------------------------------------
// MODULE-LEVEL STATE
// ------------------------------------------------------------------

// The SQLite database handle. Opened once, reused everywhere in this file.
const db = SQLite.openDatabase('field_reports_offline.db');

// Backend configuration, set by initializeOfflineSync(). Nothing is
// hard-coded — the integration teammate supplies this at app startup.
let apiConfig = {
  apiBaseUrl: null,       // e.g. "https://landguard-backend.example.com"
  endpointPath: '/api/field-reports',
};

// Prevents two sync runs from overlapping (e.g. a NetInfo event and the
// periodic retry timer firing at nearly the same moment).
let syncInProgress = false;

// Handles so initializeOfflineSync() can be "undone" if ever needed.
let netInfoUnsubscribe = null;
let retryIntervalHandle = null;

// How often (ms) we double-check for pending reports even without a
// network-change event, as a safety net. 30 seconds is reasonable for a
// hackathon demo; tune later if needed.
const RETRY_INTERVAL_MS = 30000;

// ------------------------------------------------------------------
// STEP 0: DATABASE SETUP
// ------------------------------------------------------------------

// Creates the local table if it doesn't already exist. Safe to call
// multiple times — CREATE TABLE IF NOT EXISTS is a no-op after the first run.
//
// Columns explained:
//   client_id     - locally generated unique id, sent to backend too,
//                    so retries/duplicates can be identified
//   status        - 'PENDING_SYNC' | 'SYNCING' | 'SYNCED'
//   created_at    - when the officer submitted the report (local time)
function setupDatabase() {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS field_reports (
            client_id TEXT PRIMARY KEY NOT NULL,
            report_type TEXT NOT NULL,
            description TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            severity TEXT NOT NULL,
            photo_uri TEXT,
            status TEXT NOT NULL DEFAULT 'PENDING_SYNC',
            created_at TEXT NOT NULL
          );`
        );
      },
      (error) => reject(error),
      () => resolve()
    );
  });
}

// Simple unique id generator. Not a "real" UUID library (kept dependency-free
// on purpose) but unique enough for this use case: timestamp + random suffix.
function generateClientId() {
  return `report_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
}

// ------------------------------------------------------------------
// STEP 1: SAVE REPORT LOCALLY (called right after form submission)
// ------------------------------------------------------------------

// report = { report_type, description, latitude, longitude, severity, photo }
// This is EXACTLY the shape FieldReportForm.js produces.
//
// Returns the client_id of the saved row, in case the caller wants to
// track it (e.g. show "Report #123 pending sync" in the UI later).
export function saveReportLocally(report) {
  return new Promise((resolve, reject) => {
    // Basic defensive checks — the form already validates these fields,
    // but this module should not silently accept garbage data either.
    if (!report || !report.report_type || !report.description ||
        report.latitude == null || report.longitude == null || !report.severity) {
      reject(new Error('saveReportLocally: missing required report fields.'));
      return;
    }

    const clientId = generateClientId();
    const createdAt = new Date().toISOString();

    db.transaction(
      (tx) => {
        tx.executeSql(
          `INSERT INTO field_reports
            (client_id, report_type, description, latitude, longitude, severity, photo_uri, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING_SYNC', ?);`,
          [
            clientId,
            report.report_type,
            report.description,
            report.latitude,
            report.longitude,
            report.severity,
            report.photo || null, // photo is optional
            createdAt,
          ]
        );
      },
      (error) => reject(error),
      () => {
        console.log(`[OfflineSync] Report saved locally as PENDING_SYNC: ${clientId}`);
        resolve(clientId);

        // Best-effort: if we happen to be online right now, try syncing
        // immediately instead of waiting for the next network event/interval.
        // This is fire-and-forget on purpose — saveReportLocally() should
        // resolve quickly regardless of network state.
        syncPendingReports().catch((err) => {
          console.log('[OfflineSync] Immediate sync attempt failed (will retry later):', err.message);
        });
      }
    );
  });
}

// ------------------------------------------------------------------
// STEP 2: READ PENDING REPORTS (useful for a "My Reports" screen too)
// ------------------------------------------------------------------

// Returns all reports currently waiting to be uploaded.
export function getPendingReports() {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          `SELECT * FROM field_reports WHERE status = 'PENDING_SYNC' ORDER BY created_at ASC;`,
          [],
          (_, { rows }) => resolve(rows._array),
          (_, error) => { reject(error); return false; }
        );
      }
    );
  });
}

// Bonus helper (not required, but handy for the integration teammate to
// show sync history / debug): returns ALL reports regardless of status.
export function getAllLocalReports() {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          `SELECT * FROM field_reports ORDER BY created_at DESC;`,
          [],
          (_, { rows }) => resolve(rows._array),
          (_, error) => { reject(error); return false; }
        );
      }
    );
  });
}

// ------------------------------------------------------------------
// STEP 3: MARK STATUS HELPERS
// ------------------------------------------------------------------

function updateReportStatus(clientId, newStatus) {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          `UPDATE field_reports SET status = ? WHERE client_id = ?;`,
          [newStatus, clientId],
          (_, result) => resolve(result),
          (_, error) => { reject(error); return false; }
        );
      }
    );
  });
}

// ------------------------------------------------------------------
// STEP 4: UPLOAD A SINGLE REPORT (multipart/form-data)
// ------------------------------------------------------------------

// Builds the multipart form and POSTs it to <apiBaseUrl><endpointPath>.
// Throws on any failure (network error, non-2xx response) so the caller
// (syncPendingReports) can decide what to do — it will NOT mark the report
// as synced if this throws.
async function uploadReport(report) {
  if (!apiConfig.apiBaseUrl) {
    throw new Error(
      'API base URL is not configured. Call initializeOfflineSync({ apiBaseUrl }) at app startup.'
    );
  }

  const formData = new FormData();

  // These field names match exactly what the backend expects:
  // report_type, description, latitude, longitude, severity, photo (optional)
  formData.append('report_type', report.report_type);
  formData.append('description', report.description);
  formData.append('latitude', String(report.latitude));
  formData.append('longitude', String(report.longitude));
  formData.append('severity', report.severity);

  // Also send our local client_id — harmless extra field for now, but useful
  // if the backend later wants to de-duplicate retried uploads.
  formData.append('client_id', report.client_id);

  if (report.photo_uri) {
    formData.append('photo', {
      uri: report.photo_uri,
      name: `${report.client_id}.jpg`,
      type: 'image/jpeg',
    });
  }

  const url = `${apiConfig.apiBaseUrl}${apiConfig.endpointPath}`;

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    headers: {
      // Note: do NOT manually set 'Content-Type' for multipart/form-data —
      // fetch sets the correct boundary automatically when body is FormData.
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    // Non-2xx response — treat as failure so the report stays PENDING_SYNC.
    const bodyText = await response.text().catch(() => '');
    throw new Error(`Server rejected report (status ${response.status}): ${bodyText}`);
  }

  return response.json().catch(() => ({})); // some backends may return empty body
}

// ------------------------------------------------------------------
// STEP 5: SYNC ALL PENDING REPORTS
// ------------------------------------------------------------------

// Finds every PENDING_SYNC report and attempts to upload it one at a time.
// Safe to call repeatedly/concurrently — syncInProgress guards against
// overlapping runs.
export async function syncPendingReports() {
  if (syncInProgress) {
    console.log('[OfflineSync] Sync already in progress, skipping this call.');
    return;
  }

  // Check connectivity before even trying — avoids pointless failed requests.
  const netState = await NetInfo.fetch();
  if (!netState.isConnected || netState.isInternetReachable === false) {
    console.log('[OfflineSync] No internet connection, skipping sync.');
    return;
  }

  syncInProgress = true;
  try {
    const pending = await getPendingReports();

    if (pending.length === 0) {
      console.log('[OfflineSync] No pending reports to sync.');
      return;
    }

    console.log(`[OfflineSync] Found ${pending.length} pending report(s). Starting sync...`);

    for (const report of pending) {
      try {
        // Mark as SYNCING first, so if syncPendingReports() somehow gets
        // called again mid-loop, this row won't be picked up twice.
        await updateReportStatus(report.client_id, 'SYNCING');

        await uploadReport(report);

        // Server confirmed — NOW it's safe to mark SYNCED.
        // The row is kept (not deleted) for history/audit purposes.
        await updateReportStatus(report.client_id, 'SYNCED');
        console.log(`[OfflineSync] Report ${report.client_id} synced successfully.`);
      } catch (err) {
        // Upload failed — revert to PENDING_SYNC so it retries next time.
        // The report is NEVER lost.
        await updateReportStatus(report.client_id, 'PENDING_SYNC');
        console.log(`[OfflineSync] Failed to sync report ${report.client_id}, will retry later:`, err.message);
      }
    }
  } finally {
    syncInProgress = false;
  }
}

// ------------------------------------------------------------------
// STEP 6: INITIALIZE — call this ONCE when your app starts
// ------------------------------------------------------------------

// config = { apiBaseUrl: string, endpointPath?: string }
//
// Example:
//   initializeOfflineSync({ apiBaseUrl: 'https://your-backend.example.com' })
//
// This function:
//   1. Creates the local SQLite table if needed
//   2. Stores the backend config (no URL hard-coded in this file)
//   3. Starts listening for connectivity changes → auto-triggers sync
//   4. Starts a periodic safety-net sync check every 30s
//   5. Attempts one sync immediately, in case there are already pending
//      reports from a previous app session
export async function initializeOfflineSync(config) {
  if (!config || !config.apiBaseUrl) {
    throw new Error('initializeOfflineSync: you must provide { apiBaseUrl }.');
  }

  apiConfig.apiBaseUrl = config.apiBaseUrl;
  if (config.endpointPath) {
    apiConfig.endpointPath = config.endpointPath;
  }

  await setupDatabase();

  // Reactive trigger: fires the moment the device regains connectivity.
  netInfoUnsubscribe = NetInfo.addEventListener((state) => {
    if (state.isConnected && state.isInternetReachable !== false) {
      console.log('[OfflineSync] Network restored — attempting sync.');
      syncPendingReports().catch((err) =>
        console.log('[OfflineSync] Sync triggered by network event failed:', err.message)
      );
    }
  });

  // Safety-net trigger: in case the network event above is ever missed
  // (this happens occasionally on some Android devices).
  retryIntervalHandle = setInterval(() => {
    syncPendingReports().catch((err) =>
      console.log('[OfflineSync] Periodic sync attempt failed:', err.message)
    );
  }, RETRY_INTERVAL_MS);

  // Catch up on anything left over from a previous app session.
  syncPendingReports().catch((err) =>
    console.log('[OfflineSync] Initial sync attempt failed:', err.message)
  );

  console.log('[OfflineSync] Initialized with backend:', apiConfig.apiBaseUrl);
}

// Optional cleanup — call if you ever need to stop the listeners
// (e.g. on logout, or in a test teardown). Not required for normal use.
export function stopOfflineSync() {
  if (netInfoUnsubscribe) netInfoUnsubscribe();
  if (retryIntervalHandle) clearInterval(retryIntervalHandle);
}
