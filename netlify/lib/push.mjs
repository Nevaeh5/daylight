import { getStore } from "@netlify/blobs";
import webpush from "web-push";
import { createHash } from "node:crypto";
export const hash = (value) => createHash("sha256").update(value).digest("hex");
export const store = () =>
  getStore({ name: "daylight-reminders-v1", consistency: "strong" });
export async function keys(db) {
  let pair = await db.get("private/vapid", { type: "json" });
  if (!pair) {
    await db.setJSON("private/vapid", webpush.generateVAPIDKeys(), {
      onlyIfNew: true,
    });
    pair = await db.get("private/vapid", { type: "json" });
  }
  return pair;
}
export function validEndpoint(value) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.port &&
      /^(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|[a-z0-9.-]+\.push\.apple\.com|[a-z0-9.-]+\.notify\.windows\.com)$/.test(
        url.hostname,
      )
    );
  } catch {
    return false;
  }
}
export async function send(subscription, payload, pair, origin) {
  return webpush.sendNotification(subscription, JSON.stringify(payload), {
    vapidDetails: {
      subject: origin,
      publicKey: pair.publicKey,
      privateKey: pair.privateKey,
    },
    TTL: 300,
    urgency: "high",
    timeout: 5000,
  });
}
export function due(reminder, now) {
  return reminder.startsAt > now && reminder.startsAt - 15 * 60_000 <= now;
}
