# Daylight 架构与阶段计划

## 产品和视觉

效率工具为核心，固定小狗「小光」提供陪伴。奖励统一使用「阳光」，不设连续打卡中断惩罚、不扣奖励、没有商城和抽卡。像素场景与图标用本地 SVG（crispEdges），标题采用疏朗字距与像素装饰，正文使用系统中文字体；柔和奶油白、鼠尾草绿、浅麦黄。桌面侧栏，移动端底部四导航，适配 safe-area 和动态视口。小狗呼吸、眨眼由 CSS steps 动画实现，系统减少动态效果时关闭动画。无需游戏引擎、Canvas 渲染循环或远程素材。

## 模块边界

- `src/domain/tasks.ts`：任务类型、Schema 验证、按日期查询、Top 3 上限规则。
- `src/data/repository.ts`：TaskRepository 接口、版本化 localStorage 适配器。Phase 1 数据量小，先用同步写入便于准确反馈保存失败；Phase 2 替换为 IndexedDB 的实体缓存及待同步操作队列。
- `src/data/useTasks.ts`：读取和提交、持久化失败提示、跨标签页更新。
- `src/components/TaskEditor.tsx`：原生 dialog 弹窗，支持键盘关闭、任务表单、日期和可选时间。
- `src/features/pet/PixelRoom.tsx`：独立像素场景、小狗展示、轻量待机及点击打招呼。不会写入任务数据。
- `src/App.tsx`：导航、首页布局、任务工作流、阶段边界与备份入口。
- `src/styles.css`：设计色彩、响应式布局、像素动画、减少动态效果支持。

Phase 4 再拆分宠物 `PetSprite`（只渲染）、`PetScene`（背景）、`petReducer`（状态迁移）、`feedbackPolicy`（业务事件转动作与文案）、`rewardLedger`（幂等奖励账本）。业务事件为 day.opened、task.completed、priorities.completed、journal.saved、journal.reminder。task.completed 用任务 ID + 日期结算，反复勾选不得反复发阳光；日记按用户/日期唯一结算。Top 3 用当日里程碑记录防刷。点击互动只反馈，不奖励。上次访问日期、mood/energy/bond 保存在独立 pet_state；低/中/高或 0–5 数值，久未使用仅轻微降低精力，不出现责备或病痛文案。

## 数据结构与同步扩展

Phase 1 本地根结构 `{version:1,tasks:Task[]}`；Task 包含 id、title、date、time（可空）、notes、priority、done、focus、order、createdAt、updatedAt。日期为设备本地 YYYY-MM-DD，time 为本地墙上时间，尚非跨时区事件。每天重点名额独立，用户手动改变日期才能顺延；历史不自动删除。数据导入逐字段验证，再由用户确认替换；无法读取时暂停写入并允许导出原始备份。localStorage 不是云端备份，多窗口同步只适用于同浏览器同源，极端并发写入不提供数据库事务保证。

Phase 2 云端将重点关系拆为 daily_priorities(user_id,date,task_id,position)，日期/位置唯一；tasks 增加 user_id、revision、deleted_at。其余规划：profiles（时区）、events（开始/结束、全天与重复）、gratitude_entries（user_id/date 唯一）、notification_preferences、push_subscriptions、notification_jobs、calendar_connections、calendar_event_mappings、sync_logs、pet_state、reward_ledger。所有私有表启用 RLS，user_id 所有权检查，任务写入用 revision 防静默覆盖。离线队列带 operation_id，实现幂等与删除墓碑。服务器密钥只存在服务器环境变量。

预留 CalendarProvider：connect、listChanges(cursor)、upsert(event,idempotencyKey)、delete(externalId)、disconnect。Google Calendar 中转到 iPhone 上的 Google 日历，不会自动同步既有 iCloud 日历；CalDAV 后续单独评估，不保存 Apple 账户密码。

## 阶段验收

1. **Phase 1 / 已开发**：React/TS/Vite、PWA 构建、像素首页、小狗待机与打招呼、任务增删改查、完成切换、Top 3 上限和排序、可选时间轴、本地保存、日期历史、JSON 导入导出、导航基础页。空数据库启动，不预置虚假任务。完整浏览器验收见 README。
2. **Phase 2**：Supabase Auth、SQL migration、RLS、IndexedDB 缓存与操作队列、冲突解释、跨设备同步。需要用户创建 Supabase 项目并在本机环境文件设置公开 URL/anon key。
3. **Phase 3**：中文规则解析、确认卡片、歧义提示、重复规则、日/周/月日历、独立事件管理、可配置时区。AI 仅在规则不确定时由服务端调用，输出验证后用户确认保存。
4. **Phase 4**：宠物完整事件反馈、mood/energy/bond、阳光奖励、轻量解锁、夜间感恩日记自动保存与历史回顾。22:00 建立按用户时区的提醒任务；真实后台送达依赖 Phase 5 Web Push，不使用页面定时器冒充后台通知。
5. **Phase 5**：Web Push 与服务端调度、提醒日志与去重、Google OAuth 与双向日历同步、增量游标和冲突处理、HTTPS 部署优化、iPhone 真机安装和通知验收。

## 当前明确未实现

没有账户、云同步、中文时间语义解析、独立日程事件、完整日/周/月网格、日记保存、成长/奖励账本、后台提醒、Google/Apple 日历联动、线上部署。输入框当前只预填任务标题，用户在表单手动确认日期和时间。日记页是明确标记的开发预告。
