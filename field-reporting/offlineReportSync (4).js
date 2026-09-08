// offlineReportSync.js
//
// FIELD REPORTING MODULE — Member 5 (Web version, rebuilt)
// SIH26001 LandGuard AI — Vite + React 19 web application
//
// Browser-native offline storage + sync engine. No Expo, no React Native,
// no new npm packages — IndexedDB + fetch + FormData + navigator.onLine +
// window 'online'/'offline' events only.
//
// This is the SINGLE ENTRY POINT for submitting a field report. UI
// components (e.g. FieldReportForm.jsx) call submitReport() and render
// whatever it returns — they do not implement their own fetch() logic.
//
// WHAT THIS FILE DOES:
//   1. submitReport(): if online, tries the backend directly; if offline,
//      or if the online attempt fails, saves the report to IndexedDB as
//      PENDING_SYNC instead — the report is never lost.
//   2. Watches connectivity (window 'online' event + navigator.onLine).
//   3. Automatically retries all PENDING_SYNC reports when connectivity
//      returns, and periodically every 30s while the app is open.
//   4. Marks a report SYNCED only after the backend confirms success, and
//      preserves the backend's response (id, status, created_at).
//   5. Never deletes a report just because an upload failed.
//
// WHAT THIS FILE DOES NOT DO (on purpose, per current scope):
//   - No true background sync (Service Worker Background Sync API) — sync
//     only runs while this browser tab is open.
//   - No hard-coded backend URL — provided via initializeOfflineSync().

// ------------------------------------------------------------------
// MODULE-LEVEL STATE
// ------------------------------------------------------------------

const DB_NAME = 'field_reports_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'reports';

// Cached IndexedDB connection promise, opened once and reused.
let dbPromise = null;

// Backend configuration, set by initializeOfflineSync(). Nothing is
// hard-coded — the app supplies this at startup, typically from
// import.meta.env.VITE_API_BASE_URL.
let apiConfig = {
  apiBaseUrl: null,
  endpointPath: '/api/field-reports',
};

// Prevents two sync runs from overlapping (e.g. an 'online' event and the
// periodic retry timer firing at nearly the same moment).
let syncInProgress = false;

// Handles so initializeOfflineSync() can be "undone" if ever needed.
let onlineListenerAttached = false;
let retryIntervalHandle = null;

// How often (ms) we double-check for pending reports even without an
// online event, as a safety net.
const RETRY_INTERVAL_MS = 30000;

// ------------------------------------------------------------------
// ERROR TYPES
// ------------------------------------------------------------------

// Thrown for HTTP 4xx responses — the request itself was rejected as
// invalid (bad data, validation failure, etc). Retrying the exact same
// payload will never succeed, so this is treated differently from a
// network/server (transient) failure everywhere it's caught below.
class PermanentUploadError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'PermanentUploadError';
    this.status = status;
  }
}

// ------------------------------------------------------------------
// DATABASE SETUP
// ------------------------------------------------------------------

// Opens (or creates) the IndexedDB database. Safe to call multiple times —
// the connection is cached after the first successful open.
//
// Record shape stored in the 'reports' object store:
//   clientId          - locally generated unique id (primary key).
//                        LOCAL ONLY — never sent to the backend.
//   report_type, description, latitude, longitude, severity - report fields
//   photoBlob          - the actual photo File/Blob, or null. IndexedDB
//                        stores Blobs directly via structured clone, so
//                        the photo survives a page reload while offline.
//   photoName          - original file name, reused when re-uploading.
//   photoType          - original file MIME type.
//   status             - 'PENDING_SYNC' | 'SYNCING' | 'SYNCED' | 'FAILED'
//                        (this is OUR local sync state — distinct from
//                        the backend's own review status, see backendStatus.
//                        FAILED means the backend permanently rejected the
//                        request (HTTP 4xx) — retrying the same payload
//                        would never succeed, so it is not retried further.)
//   backendReportId    - the backend's real report id, filled in once known
//   backendStatus      - the backend's own status (e.g. PENDING_VERIFICATION),
//                        filled in once known. NOT the same thing as `status`.
//   createdAt          - when the officer submitted the report (local ISO time)
//   syncedAt           - when the backend confirmed the report, or null
function openDatabase() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'clientId' });
        // Index so getPendingReports() doesn't need to scan the whole store.
        store.createIndex('status', 'status', { unique: false });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });

  return dbPromise;
}

