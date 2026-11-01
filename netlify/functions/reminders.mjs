import { z } from "zod";
import { hash, store, keys, validEndpoint, send } from "../lib/push.mjs";
const subscriptionSchema = z.object({
  endpoint: z.string().max(2048).refine(validEndpoint),
  keys: z.object({
    p256dh: z.string().regex(/^[\w-]{87}$/),
    auth: z.string().regex(/^[\w-]{22}$/),
  }),
});
const schema = z.object({
  subscription: subscriptionSchema,
  reminders: z
    .array(
      z.object({
        id: z.string().min(1).max(100),
        title: z.string().min(1).max(120),
        startsAt: z.number().int().positive(),
      }),
    )
    .max(500),
});
const json = (body, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
export default async function handler(request) {
  if (
    request.headers.get("origin") &&
    request.headers.get("origin") !== new URL(request.url).origin
  )
    return json({ error: "来源无效" }, 403);
  try {
    const db = store();
    if (request.method === "GET")
      return json({ publicKey: (await keys(db)).publicKey });
    const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
    if (!token || !/^[a-f0-9]{64}$/.test(token))
      return json({ error: "设备凭证无效" }, 401);
    const key = `devices/${hash(token)}`;
    if (request.method === "DELETE") {
      await db.delete(key);
      return json({ ok: true });
    }
    if (request.method !== "POST") return json({ error: "方法不支持" }, 405);
    const raw = await request.text();
    if (raw.length > 160000) return json({ error: "提醒数据过大" }, 413);
    const body = JSON.parse(raw);
    if (body.test === true) {
      const device = await db.get(key, { type: "json" });
      if (!device) return json({ error: "请先开启提醒" }, 404);
      await send(
        device.subscription,
        {
          title: "Daylight 提醒已连接",
          body: "这是一条测试通知，接下来可以关闭应用验证定时提醒。",
          tag: "daylight-test",
        },
        await keys(db),
        new URL(request.url).origin,
      );
      return json({ ok: true });
    }
    const input = schema.parse(body);
    const reminders = input.reminders.filter((r) => r.startsAt > Date.now());
    const old = await db.get(key, { type: "json" });
    await db.setJSON(key, {
      ...input,
      reminders,
      origin: new URL(request.url).origin,
      updatedAt: Date.now(),
      lastTest: old?.lastTest,
    });
    return json({ ok: true, count: reminders.length });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError)
      return json({ error: "提醒格式无效" }, 400);
    console.error("Reminder service failed", error?.name);
    return json({ error: "后台提醒服务暂不可用，请稍后重试" }, 503);
  }
}
