import { useEffect, useState } from "react";
import {
  daySchema,
  localDay,
  shiftDay,
  type Data,
  type Journal,
  putJournal,
} from "../../domain/tasks";
import Icon from "../../components/Icon";
const prompts = [
  "今天让我开心的一件小事",
  "今天想感谢的人或事",
  "今天值得肯定的自己",
];
type Commit = (update: (d: Data) => Data) => boolean;
function JournalEditor({
  entry,
  date,
  commit,
  onSaved,
}: {
  entry?: Journal;
  date: string;
  commit: Commit;
  onSaved: () => void;
}) {
  const [answers, setAnswers] = useState<Journal["answers"]>(
    entry?.answers || ["", "", ""],
  );
  const [saved, setSaved] = useState(!!entry);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setAnswers(entry?.answers || ["", "", ""]);
    setSaved(!!entry);
    setFailed(false);
  }, [entry]);
  function update(i: number, text: string) {
    const next = [...answers] as Journal["answers"];
    next[i] = text;
    setAnswers(next);
    const ok = commit((d) =>
      putJournal(d, {
        date,
        answers: next,
        updatedAt: new Date().toISOString(),
      }),
    );
    setSaved(ok);
    setFailed(!ok);
  }
  return (
    <section className="journal-paper">
      <div className="section-heading">
        <h2>给这一天，留一点光</h2>
        <span className="save-state" role="status">
          {failed
            ? "保存失败，内容仍在当前页面"
            : saved
              ? "✓ 已自动保存在此设备"
              : "写下即自动保存"}
        </span>
      </div>
      {prompts.map((p, i) => (
        <label className="journal-question" key={p}>
          <span>
            <b>0{i + 1}</b> {p}
          </span>
          <textarea
            value={answers[i]}
            onChange={(e) => update(i, e.target.value)}
            maxLength={12000}
            rows={4}
            placeholder={
              [
                "一顿热饭、一阵晚风，也值得被记住…",
                "谢谢那个给你温暖的人，也可以谢谢自己…",
                "今天的你，已经做得很好了…",
              ][i]
            }
          />
        </label>
      ))}
      <div className="journal-footer">
        <span>只属于你的记录 · 不会发送给 AI</span>
        <button
          className="primary"
          disabled={!saved || !answers.some((a) => a.trim()) || failed}
          onClick={onSaved}
        >
          收好今天的美好 <Icon name="check" size={16} />
        </button>
      </div>
    </section>
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
  const [date, setDate] = useState(localDay);
  const entry = data.journals?.find((j) => j.date === date);
  const records = [...(data.journals || [])]
    .filter((j) => j.answers.some((a) => a.trim()))
    .sort((a, b) => b.date.localeCompare(a.date));
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">SAVE A LITTLE GOODNESS</div>
          <h1>每一刻，都值得被记住</h1>
          <p>白天的雀跃，夜晚的温柔。想写的时候，随时来。</p>
        </div>
      </div>
      <div className="journal-scene">
        <span className="pixel-moon">☾</span>
        <span className="journal-stars">✦ · ✧ · ✦</span>
        <div className="pixel-lamp">
          ▟<br />┃<br />━
        </div>
        <div className="journal-pet">
          ◢◣
          <br />
          ▌•ᴥ•▐
          <br />
          ▚▂▞
        </div>
        <div>
          <span className="eyebrow">小光的美好收集站</span>
          <h2>“我想听听你今天的小幸福。”</h2>
          <p>不用等到睡前，也不用写得很完整。</p>
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
          aria-label="日记日期"
          type="date"
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
      <JournalEditor
        key={date}
        entry={entry}
        date={date}
        commit={commit}
        onSaved={onCelebrate}
      />
      <section className="panel journal-settings">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={data.journalReminderEnabled !== false}
            onChange={(e) =>
              commit((d) => ({
                ...d,
                journalReminderEnabled: e.target.checked,
              }))
            }
          />{" "}
          22:00 小光晚安提醒
        </label>
        <p>
          目前仅在应用打开时显示提醒；全天可写。锁屏与关闭应用后的推送尚未接入。按设备时区：
          {Intl.DateTimeFormat().resolvedOptions().timeZone}。
        </p>
      </section>
      <section className="panel journal-history">
        <h2>
          美好足迹 <span>{records.length} 天</span>
        </h2>
        {records.length ? (
          records.map((j) => (
            <button
              key={j.date}
              onClick={() => setDate(j.date)}
              className={date === j.date ? "selected" : ""}
            >
              <span>{j.date}</span>
              <span>{j.answers.find((a) => a.trim())}</span>
              <Icon name="arrow" size={14} />
            </button>
          ))
        ) : (
          <p>你的第一份美好，正等着被记下。</p>
        )}
      </section>
    </>
  );
}
