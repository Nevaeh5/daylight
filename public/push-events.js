self.addEventListener("push", (event) => {
  let message;
  try {
    message = event.data.json();
  } catch {
    message = {};
  }
  event.waitUntil(
    self.registration.showNotification(message.title || "Daylight · 日程提醒", {
      body: message.body || "有一件安排快开始了。",
      icon: "/pink-sun-192.png",
      badge: "/pink-sun-192.png",
      tag: message.tag || "daylight-reminder",
      data: { url: "/" },
    }),
  );
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const target = windows.find(
        (client) => new URL(client.url).origin === self.location.origin,
      );
      if (target) return target.focus();
      return self.clients.openWindow("/");
    })(),
  );
});
