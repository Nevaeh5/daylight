import { useState } from "react";
import type { Data } from "../../domain/tasks";
import Icon from "../../components/Icon";

export default function Ideas({
  data,
  commit,
  onDelete,
}: {
  data: Data;
  commit: (update: (data: Data) => Data) => boolean;
  onDelete: (id: string) => void;
}) {
  const [text, setText] = useState("");
  const ideas = data.ideas || [];
  return (
    <section className="panel ideas-panel" aria-labelledby="ideas-heading">
      <div className="section-heading">
        <div className="section-title">
          <span className="section-icon">
            <Icon name="book" />
          </span>
          <h2 id="ideas-heading">随心记</h2>
          <span className="pill">以后想做的事</span>
        </div>
        <span className="count">
          {ideas.filter((i) => !i.done).length}
          <span> 件待做</span>
        </span>
      </div>
      <p className="section-description">
        不设日期、不设时间。把长远想做的事放在这里，哪天打开都还在。
      </p>
      <form
        className="idea-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          if (
            commit((d) => ({
              ...d,
              ideas: [
                ...(d.ideas || []),
                {
                  id: crypto.randomUUID(),
                  title: text.trim(),
                  done: false,
                  createdAt: new Date().toISOString(),
                },
              ],
            }))
          )
            setText("");
        }}
      >
        <input
          aria-label="随心记内容"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={120}
          placeholder="比如：学陶艺、整理旅行照片…"
        />
        <button className="primary" disabled={!text.trim()}>
          记下来
        </button>
      </form>
      <div className="ideas-list">
        {ideas.length ? (
          [...ideas]
            .sort((a, b) => Number(a.done) - Number(b.done))
            .map((idea) => (
              <div
                className={`task-row ${idea.done ? "is-done" : ""}`}
                key={idea.id}
              >
                <button
                  className="check-box"
                  aria-label={`${idea.done ? "取消完成" : "完成"}随心记 ${idea.title}`}
                  aria-pressed={idea.done}
                  onClick={() =>
                    commit((d) => ({
                      ...d,
                      ideas: (d.ideas || []).map((i) =>
                        i.id === idea.id ? { ...i, done: !i.done } : i,
                      ),
                    }))
                  }
                >
                  {idea.done && <Icon name="check" size={15} />}
                </button>
                <span className="task-content task-title">{idea.title}</span>
                <button
                  className="text-button"
                  aria-label={`删除随心记 ${idea.title}`}
                  onClick={() => onDelete(idea.id)}
                >
                  删除
                </button>
              </div>
            ))
        ) : (
          <p className="agenda-empty">慢慢收集想做的事，不必急着排进今天。</p>
        )}
      </div>
    </section>
  );
}
