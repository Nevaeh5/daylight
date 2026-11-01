import { useEffect, useRef, useState } from "react";
import type { Task } from "../domain/tasks";
import Icon from "./Icon";
export default function TaskEditor({
  task,
  existing,
  onSave,
  onClose,
  onDelete,
  recognition,
}: {
  task: Task;
  existing: boolean;
  onSave: (t: Task) => boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  recognition?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [time, setTime] = useState(task.time);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
    dialog.current
      ?.querySelector<HTMLInputElement>('input[name="title"]')
      ?.focus();
  }, []);
  return (
    <dialog
      ref={dialog}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          if (
            onSave({
              ...task,
              title: String(f.get("title")).trim(),
              date: String(f.get("date")),
              time: String(f.get("time")),
              priority: f.get("priority") as Task["priority"],
              notes: String(f.get("notes")),
              focus: f.get("focus") === "on",
              reminderMinutes: time && f.get("reminder") === "on" ? 15 : null,
              updatedAt: new Date().toISOString(),
            })
          )
            onClose();
          else setFailed(true);
        }}
      >
        <div className="section-heading">
          <h2>{existing ? "编辑这件小事" : "安排一件小事"}</h2>
          <button
            type="button"
            className="icon-button"
            aria-label="关闭"
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        </div>
        {recognition && (
          <p className="recognition-note" role="status">
            {recognition}
          </p>
        )}
        <label>
          想完成什么？
          <input
            name="title"
            defaultValue={task.title}
            required
            maxLength={120}
            autoFocus
            placeholder="给今天留一点小期待"
          />
        </label>
        <div className="form-row">
          <label>
            日期
            <input type="date" name="date" defaultValue={task.date} required />
          </label>
          <label>
            时间（可选）
            <input
              type="time"
              name="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </label>
        </div>
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="reminder"
            defaultChecked={task.reminderMinutes !== null}
            disabled={!time}
          />
          提前 15 分钟提醒{!time && "（先填写时间）"}
        </label>
        <p className="reminder-help">
          请在「我的」开启后台提醒并确认同步成功；若距开始不足 15
          分钟，将尽快提醒。请核对日期、时间后保存。
        </p>
        <label>
          优先级
          <select name="priority" defaultValue={task.priority}>
            <option value="low">慢慢来</option>
            <option value="normal">日常安排</option>
            <option value="high">优先完成</option>
          </select>
        </label>
        <label>
          备注
          <textarea
            name="notes"
            defaultValue={task.notes}
            rows={3}
            maxLength={2000}
            placeholder="补充一点细节…"
          />
        </label>
        <label className="checkbox-label">
          <input type="checkbox" name="focus" defaultChecked={task.focus} />{" "}
          加入当天 Top 3
        </label>
        {failed && (
          <p role="alert" className="error">
            保存未成功。请检查当天 Top 3
            是否已满，或是否有本地存储错误；输入内容已保留。
          </p>
        )}
        <div className="form-actions">
          <button
            type="button"
            className="text-button danger"
            onClick={() => onDelete(task.id)}
          >
            {existing ? "删除任务" : "取消"}
          </button>
          <button className="primary" type="submit">
            保存安排 <Icon name="check" size={17} />
          </button>
        </div>
      </form>
    </dialog>
  );
}
