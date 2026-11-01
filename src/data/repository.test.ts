import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocalTaskRepository, STORAGE_KEY } from "./repository";
describe("本地数据保护", () => {
  let values: Map<string, string>;
  let repo: LocalTaskRepository;
  beforeEach(() => {
    values = new Map();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => values.get(k) ?? null,
      setItem: (k: string, v: string) => values.set(k, v),
    });
    repo = new LocalTaskRepository();
  });
  afterEach(() => vi.unstubAllGlobals());
  it("首次使用无模拟数据", () =>
    expect(repo.load()).toEqual({ version: 1, tasks: [] }));
  it("刷新可读取持久化记录", () => {
    repo.save({ version: 1, tasks: [] });
    expect(new LocalTaskRepository().load()).toEqual({ version: 1, tasks: [] });
  });
  it("损坏数据报错且不覆盖原文", () => {
    values.set(STORAGE_KEY, "bad json");
    expect(() => repo.load()).toThrow();
    expect(values.get(STORAGE_KEY)).toBe("bad json");
  });
  it("空间不足向上抛错", () => {
    vi.stubGlobal("localStorage", {
      setItem: () => {
        throw Error("quota exceeded");
      },
    });
    expect(() => repo.save({ version: 1, tasks: [] })).toThrow(
      "quota exceeded",
    );
  });
});
