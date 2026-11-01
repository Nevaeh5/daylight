import { hash, store, keys, send, due } from "../lib/push.mjs";
export const config = { schedule: "* * * * *" };
export default async function handler() {
  const db = store(),
    now = Date.now(),
    pair = await keys(db);
  // Keep each scheduled invocation within Netlify's 30-second execution limit.
  const deadline = now + 23000;
  for await (const page of db.list({ prefix: "devices/", paginate: true })) {
    for (const blob of page.blobs) {
      if (Date.now() > deadline) return;
      const device = await db.get(blob.key, { type: "json" });
      if (!device) continue;
      if (device.updatedAt < now - 366 * 86400_000) {
        await db.delete(blob.key);
        continue;
      }
      for (const reminder of device.reminders.filter((r) => due(r, now))) {
        const delivery = `deliveries/${hash(`${blob.key}:${reminder.id}:${reminder.startsAt}`)}`;
        if (
          !(await db.setJSON(delivery, { at: now }, { onlyIfNew: true }))
            .modified
        )
          continue;
        try {
          // Recheck after claiming, so edits/deletion before delivery take effect.
          const latest = await db.get(blob.key, { type: "json" });
          if (
            !latest?.reminders.some(
              (r) => r.id === reminder.id && r.startsAt === reminder.startsAt,
            )
          ) {
            await db.delete(delivery);
            continue;
          }
          await send(
            latest.subscription,
            {
              title: "Daylight · 日程提醒",
              body: `${reminder.title} · ${new Date(reminder.startsAt).toLocaleTimeString("zh-CN", { timeZone: "Asia/Shanghai", hour: "2-digit", minute: "2-digit" })} 开始`,
              tag: hash(delivery),
            },
            pair,
            latest.origin,
          );
        } catch (error) {
          await db.delete(delivery);
          if (error.statusCode === 404 || error.statusCode === 410) {
            await db.delete(blob.key);
            break;
          }
          console.error(
            "Push delivery failed",
            error?.statusCode || error?.name,
          );
        }
      }
    }
  }
}