// Simple unique id generator. Not a "real" UUID library (kept
// dependency-free on purpose) but unique enough for this use case.
function generateClientId() {
  return `report_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
}

async function putRecord(record) {
  const db = await openDatabase();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = (event) => reject(event.target.error);
  });
}

async function getRecord(clientId) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(clientId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = (event) => reject(event.target.error);
  });
}

// ------------------------------------------------------------------
// VALIDATION
// ------------------------------------------------------------------

function validateReportPayload(report) {
  if (!report || !report.report_type || !report.description ||
      report.latitude == null || report.longitude == null || !report.severity) {
    throw new Error('Missing required report fields (report_type, description, latitude, longitude, severity).');
  }
}

// ------------------------------------------------------------------
// SAVE REPORT LOCALLY
// ------------------------------------------------------------------

// reportPayload = { report_type, description, latitude, longitude, severity, photo }
// where `photo` is a browser File object (from <input type="file">) or null/undefined.
//
// Always saves as PENDING_SYNC, regardless of current connectivity. Used
// internally by submitReport() as its offline/fallback path, and exported
// in case a caller explicitly wants "always save locally" behavior.
//
// Returns the clientId of the saved row.
export async function saveReportLocally(reportPayload) {
  validateReportPayload(reportPayload);

  const clientId = generateClientId();
  const createdAt = new Date().toISOString();

  await putRecord({
    clientId,
    report_type: reportPayload.report_type,
    description: reportPayload.description,
    latitude: reportPayload.latitude,
    longitude: reportPayload.longitude,
    severity: reportPayload.severity,
    photoBlob: reportPayload.photo || null,
    photoName: reportPayload.photo ? (reportPayload.photo.name || 'report.jpg') : null,
    photoType: reportPayload.photo ? (reportPayload.photo.type || 'image/jpeg') : null,
    status: 'PENDING_SYNC',
    backendReportId: null,
    backendStatus: null,
    createdAt,
    syncedAt: null,
  });

  console.log(`[OfflineSync] Report saved locally as PENDING_SYNC: ${clientId}`);

  // Best-effort: if we happen to be online right now, try syncing
  // immediately instead of waiting for the next event/interval tick.
  // Fire-and-forget on purpose.
  syncPendingReports().catch((err) => {
    console.log('[OfflineSync] Immediate sync attempt failed (will retry later):', err.message);
  });

  return clientId;
}

// ------------------------------------------------------------------
// READ HELPERS
// ------------------------------------------------------------------

// Returns all reports currently waiting to be uploaded, oldest first.
export async function getPendingReports() {
  const db = await openDatabase();

  const results = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const index = tx.objectStore(STORE_NAME).index('status');
    const request = index.getAll('PENDING_SYNC');
    request.onsuccess = () => resolve(request.result);
    request.onerror = (event) => reject(event.target.error);
  });

  return results.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

// Returns ALL locally stored reports regardless of status (PENDING_SYNC,
// SYNCING, and SYNCED are all kept — nothing is ever deleted), newest first.
export async function getAllLocalReports() {
  const db = await openDatabase();

  const results = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = (event) => reject(event.target.error);
  });

  return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// ------------------------------------------------------------------
// RECOVERY: reports stuck in SYNCING from an interrupted session
// ------------------------------------------------------------------

// If the tab is closed or crashes mid-upload, a report can be left with
// status 'SYNCING' forever — getPendingReports() only ever looks for
// PENDING_SYNC, so that row would otherwise never be retried again.
//
// This is safe to run only at startup (not mid-session): within a single
// running session, syncInProgress + the per-record SYNCING mark already
// prevent any real double-upload, so a SYNCING row seen at startup can
// only be leftover from a previous session that never finished.
async function recoverInterruptedSyncs() {
  const db = await openDatabase();

  const stuck = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const index = tx.objectStore(STORE_NAME).index('status');
    const request = index.getAll('SYNCING');
    request.onsuccess = () => resolve(request.result);
    request.onerror = (event) => reject(event.target.error);
  });

  if (stuck.length === 0) return;

  console.log(`[OfflineSync] Recovering ${stuck.length} report(s) stuck in SYNCING from a previous session.`);
  for (const record of stuck) {
    await updateLocalStatus(record.clientId, 'PENDING_SYNC');
  }
}

// ------------------------------------------------------------------
// STATUS UPDATE HELPERS
// ------------------------------------------------------------------

async function updateLocalStatus(clientId, newStatus) {
  const record = await getRecord(clientId);
  if (!record) return; // record no longer exists — nothing to update
  record.status = newStatus;
  await putRecord(record);
}

async function markSynced(clientId, { backendReportId, backendStatus }) {
  const record = await getRecord(clientId);
  if (!record) return;
  record.status = 'SYNCED';
  record.backendReportId = backendReportId ?? null;
  record.backendStatus = backendStatus ?? null;
  record.syncedAt = new Date().toISOString();
  await putRecord(record);
}

// ------------------------------------------------------------------
// BACKEND UPLOAD (shared by direct submit and queued sync)
// ------------------------------------------------------------------

// Builds the multipart form and POSTs it to <apiBaseUrl><endpointPath>.
// Sends ONLY the backend's documented fields — report_type, description,
// latitude, longitude, severity, and photo (optional). No client_id,
// weather, reportedBy, zone_id, or verified fields are ever sent.
//
// Throws on any failure (missing config, network error, non-2xx response,
// or a malformed success response) so the caller can decide what to do.
// Returns the full parsed backend response, e.g.
//   { success: true, message: '...', report: { id, status, created_at, ... } }
async function uploadReportCore({ report_type, description, latitude, longitude, severity, photoBlob, photoFileName }) {
  if (!apiConfig.apiBaseUrl) {
    throw new Error(
      'API base URL is not configured. Call initializeOfflineSync({ apiBaseUrl }) at app startup.'
    );
  }

  const formData = new FormData();
  formData.append('report_type', report_type);
  formData.append('description', description);
  formData.append('latitude', String(latitude));
  formData.append('longitude', String(longitude));
  formData.append('severity', severity);

  if (photoBlob) {
    // Browser File/Blob objects drop straight into FormData.
    formData.append('photo', photoBlob, photoFileName || 'report.jpg');
  }

  const url = `${apiConfig.apiBaseUrl}${apiConfig.endpointPath}`;

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    // Do NOT set 'Content-Type' manually for multipart/form-data — the
    // browser generates the correct boundary automatically for FormData.
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const bodyText = await response.text().catch(() => '');
    const message = bodyText || `Server responded with status ${response.status}.`;

    // 4xx = the request itself is invalid (bad data, validation failure,
    // etc). Retrying the exact same payload will never succeed, so this
    // is a PERMANENT failure, handled differently by every caller below.
    // 5xx / other = treated as transient — worth retrying later.
    if (response.status >= 400 && response.status < 500) {
      throw new PermanentUploadError(message, response.status);
    }
    throw new Error(message);
  }

  const data = await response.json().catch(() => null);

  if (!data || !data.report) {
    throw new Error('Backend response did not include the expected "report" object.');
  }

  return data;
}

// ------------------------------------------------------------------
// SUBMIT REPORT — the single entry point UI components call
// ------------------------------------------------------------------

// reportPayload = { report_type, description, latitude, longitude, severity, photo }
// `photo` is a browser File object or null/undefined.
//
// Returns one of:
//   { mode: 'submitted', report: {...} }   — real backend-confirmed report
//   { mode: 'offline', localId, savedAt }  — saved locally, will auto-sync later
//
// Throws only for genuine failures (e.g. missing required fields, or
// IndexedDB itself failing) — never for "just offline", which is a normal,
// expected outcome represented by the 'offline' mode above.
export async function submitReport(reportPayload) {
  validateReportPayload(reportPayload);

  const isOnline = typeof navigator === 'undefined' || navigator.onLine !== false;

  if (!isOnline) {
    const localId = await saveReportLocally(reportPayload);
    return { mode: 'offline', localId, savedAt: new Date().toISOString() };
  }

  // Online: attempt the real submission directly.
  try {
    const data = await uploadReportCore({
      report_type: reportPayload.report_type,
      description: reportPayload.description,
      latitude: reportPayload.latitude,
      longitude: reportPayload.longitude,
      severity: reportPayload.severity,
      photoBlob: reportPayload.photo || null,
      photoFileName: reportPayload.photo ? (reportPayload.photo.name || 'report.jpg') : null,
    });

    // Keep a SYNCED copy in local history too, so getAllLocalReports()
    // reflects every report ever submitted, not just the offline ones.
    const clientId = generateClientId();
    const now = new Date().toISOString();
    await putRecord({
      clientId,
      report_type: reportPayload.report_type,
      description: reportPayload.description,
      latitude: reportPayload.latitude,
      longitude: reportPayload.longitude,
      severity: reportPayload.severity,
      photoBlob: reportPayload.photo || null,
      photoName: reportPayload.photo ? (reportPayload.photo.name || 'report.jpg') : null,
      photoType: reportPayload.photo ? (reportPayload.photo.type || 'image/jpeg') : null,
      status: 'SYNCED',
      backendReportId: data.report.id ?? null,
      backendStatus: data.report.status ?? null,
      createdAt: now,
      syncedAt: now,
    });

    return { mode: 'submitted', report: data.report };
  } catch (err) {
    if (err instanceof PermanentUploadError) {
      // The backend rejected this exact request as invalid (e.g. a 422
      // validation error). Saving it offline would just retry a request
      // that can never succeed — surface the real error to the caller
      // instead, so the UI can show it and the user can correct the form.
      console.warn('[OfflineSync] Backend permanently rejected the report (not retrying):', err.message);
      throw err;
    }

    // We appeared online, but the request itself failed for a transient
    // reason (network error, timeout, dropped connection, 5xx). Fall back
    // to local storage so the report is never lost — this is NOT a fake
    // success.
    console.warn('[OfflineSync] Online submission failed, saving offline instead:', err.message);
    const localId = await saveReportLocally(reportPayload);
    return { mode: 'offline', localId, savedAt: new Date().toISOString() };
  }
}

// ------------------------------------------------------------------
// SYNC ALL PENDING REPORTS
// ------------------------------------------------------------------

// Finds every PENDING_SYNC report and attempts to upload it one at a time.
// Safe to call repeatedly/concurrently — syncInProgress guards against
// overlapping runs.
export async function syncPendingReports() {
  if (syncInProgress) {
    console.log('[OfflineSync] Sync already in progress, skipping this call.');
    return;
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    console.log('[OfflineSync] Browser reports offline, skipping sync.');
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

    for (const record of pending) {
      try {
        // Mark SYNCING first, so if syncPendingReports() somehow gets
        // called again mid-loop, this row won't be picked up twice.
        await updateLocalStatus(record.clientId, 'SYNCING');

        const data = await uploadReportCore({
          report_type: record.report_type,
          description: record.description,
          latitude: record.latitude,
          longitude: record.longitude,
          severity: record.severity,
          photoBlob: record.photoBlob,
          photoFileName: record.photoName,
        });

        // Server confirmed — mark SYNCED and preserve the backend response.
        // The record is kept (not deleted) for local history.
        await markSynced(record.clientId, {
          backendReportId: data.report.id ?? null,
          backendStatus: data.report.status ?? null,
        });
        console.log(`[OfflineSync] Report ${record.clientId} synced successfully (backend id: ${data.report.id}).`);
      } catch (err) {
        if (err instanceof PermanentUploadError) {
          // The backend has permanently rejected this queued report (4xx).
          // Retrying the same payload forever would never succeed, so mark
          // it FAILED instead of PENDING_SYNC. The record is still kept
          // (never deleted) for the officer/admin to review or resubmit
          // manually later.
          await updateLocalStatus(record.clientId, 'FAILED');
          console.log(`[OfflineSync] Report ${record.clientId} permanently rejected by backend (status ${err.status}), will not retry:`, err.message);
          continue;
        }

        // Transient failure (network error, timeout, 5xx) — revert to
        // PENDING_SYNC so it retries next time. The report is NEVER lost.
        await updateLocalStatus(record.clientId, 'PENDING_SYNC');
        console.log(`[OfflineSync] Failed to sync report ${record.clientId}, will retry later:`, err.message);
      }
    }
  } finally {
    syncInProgress = false;
  }
}

// ------------------------------------------------------------------
// INITIALIZE — call this ONCE when your app starts
// ------------------------------------------------------------------

// config = { apiBaseUrl: string, endpointPath?: string }
//
// Example:
//   initializeOfflineSync({ apiBaseUrl: import.meta.env.VITE_API_BASE_URL })
//
// This function:
//   1. Opens/creates the IndexedDB database
//   2. Stores the backend config (no URL hard-coded in this file)
//   3. Starts listening for the browser 'online' event → auto-triggers sync
//   4. Starts a periodic safety-net sync check every 30s
//   5. Attempts one sync immediately, in case there are already pending
//      reports from a previous browser session
export async function initializeOfflineSync(config) {
  if (!config || !config.apiBaseUrl) {
    throw new Error('initializeOfflineSync: you must provide { apiBaseUrl }.');
  }

  apiConfig.apiBaseUrl = config.apiBaseUrl;
  if (config.endpointPath) {
    apiConfig.endpointPath = config.endpointPath;
  }

  await openDatabase();

  // Recover any reports left stuck in SYNCING by a previous session that
  // was interrupted (tab closed/crashed mid-upload) — must run before the
  // first sync attempt below, so those reports are eligible for retry.
  await recoverInterruptedSyncs();

  if (!onlineListenerAttached && typeof window !== 'undefined') {
    window.addEventListener('online', handleOnlineEvent);
    onlineListenerAttached = true;
  }

  if (!retryIntervalHandle) {
    retryIntervalHandle = setInterval(() => {
      syncPendingReports().catch((err) =>
        console.log('[OfflineSync] Periodic sync attempt failed:', err.message)
      );
    }, RETRY_INTERVAL_MS);
  }

  // Catch up on anything left over from a previous browser session.
  syncPendingReports().catch((err) =>
    console.log('[OfflineSync] Initial sync attempt failed:', err.message)
  );

  console.log('[OfflineSync] Initialized with backend:', apiConfig.apiBaseUrl);
}

function handleOnlineEvent() {
  console.log('[OfflineSync] Browser back online — attempting sync.');
  syncPendingReports().catch((err) =>
    console.log('[OfflineSync] Sync triggered by online event failed:', err.message)
  );
}

// Optional cleanup — call if you ever need to stop the listeners
// (e.g. on logout, or in a test teardown). Not required for normal use.
export function stopOfflineSync() {
  if (onlineListenerAttached && typeof window !== 'undefined') {
    window.removeEventListener('online', handleOnlineEvent);
    onlineListenerAttached = false;
  }
  if (retryIntervalHandle) {
    clearInterval(retryIntervalHandle);
    retryIntervalHandle = null;
  }
}
