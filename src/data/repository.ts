import { dataSchema, type Data } from "../domain/tasks";
export const STORAGE_KEY = "daylight.local.v1";
export interface TaskRepository {
  load(): Data;
  save(data: Data): void;
}
export class LocalTaskRepository implements TaskRepository {
  load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: 1 as const, tasks: [] };
    return dataSchema.parse(JSON.parse(raw));
  }
  save(data: Data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataSchema.parse(data)));
  }
}
export const repository = new LocalTaskRepository();
