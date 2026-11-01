import { describe, it, expect } from "vitest";
import {
  dataSchema,
  putTask,
  localDay,
  shiftDay,
  dayTasks,
  type Task,
  type Data,
} from "./tasks";
const task = (id: string, date = "2026-11-01"): Task => ({
  id,
  title: "写一点东西",
  date,
  time: "15:00",
  notes: "",
  priority: "normal",
  done: false,
  focus: true,
  order: Number(id),
  createdAt: "2026-11-01T00:00:00Z",
  updatedAt: "2026-11-01T00:00:00Z",
});
const empty: Data = { version: 1, tasks: [] };
describe("日期与 Top 3", () => {
  it("日期按设备本地时间计算", () =>
    expect(localDay(new Date(2026, 10, 1, 23, 59))).toBe("2026-11-01"));
  it("跨年与闰日", () => {
    expect(shiftDay("2026-12-31", 1)).toBe("2027-01-01");
    expect(shiftDay("2028-02-28", 1)).toBe("2028-02-29");
  });
  it("同一天拒绝第四个重点", () => {
    let d = empty;
    for (let i = 1; i < 4; i++) d = putTask(d, task(String(i)));
    expect(() => putTask(d, task("4"))).toThrow();
  });
  it("跨日保留历史、独立重点名额", () => {
    let d = empty;
    for (let i = 1; i < 4; i++) d = putTask(d, task(String(i)));
    d = putTask(d, task("4", "2026-11-02"));
    expect(dayTasks(d, "2026-11-01")).toHaveLength(3);
    expect(dayTasks(d, "2026-11-02")).toHaveLength(1);
  });
  it("更新同一任务无重复", () => {
    let d = putTask(empty, task("1"));
    d = putTask(d, { ...task("1"), done: true, title: "新的标题" });
    expect(d.tasks).toHaveLength(1);
    expect(d.tasks[0].done).toBe(true);
  });
  it("拒绝空标题和错误日期", () => {
    expect(() => putTask(empty, { ...task("1"), title: "  " })).toThrow();
    expect(() => putTask(empty, task("1", "2026-02-30"))).toThrow();
  });
  it("拒绝导入重复 ID", () =>
    expect(() =>
      dataSchema.parse({ version: 1, tasks: [task("1"), task("1")] }),
    ).toThrow());
  it("拒绝非法时间和过长文本", () => {
    expect(() => putTask(empty, { ...task("1"), time: "25:00" })).toThrow();
    expect(() =>
      putTask(empty, { ...task("1"), notes: "x".repeat(2001) }),
    ).toThrow();
  });
  it("按重点排序值显示", () =>
    expect(
      dayTasks(
        { version: 1, tasks: [task("3"), task("1"), task("2")] },
        "2026-11-01",
      ).map((t) => t.id),
    ).toEqual(["1", "2", "3"]));
});
