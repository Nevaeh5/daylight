import { describe, it, expect } from "vitest";
import { parseSchedule } from "./parseSchedule";
import { dataSchema, dayTasks } from "./tasks";
import { reminderPayload } from "../features/reminders/PushSettings";
const now = new Date(2026, 10, 1, 12, 0);
describe("一句话日程", () => {
  it.each([
    ["明天下午三点半去看牙医", "2026-11-02", "15:30", "去看牙医"],
    ["后天上午9:05开会", "2026-11-03", "09:05", "开会"],
    ["下周一晚上八点读书", "2026-11-02", "20:00", "读书"],
    ["下下周三14:00复诊", "2026-11-11", "14:00", "复诊"],
    ["2027年2月28日中午十二点吃饭", "2027-02-28", "12:00", "吃饭"],
    [
      "提醒我12月31日23:45出发 提前十五分钟提醒我",
      "2026-12-31",
      "23:45",
      "出发",
    ],
    ["明天凌晨十二点一刻出发", "2026-11-02", "00:15", "出发"],
  ])("%s", (text, date, time, title) =>
    expect(parseSchedule(text, now)).toMatchObject({ date, time, title }),
  );
  it("跨年和下个月日期", () => {
    expect(parseSchedule("明天早上九点出门", new Date(2026, 11, 31)).date).toBe(
      "2027-01-01",
    );
    expect(parseSchedule("1月1日10:00出门", now).date).toBe("2027-01-01");
  });
  it("缺失、歧义和无效输入不默默确认", () => {
    expect(parseSchedule("读书", now).warnings).toHaveLength(2);
    expect(parseSchedule("明天三点开会", now).warnings.join()).toContain(
      "上午或下午",
    );
    expect(parseSchedule("明天25:70开会", now).time).toBe("");
    expect(parseSchedule("2026年2月30日开会", now).warnings.join()).toContain(
      "日期无效",
    );
  });
});
describe("模块隔离和提醒", () => {
  it("随心记跨日保留且不进入当天列表，旧备份可读取", () => {
    const old = { version: 1 as const, tasks: [] };
    expect(dataSchema.parse(old)).toEqual(old);
    const data = dataSchema.parse({
      ...old,
      ideas: [{ id: "idea", title: "学陶艺", done: false, createdAt: "" }],
    });
    expect(dayTasks(data, "2026-11-01")).toEqual([]);
    expect(dayTasks(data, "2026-11-02")).toEqual([]);
    expect(dataSchema.parse(JSON.parse(JSON.stringify(data))).ideas).toEqual(
      data.ideas,
    );
    expect(() =>
      dataSchema.parse({ ...data, ideas: [...data.ideas!, ...data.ideas!] }),
    ).toThrow();
  });
  it("只上传未来、未完成且开启提醒的有时日程；取消、完成会撤下", () => {
    const task = {
      id: "1",
      title: "复诊",
      date: "2026-11-02",
      time: "00:05",
      done: false,
      focus: false,
      notes: "私密备注",
      priority: "normal" as const,
      order: 0,
      createdAt: "",
      updatedAt: "",
      reminderMinutes: 15 as const,
    };
    const payload = reminderPayload({ version: 1, tasks: [task] }, +now);
    expect(payload).toEqual([
      { id: "1", title: "复诊", startsAt: +new Date(2026, 10, 2, 0, 5) },
    ]);
    for (const change of [
      { done: true },
      { time: "" },
      { reminderMinutes: null },
      { date: "2026-10-31" },
    ])
      expect(
        reminderPayload({ version: 1, tasks: [{ ...task, ...change }] }, +now),
      ).toEqual([]);
  });
});
