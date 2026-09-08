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

const { onCall } = require("firebase-functions/v2/https");
const functionsV1 = require("firebase-functions/v1");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

const SETTINGS_DOC = db.collection("settings").doc("vipAuto");

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
 * WITHOUT touching the vipUsers list already granted. Only callable by the
 * admin email configured below (kept in sync with firestore.rules' isAdmin()).
 */
const ADMIN_EMAILS = ["hhackmapp@gmail.com"];

exports.resetVipAutoCounter = onCall(async (request) => {
  const email = request.auth && request.auth.token && request.auth.token.email;
  if (!email || !ADMIN_EMAILS.includes(email)) {
    throw new Error("permission-denied: admin only");
  }
  await SETTINGS_DOC.set({ registeredCount: 0 }, { merge: true });
  return { ok: true };
});
