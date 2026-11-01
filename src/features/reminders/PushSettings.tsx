import { useEffect, useRef, useState } from "react";
import { repository } from "../../data/repository";
import type { Data } from "../../domain/tasks";
const API = "/.netlify/functions/reminders";
const TOKEN = "daylight.push.device",
  ENABLED = "daylight.push.enabled";
function token() {
  let value = localStorage.getItem(TOKEN);
  if (!value) {
    value = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
    localStorage.setItem(TOKEN, value);
  }
  return value;
}
async function api(method: string, body?: unknown) {
  const response = await fetch(API, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token()}`,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok)
    throw new Error(
      "后台同步失败，请保持联网后重试；这次改动尚未同步到提醒服务。",
    );
  return response.json();
}
export function reminderPayload(data: Data, now = Date.now()) {
  return data.tasks
    .filter((t) => !t.done && t.time && t.reminderMinutes === 15)
    .map((t) => ({
      id: t.id,
      title: t.title,
      startsAt: +new Date(`${t.date}T${t.time}:00`),
    }))
    .filter((t) => t.startsAt > now);
}
export default function PushSettings({ data }: { data: Data }) {
  const supported =
    window.isSecureContext &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    import.meta.env.PROD;
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem(ENABLED) === "yes";
    } catch {
      return false;
    }
  });
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const chain = useRef(Promise.resolve());
  const active = useRef(enabled);
  async function sync() {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription || Notification.permission !== "granted") {
      active.current = false;
      localStorage.removeItem(ENABLED);
      setEnabled(false);
      throw new Error("通知授权已失效，请重新开启提醒。");
    }
    const reminders = reminderPayload(repository.load());
    if (reminders.length > 500)
      throw new Error("后台最多支持 500 条未来提醒，请减少日程后重试。");
    const result = await api("POST", {
      subscription: subscription.toJSON(),
      reminders,
    });
    setStatus(`已同步 ${result.count} 条未来提醒 · 关闭应用后仍可接收`);
  }
  function enqueue() {
    chain.current = chain.current
      .catch(() => {})
      .then(async () => {
        if (active.current) await sync();
      })
      .catch((e) => setStatus(e.message));
    return chain.current;
  }
  useEffect(() => {
    if (!enabled || !supported) return;
    setStatus("正在同步后台提醒…");
    void enqueue();
    // Synchronize all edits, including completion, deletion and backup restore.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, enabled]);
  useEffect(() => {
    const retry = () => {
      if (active.current && supported) void enqueue();
    };
    const timer = setInterval(retry, 60000);
    window.addEventListener("online", retry);
    window.addEventListener("focus", retry);
    return () => {
      clearInterval(timer);
      window.removeEventListener("online", retry);
      window.removeEventListener("focus", retry);
    };
  }, [supported]);
  async function enable() {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted")
        throw new Error(
          "尚未允许通知，请在设备设置中允许 Daylight 通知后重试。",
        );
      setStatus("正在连接后台提醒…");
      const response = await fetch(API, { signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw new Error("后台提醒服务尚未就绪，请稍后重试。");
      const { publicKey } = await response.json();
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration?.active)
        throw new Error("应用正在更新，请刷新后重试开启提醒。");
      const binary = atob(publicKey.replace(/-/g, "+").replace(/_/g, "/"));
      const key = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      (await registration.pushManager.getSubscription()) ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: key,
        }));
      await sync();
      localStorage.setItem(ENABLED, "yes");
      active.current = true;
      setEnabled(true);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "提醒开启失败，请重试。");
    } finally {
      setBusy(false);
    }
  }
  async function disable() {
    setBusy(true);
    try {
      active.current = false;
      await chain.current;
      await api("DELETE");
      localStorage.removeItem(ENABLED);
      setEnabled(false);
      setStatus("后台提醒已关闭");
    } catch (e) {
      active.current = true;
      setStatus(e instanceof Error ? e.message : "关闭失败，请重试。");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel push-settings" aria-labelledby="push-heading">
      <h2 id="push-heading">提前 15 分钟提醒</h2>
      <p>
        开启后，有时间且勾选提醒的日程会在开始前 15 分钟推送。iPhone 请先用
        Safari 将 Daylight 添加到主屏幕，再从桌面打开授权通知。
      </p>
      <p className="subtle">
        开启会将需要提醒的日程标题、时间和此设备的通知订阅保存到后台；随心记与日记不会上传。后台每分钟检查，送达可能受网络、系统通知和专注模式影响。
      </p>
      {!supported ? (
        <p role="status">
          请在正式 HTTPS 网站或 iPhone
          主屏幕应用中开启；当前环境不支持后台推送。
        </p>
      ) : (
        <div className="push-actions">
          <button
            className="primary"
            disabled={busy}
            onClick={() => (enabled ? void disable() : void enable())}
          >
            {busy ? "处理中…" : enabled ? "关闭后台提醒" : "开启后台提醒"}
          </button>
          {enabled && (
            <button
              className="secondary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await api("POST", { test: true });
                  setStatus("测试通知已发送，请查看系统通知。");
                } catch (e) {
                  setStatus(e instanceof Error ? e.message : "发送失败");
                } finally {
                  setBusy(false);
                }
              }}
            >
              发送测试通知
            </button>
          )}
          {enabled && (
            <button
              className="text-button"
              disabled={busy}
              onClick={() => void enqueue()}
            >
              重新同步
            </button>
          )}
        </div>
      )}
      {status && (
        <p role="status" aria-live="polite">
          {status}
        </p>
      )}
    </section>
  );
}
