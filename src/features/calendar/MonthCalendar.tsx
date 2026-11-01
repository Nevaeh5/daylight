import type { Task } from "../../domain/tasks";
import { monthDays, shiftMonth } from "./month";
import Icon from "../../components/Icon";
export default function MonthCalendar({
  date,
  today,
  tasks,
  onSelect,
}: {
  date: string;
  today: string;
  tasks: Task[];
  onSelect: (d: string) => void;
}) {
  const groups = new Map<string, Task[]>();
  for (const t of tasks) {
    const list = groups.get(t.date) || [];
    list.push(t);
    groups.set(t.date, list);
  }
  return (
    <section className="panel month-calendar" aria-label="月历">
      <div className="month-toolbar">
        <button
          className="icon-button prev"
          aria-label="上个月"
          onClick={() => onSelect(shiftMonth(date, -1))}
        >
          <Icon name="arrow" />
        </button>
        <h2>
          {new Date(date + "T12:00:00").getFullYear()} 年{" "}
          {Number(date.slice(5, 7))} 月
        </h2>
        <button
          className="icon-button"
          aria-label="下个月"
          onClick={() => onSelect(shiftMonth(date, 1))}
        >
          <Icon name="arrow" />
        </button>
        <button className="secondary" onClick={() => onSelect(today)}>
          回到今天
        </button>
      </div>
      <div className="month-weekdays">
        {"一二三四五六日".split("").map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="month-grid">
        {monthDays(date).map((day) => {
          const events = (groups.get(day) || []).sort(
            (a, b) =>
              Number(b.focus) - Number(a.focus) ||
              (a.time || "99").localeCompare(b.time || "99"),
          );
          return (
            <button
              key={day}
              className={`month-cell ${day.slice(0, 7) !== date.slice(0, 7) ? "other-month" : ""} ${day === date ? "selected" : ""} ${day === today ? "is-today" : ""}`}
              aria-label={`${day}，${events.length}件事${events.some((t) => t.focus) ? "，有重点" : ""}`}
              aria-pressed={day === date}
              onClick={() => onSelect(day)}
            >
              <span className="day-number">
                {Number(day.slice(8))}
                {events.length > 0 && <span className="day-star">★</span>}
              </span>
              <span className="day-events">
                {events.slice(0, 2).map((t) => (
                  <span
                    key={t.id}
                    className={`${t.focus ? "focus-event" : ""} ${t.done ? "event-done" : ""}`}
                  >
                    {t.focus ? "★ " : ""}
                    {t.time && <span className="event-time">{t.time} </span>}
                    <span className="event-title">{t.title}</span>
                  </span>
                ))}
                {events.length > 2 && (
                  <span className="more-events">+{events.length - 2} 件</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
      <p className="calendar-legend">
        ★ 有安排的日子 · 金色条目为 Top 3 · 点击日期查看全部事项
      </p>
    </section>
  );
}
