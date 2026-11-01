import { beforeEach, describe, it, expect, vi } from "vitest";
const { entries, sent } = vi.hoisted(() => ({
  entries: new Map(),
  sent: vi.fn(),
}));
vi.mock("@netlify/blobs", () => ({
  getStore: () => ({
    get: async (key) => structuredClone(entries.get(key) ?? null),
    setJSON: async (key, value, options) => {
      if (options?.onlyIfNew && entries.has(key)) return { modified: false };
      entries.set(key, structuredClone(value));
      return { modified: true };
    },
    delete: async (key) => {
      entries.delete(key);
    },
    list: async function* () {
      yield {
        blobs: [...entries.keys()]
          .filter((k) => k.startsWith("devices/"))
          .map((key) => ({ key })),
      };
    },
  }),
}));
vi.mock("web-push", () => ({
  default: {
    generateVAPIDKeys: () => ({ publicKey: "public", privateKey: "private" }),
    sendNotification: sent,
  },
}));
import api from "../../../netlify/functions/reminders.mjs";
import dispatch from "../../../netlify/functions/send-reminders.mjs";
import { hash, validEndpoint, due } from "../../../netlify/lib/push.mjs";
const token = "a".repeat(64),
  key = `devices/${hash(token)}`;
const subscription = {
  endpoint: "https://fcm.googleapis.com/fcm/send/test",
  keys: { p256dh: "a".repeat(87), auth: "b".repeat(22) },
};
const request = (method, body, auth = token) =>
  new Request("https://daylight.netlify.app/.netlify/functions/reminders", {
    method,
    headers: { authorization: `Bearer ${auth}` },
    body: body ? JSON.stringify(body) : undefined,
  });
beforeEach(() => {
  entries.clear();
  sent.mockReset().mockResolvedValue({ statusCode: 201 });
});
describe("后台提醒", () => {
  it("公开接口只返回公钥，不暴露私钥；密钥只创建一次", async () => {
    expect(await (await api(request("GET"))).json()).toEqual({
      publicKey: "public",
    });
    expect(await (await api(request("GET"))).json()).toEqual({
      publicKey: "public",
    });
    expect(entries.get("private/vapid").privateKey).toBe("private");
  });
  it("拒绝无凭证写入、跨站请求和非推送服务地址", async () => {
    expect((await api(request("DELETE", null, "bad"))).status).toBe(401);
    expect(
      (
        await api(
          new Request(
            "https://daylight.netlify.app/.netlify/functions/reminders",
            { method: "DELETE", headers: { origin: "https://evil.example" } },
          ),
        )
      ).status,
    ).toBe(403);
    for (const endpoint of [
      "http://127.0.0.1",
      "https://localhost/",
      "https://fcm.googleapis.com.evil.test/send",
      "https://user@fcm.googleapis.com/send",
    ])
      expect(validEndpoint(endpoint)).toBe(false);
    expect(
      (
        await api(
          request("POST", {
            subscription: { ...subscription, endpoint: "https://localhost/" },
            reminders: [],
          }),
        )
      ).status,
    ).toBe(400);
  });
  it("到前15分钟才发送，重复执行不重复发送，跨午夜也正确", async () => {
    const startsAt = Date.now() + 15 * 60000;
    expect(due({ startsAt }, startsAt - 15 * 60000 - 1)).toBe(false);
    expect(due({ startsAt }, startsAt - 15 * 60000)).toBe(true);
    expect(due({ startsAt }, startsAt)).toBe(false);
    expect(
      (
        await api(
          request("POST", {
            subscription,
            reminders: [{ id: "1", title: "复诊", startsAt }],
          }),
        )
      ).status,
    ).toBe(200);
    await dispatch();
    await dispatch();
    expect(sent).toHaveBeenCalledTimes(1);
  });
  it("完成或删除日程后不再发送，测试通知可达", async () => {
    await api(
      request("POST", {
        subscription,
        reminders: [{ id: "1", title: "复诊", startsAt: Date.now() + 60000 }],
      }),
    );
    await api(request("POST", { subscription, reminders: [] }));
    await dispatch();
    expect(sent).not.toHaveBeenCalled();
    expect((await api(request("POST", { test: true }))).status).toBe(200);
    expect(sent).toHaveBeenCalledTimes(1);
    await api(request("DELETE"));
    expect(entries.has(key)).toBe(false);
  });
  it("临时失败重试；过期订阅删除，不重复轰炸", async () => {
    await api(
      request("POST", {
        subscription,
        reminders: [{ id: "1", title: "复诊", startsAt: Date.now() + 60000 }],
      }),
    );
    sent.mockRejectedValueOnce({ statusCode: 503 });
    await dispatch();
    await dispatch();
    expect(sent).toHaveBeenCalledTimes(2);
    entries.set(key, {
      ...entries.get(key),
      reminders: [{ id: "2", title: "开会", startsAt: Date.now() + 60000 }],
    });
    sent.mockRejectedValueOnce({ statusCode: 410 });
    await dispatch();
    expect(entries.has(key)).toBe(false);
  });
});
