// offlineReportSync.js
//
// FIELD REPORTING MODULE — Member 5 — Offline Storage & Automatic Sync
// SIH26001 LandGuard AI — Web (Vite + React) version
//
// Zero-dependency browser implementation: raw IndexedDB (no library) +
// native online/offline events + native fetch(). No Expo, no React Native.
//
// WHAT THIS FILE DOES:
//   1. Saves a submitted report into IndexedDB immediately (status: PENDING_SYNC)
//   2. Watches browser connectivity (navigator.onLine + 'online' event)
//   3. When online, automatically uploads all PENDING_SYNC reports to the backend
//   4. Marks each report SYNCED only after the server confirms success
//   5. Never deletes a report until the server has confirmed it
//
// WHAT THIS FILE DOES NOT DO (on purpose, per current scope):
//   - No alerts / push notifications
//   - No UI — this is a plain logic module
//   - No hard-coded backend URL — you provide it via initializeOfflineSync()

// ------------------------------------------------------------------
// MODULE-LEVEL STATE
// ------------------------------------------------------------------

const DB_NAME = 'field_reports_offline';
const DB_VERSION = 1;
const STORE_NAME = 'reports';

// Backend configuration, set by initializeOfflineSync(). Nothing is
// hard-coded — the integration teammate supplies this at app startup.
const apiConfig = {
  apiBaseUrl: null,       // e.g. "https://landguard-backend.example.com"
  endpointPath: '/api/field-reports',
};

// Prevents two sync runs from overlapping (e.g. the 'online' event and the
// periodic retry timer firing at nearly the same moment).
let syncInProgress = false;

// Handles so initializeOfflineSync() can be "undone" if ever needed.
let onlineListenerAttached = false;
let retryIntervalHandle = null;

// How often (ms) we double-check for pending reports even without an
// 'online' event, as a safety net. 30 seconds is reasonable for a
// hackathon demo; tune later if needed.
const RETRY_INTERVAL_MS = 30000;

// ------------------------------------------------------------------
// STEP 0: DATABASE SETUP
// ------------------------------------------------------------------

