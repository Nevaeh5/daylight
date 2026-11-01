import { localDay, shiftDay } from "../../domain/tasks";
export function monthStart(day: string) {
  return day.slice(0, 7) + "-01";
}
export function shiftMonth(day: string, delta: number) {
  const d = new Date(monthStart(day) + "T12:00:00");
  d.setMonth(d.getMonth() + delta);
  return localDay(d);
}
export function monthDays(day: string) {
  const first = monthStart(day),
    weekday = new Date(first + "T12:00:00").getDay();
  const start = shiftDay(first, -((weekday + 6) % 7));
  return Array.from({ length: 42 }, (_, i) => shiftDay(start, i));
}
