import { describe, it, expect } from "vitest";
import { entriesForDay, saveEntry, deleteEntry } from "./entries";
import { dataSchema, type Data, type JournalEntry } from "../../domain/tasks";
import { shouldRemind } from "./EveningReminder";
const empty: Data = { version: 1, tasks: [] };
const entry = (id: string, date = "2026-11-01"): JournalEntry => ({
  id,
  date,
  text: "谢谢今天的晚风",
  createdAt: "2026-11-01T12:00:00Z",
  updatedAt: "2026-11-01T12:00:00Z",
});
describe("逐条日记", () => {
  it("同日多次提交、跨日隔离、编辑删除独立", () => {
    let data = saveEntry(
      saveEntry(saveEntry(empty, entry("1")), entry("2")),
      entry("3", "2026-11-02"),
    );
    expect(entriesForDay(data, "2026-11-01")).toHaveLength(2);
    data = saveEntry(data, { ...entry("1"), text: "修改第一条" });
    data = deleteEntry(data, entry("2"));
    expect(entriesForDay(data, "2026-11-01").map((e) => e.text)).toEqual([
      "修改第一条",
    ]);
    expect(entriesForDay(data, "2026-11-02")).toHaveLength(1);
    expect(dataSchema.parse(JSON.parse(JSON.stringify(data)))).toEqual(data);
  });
  it("旧三栏内容逐条保留，新增和修改不覆盖其他内容", () => {
    let data: Data = {
      ...empty,
      journals: [
        {
          date: "2026-11-01",
          answers: ["开心的事", "感谢的人", "肯定自己"],
          updatedAt: "",
        },
      ],
    };
    data = saveEntry(data, entry("new"));
    expect(entriesForDay(data, "2026-11-01").map((e) => e.text)).toEqual([
      "开心的事",
      "感谢的人",
      "肯定自己",
      "谢谢今天的晚风",
    ]);
    data = saveEntry(data, {
      ...entriesForDay(data, "2026-11-01")[0],
      text: "旧记录已编辑",
    });
    data = deleteEntry(data, entriesForDay(data, "2026-11-01")[1]);
    expect(entriesForDay(data, "2026-11-01").map((e) => e.text)).toEqual([
      "旧记录已编辑",
      "肯定自己",
      "谢谢今天的晚风",
    ]);
  });
  it("空记录和重复 ID 拦截，提交后停止当日日记邀请", () => {
    expect(() => saveEntry(empty, { ...entry("1"), text: "  " })).toThrow();
    expect(() =>
      dataSchema.parse({ ...empty, journalEntries: [entry("1"), entry("1")] }),
    ).toThrow();
    expect(
      shouldRemind(saveEntry(empty, entry("1")), new Date(2026, 10, 1, 22)),
    ).toBe(false);
  });
});
