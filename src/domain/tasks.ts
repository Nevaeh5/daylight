import { z } from "zod";
export const daySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => {
    const d = new Date(v + "T12:00:00");
    return !isNaN(+d) && localDay(d) === v;
  }, "日期无效");
export const taskSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(120),
  date: daySchema,
  time: z.union([z.literal(""), z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)]),
  notes: z.string().max(2000),
  priority: z.enum(["low", "normal", "high"]),
  done: z.boolean(),
  focus: z.boolean(),
  order: z.number().finite(),
  createdAt: z.string(),
  updatedAt: z.string(),
  reminderMinutes: z.union([z.literal(15), z.null()]).optional(),
});
export type Task = z.infer<typeof taskSchema>;
export const ideaSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(120),
  done: z.boolean(),
  createdAt: z.string(),
});
export type Idea = z.infer<typeof ideaSchema>;
export const journalSchema = z.object({
  date: daySchema,
  answers: z.tuple([
    z.string().max(12000),
    z.string().max(12000),
    z.string().max(12000),
  ]),
  updatedAt: z.string(),
});
export type Journal = z.infer<typeof journalSchema>;
export const journalEntrySchema = z.object({
  id: z.string().min(1),
  date: daySchema,
  text: z.string().trim().min(1).max(12000),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type JournalEntry = z.infer<typeof journalEntrySchema>;
export const dataSchema = z
  .object({
    version: z.literal(1),
    tasks: z.array(taskSchema).max(10000),
    ideas: z.array(ideaSchema).max(10000).optional(),
    journals: z.array(journalSchema).max(10000).optional(),
    journalEntries: z.array(journalEntrySchema).max(10000).optional(),
    pet: z
      .object({
        bond: z.number().int().min(0).max(5),
        fedOn: daySchema.optional(),
        playedOn: daySchema.optional(),
      })
      .optional(),
    journalReminderEnabled: z.boolean().optional(),
    reminderDismissedOn: daySchema.optional(),
  })
  .superRefine((d, ctx) => {
    const counts = new Map<string, number>();
    const ids = new Set<string>();
    const journalDates = new Set<string>();
    const entryIds = new Set<string>();
    for (const entry of d.journalEntries || []) {
      if (entryIds.has(entry.id))
        ctx.addIssue({ code: "custom", message: "日记记录 ID 重复" });
      entryIds.add(entry.id);
    }
    const ideaIds = new Set<string>();
    for (const idea of d.ideas || []) {
      if (ideaIds.has(idea.id))
        ctx.addIssue({ code: "custom", message: "随心记 ID 重复" });
      ideaIds.add(idea.id);
    }
    for (const j of d.journals || []) {
      if (journalDates.has(j.date))
        ctx.addIssue({ code: "custom", message: "每天只能有一份日记" });
      journalDates.add(j.date);
    }
    for (const t of d.tasks) {
      if (ids.has(t.id))
        ctx.addIssue({ code: "custom", message: "任务 ID 重复" });
      ids.add(t.id);
      if (t.focus) {
        counts.set(t.date, (counts.get(t.date) || 0) + 1);
        if (counts.get(t.date)! > 3)
          ctx.addIssue({ code: "custom", message: "每天最多三件重点任务" });
      }
    }
  });
export type Data = z.infer<typeof dataSchema>;
export function localDay(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function shiftDay(day: string, n: number) {
  const d = new Date(day + "T12:00:00");
  d.setDate(d.getDate() + n);
  return localDay(d);
}
export function putTask(data: Data, task: Task): Data {
  const valid = taskSchema.parse(task);
  return dataSchema.parse({
    ...data,
    tasks: [...data.tasks.filter((t) => t.id !== task.id), valid],
  });
}
export function dayTasks(data: Data, day: string) {
  return data.tasks
    .filter((t) => t.date === day)
    .sort((a, b) => a.order - b.order);
}
export function splitDayTasks(data: Data, day: string) {
  const tasks = dayTasks(data, day);
  return {
    focus: tasks.filter((t) => t.focus),
    schedule: tasks.filter((t) => !t.focus),
  };
}
export function putJournal(data: Data, entry: Journal): Data {
  return dataSchema.parse({
    ...data,
    journals: [
      ...(data.journals || []).filter((j) => j.date !== entry.date),
      journalSchema.parse(entry),
    ],
  });
}
