# Superpowers 版本更新日志

## v5.1.0 (2026-04-30)

### 移除

- **移除旧版斜杠命令** — `/brainstorm`、`/execute-plan` 和 `/write-plan` 已被移除。它们曾是已弃用的存根，仅告诉用户去调用相应的技能。请直接调用 `superpowers:brainstorming`、`superpowers:executing-plans` 和 `superpowers:writing-plans`。(#1188)
- **移除 `superpowers:code-reviewer` 命名智能体** — 该智能体是插件中唯一的命名智能体，仅被两个技能使用，而仓库中所有其他审查者/实现者子智能体都通过 `general-purpose` 配合技能中的提示模板来调度。该智能体的角色定义和检查清单已合并到 `skills/requesting-code-review/code-reviewer.md` 中，作为一个独立的 Task 调度模板。任何调度 `Task (superpowers:code-reviewer)` 的地方应改为使用 `Task (general-purpose)` 并配合该提示模板。(PR #1299)
- **从技能中移除集成部分** — 这些是智能体拥有原生技能系统之前的遗留内容，对引导没有帮助。

### Worktree 技能重写

`using-git-worktrees` 和 `finishing-a-development-branch` 现在能检测智能体是否已在隔离的 worktree 中运行，并优先使用 harness 的原生 worktree 控制，然后才回退到 `git worktree`。行为已通过 TDD 验证，并在五种 harness 上进行了跨平台检查。(PRI-974, PR #1121)

- **环境检测** — 两个技能在任何操作之前检查 `GIT_DIR != GIT_COMMON`；如果已在链接的 worktree 中，则完全跳过创建。子模块防护可防止误检测。
- **创建 worktree 前征得同意** — `using-git-worktrees` 不再隐式创建 worktree；该技能会先询问用户。修复 #991（subagent-driven-development 之前未经同意自动创建 worktree）。
- **原生工具优先（步骤 1a）** — 当 harness 提供自己的 worktree 工具时（例如 Codex），技能优先使用该工具。当用户明确表达偏好时，予以尊重。
- **基于来源的清理** — `finishing-a-development-branch` 仅清理 `.worktrees/` 内（由 superpowers 创建）的 worktree；之外的内容保持原样。修复 #940（选项 2 错误地清理了 worktree）、#999（先合并后删除的顺序问题）和 #238（在 `git worktree remove` 前 `cd` 到仓库根目录）。
- **Detached HEAD 处理** — 当没有可合并的分支时，完成菜单缩减为两个选项。
- 技能示例中的**硬编码 `/Users/jesse` 路径**已替换为通用占位符。(#858, PR #1122)

### 面向 AI 智能体的贡献者指南

在 `CLAUDE.md`（符号链接到 `AGENTS.md`）顶部新增两个部分，直接面向 AI 智能体。对本仓库最近 100 个已关闭 PR 的审计显示，94% 的拒绝率源于 AI 生成的垃圾：智能体没有阅读 PR 模板、提交重复 PR、捏造问题描述，或将 fork 特定或领域特定的改动推到上游。

- **提交前检查清单** — 阅读 PR 模板，搜索已有 PR，确认存在真实问题，确认改动属于核心，在提交前向人类搭档展示完整的 diff。
- **我们不会接受的内容** — 第三方依赖、对技能内容的"合规性"重写、项目特定配置、批量 PR、推测性修复、领域特定技能、fork 特定改动、捏造内容以及捆绑不相关的改动。
- **新 harness PR 需要会话转录** — 大多数以往的新 harness 集成只是复制技能文件或用 `npx skills` 包装，而不是在会话开始时加载 `using-superpowers` 引导程序。现在要求提供验收测试（在干净会话中发送 "Let's make a react todo list" 必须自动触发 `brainstorming`）和完整的会话转录。

### Codex 插件镜像工具

新增 `sync-to-codex-plugin` 脚本，将 superpowers 镜像到 OpenAI Codex 插件市场 `prime-radiant-inc/openai-codex-plugins`。路径/用户无关，任何团队成员均可运行。(PR #1165)

- 每次运行将 fork 全新克隆到临时目录，内联重新生成覆盖层，并提交 PR；从脚本自身位置自动检测上游，预检 `rsync`/`git`/`gh auth`/`python3`。
- `--bootstrap` 标志用于首次设置；`EXCLUDES` 模式锚定到源根目录；`assets/` 排除在外。
- 镜像 `CODE_OF_CONDUCT.md`；丢弃 `agents/openai.yaml` 覆盖层。
- 在镜像的 `plugin.json` 中填入 `interface.defaultPrompt`。(PR #1180 by @arittr)
- Codex 插件文件提交到源仓库，以便同步脚本使用规范版本；Codex 市场元数据得以保留。

### OpenCode

- **Bootstrap 内容在模块级别缓存** — `getBootstrapContent()` 之前在智能体的每个步骤都调用 `fs.existsSync` + `fs.readFileSync` + frontmatter 正则（`experimental.chat.messages.transform` hook 在 OpenCode 的智能体循环中每个步骤都会触发）。现在读取一次，在会话生命周期内缓存，对于文件缺失的情况使用 null 哨兵值。15 个回归测试覆盖了缓存行为、fs 调用计数、注入防护、缺失文件哨兵和缓存重置。(修复 #1202)
- **集成测试已现代化**。
- **README 中的安装注意事项已明确**。

### 代码审查整合

`requesting-code-review` 现已自包含：角色定义、检查清单和调度模板位于 `skills/requesting-code-review/code-reviewer.md` 中，该技能直接调度 `Task (general-purpose)`。(PR #1299)

- **单一事实来源** — 以前同时存在于 `agents/code-reviewer.md` 和技能的占位模板中的角色/检查清单（且各自独立演变）现在合并为一个文件。
- **`subagent-driven-development` 同步跟进** — 其 `code-quality-reviewer-prompt.md` 现在调度 `Task (general-purpose)` 而非命名智能体。
- **新增行为测试** — `tests/claude-code/test-requesting-code-review.sh` 在一个小型项目中植入真实 bug（SQL 注入、明文密码处理、凭据日志记录），并断言调度的审查者以 Critical/Important 严重级别标记每个植入问题，并拒绝批准 diff。
- **Codex 和 Copilot 的变通方案文档已精简** — `references/codex-tools.md` 和 `references/copilot-tools.md` 中的"命名智能体调度"部分记录了如何将命名智能体展平为通用调度。由于不再发布命名智能体，该变通方案不再需要；两个部分均已删除。

### Subagent-Driven Development

- **不再每 3 个任务暂停一次** — `requesting-code-review` 中"每批次（3 个任务）后审查"的节奏（最初为 `executing-plans` 设计）泄露到了 `subagent-driven-development` 中。替换为"每个任务后或在自然检查点"加上显式的连续执行指令。
- **SDD 集成测试现在真正运行其断言** — 三个独立的 bug 导致测试在打印任何验证结果前静默退出：工作目录路径中未解析的 `..` 段，`set -euo pipefail` 与 `find | sort | head -1` 的交互（生产者端的 SIGPIPE 杀死了脚本），以及 `claude -p` 调用中缺失的 `--plugin-dir` 导致测试加载了已安装的插件而非工作树。全部三个已修复；六个验证测试现在真正针对真实的端到端 SDD 运行进行验证。

### Cursor

- **Windows SessionStart hook** 通过 `run-hook.cmd` 路由，而不是直接调用无扩展名的 `session-start` 脚本。修复了 Windows 在编辑器中打开文件而非运行它的问题。同时从 `hooks-cursor.json` 中移除了意外的 UTF-8 BOM。

### Gemini CLI

- **子智能体调度映射** — Gemini 的 `Task` 调度现在映射到 `@agent-name` / `@generalist`，并记录了针对独立任务的并行子智能体调度方法。

### 技能

- 技能内容中的**术语清理**。

### 文档与安装

- **Factory Droid 安装说明**已添加到 README。
- **README 中的快速入门安装链接**。(PR #1293 by @arittr)
- **Codex 插件安装指南**已更新。(PR #1288 by @arittr)
- 工具参考中 **Codex `wait` 映射**更正为 `wait_agent`。
- **安装顺序重新组织**；Codex 安装说明已清理。
- **移除遗留的 `CHANGELOG.md`**，以 `RELEASE-NOTES.md` 作为唯一来源。(PR #1163 by @shaanmajid)
- **Discord 邀请链接**已修复；在社区贡献部分添加了版本发布公告链接和详细的 Discord 描述。

### 社区贡献

- @shaanmajid — 移除遗留的 `CHANGELOG.md` (PR #1163)
- @arittr — README 快速入门安装链接 (#1293)、Codex 插件安装指南 (#1288)、`sync-to-codex-plugin` `interface.defaultPrompt` 填入 (#1180)

## v5.0.7 (2026-03-31)

### GitHub Copilot CLI 支持

- **SessionStart 上下文注入** — Copilot CLI v1.0.11 在 sessionStart hook 输出中新增了对 `additionalContext` 的支持。session-start hook 现在检测 `COPILOT_CLI` 环境变量并输出 SDK 标准的 `{ "additionalContext": "..." }` 格式，在会话开始时为 Copilot CLI 用户提供完整的 superpowers 引导程序。(原始修复由 @culinablaz 在 PR #910 中完成)
- **工具映射** — 新增 `references/copilot-tools.md`，包含完整的 Claude Code 到 Copilot CLI 工具等价表
- **技能和 README 更新** — 在 `using-superpowers` 技能的平台说明和 README 安装部分中添加了 Copilot CLI

### OpenCode 修复

- **技能路径一致性** — 引导文本不再宣传与实际运行时路径不匹配的误导性 `configDir/skills/superpowers/` 路径。智能体应使用原生的 `skill` 工具，而非通过路径导航到文件。测试现在使用从单一事实来源派生的统一路径。(#847, #916)
- **Bootstrap 作为用户消息** — 将引导注入从 `experimental.chat.system.transform` 移至 `experimental.chat.messages.transform`，前置到第一条用户消息之前，而非添加一条系统消息。避免了系统消息每轮重复导致的 token 膨胀 (#750)，并修复了与 Qwen 及其他在多个系统消息上出错的模型的兼容性问题 (#894)。

## v5.0.6 (2026-03-24)

### 内联自我审查取代子智能体审查循环

子智能体审查循环（调度新的智能体来审查计划/规格）将执行时间翻倍（约 25 分钟开销），却没有可衡量地提升计划质量。跨 5 个版本的回归测试，每个版本 5 次试验，显示无论审查循环是否运行，质量评分均相同。

- **brainstorming** — 将 Spec Review Loop（子智能体调度 + 最多 3 次迭代）替换为内联 Spec Self-Review 检查清单：占位符扫描、内部一致性、范围检查、歧义检查
- **writing-plans** — 将 Plan Review Loop（子智能体调度 + 最多 3 次迭代）替换为内联 Self-Review 检查清单：规格覆盖、占位符扫描、类型一致性
- **writing-plans** — 新增显式的"No Placeholders"部分，定义计划失败条件（TBD、模糊描述、未定义引用、"类似 Task N"）
- 自我审查在每次运行中约 30 秒内捕获 3-5 个真实 bug，而子智能体方式需要约 25 分钟，缺陷检测率相当

### Brainstorm 服务器

- **会话目录重构** — brainstorm 服务器的会话目录现在包含两个并列子目录：`content/`（提供给浏览器的 HTML 文件）和 `state/`（事件、服务器信息、pid、日志）。此前，服务器状态和用户交互数据与提供给浏览器的内容存储在一起，导致它们可通过 HTTP 访问。`screen_dir` 和 `state_dir` 路径均包含在 server-started JSON 中。(由 吉田仁 报告)

### 缺陷修复

- **Owner-PID 生命周期修复** — brainstorm 服务器的 owner-PID 监控有两个 bug 导致在 60 秒内错误关闭：(1) 跨用户 PID（Tailscale SSH 等）的 EPERM 被当作"进程已死"处理，(2) 在 WSL 上，祖父进程 PID 解析为在第一次生命周期检查前就已退出的短暂子进程。修复方法：将 EPERM 视为"存活"，并在启动时验证 owner PID——如果它已经死亡，则禁用监控，服务器依赖 30 分钟空闲超时。这也移除了 `start-server.sh` 中 Windows/MSYS2 特定的特殊处理，因为服务器现在已通用地处理此问题。(#879)
- **writing-skills** — 纠正了 SKILL.md frontmatter 仅支持"两个字段"的错误说法；现在表述为"两个必填字段"，并提供 agentskills.io 规范的链接以了解所有支持的字段 (PR #882 by @arittr)

### Codex App 兼容性

- **codex-tools** — 新增命名智能体调度映射，记录如何将 Claude Code 的命名智能体类型翻译为 Codex 使用 worker 角色的 `spawn_agent` (PR #647 by @arittr)
- **codex-tools** — 为 worktree 感知技能新增了环境检测和 Codex App 完成部分 (by @arittr)
- **设计规格** — 新增 Codex App 兼容性设计规格 (PRI-823)，涵盖只读环境检测、worktree 安全技能行为及沙箱回退模式 (by @arittr)

## v5.0.5 (2026-03-17)

### 缺陷修复

- **Brainstorm 服务器 ESM 修复** — 将 `server.js` 重命名为 `server.cjs`，使 brainstorming 服务器在 Node.js 22+ 上正常启动，解决了根目录 `package.json` 中 `"type": "module"` 导致 `require()` 失败的问题。(PR #784 by @sarbojitrana, 修复 #774, #780, #783)
- **Windows 上 Brainstorm owner-PID** — 在 Windows/MSYS2 上跳过 PID 生命周期监控，因为 PID 命名空间对 Node.js 不可见，防止服务器在 60 秒后自终止。(#770, 文档来自 PR #768 by @lucasyhzlu-debug)
- **stop-server.sh 可靠性** — 在报告成功前验证服务器进程确实已终止。SIGTERM + 2s 等待 + SIGKILL 回退。(#723)

### 变更

- **执行交接** — 恢复用户在计划编写后选择子智能体驱动或内联执行的权利。子智能体驱动推荐使用但不再强制。

## v5.0.4 (2026-03-16)

### 审查循环优化

通过消除不必要的审查轮次和收紧审查者关注点，大幅减少 token 使用量并加速规格和计划审查。

- **单次完整计划审查** — 计划审查者现在一次性审查完整计划，而非逐块审查。移除了所有与块相关的概念（`## Chunk N:` 标题、1000 行块限制、每块调度）。
- **提高阻塞问题的门槛** — 规格和计划审查者提示现在均包含"校准"部分：仅标记那些在实现过程中会导致实际问题的问题。细微措辞、风格偏好和格式小问题不应阻止批准。
- **减少最大审查迭代次数** — 规格和计划审查循环均从 5 次减至 3 次。如果审查者校准正确，3 轮已足够。
- **精简审查者检查清单** — 规格审查者从 7 个类别缩减至 5 个；计划审查者从 7 个缩减至 4 个。移除了格式焦点检查（任务语法、块大小），转向关注实质内容（可构建性、规格对齐）。

### OpenCode

- **一行安装插件** — OpenCode 插件现在通过 `config` hook 自动注册技能目录。无需符号链接或 `skills.paths` 配置。安装只需在 `opencode.json` 中添加一行。(PR #753)
- **新增 `package.json`** — 使 OpenCode 可以将 superpowers 作为 npm 包从 git 安装。

### 缺陷修复

- **验证服务器确实已停止** — `stop-server.sh` 现在在报告成功前确认进程已终止。SIGTERM + 2s 等待 + SIGKILL 回退。如果进程存活则报告失败。(PR #751)
- **通用智能体语言** — brainstorm 伴侣等待页面现在说"the agent"而非"Claude"。

## v5.0.3 (2026-03-15)

### Cursor 支持

- **Cursor hooks** — 新增 `hooks/hooks-cursor.json`，采用 Cursor 的驼峰命名格式（`sessionStart`、`version: 1`），并更新 `.cursor-plugin/plugin.json` 以引用它。修复了 `session-start` 中的平台检测，优先检查 `CURSOR_PLUGIN_ROOT`（Cursor 可能也会设置 `CLAUDE_PLUGIN_ROOT`）。(基于 PR #709)

### 缺陷修复

- **停止在 `--resume` 时触发 SessionStart hook** — 启动 hook 之前会在恢复的会话上重新注入上下文，而这些会话的对话历史中已包含上下文。hook 现在仅在 `startup`、`clear` 和 `compact` 时触发。
- **Bash 5.3+ hook 挂起** — 在 `hooks/session-start` 中将 heredoc（`cat <<EOF`）替换为 `printf`。修复了在 macOS 上使用 Homebrew bash 5.3+ 时，因 bash 在 heredoc 中处理大变量展开的回归问题导致的无限挂起。(#572, #571)
- **POSIX 安全 hook 脚本** — 在 `hooks/session-start` 中将 `${BASH_SOURCE[0]:-$0}` 替换为 `$0`。修复了 Ubuntu/Debian 上 `/bin/sh` 为 dash 时的"Bad substitution"错误。(#553)
- **可移植 shebang** — 在所有 shell 脚本中将 `#!/bin/bash` 替换为 `#!/usr/bin/env bash`。修复了在 NixOS、FreeBSD 和使用 Homebrew bash 的 macOS 上 `/bin/bash` 过时或缺失时的执行问题。(#700)
- **Windows 上的 Brainstorm 服务器** — 自动检测 Windows/Git Bash（`OSTYPE=msys*`、`MSYSTEM`）并切换到前台模式，修复了因 `nohup`/`disown` 进程回收导致的静默服务器故障。(#737)
- **Codex 文档修复** — 在 Codex 文档中将已弃用的 `collab` 标志替换为 `multi_agent`。(PR #749)

## v5.0.2 (2026-03-11)

### 零依赖 Brainstorm 服务器

**移除所有内置的 node_modules — server.js 现已完全自包含**

- 用零依赖的 Node.js 服务器替换了 Express/Chokidar/WebSocket 依赖，使用内置的 `http`、`fs` 和 `crypto` 模块
- 移除了约 1,200 行内置的 `node_modules/`、`package.json` 和 `package-lock.json`
- 自定义 WebSocket 协议实现（RFC 6455 帧、ping/pong、正确的关闭握手）
- 原生 `fs.watch()` 文件监控取代 Chokidar
- 完整测试套件：HTTP 服务、WebSocket 协议、文件监控和集成测试

### Brainstorm 服务器可靠性

- **空闲 30 分钟后自动退出** — 当无客户端连接时服务器关闭，防止孤立进程
- **Owner 进程跟踪** — 服务器监控父 harness PID，当所属会话终止时退出
- **活跃性检查** — 技能在重用现有实例前验证服务器是否响应
- **编码修复** — 在提供的 HTML 页面上添加正确的 `<meta charset="utf-8">`

### 子智能体上下文隔离

- 所有委托技能（brainstorming、dispatching-parallel-agents、requesting-code-review、subagent-driven-development、writing-plans）现在均包含上下文隔离原则
- 子智能体仅接收其需要的上下文，防止上下文窗口污染

## v5.0.1 (2026-03-10)

### Agentskills 合规

**Brainstorm-server 移入技能目录**

- 将 `lib/brainstorm-server/` 移至 `skills/brainstorming/scripts/`，符合 [agentskills.io](https://agentskills.io) 规范
- 所有 `${CLAUDE_PLUGIN_ROOT}/lib/brainstorm-server/` 引用替换为相对路径 `scripts/`
- 技能现已完全跨平台可移植——无需平台特定环境变量来定位脚本
- `lib/` 目录已移除（这是其最后剩余的内容）

### 新功能

**Gemini CLI 扩展**

- 通过仓库根目录的 `gemini-extension.json` 和 `GEMINI.md` 提供原生 Gemini CLI 扩展支持
- `GEMINI.md` 在会话开始时 @import `using-superpowers` 技能和工具映射表
- Gemini CLI 工具映射参考（`skills/using-superpowers/references/gemini-tools.md`）— 将 Claude Code 工具名称（Read、Write、Edit、Bash 等）翻译为 Gemini CLI 对应项（read_file、write_file、replace 等）
- 记录 Gemini CLI 限制：无子智能体支持，技能回退到 `executing-plans`
- 扩展根目录位于仓库根目录以实现跨平台兼容性（避免 Windows 符号链接问题）
- 安装说明已添加到 README

### 改进

**多平台 brainstorm 服务器启动**

- visual-companion.md 中的各平台启动说明：Claude Code（默认模式）、Codex（通过 `CODEX_CI` 自动前台）、Gemini CLI（`--foreground` 配合 `is_background`），以及针对其他环境的回退方案
- 服务器现在将启动 JSON 写入 `$SCREEN_DIR/.server-info`，使智能体即使在后台执行中 stdout 被隐藏也能找到 URL 和端口

**Brainstorm 服务器依赖内置**

- `node_modules` 已内置到仓库中，使 brainstorm 服务器在全新插件安装后无需运行时 `npm` 即可立即工作
- 从内置依赖中移除了 `fsevents`（仅 macOS 原生二进制文件；chokidar 在没有它时能优雅回退）
- 如果 `node_modules` 缺失，回退到通过 `npm install` 自动安装

**OpenCode 工具映射修复**

- `TodoWrite` → `todowrite`（此前错误映射到 `update_plan`）；已针对 OpenCode 源代码验证

### 缺陷修复

**Windows/Linux：单引号破坏 SessionStart hook** (#577, #529, #644, PR #585)

- `hooks.json` 中 `${CLAUDE_PLUGIN_ROOT}` 周围的单引号在 Windows 上失败（cmd.exe 不将单引号识别为路径分隔符），在 Linux 上也失败（单引号阻止变量展开）
- 修复：将单引号替换为转义双引号——在 macOS bash、Windows cmd.exe、Windows Git Bash 和 Linux 上均正常工作，无论路径中是否含空格
- 已在 Windows 11 (NT 10.0.26200.0) 上使用 Claude Code 2.1.72 和 Git for Windows 验证

**Brainstorming 规格审查循环被跳过** (#677)

- 规格审查循环（调度 spec-document-reviewer 子智能体，迭代直到批准）存在于"设计之后"部分的文字说明中，但在检查清单和流程图中缺失
- 由于智能体对图表和检查清单的遵循度高于纯文本，规格审查步骤被完全跳过
- 在检查清单中添加了步骤 7（规格审查循环），并在 dot 图中添加了对应节点
- 已使用 `claude --plugin-dir` 和 `claude-session-driver` 测试：worker 现在正确调度审查者

**Cursor 安装命令** (PR #676)

- 修复了 README 中的 Cursor 安装命令：`/plugin-add` → `/add-plugin`（经 Cursor 2.5 发布公告确认）

**Brainstorming 中的用户审查关卡** (#565)

- 在规格完成和 writing-plans 交接之间添加了显式的用户审查步骤
- 用户必须在实现计划开始前批准规格
- 检查清单、流程和文字说明均已更新，包含新关卡

**Session-start hook 每个平台仅发出一次上下文**

- hook 现在检测是在 Claude Code 还是其他平台中运行
- 对 Claude Code 发出 `hookSpecificOutput`，对其他平台发出 `additional_context`——防止双重上下文注入

**Token 分析脚本的 linting 修复**

- `tests/claude-code/analyze-token-usage.py` 中 `except:` → `except Exception:`

### 维护

**移除死代码**

- 删除了 `lib/skills-core.js` 及其测试（`tests/opencode/test-skills-core.js`）——自 2026 年 2 月起未使用
- 从 `tests/opencode/test-plugin-loading.sh` 中移除了 skills-core 存在性检查

### 社区贡献

- @karuturi — Claude Code 官方市场安装说明 (PR #610)
- @mvanhorn — session-start hook 双重发出修复，OpenCode 工具映射修复
- @daniel-graham — bare except 的 linting 修复
- PR #585 作者 — Windows/Linux hooks 引号修复

---

## v5.0.0 (2026-03-09)

### 破坏性变更

**规格和计划目录重构**

- 规格（brainstorming 输出）现在保存到 `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
- 计划（writing-plans 输出）现在保存到 `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md`
- 用户对规格/计划位置的偏好覆盖这些默认值
- 所有内部技能引用、测试文件和示例路径已更新以匹配
- 迁移：如有需要，将现有文件从 `docs/plans/` 移动到新位置

**在具备子智能体能力的 harness 上 subagent-driven-development 强制使用**

Writing-plans 不再提供子智能体驱动和 executing-plans 之间的选择。在支持子智能体的 harness（Claude Code、Codex）上，subagent-driven-development 是必需的。Executing-plans 保留给不具备子智能体能力的 harness，现在会告知用户 Superpowers 在支持子智能体的平台上效果更好。

**Executing-plans 不再分批**

移除了"执行 3 个任务然后停下来审查"的模式。计划现在连续执行，仅在遇到阻塞时才停止。

**斜杠命令已弃用**

`/brainstorm`、`/write-plan` 和 `/execute-plan` 现在显示弃用通知，引导用户使用相应技能。这些命令将在下一个主版本中移除。

### 新功能

**可视化 brainstorming 伴侣**

可选的基于浏览器的 brainstorming 会话伴侣。当话题可从可视化中受益时，brainstorming 技能会提示在浏览器窗口中与终端对话并行展示原型、图表、对比等内容。

- `lib/brainstorm-server/` — WebSocket 服务器，包含浏览器辅助库、会话管理脚本和深色/浅色主题框架模板（"Superpowers Brainstorming"，附带 GitHub 链接）
- `skills/brainstorming/visual-companion.md` — 服务器工作流、屏幕创作和反馈收集的渐进式披露指南
- Brainstorming 技能在其流程中添加了可视化伴侣决策点：在探索项目上下文后，技能评估即将讨论的问题是否涉及可视化内容，并在自己的消息中提供伴侣选项
- 每个问题的决策：即使接受了伴侣，每个问题都会评估浏览器还是终端更合适
- `tests/brainstorm-server/` 中的集成测试

**文档审查系统**

使用子智能体调度的规格和计划文档自动审查循环：

- `skills/brainstorming/spec-document-reviewer-prompt.md` — 审查者检查完整性、一致性、架构和 YAGNI
- `skills/writing-plans/plan-document-reviewer-prompt.md` — 审查者检查规格对齐、任务分解、文件结构和文件大小
- Brainstorming 在撰写设计文档后调度规格审查者
- Writing-plans 在每个部分之后包含基于块的计划审查循环
- 审查循环重复直到批准，或在 5 次迭代后升级
- `tests/claude-code/test-document-review-system.sh` 中的端到端测试
- `docs/superpowers/` 中的设计规格和实现计划

**贯穿技能管线的架构指导**

在 brainstorming、writing-plans 和 subagent-driven-development 中添加了面向隔离的设计和文件大小意识指导：

- **Brainstorming** — 新增部分："Design for isolation and clarity"（清晰的边界、定义良好的接口、可独立测试的单元）和"Working in existing codebases"（遵循现有模式、仅做针对性改进）
- **Writing-plans** — 新增"File Structure"部分：在定义任务之前规划文件和职责。新增"Scope Check"后盾：捕获应在 brainstorming 阶段分解的多子系统规格
- **SDD 实现者** — 新增"Code Organization"部分（遵循计划的文件结构，报告对文件膨胀的担忧）和"When You're in Over Your Head"升级指导
- **SDD 代码质量审查者** — 现在检查架构、单元分解、计划一致性和文件膨胀
- **规格/计划审查者** — 审查标准中添加了架构和文件大小
- **范围评估** — Brainstorming 现在评估项目是否太大而不适合单个规格。多子系统请求被及早标记并分解为子项目，每个子项目有自己的规格 → 计划 → 实现循环

**Subagent-driven development 改进**

- **模型选择** — 按任务类型选择模型能力的指导：机械实现用廉价模型、集成用标准模型、架构和审查用高能力模型
- **实现者状态协议** — 子智能体现在报告 DONE、DONE_WITH_CONCERNS、BLOCKED 或 NEEDS_CONTEXT。控制器对每种状态适当处理：提供更多上下文重新调度、升级模型能力、拆分任务或升级给人类

### 改进

**指令优先级层次**

在 using-superpowers 中添加了显式的优先级排序：

1. 用户的显式指令（CLAUDE.md、AGENTS.md、直接请求）——最高优先级
2. Superpowers 技能——覆盖默认系统行为
3. 默认系统提示——最低优先级

如果 CLAUDE.md 或 AGENTS.md 说"不要用 TDD"，而某个技能说"始终用 TDD"，以用户的指令为准。

**SUBAGENT-STOP 关卡**

在 using-superpowers 中添加了 `<SUBAGENT-STOP>` 块。为特定任务调度的子智能体现在跳过该技能，而非激活 1% 规则并调用完整技能工作流。

**多平台改进**

- Codex 工具映射移至渐进式披露参考文件（`references/codex-tools.md`）
- 新增平台适配指针，使非 Claude Code 平台可找到工具等价项
- 计划页眉现在面向"智能体工作者"而非特指"Claude"
- Collab 功能要求在 `docs/README.codex.md` 中记录

**Writing-plans 模板更新**

- 计划步骤现在使用复选框语法（`- [ ] **Step N:**`）以便跟踪进度
- 计划页眉同时引用 subagent-driven-development 和 executing-plans，并带有平台感知路由

---

## v4.3.1 (2026-02-21)

### 新增

**Cursor 支持**

Superpowers 现已兼容 Cursor 的插件系统。包含 `.cursor-plugin/plugin.json` 清单和 README 中 Cursor 特定的安装说明。SessionStart hook 输出现在除现有的 `hookSpecificOutput.additionalContext` 外，还包含 `additional_context` 字段，以兼容 Cursor hook。

### 修复

**Windows：恢复 polyglot 包装器以实现可靠的 hook 执行 (#518, #504, #491, #487, #466, #440)**

Claude Code 在 Windows 上的 `.sh` 自动检测会在 hook 命令前添加 `bash`，导致执行中断。修复方案：

- 将 `session-start.sh` 重命名为 `session-start`（无扩展名），使自动检测不干扰
- 恢复 `run-hook.cmd` polyglot 包装器，具有多位置 bash 发现（标准 Git for Windows 路径，然后 PATH 回退）
- 如果找不到 bash 则静默退出而非报错
- 在 Unix 上，包装器通过 `exec bash` 直接运行脚本
- 使用 POSIX 安全的 `dirname "$0"` 路径解析（在 dash/sh 上工作，不仅 bash）

这修复了 Windows 上路径含空格、缺少 WSL、MSYS 上 `set -euo pipefail` 脆弱性以及反斜杠损坏导致的 SessionStart 失败。

## v4.3.0 (2026-02-12)

此修复应大幅提升 superpowers 技能合规性，并应减少 Claude 无意中进入其原生计划模式的可能性。

### 变更

**Brainstorming 技能现在强制执行其工作流，而非描述它**

模型之前会跳过设计阶段直接跳转到实现技能（如 frontend-design），或将整个 brainstorming 流程压缩为单个文本块。该技能现在使用硬关卡、强制检查清单和 graphviz 流程图来强制执行合规：

- `<HARD-GATE>`：在呈现设计并获得用户批准前，不得使用实现技能、代码或脚手架
- 显式检查清单（6 项），必须作为任务创建并按顺序完成
- Graphviz 流程图，以 `writing-plans` 为唯一有效的终态
- 反模式标注："这太简单了不需要设计"——正是模型用来跳过流程的合理化借口
- 设计部分大小基于部分复杂性而非项目复杂性

**Using-superpowers 工作流图截获 EnterPlanMode**

在技能流程图中添加了 `EnterPlanMode` 截获。当模型即将进入 Claude 的原生计划模式时，它检查 brainstorming 是否已发生，并通过 brainstorming 技能路由。计划模式永远不会被进入。

### 修复

**SessionStart hook 现在同步运行**

在 hooks.json 中将 `async: true` 改为 `async: false`。当异步时，hook 可能在模型的第一个回合前未能完成，意味着 using-superpowers 指令在第一条消息时不处于上下文中。

## v4.2.0 (2026-02-05)

### 破坏性变更

**Codex：用原生技能发现替换 Bootstrap CLI**

`superpowers-codex` bootstrap CLI、Windows `.cmd` 包装器及相关的 bootstrap 内容文件已被移除。Codex 现在通过 `~/.agents/skills/superpowers/` 符号链接使用原生技能发现，因而不需要旧的 `use_skill`/`find_skills` CLI 工具。

安装现在只需 clone + symlink（记录在 INSTALL.md 中）。无需 Node.js 依赖。旧路径 `~/.codex/skills/` 已弃用。

### 修复

**Windows：修复 Claude Code 2.1.x hook 执行 (#331)**

Claude Code 2.1.x 更改了 Windows 上 hook 的执行方式：现在它自动检测命令中的 `.sh` 文件并添加 `bash` 前缀。这破坏了 polyglot 包装器模式，因为 `bash "run-hook.cmd" session-start.sh` 尝试将 .cmd 文件作为 bash 脚本执行。

修复：hooks.json 现在直接调用 session-start.sh。Claude Code 2.1.x 自动处理 bash 调用。同时添加了 .gitattributes 以强制 shell 脚本使用 LF 行尾（修复 Windows checkout 时的 CRLF 问题）。

**Windows：SessionStart hook 异步运行以防止终端冻结 (#404, #413, #414, #419)**

同步 SessionStart hook 在 Windows 上阻止了 TUI 进入 raw 模式，冻结所有键盘输入。异步运行 hook 防止了冻结，同时仍注入 superpowers 上下文。

**Windows：修复 O(n^2) 的 `escape_for_json` 性能问题**

使用 `${input:$i:1}` 的逐字符循环在 bash 中因 substring 复制开销为 O(n^2)。在 Windows Git Bash 上这需要 60 多秒。替换为 bash 参数替换（`${s//old/new}`），每次模式作为单次 C 级遍历运行——macOS 上快 7 倍，Windows 上显著更快。

**Codex：修复 Windows/PowerShell 调用 (#285, #243)**

- Windows 不识别 shebang，因此直接调用无扩展名的 `superpowers-codex` 脚本会触发"打开方式"对话框。所有调用现在以 `node` 为前缀。
- 修复了 `~/` 路径展开——PowerShell 在将 `~` 作为参数传递给 `node` 时不展开它。改为 `$HOME`，在 bash 和 PowerShell 中均可正确展开。

**Codex：修复安装程序中的路径解析**

使用 `fileURLToPath()` 替代手动的 URL pathname 解析，以在所有平台上正确处理含空格和特殊字符的路径。

**Codex：修复 writing-skills 中过时的技能路径**

将 `~/.codex/skills/` 引用（已弃用）更新为 `~/.agents/skills/` 以支持原生发现。

### 改进

**实现前现在需要 worktree 隔离**

将 `using-git-worktrees` 设为 `subagent-driven-development` 和 `executing-plans` 的必需技能。实现工作流现在明确要求在开始工作前设置隔离的 worktree，防止意外直接在 main 上工作。

**主分支保护软化——要求明确同意**

技能不再完全禁止在 main 分支上工作，而是允许在用户明确同意的情况下进行。更加灵活，同时仍确保用户了解其影响。

**简化安装验证**

从验证步骤中移除了 `/help` 命令检查和特定斜杠命令列表。技能主要通过描述你想做的事来调用，而非通过运行特定命令。

**Codex：在引导中明确子智能体工具映射**

改进了 Codex 工具如何映射到 Claude Code 对应项以用于子智能体工作流的文档。

### 测试

- 为 subagent-driven-development 新增 worktree 要求测试
- 新增 main 分支红旗警告测试
- 修复技能识别测试断言中的大小写敏感问题

---

## v4.1.1 (2026-01-23)

### 修复

**OpenCode：按官方文档标准化为 `plugins/` 目录 (#343)**

OpenCode 的官方文档使用 `~/.config/opencode/plugins/`（复数）。我们的文档此前使用 `plugin/`（单数）。虽然 OpenCode 接受两种形式，但我们已按官方惯例标准化以避免混淆。

变更：
- 在仓库结构中将 `.opencode/plugin/` 重命名为 `.opencode/plugins/`
- 跨所有平台更新了所有安装文档（INSTALL.md、README.opencode.md）
- 更新测试脚本以匹配

**OpenCode：修复符号链接说明 (#339, #342)**

- 在 `ln -s` 前添加显式的 `rm`（修复重新安装时"文件已存在"的错误）
- 添加了 INSTALL.md 中缺失的技能符号链接步骤
- 从已弃用的 `use_skill`/`find_skills` 更新为原生 `skill` 工具引用

---

## v4.1.0 (2026-01-23)

### 破坏性变更

**OpenCode：切换到原生技能系统**

Superpowers for OpenCode 现在使用 OpenCode 的原生 `skill` 工具，而非自定义的 `use_skill`/`find_skills` 工具。这是一个更清晰的集成，与 OpenCode 内置的技能发现配合使用。

**需要迁移：** 技能必须符号链接到 `~/.config/opencode/skills/superpowers/`（见更新后的安装文档）。

### 修复

**OpenCode：修复会话启动时智能体重置 (#226)**

之前使用 `session.prompt({ noReply: true })` 的引导注入方法导致 OpenCode 在第一条消息时将选定智能体重置为"build"。现在使用 `experimental.chat.system.transform` hook，直接修改系统提示而不产生副作用。

**OpenCode：修复 Windows 安装 (#232)**

- 移除了对 `skills-core.js` 的依赖（消除文件被复制而非符号链接时损坏的相对导入）
- 为 cmd.exe、PowerShell 和 Git Bash 添加了全面的 Windows 安装文档
- 为每个平台记录了正确的 symlink vs junction 用法

**Claude Code：修复 Claude Code 2.1.x 的 Windows hook 执行**

Claude Code 2.1.x 更改了 Windows 上 hook 的执行方式：现在它自动检测命令中的 `.sh` 文件并添加 `bash` 前缀。这破坏了 polyglot 包装器模式，因为 `bash "run-hook.cmd" session-start.sh` 尝试将 .cmd 文件作为 bash 脚本执行。

修复：hooks.json 现在直接调用 session-start.sh。Claude Code 2.1.x 自动处理 bash 调用。同时添加了 .gitattributes 以强制 shell 脚本使用 LF 行尾（修复 Windows checkout 时的 CRLF 问题）。

---

## v4.0.3 (2025-12-26)

### 改进

**强化 using-superpowers 技能以响应显式技能请求**

解决了一个失败模式：即使用户按名称显式请求了技能（例如"subagent-driven-development, please"），Claude 也会跳过调用该技能。Claude 会想"我知道那是什么意思"然后直接开始工作，而不是加载技能。

变更：
- 将"The Rule"更新为"Invoke relevant or requested skills"而非"Check for skills"——强调主动调用而非被动检查
- 添加了"BEFORE any response or action"——原始措辞仅提到"response"，但 Claude 有时会不先回应就采取行动
- 添加了安心说明：调用错误的技能也没关系——减少犹豫
- 新增红旗警告："I know what that means" → 知道概念不等于使用技能

**新增显式技能请求测试**

`tests/explicit-skill-requests/` 中的新测试套件，验证 Claude 在用户按名称请求技能时是否正确调用它们。包含单轮和多轮测试场景。

## v4.0.2 (2025-12-23)

### 修复

**斜杠命令现在仅限用户使用**

为所有三个斜杠命令（`/brainstorm`、`/execute-plan`、`/write-plan`）添加了 `disable-model-invocation: true`。Claude 不能再通过 Skill 工具调用这些命令——它们仅限于用户手动调用。

底层技能（`superpowers:brainstorming`、`superpowers:executing-plans`、`superpowers:writing-plans`）仍然可供 Claude 自主调用。此更改防止了 Claude 调用一个仅仅重定向到某个技能的命令时产生的混乱。

## v4.0.1 (2025-12-23)

### 修复

**明确如何在 Claude Code 中访问技能**

修复了一个令人困惑的模式：Claude 会通过 Skill 工具调用某个技能，然后又尝试单独 Read 该技能文件。`using-superpowers` 技能现在明确说明 Skill 工具直接加载技能内容——无需读取文件。

- 在 `using-superpowers` 中新增"How to Access Skills"部分
- 在指令中将"read the skill"改为"invoke the skill"
- 更新斜杠命令使用完全限定的技能名称（例如 `superpowers:brainstorming`）

**在 receiving-code-review 中添加 GitHub 线程回复指导** (h/t @ralphbean)

添加了一条关于在原始线程中回复内联审查评论、而非作为顶级 PR 评论的说明。

**在 writing-skills 中添加自动化优先于文档化的指导** (h/t @EthanJStark)

添加了指导：机械性约束应被自动化，而非文档化——将技能留给需要判断的决策。

## v4.0.0 (2025-12-17)

### 新功能

**Subagent-driven-development 中的两阶段代码审查**

子智能体工作流现在在每个任务后使用两个独立的审查阶段：

1. **规格合规性审查** — 持怀疑态度的审查者验证实现是否完全匹配规格。既捕获缺失的需求，也捕获过度构建。不信任实现者的报告——阅读实际代码。

2. **代码质量审查** — 仅在规格合规性审查通过后运行。审查代码质量、测试覆盖率和可维护性。

这捕获了常见的失败模式：代码写得好但与需求不符。审查是循环的，而非一次性的：如果审查者发现问题，实现者修复它们，然后审查者再次检查。

其他子智能体工作流改进：
- 控制器向 worker 提供完整任务文本（而非文件引用）
- Worker 可在工作前和工作期间提出澄清问题
- 报告完成前的自我审查检查清单
- 计划在开始时一次性读取，提取到 TodoWrite

`skills/subagent-driven-development/` 中的新提示模板：
- `implementer-prompt.md` — 包含自我审查检查清单，鼓励提问
- `spec-reviewer-prompt.md` — 针对需求的持怀疑态度验证
- `code-quality-reviewer-prompt.md` — 标准代码审查

**调试技术与工具整合**

`systematic-debugging` 现在捆绑了支持性技术和工具：
- `root-cause-tracing.md` — 通过调用栈向后追溯 bug
- `defense-in-depth.md` — 在多个层次添加验证
- `condition-based-waiting.md` — 用条件轮询替换任意超时
- `find-polluter.sh` — 二分查找脚本，找出哪个测试产生污染
- `condition-based-waiting-example.ts` — 来自真实调试会话的完整实现

**测试反模式参考**

`test-driven-development` 现在包含 `testing-anti-patterns.md`，涵盖：
- 测试 mock 行为而非真实行为
- 向生产类添加仅测试使用的方法
- 在不理解依赖的情况下进行 mock
- 隐藏结构假设的不完整 mock

**技能测试基础设施**

用于验证技能行为的三个新测试框架：

`tests/skill-triggering/` — 验证技能从自然提示触发而无需显式命名。测试 6 个技能以确保仅描述就足够。

`tests/claude-code/` — 使用 `claude -p` 进行无头测试的集成测试。通过会话转录（JSONL）分析验证技能使用。包含用于成本跟踪的 `analyze-token-usage.py`。

`tests/subagent-driven-dev/` — 通过两个完整测试项目进行端到端工作流验证：
- `go-fractals/` — 用于 Sierpinski/Mandelbrot 的 CLI 工具（10 个任务）
- `svelte-todo/` — 使用 localStorage 和 Playwright 的 CRUD 应用（12 个任务）

### 主要变更

**DOT 流程图作为可执行规格**

使用 DOT/GraphViz 流程图重写了关键技能，将其作为权威的流程定义。文字描述成为支持性内容。

**描述陷阱**（记录在 `writing-skills` 中）：发现当描述包含工作流摘要时，技能描述会覆盖流程图内容。Claude 遵循简短描述，而不阅读详细流程图。修复：描述必须仅用于触发（"Use when X"），不包含流程细节。

**Using-superpowers 中的技能优先级**

当多个技能适用时，流程技能（brainstorming、debugging）现在明确排在实现技能之前。"Build X"先触发 brainstorming，然后是领域技能。

**Brainstorming 触发强化**

描述改为命令式："在进行任何创造性工作之前——创建功能、构建组件、添加功能或修改行为——你必须使用此技能。"

### 破坏性变更

**技能整合** — 六个独立技能合并：
- `root-cause-tracing`、`defense-in-depth`、`condition-based-waiting` → 合并到 `systematic-debugging/`
- `testing-skills-with-subagents` → 合并到 `writing-skills/`
- `testing-anti-patterns` → 合并到 `test-driven-development/`
- `sharing-skills` 已移除（已过时）

### 其他改进

- **render-graphs.js** — 从技能中提取 DOT 图并渲染为 SVG 的工具
- **using-superpowers 中的 Rationalizations 表格** — 可扫描格式，包含新条目："I need more context first"、"Let me explore first"、"This feels productive"
- **docs/testing.md** — 使用 Claude Code 集成测试来测试技能的指南

---

## v3.6.2 (2025-12-03)

### 修复

- **Linux 兼容性**：修复 polyglot hook 包装器（`run-hook.cmd`）使用 POSIX 兼容语法
  - 在第 16 行将 bash 特定的 `${BASH_SOURCE[0]:-$0}` 替换为标准 `$0`
  - 解决了 Ubuntu/Debian 系统上 `/bin/sh` 为 dash 时的"Bad substitution"错误
  - 修复 #141

---

## v3.5.1 (2025-11-24)

### 变更

- **OpenCode Bootstrap 重构**：从 `chat.message` hook 切换到 `session.created` 事件进行引导注入
  - 引导现在在会话创建时通过 `session.prompt()` 注入，带有 `noReply: true`
  - 明确告知模型 using-superpowers 已加载，防止冗余技能加载
  - 将引导内容生成合并到共享的 `getBootstrapContent()` 辅助函数中
  - 更简洁的单一实现方法（移除了回退模式）

---

## v3.5.0 (2025-11-23)

### 新增

- **OpenCode 支持**：面向 OpenCode.ai 的原生 JavaScript 插件
  - 自定义工具：`use_skill` 和 `find_skills`
  - 消息插入模式，使技能在上下文压缩后持久保留
  - 通过 chat.message hook 自动注入上下文
  - 在 session.compacted 事件上自动重新注入
  - 三层技能优先级：项目 > 个人 > superpowers
  - 项目本地技能支持（`.opencode/skills/`）
  - 共享核心模块（`lib/skills-core.js`）用于与 Codex 共享代码
  - 具有适当隔离的自动化测试套件（`tests/opencode/`）
  - 平台特定文档（`docs/README.opencode.md`、`docs/README.codex.md`）

### 变更

- **重构 Codex 实现**：现在使用共享的 `lib/skills-core.js` ES 模块
  - 消除了 Codex 和 OpenCode 之间的代码重复
  - 技能发现和解析的单一事实来源
  - Codex 通过 Node.js 互操作成功加载 ES 模块

- **改进文档**：重写 README 以清晰解释问题/解决方案
  - 移除了重复部分和冲突信息
  - 添加了完整工作流描述（brainstorm → plan → execute → finish）
  - 简化了平台安装说明
  - 强调技能检查协议而非自动激活声明

---

## v3.4.1 (2025-10-31)

### 改进

- 优化 superpowers 引导程序以消除冗余技能执行。`using-superpowers` 技能内容现在直接在会话上下文中提供，明确指导仅对其他技能使用 Skill 工具。这减少了开销，并防止了智能体即使在已有来自会话启动的内容时还手动执行 `using-superpowers` 的令人困惑的循环。

## v3.4.0 (2025-10-30)

### 改进

- 简化 `brainstorming` 技能，回归原始对话式愿景。移除了带有正式检查清单的重量级 6 阶段流程，改为自然对话：逐个提问，然后以 200-300 词的分段呈现设计并进行验证。保留了文档和实现交接功能。

## v3.3.1 (2025-10-28)

### 改进

- 更新 `brainstorming` 技能，要求提问前先自主探索，鼓励基于建议的决策，防止智能体将优先级排序委托回给人类。
- 遵循 Strunk 的"Elements of Style"原则（省略不必要的词、将否定形式转为肯定形式、改进并列结构）对 `brainstorming` 技能应用了写作清晰度改进。

### 缺陷修复

- 澄清了 `writing-skills` 指导，使其指向正确的智能体特定个人技能目录（Claude Code 使用 `~/.claude/skills`，Codex 使用 `~/.codex/skills`）。

## v3.3.0 (2025-10-28)

### 新功能

**实验性 Codex 支持**
- 添加了统一的 `superpowers-codex` 脚本，包含 bootstrap/use-skill/find-skills 命令
- 跨平台 Node.js 实现（可在 Windows、macOS、Linux 上运行）
- 命名空间技能：superpowers 技能使用 `superpowers:skill-name`，个人技能使用 `skill-name`
- 当名称匹配时，个人技能覆盖 superpowers 技能
- 清晰的技能显示：显示名称/描述而不显示原始 frontmatter
- 有用的上下文：为每个技能显示支持文件目录
- Codex 的工具映射：TodoWrite→update_plan、子智能体→手动回退等
- 与最小 AGENTS.md 的引导集成以实现自动启动
- 针对 Codex 的完整安装指南和引导说明

**与 Claude Code 集成的主要区别：**
- 单一统一脚本而非独立工具
- 针对 Codex 特定等价项的工具替换系统
- 简化的子智能体处理（手动工作而非委托）
- 更新的术语："Superpowers skills"而非"Core skills"

### 新增文件
- `.codex/INSTALL.md` — Codex 用户安装指南
- `.codex/superpowers-bootstrap.md` — 带 Codex 适配的引导说明
- `.codex/superpowers-codex` — 包含所有功能的统一 Node.js 可执行文件

**注意：** Codex 支持是实验性的。集成提供核心 superpowers 功能，但可能需要根据用户反馈进行改进。

## v3.2.3 (2025-10-23)

### 改进

**更新 using-superpowers 技能以使用 Skill 工具而非 Read 工具**
- 将技能调用说明从 Read 工具改为 Skill 工具
- 更新描述："using Read tool" → "using Skill tool"
- 更新步骤 3："Use the Read tool" → "Use the Skill tool to read and run"
- 更新合理化列表："Read the current version" → "Run the current version"

Skill 工具是在 Claude Code 中调用技能的正确机制。此更新将引导指令修正为引导智能体使用正确工具。

### 文件变更
- 更新：`skills/using-superpowers/SKILL.md` — 将工具引用从 Read 改为 Skill

## v3.2.2 (2025-10-21)

### 改进

**强化 using-superpowers 技能对抗智能体合理化行为**
- 添加了 EXTREMELY-IMPORTANT 块，使用绝对化语言说明强制性技能检查
  - "If even 1% chance a skill applies, you MUST read it"
  - "You do not have a choice. You cannot rationalize your way out."
- 添加了 MANDATORY FIRST RESPONSE PROTOCOL 检查清单
  - 智能体在任何回应之前必须完成的 5 步流程
  - 明确的"responding without this = failure"后果
- 添加了 Common Rationalizations 部分，包含 8 种特定的回避模式
  - "This is just a simple question" → WRONG
  - "I can check files quickly" → WRONG
  - "Let me gather information first" → WRONG
  - 以及在智能体行为中观察到的另外 5 种常见模式

这些更改解决了在智能体行为中观察到的现象：尽管有明确指令，它们仍会为绕过技能使用找借口。强硬的措辞和预先的反驳旨在使不合规更难发生。

### 文件变更
- 更新：`skills/using-superpowers/SKILL.md` — 添加了三层强制执行以防止技能跳过合理化

## v3.2.1 (2025-10-20)

### 新功能

**代码审查智能体现在包含在插件中**
- 将 `superpowers:code-reviewer` 智能体添加到插件的 `agents/` 目录
- 智能体根据计划和编码标准提供系统性代码审查
- 此前需要用户具有个人智能体配置
- 所有技能引用已更新为使用命名空间的 `superpowers:code-reviewer`
- 修复 #55

### 文件变更
- 新增：`agents/code-reviewer.md` — 包含审查检查清单和输出格式的智能体定义
- 更新：`skills/requesting-code-review/SKILL.md` — 引用改为 `superpowers:code-reviewer`
- 更新：`skills/subagent-driven-development/SKILL.md` — 引用改为 `superpowers:code-reviewer`

## v3.2.0 (2025-10-18)

### 新功能

**Brainstorming 工作流中的设计文档**
- 在 brainstorming 技能中添加了阶段 4：设计文档
- 设计文档现在在实现前写入 `docs/plans/YYYY-MM-DD-<topic>-design.md`
- 恢复了在技能转换过程中丢失的原始 brainstorming 命令的功能
- 文档在 worktree 设置和实现计划前写入
- 已使用子智能体测试以验证在时间压力下的合规性

### 破坏性变更

**技能引用命名空间标准化**
- 所有内部技能引用现在使用 `superpowers:` 命名空间前缀
- 更新格式：`superpowers:test-driven-development`（此前仅为 `test-driven-development`）
- 影响所有 REQUIRED SUB-SKILL、RECOMMENDED SUB-SKILL 和 REQUIRED BACKGROUND 引用
- 与使用 Skill 工具调用技能的方式保持一致
- 更新文件：brainstorming、executing-plans、subagent-driven-development、systematic-debugging、testing-skills-with-subagents、writing-plans、writing-skills

### 改进

**设计与实现计划命名**
- 设计文档使用 `-design.md` 后缀以防止文件名冲突
- 实现计划继续使用现有 `YYYY-MM-DD-<feature-name>.md` 格式
- 两者均存储在 `docs/plans/` 目录中，命名区分清晰

## v3.1.1 (2025-10-17)

### 缺陷修复

- **修复 README 中的命令语法** (#44) — 将所有命令引用更新为使用正确的命名空间语法（`/superpowers:brainstorm` 而非 `/brainstorm`）。插件提供的命令由 Claude Code 自动命名空间化，以避免插件之间冲突。

## v3.1.0 (2025-10-17)

### 破坏性变更

**技能名称标准化为小写**
- 所有技能 frontmatter 的 `name:` 字段现在使用小写 kebab-case，与目录名匹配
- 示例：`brainstorming`、`test-driven-development`、`using-git-worktrees`
- 所有技能公告和交叉引用已更新为小写格式
- 这确保了目录名、frontmatter 和文档之间的命名一致性

### 新功能

**增强的 brainstorming 技能**
- 添加了显示阶段、活动和工具使用的快速参考表
- 添加了可复制的用于跟踪进度的工作流检查清单
- 添加了何时重新访问早期阶段的决策流程图
- 添加了带有具体示例的全面 AskUserQuestion 工具指导
- 添加了"Question Patterns"部分，说明何时使用结构化问题 vs 开放式问题
- 将关键原则重构为可扫描表格

**Anthropic 最佳实践集成**
- 添加了 `skills/writing-skills/anthropic-best-practices.md` — Anthropic 官方技能编写指南
- 在 writing-skills 的 SKILL.md 中引用以提供全面指导
- 提供渐进式披露、工作流和评估的模式

### 改进

**技能交叉引用清晰度**
- 所有技能引用现在使用显式要求标记：
  - `**REQUIRED BACKGROUND:**` — 必须理解的先决条件
  - `**REQUIRED SUB-SKILL:**` — 工作流中必须使用的技能
  - `**Complementary skills:**` — 可选但有用的相关技能
- 移除旧路径格式（`skills/collaboration/X` → 仅 `X`）
- 使用分类关系更新集成部分（必需 vs 互补）
- 使用最佳实践更新交叉引用文档

**与 Anthropic 最佳实践对齐**
- 修复描述语法和语态（完全第三人称）
- 添加快速参考表便于扫描
- 添加 Claude 可以复制和跟踪的工作流检查清单
- 在非显而易见的决策点适当使用流程图
- 改进可扫描表格格式
- 所有技能远低于 500 行建议值

### 缺陷修复

- **重新添加缺失的命令重定向** — 恢复了在 v3.0 迁移中意外移除的 `commands/brainstorm.md` 和 `commands/write-plan.md`
- 修复 `defense-in-depth` 名称不匹配（之前为 `Defense-in-Depth-Validation`）
- 修复 `receiving-code-review` 名称不匹配（之前为 `Code-Review-Reception`）
- 修复 `commands/brainstorm.md` 中对正确技能名称的引用
- 移除对不存在的相关技能的引用

### 文档

**writing-skills 改进**
- 使用显式要求标记更新交叉引用指导
- 添加了 Anthropic 官方最佳实践的引用
- 改进了展示正确技能引用格式的示例

## v3.0.1 (2025-10-16)

### 变更

我们现在使用 Anthropic 的第一方技能系统！

## v2.0.2 (2025-10-12)

### 缺陷修复

- **修复本地技能仓库领先上游时的误报警告** — 初始化脚本在本地仓库有领先上游的提交时，错误地警告"New skills available from upstream"。该逻辑现在正确区分三种 git 状态：本地落后（应更新）、本地领先（不警告）和分叉（应警告）。

## v2.0.1 (2025-10-12)

### 缺陷修复

- **修复插件上下文中的 session-start hook 执行** (#8, PR #9) — hook 静默失败，出现"Plugin hook error"，阻止技能上下文加载。通过以下方式修复：
  - 在 BASH_SOURCE 在 Claude Code 的执行上下文中未绑定时，使用 `${BASH_SOURCE[0]:-$0}` 回退
  - 添加 `|| true` 以优雅地处理过滤状态标志时的空 grep 结果

---

# Superpowers v2.0.0 版本更新日志

## 概述

Superpowers v2.0 通过一次重大架构变革，使技能更易获取、更易维护且由社区驱动。

核心变化是**技能仓库分离**：所有技能、脚本和文档已从插件移至一个专用仓库（[obra/superpowers-skills](https://github.com/obra/superpowers-skills)）。这将 superpowers 从一个单体插件转变为一个轻量级 shim，管理技能仓库的本地克隆。技能在会话启动时自动更新。用户通过标准 git 工作流 fork 并贡献改进。技能库独立于插件进行版本迭代。

除了基础设施之外，此版本还新增了九个专注于问题解决、研究和架构的新技能。我们以命令式语气和更清晰的结构重写了核心的 **using-skills** 文档，使 Claude 更容易理解何时以及如何使用技能。**find-skills** 现在输出可直接粘贴到 Read 工具的路径，消除了技能发现工作流中的摩擦。

用户获得无缝体验：插件自动处理克隆、fork 和更新。贡献者发现新架构使改进和分享技能变得简单。此版本为技能作为社区资源快速发展奠定了基础。

## 破坏性变更

### 技能仓库分离

**最大的变化：** 技能不再存放在插件中。它们已移至独立仓库 [obra/superpowers-skills](https://github.com/obra/superpowers-skills)。

**这对你意味着什么：**

- **首次安装：** 插件自动将技能克隆到 `~/.config/superpowers/skills/`
- **Fork：** 在设置过程中，如果安装了 `gh`，你会被提供 fork 技能仓库的选项
- **更新：** 技能在会话启动时自动更新（尽可能快进合并）
- **贡献：** 在分支上工作，本地提交，向上游提交 PR
- **不再有遮盖：** 旧的两级系统（个人/核心）替换为单一仓库分支工作流

**迁移：**

如果你有现有安装：
1. 你的旧 `~/.config/superpowers/.git` 将备份到 `~/.config/superpowers/.git.bak`
2. 旧技能将备份到 `~/.config/superpowers/skills.bak`
3. obra/superpowers-skills 的全新克隆将创建在 `~/.config/superpowers/skills/`

### 移除的功能

- **个人 superpowers 覆盖系统** — 由 git 分支工作流替代
- **setup-personal-superpowers hook** — 由 initialize-skills.sh 替代

## 新功能

### 技能仓库基础设施

**自动克隆与设置** (`lib/initialize-skills.sh`)
- 首次运行时克隆 obra/superpowers-skills
- 如果安装了 GitHub CLI，提供创建 fork 的选项
- 正确设置 upstream/origin 远程仓库
- 处理从旧安装的迁移

**自动更新**
- 每次会话启动时从跟踪的远程仓库 fetch
- 在可能时自动快进合并
- 当需要手动同步（分支分叉）时通知
- 使用 pulling-updates-from-skills-repository 技能进行手动同步

### 新技能

**问题解决技能** (`skills/problem-solving/`)
- **collision-zone-thinking** — 强制不相关的概念碰撞以产生新见解
- **inversion-exercise** — 翻转假设以揭示隐藏约束
- **meta-pattern-recognition** — 跨领域识别通用原则
- **scale-game** — 在极端条件下测试以揭示基本真理
- **simplification-cascades** — 找到能消除多个组件的洞察
- **when-stuck** — 分派到正确的问题解决技术

**研究技能** (`skills/research/`)
- **tracing-knowledge-lineages** — 理解想法如何随时间演变

**架构技能** (`skills/architecture/`)
- **preserving-productive-tensions** — 保持多种有效方法，而非强迫过早解决

### 技能改进

**using-skills（原 getting-started）**
- 从 getting-started 重命名为 using-skills
- 使用命令式语气完全重写（v4.0.0）
- 关键规则前置
- 为所有工作流添加了"Why"解释
- 引用中始终包含 /SKILL.md 后缀
- 更清晰区分刚性规则和灵活模式

**writing-skills**
- 交叉引用指导从 using-skills 移入
- 添加了 token 效率部分（字数目标）
- 改进了 CSO（Claude Search Optimization）指导

**sharing-skills**
- 更新为新的分支和 PR 工作流（v2.0.0）
- 移除了个人/核心拆分引用

**pulling-updates-from-skills-repository**（新增）
- 用于与上游同步的完整工作流
- 替代旧的"updating-skills"技能

### 工具改进

**find-skills**
- 现在输出带 /SKILL.md 后缀的完整路径
- 使路径可直接用于 Read 工具
- 更新了帮助文本

**skill-run**
- 从 scripts/ 移至 skills/using-skills/
- 改进了文档

### 插件基础设施

**会话启动 Hook**
- 现在从技能仓库位置加载
- 在会话启动时显示完整技能列表
- 打印技能位置信息
- 显示更新状态（更新成功 / 落后上游）
- 将"技能落后"警告移至输出末尾

**环境变量**
- `SUPERPOWERS_SKILLS_ROOT` 设置为 `~/.config/superpowers/skills`
- 在所有路径中一致使用

## 缺陷修复

- 修复 fork 时重复添加 upstream 远程仓库
- 修复 find-skills 输出中双重"skills/"前缀
- 从 session-start 中移除过时的 setup-personal-superpowers 调用
- 修复 hooks 和命令中的路径引用

## 文档

### README
- 针对新技能仓库架构更新
- 突出显示 superpowers-skills 仓库链接
- 更新自动更新描述
- 修复技能名称和引用
- 更新元技能列表

### 测试文档
- 添加了全面的测试检查清单（`docs/TESTING-CHECKLIST.md`）
- 创建了用于测试的本地市场配置
- 记录了手动测试场景

## 技术细节

### 文件变更

**新增：**
- `lib/initialize-skills.sh` — 技能仓库初始化和自动更新
- `docs/TESTING-CHECKLIST.md` — 手动测试场景
- `.claude-plugin/marketplace.json` — 本地测试配置

**移除：**
- `skills/` 目录（82 个文件） — 现在在 obra/superpowers-skills 中
- `scripts/` 目录 — 现在在 obra/superpowers-skills/skills/using-skills/ 中
- `hooks/setup-personal-superpowers.sh` — 已过时

**修改：**
- `hooks/session-start.sh` — 从 ~/.config/superpowers/skills 使用技能
- `commands/brainstorm.md` — 更新路径为 SUPERPOWERS_SKILLS_ROOT
- `commands/write-plan.md` — 更新路径为 SUPERPOWERS_SKILLS_ROOT
- `commands/execute-plan.md` — 更新路径为 SUPERPOWERS_SKILLS_ROOT
- `README.md` — 针对新架构全面重写

### 提交历史

此版本包含：
- 20+ 个用于技能仓库分离的提交
- PR #1：受 Amplifier 启发的问题解决和研究技能
- PR #2：个人 superpowers 覆盖系统（后被替换）
- 多次技能优化和文档改进

## 升级说明

### 全新安装

```bash
# 在 Claude Code 中
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

插件自动处理一切。

### 从 v1.x 升级

1. **备份你的个人技能**（如果你有的话）：
   ```bash
   cp -r ~/.config/superpowers/skills ~/superpowers-skills-backup
   ```

2. **更新插件：**
   ```bash
   /plugin update superpowers
   ```

3. **在下一次会话启动时：**
   - 旧安装将自动备份
   - 全新技能仓库将被克隆
   - 如果你有 GitHub CLI，将被提供 fork 的选项

4. **迁移个人技能**（如果你有的话）：
   - 在你的本地技能仓库中创建一个分支
   - 从备份中复制你的个人技能
   - 提交并推送到你的 fork
   - 考虑通过 PR 贡献回社区

## 下一步

### 对于用户

- 探索新的问题解决技能
- 尝试基于分支的工作流以改进技能
- 向社区贡献技能

### 对于贡献者

- 技能仓库现在位于 https://github.com/obra/superpowers-skills
- Fork → Branch → PR 工作流
- 参见 skills/meta/writing-skills/SKILL.md 了解文档的 TDD 方法

## 已知问题

目前没有。

## 致谢

- 问题解决技能受 Amplifier 模式启发
- 社区贡献和反馈
- 对技能有效性的大量测试和迭代

---

**完整更新日志：** https://github.com/BigSword123/superpowers-cn/compare/dd013f6...main
**技能仓库：** https://github.com/BigSword123/superpowers-cn
**问题跟踪：** https://github.com/BigSword123/superpowers-cn/issues
