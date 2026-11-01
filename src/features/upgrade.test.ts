import { describe, it, expect } from "vitest";
import {
  splitDayTasks,
  putTask,
  putJournal,
  dataSchema,
  type Data,
  type Task,
} from "../domain/tasks";
import { monthDays, shiftMonth } from "./calendar/month";
import { quoteFor, interact } from "./pet/companion";
import { shouldRemind } from "./journal/EveningReminder";
const empty: Data = { version: 1, tasks: [] };
const task: Task = {
  id: "1",
  title: "重点",
  date: "2026-11-01",
  time: "",
  notes: "",
  priority: "normal",
  focus: true,
  done: false,
  order: 1,
  createdAt: "",
  updatedAt: "",
};
describe("陪伴版升级", () => {
  it("Top3 和今日安排互斥且不会漏任务", () => {
    let data = putTask(empty, task);
    data = putTask(data, { ...task, id: "2", focus: false });
    const { focus, schedule } = splitDayTasks(data, task.date);
    expect(focus.map((t) => t.id)).toEqual(["1"]);
    expect(schedule.map((t) => t.id)).toEqual(["2"]);
  });
  it("移出重点后只出现于安排", () => {
    const data = putTask(putTask(empty, task), { ...task, focus: false });
    expect(splitDayTasks(data, task.date).focus).toHaveLength(0);
    expect(splitDayTasks(data, task.date).schedule).toHaveLength(1);
  });
  it("月历以周一开始并覆盖目标月最后一天", () => {
    const days = monthDays("2026-11-01");
    expect(days[0]).toBe("2026-10-26");
    expect(days).toHaveLength(42);
    expect(days).toContain("2026-11-30");
    expect(new Set(days).size).toBe(42);
  });
  it("月导航跨年、闰日不跳月", () => {
    expect(shiftMonth("2028-01-31", 1)).toBe("2028-02-01");
    expect(shiftMonth("2026-12-31", 1)).toBe("2027-01-01");
    expect(monthDays("2028-02-01")).toContain("2028-02-29");
  });
  it("每天同一句、互动换句", () => {
    expect(quoteFor("2026-11-01")).toBe(quoteFor("2026-11-01"));
    expect(quoteFor("2026-11-01", 1)).not.toBe(quoteFor("2026-11-01"));
    expect(quoteFor("2026-11-02")).not.toBe(quoteFor("2026-11-01"));
  });
  it("同日重复喂食不刷陪伴值，跨日可增加且有上限", () => {
    let data = interact(empty, "feed", "2026-11-01");
    data = interact(data, "feed", "2026-11-01");
    expect(data.pet?.bond).toBe(1);
    data = interact(data, "feed", "2026-11-02");
    expect(data.pet?.bond).toBe(2);
    for (let i = 3; i < 10; i++) data = interact(data, "play", `2026-11-0${i}`);
    expect(data.pet?.bond).toBe(5);
  });
  it("旧备份兼容、日记按日唯一，更新不改其他日", () => {
    expect(dataSchema.parse(empty)).toEqual(empty);
    let data = putJournal(empty, {
      date: "2026-11-01",
      answers: ["午饭", "", ""],
      updatedAt: "",
    });
    data = putJournal(data, {
      date: "2026-11-02",
      answers: ["晚风", "", ""],
      updatedAt: "",
    });
    data = putJournal(data, {
      date: "2026-11-01",
      answers: ["新的午饭", "", ""],
      updatedAt: "",
    });
    expect(data.journals).toHaveLength(2);
    expect(
      data.journals?.find((j) => j.date === "2026-11-01")?.answers[0],
    ).toBe("新的午饭");
  });
  it("日记不受写入时间限制", () => {
    const data = putJournal(empty, {
      date: "2026-11-01",
      answers: ["早上就写", "", ""],
      updatedAt: "2026-11-01T08:00:00+08:00",
    });
    expect(data.journals?.[0].answers[0]).toBe("早上就写");
  });
  it("22点前不提醒、已写或关闭不提醒", () => {
    expect(shouldRemind(empty, new Date(2026, 10, 1, 21, 59))).toBe(false);
    expect(shouldRemind(empty, new Date(2026, 10, 1, 22, 0))).toBe(true);
    expect(
      shouldRemind(
        { ...empty, journalReminderEnabled: false },
        new Date(2026, 10, 1, 22, 0),
      ),
    ).toBe(false);
    expect(
      shouldRemind(
        { ...empty, reminderDismissedOn: "2026-11-01" },
        new Date(2026, 10, 1, 22, 0),
      ),
    ).toBe(false);
    const written = putJournal(empty, {
      date: "2026-11-01",
      answers: ["good", "", ""],
      updatedAt: "",
    });
    expect(shouldRemind(written, new Date(2026, 10, 1, 22, 0))).toBe(false);
  });
  it("损坏的日记备份被拦截，任务与日记可一起往返备份", () => {
    const data = putJournal(putTask(empty, task), {
      date: "2026-11-01",
      answers: ["good", "", ""],
      updatedAt: "",
    });
    expect(dataSchema.parse(JSON.parse(JSON.stringify(data)))).toEqual(data);
    expect(() =>
      dataSchema.parse({
        ...data,
        journals: [...data.journals!, ...data.journals!],
      }),
    ).toThrow();
  });
});
