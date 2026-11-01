# Daylight：GitHub → Netlify 自动部署（Windows）

你现在的流程会变成：我修改电脑里的 Daylight → GitHub Desktop 保存并上传代码 → Netlify 自动构建并更新原网站。手机仍点原来的桌面图标。

本次已准备好 netlify.toml、Node 24 与 pnpm 版本配置，并确认 .gitignore 排除 node_modules、dist、.env、artifacts 和压缩包。当前本地仓库尚未连接 GitHub，也没有首次提交；当前分支名为 master。

## 第一步：安装 GitHub Desktop 并登录

1. 打开 https://github.com，有账号就登录；没有就按网站提示自行注册。
2. 打开 https://desktop.github.com/，下载安装 Windows 版 GitHub Desktop。
3. 启动 GitHub Desktop，选择 Sign in to GitHub.com。
4. 在浏览器完成登录和授权，再返回 GitHub Desktop；如果要求配置姓名和邮箱，使用自己的 GitHub 账户信息。

以后主要用这个软件的按钮，不需要输入命令。

## 第二步：把电脑里的整个项目交给 GitHub Desktop

1. 在 GitHub Desktop 顶部点 File → Add local repository。
2. Local path 填入：

   C:\Users\chenshu\Documents\ChatGPT\daylight

3. 点 Add repository。要选整个 daylight 源码文件夹；这里和手动上传 Netlify 的 dist 不同，因为 Netlify 自动部署需要源代码。
4. 左侧 Changes 会出现一批代码文件，保留勾选。node_modules、dist、压缩包正常不会出现在待提交列表中。
5. 左下方 Summary 填「Daylight 首次上传」，点击 Commit to master（按界面实际分支文字）。这一步只是把当前代码保存成一个版本。
6. 顶部点 Publish repository。
7. Name 填 daylight，保持勾选 Keep this code private（代码不公开）；Organization 选个人账户/None。
8. 点 Publish repository，等上传完成。
9. 点 Repository → View on GitHub。网页中应看到 src、public、package.json、pnpm-lock.yaml、pnpm-workspace.yaml、netlify.toml 等。

如果提示 daylight 已存在，先停止该发布流程并查看你已有的仓库，避免误建另一个空仓库。正常情况下不需要事先去 GitHub 网页创建仓库。

## 第三步：把原来的 Netlify 网站连接到这个仓库

1. 打开 https://app.netlify.com 并登录。
2. 在项目列表选择原来的 Daylight 项目。你之前给出的网址是 animated-faloodeh-2397a6.netlify.app，按这个名称查找对应项目。
3. 进入 Project configuration → Developer settings → Continuous deployment → Repository。
4. 点 Link repository，选择 GitHub。
5. 按提示登录/授权 GitHub；如果要求选择仓库访问范围，可选 Only select repositories，然后勾选 daylight。
6. 返回 Netlify，选择刚发布的 daylight 仓库。
7. Production branch 选择 GitHub Desktop 当前使用的分支。本机目前是 master；如果你的界面已改为 main，以实际分支为准。
8. 构建设置应为：Base directory 留空；Build command 为 pnpm run build；Publish directory 为 dist。项目内 netlify.toml 已写好，Netlify 可能直接读取并填好。
9. 点击保存/连接/Deploy（以界面文字为准）。
10. 打开 Deploys，看构建日志。等状态变成 Published/发布成功，再打开原来的网址检查。

这里连接原项目即可，不必另建 Netlify 项目，也不必换手机桌面图标。界面名称可能有调整，找不到 Repository 时可在项目设置里搜索 repository 或 continuous deployment。

## 第四步：以后每次更新只需两次点击

我改完并测试后，你打开 GitHub Desktop，确认 Current repository 是 daylight、Current branch 是部署用的分支。

1. 在 Summary 写一句说明，例如「更新小光对话」。
2. 点击 Commit to master（或你的实际分支）。
3. 点击 Push origin。
4. Netlify 自动构建和发布。到 Deploys 查看结果；发布成功后，关闭手机上的 Daylight 再打开。

Commit 是保存版本，Push 是上传到 GitHub。只点 Commit、没点 Push，Netlify 还收不到更新。文件改动本身也不会自动上传。此流程不需要重新下载 ZIP 或手工上传 dist。

## 遇到问题时看哪里

- GitHub Desktop 没有改动：确认选的是上面的原始项目目录，没有换成另一个同名文件夹。
- Netlify 找不到 daylight：检查 GitHub 授权是否允许访问这个私有仓库。
- Netlify 构建失败：打开最新部署的 Deploy log，复制包含 error 的最后一段给我，不必反复改设置。
- 手机仍是旧版：先确认 Netlify 已发布成功，再关闭 Daylight 及 Safari 中相关标签页，然后重新打开。不要直接清除网站数据。

自动部署只更新程序，不会自动同步你的任务和日记。当前记录仍保存在各设备本地。

官方参考：
- GitHub Desktop 添加本地仓库：https://docs.github.com/en/desktop/adding-and-cloning-repositories/adding-a-repository-from-your-local-computer-to-github-desktop
- GitHub Desktop 发布仓库：https://docs.github.com/en/desktop/adding-and-cloning-repositories/adding-an-existing-project-to-github-using-github-desktop?platform=windows
- Netlify 连接已有项目：https://docs.netlify.com/build/git-workflows/repo-permissions-linking/
- Netlify 构建配置：https://docs.netlify.com/build/configure-builds/overview/
