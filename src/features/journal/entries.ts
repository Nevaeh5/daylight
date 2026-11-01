import {
  dataSchema,
  journalEntrySchema,
  type Data,
  type JournalEntry,
} from "../../domain/tasks";
export function entriesForDay(data: Data, date: string): JournalEntry[] {
  const legacy = data.journals?.find((j) => j.date === date);
  return [
    ...(legacy?.answers.flatMap((text, index) =>
      text.trim()
        ? [
            {
              id: `legacy:${date}:${index}`,
              date,
              text,
              createdAt: legacy.updatedAt,
              updatedAt: legacy.updatedAt,
            },
          ]
        : [],
    ) || []),
    ...(data.journalEntries || []).filter((e) => e.date === date),
  ];
}
export function saveEntry(data: Data, entry: JournalEntry): Data {
  const valid = journalEntrySchema.parse(entry);
  const legacy = valid.id.match(/^legacy:(\d{4}-\d{2}-\d{2}):([0-2])$/);
  if (legacy)
    return dataSchema.parse({
      ...data,
      journals: (data.journals || []).map((j) =>
        j.date === legacy[1]
          ? {
              ...j,
              answers: j.answers.map((a, i) =>
                i === Number(legacy[2]) ? valid.text : a,
              ),
              updatedAt: valid.updatedAt,
            }
          : j,
      ),
    });
  return dataSchema.parse({
    ...data,
    journalEntries: [
      ...(data.journalEntries || []).filter((e) => e.id !== valid.id),
      valid,
    ],
  });
}
export function deleteEntry(data: Data, entry: JournalEntry): Data {
  const legacy = entry.id.match(/^legacy:(\d{4}-\d{2}-\d{2}):([0-2])$/);
  return dataSchema.parse(
    legacy
      ? {
          ...data,
          journals: (data.journals || []).map((j) =>
            j.date === legacy[1]
              ? {
                  ...j,
                  answers: j.answers.map((a, i) =>
                    i === Number(legacy[2]) ? "" : a,
                  ),
                }
              : j,
          ),
        }
      : {
          ...data,
          journalEntries: (data.journalEntries || []).filter(
            (e) => e.id !== entry.id,
          ),
        },
  );
}
