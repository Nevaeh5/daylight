import { useState } from "react";
import {
  daySchema,
  localDay,
  shiftDay,
  type Data,
  type JournalEntry,
} from "../../domain/tasks";
import { entriesForDay, saveEntry, deleteEntry } from "./entries";
import Icon from "../../components/Icon";
import Confirmation from "../../components/Confirmation";
type Commit = (update: (data: Data) => Data) => boolean;
function EntryComposer({
  date,
  commit,
  onSaved,
}: {
  date: string;
  commit: Commit;
  onSaved: () => void;
}) {
  const draftKey = `daylight.journal.draft.${date}`;
  const [text, setText] = useState(() => {
    try {
      return sessionStorage.getItem(draftKey) || "";
    } catch {
      return "";
    }
  });
  const [failed, setFailed] = useState(false);
  return (
    <form
      className="panel journal-composer"
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        const now = new Date().toISOString();
        if (
          commit((d) =>
            saveEntry(d, {
              id: crypto.randomUUID(),
              date,
              text: text.trim(),
              createdAt: now,
              updatedAt: now,
            }),
          )
        ) {
          setText("");
          setFailed(false);
          try {
            sessionStorage.removeItem(draftKey);
          } catch {
            /* Draft storage is optional. */
          }
          onSaved();
        } else setFailed(true);
      }}
    >
      <label className="sr-only" htmlFor="journal-text">
        感恩日记
      </label>
      <textarea
        id="journal-text"
        rows={4}
        maxLength={12000}
        value={text}
        placeholder="写下一件想记住的小事…"
        onChange={(e) => {
          setText(e.target.value);
          try {
            sessionStorage.setItem(draftKey, e.target.value);
          } catch {
            /* Keep the draft in memory. */
          }
        }}
      />
      <div className="journal-submit">
        <small>{text.length} / 12000</small>
        <button className="primary" disabled={!text.trim()}>
          提交记录 <Icon name="check" size={16} />
        </button>
      </div>
      {failed && <p role="alert">保存失败，内容已保留，请重试。</p>}
    </form>
  );
}
function EntryRow({
  entry,
  commit,
  onDelete,
}: {
  entry: JournalEntry;
  commit: Commit;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false),
    [text, setText] = useState(entry.text),
    [failed, setFailed] = useState(false);
  return (
    <article className="panel journal-entry">
      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (
              commit((d) =>
                saveEntry(d, {
                  ...entry,
                  text,
                  updatedAt: new Date().toISOString(),
                }),
              )
            ) {
              setEditing(false);
              setFailed(false);
            } else setFailed(true);
          }}
        >
          <label className="sr-only" htmlFor={`edit-${entry.id}`}>
            编辑日记记录
          </label>
          <textarea
            id={`edit-${entry.id}`}
            rows={3}
            maxLength={12000}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="journal-entry-actions">
            <button
              type="button"
              className="text-button"
              onClick={() => setEditing(false)}
            >
              取消
            </button>
            <button className="primary" disabled={!text.trim()}>
              保存修改
            </button>
          </div>
          {failed && <p role="alert">保存失败，请重试。</p>}
        </form>
      ) : (
        <>
          <p className="journal-entry-text">{entry.text}</p>
          <div className="journal-entry-actions">
            <button
              className="text-button"
              aria-label={`编辑记录：${entry.text.slice(0, 20)}`}
              onClick={() => {
                setText(entry.text);
                setEditing(true);
              }}
            >
              编辑
            </button>
            <button
              className="text-button"
              aria-label={`删除记录：${entry.text.slice(0, 20)}`}
              onClick={onDelete}
            >
              删除
            </button>
          </div>
        </>
      )}
    </article>
  );
}
export default function JournalPage({
  data,
  commit,
  onCelebrate,
}: {
  data: Data;
  commit: Commit;
  onCelebrate: () => void;
}) {
  const [date, setDate] = useState(localDay),
    [deleting, setDeleting] = useState<JournalEntry | null>(null);
  const entries = entriesForDay(data, date);
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>感恩日记</h1>
          <p>想记住的，就写下来。</p>
        </div>
      </div>
      <div className="journal-date-bar">
        <button
          className="icon-button prev"
          aria-label="上一篇日期"
          onClick={() => setDate(shiftDay(date, -1))}
        >
          <Icon name="arrow" />
        </button>
        <input
          type="date"
          aria-label="日记日期"
          value={date}
          onChange={(e) => {
            if (daySchema.safeParse(e.target.value).success)
              setDate(e.target.value);
          }}
        />
        <button
          className="icon-button"
          aria-label="下一篇日期"
          onClick={() => setDate(shiftDay(date, 1))}
        >
          <Icon name="arrow" />
        </button>
        <button className="text-button" onClick={() => setDate(localDay())}>
          今天
        </button>
      </div>
      <EntryComposer
        key={date}
        date={date}
        commit={commit}
        onSaved={onCelebrate}
      />
      <section className="journal-entries" aria-label="这一天的日记记录">
        {[...entries].reverse().map((entry) => (
          <EntryRow
            key={entry.id}
            entry={entry}
            commit={commit}
            onDelete={() => setDeleting(entry)}
          />
        ))}
        {!entries.length && (
          <p className="agenda-empty">这一天还没有记录，写一条就好。</p>
        )}
      </section>
      {deleting && (
        <Confirmation
          text="删除这条日记记录？"
          onClose={() => setDeleting(null)}
          onConfirm={() => {
            commit((d) => deleteEntry(d, deleting));
            setDeleting(null);
          }}
        />
      )}
    </>
  );
}