// Opens (and, on first run, creates) the IndexedDB database + object store.
// Returns a Promise<IDBDatabase>. Safe to call repeatedly — the browser
// only runs onupgradeneeded once, the first time this DB/version is opened.
function openDb() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB is not supported in this browser.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // clientId is the local primary key — used only for local tracking,
        // NEVER sent to the backend (see uploadReport() below).
        db.createObjectStore(STORE_NAME, { keyPath: 'clientId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Small helper: wraps an IDBRequest in a Promise.
function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
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
// `photo` is a browser File object (or null) — IndexedDB can store Blob/File
// values directly, no base64 conversion needed.
//
// Returns the clientId of the saved record, in case the caller wants to
// track it (e.g. show "Report #123 pending sync" in the UI later).
export async function saveReportLocally(report) {
  // Basic defensive checks — the form already validates these fields,
  // but this module should not silently accept garbage data either.
  if (!report || !report.report_type || !report.description ||
      report.latitude == null || report.longitude == null || !report.severity) {
    throw new Error('saveReportLocally: missing required report fields.');
  }

  const db = await openDb();
  const clientId = generateClientId();
  const createdAt = new Date().toISOString();

  const record = {
    clientId,
    report_type: report.report_type,
    description: report.description,
    latitude: report.latitude,
    longitude: report.longitude,
    severity: report.severity,
    photo: report.photo || null, // File object, or null (photo is optional)
    status: 'PENDING_SYNC',
    createdAt,
  };

  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  await requestToPromise(store.add(record));

  console.log(`[OfflineSync] Report saved locally as PENDING_SYNC: ${clientId}`);

  // Best-effort: if we happen to be online right now, try syncing
  // immediately instead of waiting for the next 'online' event/interval.
  // This is fire-and-forget on purpose — saveReportLocally() should
  // resolve quickly regardless of network state.
  syncPendingReports().catch((err) => {
    console.log('[OfflineSync] Immediate sync attempt failed (will retry later):', err.message);
  });

  return clientId;
}

// ------------------------------------------------------------------
// STEP 2: READ PENDING REPORTS (useful for a "My Reports" screen too)
// ------------------------------------------------------------------

// Returns all reports currently waiting to be uploaded, oldest first.
export async function getPendingReports() {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const all = await requestToPromise(store.getAll());
  return all
    .filter((r) => r.status === 'PENDING_SYNC')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

// Bonus helper (not required, but handy for the integration teammate to
// show sync history / debug): returns ALL reports regardless of status,
// newest first.
export async function getAllLocalReports() {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const all = await requestToPromise(store.getAll());
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ------------------------------------------------------------------
// STEP 3: MARK STATUS HELPER
// ------------------------------------------------------------------

async function updateReportStatus(clientId, newStatus) {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const record = await requestToPromise(store.get(clientId));
  if (!record) return; // record may have been removed elsewhere; nothing to do
  record.status = newStatus;
  await requestToPromise(store.put(record));
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
  // Note: clientId is intentionally NOT included — it's a local-only
  // identifier used for IndexedDB tracking, not part of the agreed
  // backend contract.
  formData.append('report_type', report.report_type);
  formData.append('description', report.description);
  formData.append('latitude', String(report.latitude));
  formData.append('longitude', String(report.longitude));
  formData.append('severity', report.severity);

  if (report.photo) {
    // report.photo is a browser File object — append directly, with its
    // original filename (falls back to a generic name if unavailable).
    formData.append('photo', report.photo, report.photo.name || 'report.jpg');
  }

  const url = `${apiConfig.apiBaseUrl}${apiConfig.endpointPath}`;

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    // Note: do NOT manually set 'Content-Type' for multipart/form-data —
    // fetch sets the correct boundary automatically when body is FormData.
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

    for (const report of pending) {
      try {
        // Mark as SYNCING first, so if syncPendingReports() somehow gets
        // called again mid-loop, this record won't be picked up twice.
        await updateReportStatus(report.clientId, 'SYNCING');

        await uploadReport(report);

        // Server confirmed — NOW it's safe to mark SYNCED.
        // The record is kept (not deleted) for history/audit purposes.
        await updateReportStatus(report.clientId, 'SYNCED');
        console.log(`[OfflineSync] Report ${report.clientId} synced successfully.`);
      } catch (err) {
        // Upload failed — revert to PENDING_SYNC so it retries next time.
        // The report is NEVER lost.
        await updateReportStatus(report.clientId, 'PENDING_SYNC');
        console.log(`[OfflineSync] Failed to sync report ${report.clientId}, will retry later:`, err.message);
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
//   1. Stores the backend config (no URL hard-coded in this file)
//   2. Starts listening for the browser's 'online' event → auto-triggers sync
//   3. Starts a periodic safety-net sync check every 30s
//   4. Attempts one sync immediately, in case there are already pending
//      reports from a previous browser session
function handleOnlineEvent() {
  console.log('[OfflineSync] Browser back online — attempting sync.');
  syncPendingReports().catch((err) =>
    console.log('[OfflineSync] Sync triggered by online event failed:', err.message)
  );
}

export function initializeOfflineSync(config) {
  if (!config || !config.apiBaseUrl) {
    throw new Error('initializeOfflineSync: you must provide { apiBaseUrl }.');
  }

  apiConfig.apiBaseUrl = config.apiBaseUrl;
  if (config.endpointPath) {
    apiConfig.endpointPath = config.endpointPath;
  }

  // Reactive trigger: fires the moment the browser regains connectivity.
  if (!onlineListenerAttached && typeof window !== 'undefined') {
    window.addEventListener('online', handleOnlineEvent);
    onlineListenerAttached = true;
  }

  // Safety-net trigger: in case the 'online' event above is ever missed
  // (can happen on some mobile browsers).
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
