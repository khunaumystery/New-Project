/**
 * functions/index.js
 *
 * Auto-VIP system for KHUN AU Mystery.
 *
 * Whenever a NEW Firebase Auth account is created (email/password sign-up
 * OR first-time Google sign-in), this function atomically:
 *   1. Reads/creates the config+counter doc at settings/vipAuto
 *   2. Increments registeredCount by 1
 *   3. If auto-VIP is enabled AND the new count is within the configured
 *      limit (default 200), adds the user to vipUsers/{uid}
 *
 * This runs with the Admin SDK, which bypasses Firestore security rules,
 * so the "first N users" count can't be spoofed by a client the way a
 * pure client-side counter could.
 *
 * Deploy with: firebase deploy --only functions
 * Requires the Blaze (pay-as-you-go) plan, since auth triggers are not
 * available on the free Spark plan.
 */

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const functionsV1 = require("firebase-functions/v1");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

const SETTINGS_DOC = db.collection("settings").doc("vipAuto");

// Kept in sync with firestore.rules' isAdmin() list.
const ADMIN_EMAILS = ["hhackmapp@gmail.com"];

function requireAdmin(request) {
  const email = request.auth && request.auth.token && request.auth.token.email;
  if (!email || !ADMIN_EMAILS.includes(email)) {
    throw new HttpsError("permission-denied", "Admin only.");
  }
}

// Fetches every Firebase Auth user, following pagination.
async function listAllUsers() {
  const users = [];
  let pageToken;
  do {
    const result = await admin.auth().listUsers(1000, pageToken);
    users.push(...result.users);
    pageToken = result.pageToken;
  } while (pageToken);
  return users;
}

exports.autoAssignVip = functionsV1.auth.user().onCreate(async (user) => {
  const vipRef = db.collection("vipUsers").doc(user.uid);

  await db.runTransaction(async (tx) => {
    const settingsSnap = await tx.get(SETTINGS_DOC);
    const settings = settingsSnap.exists ? settingsSnap.data() : {};

    const enabled = settings.enabled !== false; // default: enabled
    const limit = typeof settings.limit === "number" ? settings.limit : 200;
    const currentCount = typeof settings.registeredCount === "number" ? settings.registeredCount : 0;
    const newCount = currentCount + 1;

    // Always keep the counter/config doc up to date (creates it on first run).
    tx.set(
      SETTINGS_DOC,
      {
        enabled,
        limit,
        registeredCount: newCount,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // Only grant auto-VIP while enabled and still within the limit.
    if (enabled && newCount <= limit) {
      tx.set(vipRef, {
        label: `อัตโนมัติ (ลำดับที่ ${newCount}/${limit})`,
        addedAt: new Date().toISOString(),
        auto: true,
        order: newCount,
      });
    }
  });
});

/**
 * Optional callable the admin panel can use to reset the counter back to 0
 * WITHOUT touching the vipUsers list already granted. Admin only.
 */
exports.resetVipAutoCounter = onCall(async (request) => {
  requireAdmin(request);
  await SETTINGS_DOC.set({ registeredCount: 0 }, { merge: true });
  return { ok: true };
});

/**
 * One-off backfill: looks at every Firebase Auth account that ALREADY
 * exists (i.e. everyone who registered before this VIP system existed),
 * sorts them by account-creation date, and grants VIP to the first
 * `limit` of them (defaults to settings/vipAuto's configured limit, or
 * 200). Safe to call more than once — it's idempotent for a fixed limit,
 * and merges rather than overwriting existing vipUsers docs.
 *
 * Also sets settings/vipAuto.registeredCount to the TOTAL number of
 * existing accounts (not just the VIP ones) so the ongoing autoAssignVip
 * counter for future sign-ups continues correctly from that point,
 * instead of restarting from 0 and re-granting VIP past the real limit.
 *
 * Admin only. Call from the admin panel via httpsCallable.
 */
exports.backfillVipAuto = onCall(async (request) => {
  requireAdmin(request);

  const settingsSnap = await SETTINGS_DOC.get();
  const settings = settingsSnap.exists ? settingsSnap.data() : {};
  const requestedLimit = request.data && typeof request.data.limit === "number" ? request.data.limit : null;
  const limit = requestedLimit !== null ? requestedLimit : (typeof settings.limit === "number" ? settings.limit : 200);
  const enabled = settings.enabled !== false;

  const users = await listAllUsers();
  // Oldest account first = earliest sign-up = candidate #1.
  users.sort((a, b) => new Date(a.metadata.creationTime) - new Date(b.metadata.creationTime));

  const total = users.length;
  const vipSlice = users.slice(0, limit);

  // Firestore batched writes cap out at 500 ops, so chunk defensively.
  let batch = db.batch();
  let opsInBatch = 0;
  let addedCount = 0;

  for (let i = 0; i < vipSlice.length; i++) {
    const u = vipSlice[i];
    const order = i + 1;
    batch.set(
      db.collection("vipUsers").doc(u.uid),
      {
        label: `อัตโนมัติ (ลำดับที่ ${order}/${limit})`,
        addedAt: u.metadata.creationTime ? new Date(u.metadata.creationTime).toISOString() : new Date().toISOString(),
        auto: true,
        order,
      },
      { merge: true }
    );
    addedCount++;
    opsInBatch++;
    if (opsInBatch === 450) {
      await batch.commit();
      batch = db.batch();
      opsInBatch = 0;
    }
  }
  if (opsInBatch > 0) {
    await batch.commit();
  }

  await SETTINGS_DOC.set(
    {
      enabled,
      limit,
      registeredCount: total,
      backfilledAt: new Date().toISOString(),
    },
    { merge: true }
  );

  return { ok: true, totalUsers: total, vipGranted: addedCount, limit };
});
