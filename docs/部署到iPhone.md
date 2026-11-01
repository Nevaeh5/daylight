# Daylight 部署到 iPhone 桌面

这次已经完成本地网页和生产文件，尚未替你注册服务或发布到互联网。安装不需要 App Store，也不需要 Apple 开发者账号。下面选择不需要 GitHub 和命令行的 Netlify 手动上传方式。

## 1. 拿到可上传的网页

本次已构建好的目录：`C:\Users\chenshu\Documents\ChatGPT\daylight\dist`。

打开文件资源管理器，进入项目中的 `dist` 文件夹，应该直接看到 `index.html`、`assets`、`sw.js`、`manifest.webmanifest` 和图标。**上传整个 dist 文件夹**，不要上传源码文件夹、node_modules 或私人备份 JSON。

后续每次改完代码后，双击项目中的 **生成部署文件.cmd**。等窗口出现 `Build complete`，再上传新生成的 dist。当前 Codex 环境已装好依赖，可以直接构建。

## 2. 发布到 HTTPS 地址

1. 在电脑浏览器打开 [Netlify Drop](https://app.netlify.com/drop)。先登录你的 Netlify 账号；没有账号时按网站提示自行注册。
2. 把上述 **dist 文件夹**拖到网页的上传区域。手动发布不会替你构建，所以必须上传已经构建好的 dist。
3. 等待部署完成，复制站点地址，通常形如 `https://站点名称.netlify.app`。以服务实际返回的地址为准。
4. 用电脑打开该地址，确认首页、小光、日历、日记能正常使用。再用 iPhone Safari 打开同一个地址。
5. 暂时不需要购买域名。后续更新进入同一个 Netlify 项目的 Deploys 页面，上传新的 dist，保持原来的网址。不要每次创建新站点，否则本地记录不会跟着新域名迁移。

官方操作说明：[手动部署](https://docs.netlify.com/deploy/create-deploys/)、[新建项目](https://docs.netlify.com/manage/projects/add-new-project/)。服务套餐、免费额度与界面可能变化，以你账号显示为准。

## 3. 添加到 iPhone 主屏幕

1. 在 **Safari** 中打开部署后的 HTTPS 地址。电脑上的 `localhost:5173` 不能用于手机安装。
2. 点「分享」（方框向上箭头；部分系统版本在「更多」菜单中）。
3. 在分享列表中找到「添加到主屏幕」。没有看到时向下滚动列表查找。
4. 名称保留 **Daylight**。如果系统显示「作为网页 App 打开 / Open as Web App」，保持开启。
5. 点「添加」，回到主屏幕，点击 Daylight 图标。
6. 从这个桌面图标进入后，新建一件测试任务和一行日记，关闭再打开，确认记录仍在。

Apple 官方步骤：[在 iPhone Safari 中将网站变为 App](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios)。具体文字和按钮位置随 iOS 版本变化。

## 4. 数据与提醒的实际范围

- 当前是本地版，电脑、手机与不同站点来源的数据不会自动云同步。先在「我的」导出备份 JSON，把文件存到 iPhone 的「文件」中，再从已安装的 Daylight「我的 → 从备份恢复」选择该文件。恢复会替换该环境中的任务、日记和陪伴状态，操作前先备份。
- 直接从桌面图标开始正式记录。Safari 标签页与桌面 App 的存储行为可能因系统版本不同而变化，安装后务必执行上面的保存测试。
- 日记全天可写、输入即保存；22:00 只是温柔的提醒时刻。**当前提醒仅在应用打开时显示，锁屏或关闭 App 后不会收到后台推送。**真正后台提醒还需要 Web Push、通知授权、服务器定时调度与真机测试；安装图标不会自动启用这些能力。
- 私人任务和日记只保存在浏览器设备存储里，不会打包进 dist，也不会随静态网页上传。定期导出备份，防止清除浏览器数据后丢失。
- 第一次打开需要联网加载。生产构建包含离线预缓存配置，但本次未做 iPhone 真机飞行模式验收。

## 5. 更新后仍显示旧版

先备份，再关闭所有 Daylight 窗口和 Safari 中的 Daylight 标签页，重新从桌面打开。当前 Service Worker 采用等待安全更新的策略，不在你输入时强制刷新。不要为了更新直接清除网站数据，可能导致本地记录丢失。
