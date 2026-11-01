import { useEffect, useState } from "react";
import { localDay, type Data } from "../../domain/tasks";
export function shouldRemind(data: Data, now: Date) {
  const day = localDay(now);
  return (
    data.journalReminderEnabled !== false &&
    now.getHours() >= 22 &&
    data.reminderDismissedOn !== day &&
    !(data.journals || []).some(
      (j) => j.date === day && j.answers.some((a) => a.trim()),
    )
  );
}
export default function EveningReminder({
  data,
  onWrite,
  onDismiss,
}: {
  data: Data;
  onWrite: () => void;
  onDismiss: () => void;
}) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const update = () => setNow(new Date());
    const timer = setInterval(update, 30000);
    window.addEventListener("focus", update);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", update);
    };
  }, []);
  if (!shouldRemind(data, now)) return null;
  return (
    <aside className="evening-reminder" aria-label="22点日记提醒">
      <span>
        ☾ 小光：今天也辛苦啦，要不要记下开心的小事？
        <small>22:00 晚安邀请 · 应用内提醒</small>
      </span>
      <button className="primary" onClick={onWrite}>
        记一笔
      </button>
      <button className="text-button" onClick={onDismiss}>
        今天先休息
      </button>
    </aside>
  );
}
