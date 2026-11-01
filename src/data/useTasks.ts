import { useEffect, useState } from "react";
import { repository, STORAGE_KEY } from "./repository";
import { dataSchema, type Data } from "../domain/tasks";
const empty: Data = { version: 1, tasks: [] };
export function useTasks() {
  const [boot] = useState(() => {
    try {
      return { data: repository.load(), error: "" };
    } catch {
      return {
        data: empty,
        error:
          "本地数据暂时无法读取。为保护原始数据，已暂停写入；请先导出原始备份。",
      };
    }
  });
  const [data, setData] = useState(boot.data),
    [error, setError] = useState(boot.error);
  useEffect(() => {
    const sync = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        try {
          setData(repository.load());
          setError("");
        } catch {
          setError("另一个窗口的数据无法读取，请先备份。");
        }
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  function commit(update: (d: Data) => Data, restore = false) {
    try {
      const next = dataSchema.parse(
        update(restore ? empty : repository.load()),
      );
      repository.save(next);
      setData(next);
      setError("");
      return true;
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "保存失败，请检查浏览器存储空间。",
      );
      return false;
    }
  }
  return { data, error, commit };
}
