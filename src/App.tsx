import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  dayTasks,
  splitDayTasks,
  localDay,
  putTask,
  shiftDay,
  dataSchema,
  type Task,
} from "./domain/tasks";
import { useTasks } from "./data/useTasks";
import { STORAGE_KEY } from "./data/repository";
import PixelRoom from "./features/pet/PixelRoom";
import Icon from "./components/Icon";
import TaskEditor from "./components/TaskEditor";
import Confirmation from "./components/Confirmation";
import MonthCalendar from "./features/calendar/MonthCalendar";
import JournalPage from "./features/journal/JournalPage";
import EveningReminder from "./features/journal/EveningReminder";
import { interact, type PetAction } from "./features/pet/companion";
import { parseSchedule } from "./domain/parseSchedule";
import Ideas from "./features/ideas/Ideas";
import PushSettings from "./features/reminders/PushSettings";
import AppInstall from "./components/AppInstall";
type Page = "today" | "calendar" | "journal" | "profile";
const nav = [
  { id: "today", name: "今天", icon: "sun" },
  { id: "calendar", name: "日历", icon: "calendar" },
  { id: "journal", name: "日记", icon: "book" },
  { id: "profile", name: "我的", icon: "user" },
] as const;
function download(text: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `daylight-backup-${localDay()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function App() {
  const { data, error, commit } = useTasks();
  const [today, setToday] = useState(localDay),
    [date, setDate] = useState(localDay),
    [page, setPage] = useState<Page>("today"),
    [editor, setEditor] = useState<Task | null>(null),
    [toast, setToast] = useState(""),
    [quick, setQuick] = useState(""),
    [online, setOnline] = useState(navigator.onLine);
  const [petFeedback, setPetFeedback] = useState<
    { id: number; message: string } | undefined
  >();
  const [recognition, setRecognition] = useState("");
  const contentPane = useRef<HTMLDivElement>(null);
  const scrollPositions = useRef<Partial<Record<Page, number>>>({});
  useLayoutEffect(() => {
    contentPane.current?.scrollTo({
      top: scrollPositions.current[page] || 0,
      behavior: "auto",
    });
  }, [page]);
  const parsed = quick.trim() ? parseSchedule(quick) : null;
  function celebrate(message: string) {
    setPetFeedback({ id: Date.now(), message });
  }
  function petInteract(action: PetAction) {
    return commit((d) => interact(d, action, today));
  }
  const importer = useRef<HTMLInputElement>(null);
  const [confirmation, setConfirmation] = useState<{
    text: string;
    run: () => void;
  } | null>(null);
  useEffect(() => {
    const check = () => {
      const next = localDay();
      setToday((old) => {
        if (old !== next) setDate((d) => (d === old ? next : d));
        return next;
      });
    };
    const timer = setInterval(check, 15000);
    window.addEventListener("focus", check);
    const net = () => setOnline(navigator.onLine);
    window.addEventListener("online", net);
    window.addEventListener("offline", net);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", check);
      window.removeEventListener("online", net);
      window.removeEventListener("offline", net);
    };
  }, []);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);
  const tasks = dayTasks(data, date),
    { focus, schedule } = splitDayTasks(data, date),
    completed = tasks.filter((t) => t.done).length;
  const dateObj = new Date(date + "T12:00:00"),
    isToday = date === today;
  function newTask(title = "", focused = false) {
    setRecognition("");
    const now = new Date().toISOString();
    setEditor({
      id: crypto.randomUUID(),
      title,
      date,
      time: "",
      reminderMinutes: 15,
      notes: "",
      priority: "normal",
      done: false,
      focus: focused && focus.length < 3,
      order: Math.max(Date.now(), ...data.tasks.map((t) => t.order + 1)),
      createdAt: now,
      updatedAt: now,
    });
  }
  function save(t: Task) {
    if (
      t.focus &&
      data.tasks.filter((x) => x.date === t.date && x.focus && x.id !== t.id)
        .length >= 3
    ) {
      setToast("每天只选三件重要的事，已经足够好了。");
      return false;
    }
    const success = commit((d) => putTask(d, t));
    if (success) {
      setToast(
        t.time && t.reminderMinutes === 15
          ? `已保存到 ${t.date}，请在「我的」确认提醒同步状态`
          : "已保存在这台设备上",
      );
      setQuick("");
      setDate(t.date);
    }
    return success;
  }
  function toggle(t: Task) {
    if (
      save({ ...t, done: !t.done, updatedAt: new Date().toISOString() }) &&
      !t.done
    ) {
      const allFocus = data.tasks.filter((x) => x.date === t.date && x.focus);
      celebrate(
        t.focus &&
          allFocus.length === 3 &&
          allFocus.every((x) => x.id === t.id || x.done)
          ? "三件重要的事都完成啦！为你撒一把阳光。"
          : "又完成一件小事！汪，我为你开心。",
      );
    }
  }
  function reorder(id: string, delta: number) {
    const i = focus.findIndex((t) => t.id === id),
      other = focus[i + delta];
    if (!other) return;
    commit((d) => ({
      ...d,
      tasks: d.tasks.map((t) =>
        t.id === id
          ? { ...t, order: other.order, updatedAt: new Date().toISOString() }
          : t.id === other.id
            ? {
                ...t,
                order: focus[i].order,
                updatedAt: new Date().toISOString(),
              }
            : t,
      ),
    }));
  }
  function remove(id: string) {
    if (!data.tasks.some((t) => t.id === id)) {
      setEditor(null);
      return;
    }
    setConfirmation({
      text: "删除这件事？删除后无法撤销，可以先在「我的」导出备份。",
      run: () => {
        if (
          commit((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) }))
        ) {
          setEditor(null);
          setToast("任务已删除");
        }
      },
    });
  }
  const dateControl = (
    <div className="date-control">
      <button
        className="icon-button prev"
        aria-label="前一天"
        onClick={() => setDate(shiftDay(date, -1))}
      >
        <Icon name="arrow" size={16} />
      </button>
      <label className="date-picker">
        <Icon name="calendar" size={16} />
        <input
          aria-label="查看日期"
          type="date"
          value={date}
          onChange={(e) => {
            if (
              e.target.value &&
              dataSchema.shape.tasks.element.shape.date.safeParse(
                e.target.value,
              ).success
            )
              setDate(e.target.value);
          }}
        />
      </label>
      <button
        className="icon-button"
        aria-label="后一天"
        onClick={() => setDate(shiftDay(date, 1))}
      >
        <Icon name="arrow" size={16} />
      </button>
      {!isToday && (
        <button className="text-button" onClick={() => setDate(today)}>
          今天
        </button>
      )}
    </div>
  );
  const taskRow = (t: Task, timeline = false) => (
    <div key={t.id} className={`task-row ${t.done ? "is-done" : ""}`}>
      <button
        className="check-box"
        aria-label={`${t.done ? "取消完成" : "完成"} ${t.title}`}
        aria-pressed={t.done}
        onClick={() => toggle(t)}
      >
        {t.done && <Icon name="check" size={15} />}
      </button>
      <button
        className="task-content"
        onClick={() => {
          setRecognition("");
          setEditor(t);
        }}
      >
        <span className="task-title">{t.title}</span>
        <span className="task-meta">
          {timeline
            ? `${t.time ? t.time + " · " : ""}${t.focus ? "今日重点" : "日常安排"}`
            : t.time || "时间由你决定"}
          {t.priority === "high" && " · 优先"}
          {t.notes && " · 有备注"}
          {t.time && t.reminderMinutes === 15 && " · 提前15分钟提醒"}
        </span>
      </button>
      {!timeline && (
        <div className="sort-buttons">
          <button
            className="icon-button"
            disabled={focus[0]?.id === t.id}
            aria-label={`上移 ${t.title}`}
            onClick={() => reorder(t.id, -1)}
          >
            <Icon name="up" size={14} />
          </button>
          <button
            className="icon-button"
            disabled={focus.at(-1)?.id === t.id}
            aria-label={`下移 ${t.title}`}
            onClick={() => reorder(t.id, 1)}
          >
            <Icon name="down" size={14} />
          </button>
        </div>
      )}
      <button
        className="icon-button task-edit"
        aria-label={`编辑 ${t.title}`}
        onClick={() => {
          setRecognition("");
          setEditor(t);
        }}
      >
        <Icon name="edit" size={16} />
      </button>
    </div>
  );
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          href="#"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            setPage("today");
          }}
        >
          <span className="brand-sun">
            <Icon name="sun" size={27} />
          </span>
          <span>
            daylight<span className="brand-dot">.</span>
          </span>
        </a>
        <div className="sidebar-caption">给每一天，一点点阳光</div>
        <nav aria-label="主导航">
          {nav.map((n) => (
            <button
              key={n.id}
              className={page === n.id ? "nav-item active" : "nav-item"}
              aria-current={page === n.id ? "page" : undefined}
              onClick={() => setPage(n.id)}
            >
              <Icon name={n.icon} />
              <span>{n.name}</span>
              {page === n.id && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="tiny-plant">
            <Icon name="leaf" size={30} />
          </div>
          <p>
            不必赶路，
            <br />
            按自己的节奏生长。
          </p>
          <span className="local-status">
            <i />
            {online ? "本地保存已就绪" : "离线 · 仍可记录"}
          </span>
          <small>DAYLIGHT / CHAPTER 01</small>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <span className="desktop-breadcrumb">
            <span className="breadcrumb">我的小世界</span>
            <span className="slash">/</span>
            {nav.find((n) => n.id === page)?.name}
          </span>
          <span className="mobile-app-title">
            <img src="/pink-sun-192.png" alt="" width="34" height="34" />
            daylight<small>{nav.find((n) => n.id === page)?.name}</small>
          </span>
          <span className="topbar-right">
            <i className="status-dot" />
            本地保存 · 可选提醒 <span className="avatar">光</span>
          </span>
        </header>
        <div
          className="main-content"
          ref={contentPane}
          onScroll={(e) => {
            scrollPositions.current[page] = e.currentTarget.scrollTop;
          }}
        >
          {page === "profile" && <AppInstall />}
          {error && (
            <div className="error" role="alert">
              {error}
              <button
                className="text-button"
                onClick={() =>
                  download(localStorage.getItem(STORAGE_KEY) || "{}")
                }
              >
                导出原始备份
              </button>
            </div>
          )}
          {page !== "journal" && (
            <EveningReminder
              data={data}
              onWrite={() => setPage("journal")}
              onDismiss={() =>
                commit((d) => ({ ...d, reminderDismissedOn: today }))
              }
            />
          )}
          {page === "today" ? (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">A LITTLE BETTER, EVERY DAY</div>
                  <h1>
                    {isToday
                      ? "今天，也慢慢来"
                      : `${dateObj.getMonth() + 1}月${dateObj.getDate()}日的小安排`}
                    <span className="heading-sun">✳</span>
                  </h1>
                  <p>
                    {dateObj.toLocaleDateString("zh-CN", {
                      month: "long",
                      day: "numeric",
                      weekday: "long",
                    })}
                    <span className="dot-separator">·</span>
                    每一件小事，都有自己的意义
                  </p>
                </div>
                {dateControl}
              </div>
              <PixelRoom
                today={today}
                pet={data.pet}
                feedback={petFeedback}
                onInteract={petInteract}
              />
              <div className="daily-summary">
                <span>
                  <Icon name="leaf" size={17} /> 今天的小小进度
                </span>
                <div className="progress-track">
                  <div
                    style={{
                      width: `${tasks.length ? (completed / tasks.length) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span>
                  <b>{completed}</b> / {tasks.length} 已完成
                </span>
                <span className="summary-note">一点点，也很好</span>
              </div>
              <div className="dashboard-grid">
                <section className="panel focus-panel">
                  <div className="section-heading">
                    <div className="section-title">
                      <span className="section-icon">
                        <Icon name="star" />
                      </span>
                      <h2>今日 Top 3</h2>
                      <span className="pill">专注重要的事</span>
                    </div>
                    <span className="count">
                      {focus.filter((t) => t.done).length}
                      <span> / 3</span>
                    </span>
                  </div>
                  <p className="section-description">
                    不用做完所有事，先照顾好最重要的三件。
                  </p>
                  <div className="focus-list">
                    {focus.map((t) => taskRow(t))}
                    {Array.from({ length: 3 - focus.length }, (_, i) => (
                      <button
                        key={i}
                        className="empty-focus"
                        onClick={() => newTask("", true)}
                      >
                        <span className="empty-number">
                          0{focus.length + i + 1}
                        </span>
                        <span>留给一件重要的小事</span>
                        <Icon name="plus" size={17} />
                      </button>
                    ))}
                  </div>
                  <div className="panel-foot">
                    <Icon name="sun" size={15} />
                    <span>
                      {focus.length === 3 && focus.every((t) => t.done)
                        ? "今天的三件重要小事，都完成啦。"
                        : "留一点空白，给生活里的小惊喜。"}
                    </span>
                  </div>
                </section>
                <form
                  className="quick-add"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (quick.trim()) {
                      const result = parseSchedule(quick);
                      const now = new Date().toISOString();
                      setRecognition(
                        `已识别：${result.date} ${result.time || "待补充时间"}。${result.warnings.join(" ")}`,
                      );
                      setEditor({
                        id: crypto.randomUUID(),
                        title: result.title,
                        date: result.date,
                        time: result.time,
                        reminderMinutes: 15,
                        notes: "",
                        priority: "normal",
                        done: false,
                        focus: false,
                        order: Date.now(),
                        createdAt: now,
                        updatedAt: now,
                      });
                    }
                  }}
                >
                  <span className="input-spark" title="一句话识别日期与时间">
                    <Icon name="wand" />
                  </span>
                  <div className="quick-input">
                    <label className="sr-only" htmlFor="quick">
                      一句话添加日程
                    </label>
                    <input
                      id="quick"
                      value={quick}
                      onChange={(e) => setQuick(e.target.value)}
                      maxLength={200}
                      placeholder=""
                    />
                    <span>
                      {parsed
                        ? `${parsed.date} · ${parsed.time || "时间待补充"} · ${parsed.time ? "提前15分钟提醒" : "补充时间后可提醒"}`
                        : ""}
                    </span>
                  </div>
                  <button
                    type="submit"
                    className="primary"
                    disabled={!quick.trim()}
                  >
                    核对并添加 <Icon name="arrow" size={16} />
                  </button>
                </form>
                <section className="panel timeline-panel">
                  <div className="section-heading">
                    <div className="section-title">
                      <span className="section-icon green">
                        <Icon name="clock" />
                      </span>
                      <h2>{isToday ? "今日安排" : "当日安排"}</h2>
                      <span className="pill neutral">
                        {schedule.length} 件小事
                      </span>
                    </div>
                    <button
                      className="icon-button"
                      aria-label="添加安排"
                      onClick={() => newTask()}
                    >
                      <Icon name="plus" />
                    </button>
                  </div>
                  <p className="section-description">
                    {isToday ? "今天" : "这一天"}除 Top 3
                    以外的其他安排，与随心记分开保存。
                  </p>
                  <div className="timeline">
                    {schedule.length ? (
                      [...schedule]
                        .sort((a, b) =>
                          (a.time || "99").localeCompare(b.time || "99"),
                        )
                        .map((t) => (
                          <div className="timeline-item" key={t.id}>
                            <span className="timeline-time">
                              {t.time || "待安排"}
                            </span>
                            {taskRow(t, true)}
                          </div>
                        ))
                    ) : (
                      <div className="timeline-empty">
                        <span className="empty-clock">
                          <Icon name="clock" size={31} />
                        </span>
                        <h3>其他安排，留一点空白</h3>
                        <p>Top 3 已单独展示，这里只放其他安排。</p>
                        <button
                          className="text-button"
                          onClick={() => newTask()}
                        >
                          添加第一件事 <Icon name="plus" size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <Ideas
                data={data}
                commit={commit}
                onDelete={(id) =>
                  setConfirmation({
                    text: "删除这条随心记？",
                    run: () => {
                      commit((d) => ({
                        ...d,
                        ideas: (d.ideas || []).filter((i) => i.id !== id),
                      }));
                    },
                  })
                }
              />
              <div className="bottom-note">
                <span>小光陪你的第一个小世界</span>
                <span>不用完美，今天的你已经很好。</span>
              </div>
            </>
          ) : page === "calendar" ? (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">YOUR MONTH, IN LITTLE STARS</div>
                  <h1>日子，有迹可循</h1>
                  <p>用一颗星，记住每一个有安排的日子。</p>
                </div>
              </div>
              <MonthCalendar
                date={date}
                today={today}
                tasks={data.tasks}
                onSelect={setDate}
              />
              <section className="panel calendar-basic">
                <div className="section-heading">
                  <h2>
                    {dateObj.getMonth() + 1}月{dateObj.getDate()}日 · 全部事项
                  </h2>
                  {dateControl}
                </div>
                {tasks.length ? (
                  <>
                    <h3 className="agenda-label">★ 当日 Top 3</h3>
                    {focus.length ? (
                      focus.map((t) => taskRow(t, true))
                    ) : (
                      <p className="agenda-empty">未选择重点</p>
                    )}
                    <h3 className="agenda-label">其他安排</h3>
                    {schedule.length ? (
                      schedule.map((t) => taskRow(t, true))
                    ) : (
                      <p className="agenda-empty">暂无其他安排</p>
                    )}
                  </>
                ) : (
                  <div className="timeline-empty">
                    <Icon name="calendar" size={35} />
                    <p>这一天还没有安排。</p>
                  </div>
                )}
                <button className="primary" onClick={() => newTask()}>
                  添加这一天的任务 <Icon name="plus" size={17} />
                </button>
              </section>
            </>
          ) : page === "journal" ? (
            <JournalPage
              data={data}
              commit={commit}
              onCelebrate={() => {
                celebrate("你的美好，我都收好啦。今天的你也很棒！");
                setToast("小光：你的美好，我都收好啦。");
              }}
            />
          ) : (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">A SPACE OF YOUR OWN</div>
                  <h1>设置</h1>
                  <p>通知、备份与安装。</p>
                </div>
              </div>
              <section className="panel settings">
                <h2>数据与备份</h2>
                <p>
                  数据保存在此浏览器中。你可以导出备份或从备份恢复。开启后台提醒后，仅需提醒的日程会同步到后台。
                </p>
                <div className="settings-buttons">
                  <button
                    className="primary"
                    onClick={() => download(JSON.stringify(data, null, 2))}
                  >
                    <Icon name="download" size={17} /> 导出 JSON 备份
                  </button>
                  <button
                    className="secondary"
                    onClick={() => importer.current?.click()}
                  >
                    从备份恢复
                  </button>
                  <input
                    ref={importer}
                    type="file"
                    accept="application/json,.json"
                    hidden
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (!file) return;
                      if (file.size > 10_000_000) {
                        setToast("请选择小于 10 MB 的备份");
                        return;
                      }
                      try {
                        const imported = dataSchema.parse(
                          JSON.parse(await file.text()),
                        );
                        setConfirmation({
                          text: `将用备份中的 ${imported.tasks.length} 个任务、${imported.ideas?.length || 0} 条随心记及 ${(imported.journalEntries?.length || 0) + (imported.journals?.reduce((n, j) => n + j.answers.filter((a) => a.trim()).length, 0) || 0)} 条日记替换此设备的全部数据（含陪伴记录和后台提醒安排）。是否继续？`,
                          run: () => {
                            if (commit(() => imported, true))
                              setToast("备份已恢复");
                          },
                        });
                      } catch {
                        setToast("备份格式不正确，原数据没有修改。");
                      }
                    }}
                  />
                </div>
              </section>
              <section className="panel settings">
                <h2>安装到主屏幕</h2>
                <p>
                  在 iPhone Safari
                  中打开，点击「分享」→「添加到主屏幕」；若看到「作为网页 App
                  打开」，请保持开启。之后点击桌面上的粉红色像素太阳，就能以独立
                  App 窗口启动。Android 可在浏览器菜单中选择「安装应用」。
                </p>
                <p className="subtle">
                  本地时区：{Intl.DateTimeFormat().resolvedOptions().timeZone} ·
                  日期使用此设备本地时间。
                </p>
              </section>
              <section className="panel settings">
                <h2>日记提醒</h2>
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
                  />
                  22:00 小光晚安邀请
                </label>
                <p>
                  仅在应用打开时提醒写日记；日程的后台通知可在下方单独设置。
                </p>
              </section>
            </>
          )}
          <div hidden={page !== "profile"}>
            <PushSettings data={data} />
          </div>
        </div>
      </main>
      {confirmation && (
        <Confirmation
          text={confirmation.text}
          onConfirm={confirmation.run}
          onClose={() => setConfirmation(null)}
        />
      )}
      {editor && (
        <TaskEditor
          existing={data.tasks.some((t) => t.id === editor.id)}
          key={editor.id}
          task={editor}
          recognition={recognition}
          onClose={() => setEditor(null)}
          onSave={save}
          onDelete={remove}
        />
      )}
      <div
        role="status"
        aria-live="polite"
        className={toast ? "toast visible" : "toast"}
      >
        {toast}
      </div>
    </div>
  );
}
