# Superpowers 发布说明

## v5.1.0 (2026-04-30)

### 移除

- **移除了旧版斜杠命令** — `/brainstorm`、`/execute-plan` 和 `/write-plan` 已被移除。它们曾是已弃用的存根，仅告诉用户去调用相应的技能。请直接调用 `superpowers:brainstorming`、`superpowers:executing-plans` 和 `superpowers:writing-plans`。(#1188)
- **移除了 `superpowers:code-reviewer` 命名 agent** — 该 agent 是插件中唯一的命名 agent，仅被两个技能使用，而仓库中所有其他 reviewer/implementer subagent 都使用 `general-purpose` 并附带 prompt 模板及其技能。该 agent 的角色定义和检查清单已合并到 `skills/requesting-code-review/code-reviewer.md` 中，作为一个独立的 Task 分派模板。任何分派 `Task (superpowers:code-reviewer)` 的地方应改为使用 `Task (general-purpose)` 并附带该 prompt 模板。(PR #1299)
- **从技能中移除了集成章节** — 这些是 agent 拥有原生技能系统之前的遗留内容，对引导没有帮助。

### Worktree 技能重写

`using-git-worktrees` 和 `finishing-a-development-branch` 现在能够检测 agent 是否已在隔离的 worktree 中运行，并优先使用 harness 的原生 worktree 控制，然后才回退到 `git worktree`。行为经过了 TDD 验证和跨五个 harness 的跨平台检查。(PRI-974, PR #1121)

- **环境检测** — 两个技能在做任何事之前都会检查 `GIT_DIR != GIT_COMMON`；如果已经在链接的 worktree 中，则完全跳过创建。设有子模块防护以防止误检测。
- **创建 worktree 前征求同意** — `using-git-worktrees` 不再隐式创建 worktree；技能会先询问用户。修复了 #991（subagent-driven-development 在未经同意的情况下自动创建 worktree）。
- **原生工具优先（步骤 1a）** — 当 harness 提供自己的 worktree 工具（如 Codex）时，技能会优先使用它。用户明确表达的偏好会得到尊重。
- **基于来源的清理** — `finishing-a-development-branch` 仅清理 `.worktrees/` 内的 worktree（由 superpowers 创建）；之外的任何内容都保持原样。修复了 #940（选项 2 错误地清理了 worktree）、#999（先 merge 后 remove 的顺序问题）和 #238（在 `git worktree remove` 之前 `cd` 到仓库根目录）。
- **Detached HEAD 处理** — 当没有分支可合并时，finishing 菜单缩减为两个选项。
- **技能示例中的硬编码 `/Users/jesse` 路径** 已替换为通用占位符。(#858, PR #1122)

### 面向 AI Agent 的贡献者指南

在 `CLAUDE.md`（符号链接到 `AGENTS.md`）顶部新增了两个专门针对 AI agent 的章节。对本仓库最近 100 个已关闭 PR 的审查显示，94% 的拒绝率是由 AI 生成的垃圾造成的：agent 没有阅读 PR 模板、提交重复 PR、捏造问题描述或将 fork 特定或领域特定的改动推到上游。

- **提交前检查清单** — 阅读 PR 模板，搜索已有 PR，验证存在真实问题，确认改动属于核心，在提交前向人类伙伴展示完整的 diff。
- **我们不会接受的内容** — 第三方依赖、对技能内容的"合规性"重写、项目特定配置、批量 PR、推测性修复、领域特定技能、fork 特定改动、捏造内容以及捆绑不相关的改动。
- **新 harness PR 需要会话转录** — 大多数以往的新 harness 集成只是复制技能文件或用 `npx skills` 包装，而不是在会话开始时加载 `using-superpowers` 引导程序。现在要求提供验收测试（在干净会话中发送 "Let's make a react todo list" 必须自动触发 `brainstorming`）和完整的转录。

### Codex 插件镜像工具

新增 `sync-to-codex-plugin` 脚本，将 superpowers 镜像到 OpenAI Codex 插件市场，位于 `prime-radiant-inc/openai-codex-plugins`。路径/用户无关，任何团队成员都可以运行。(PR #1165)

- 每次运行将 fork 克隆到临时目录，内联重新生成 overlay，并提交 PR；从脚本自身位置自动检测上游，预检 `rsync`/`git`/`gh auth`/`python3`。
- `--bootstrap` 标志用于首次设置；`EXCLUDES` 模式锚定到源根目录；`assets/` 被排除。
- 镜像 `CODE_OF_CONDUCT.md`；丢弃 `agents/openai.yaml` overlay。
- 在镜像的 `plugin.json` 中注入 `interface.defaultPrompt`。(PR #1180 by @arittr)
- Codex 插件文件提交到源仓库，以便同步脚本使用规范版本；Codex 市场元数据被保留。

### OpenCode

- **Bootstrap 内容在模块级别缓存** — `getBootstrapContent()` 之前在 agent 的每个步骤上都调用 `fs.existsSync` + `fs.readFileSync` + frontmatter 正则（`experimental.chat.messages.transform` 钩子在 OpenCode 的 agent 循环中每个步骤都会触发）。现在读取一次，在会话生命周期内缓存，对于文件缺失的情况使用 null 哨兵值。15 个回归测试覆盖了缓存行为、fs 调用计数、注入保护、缺失文件哨兵和缓存重置。(修复 #1202)
- **集成测试已现代化**。
- **README 中的安装注意事项已澄清**。

### 代码审查整合

`requesting-code-review` 现在是自包含的：角色定义、检查清单和分派模板位于 `skills/requesting-code-review/code-reviewer.md` 中，技能直接分派 `Task (general-purpose)`。(PR #1299)

- **单一真实来源** — 以前同时存在于 `agents/code-reviewer.md` 和技能的占位模板中的角色/检查清单（且各自独立漂移）现在合并为一个文件。
- **`subagent-driven-development` 同步跟进** — 其 `code-quality-reviewer-prompt.md` 现在分派 `Task (general-purpose)` 而不是命名 agent。
- **新增行为测试** — `tests/claude-code/test-requesting-code-review.sh` 在一个小项目中植入真实的 bug（SQL 注入、明文密码处理、凭证日志），并断言分派的审查者以 Critical/Important 严重程度标记了每一个植入的问题，并拒绝批准 diff。
- **Codex 和 Copilot 的变通方案文档已修剪** — `references/codex-tools.md` 和 `references/copilot-tools.md` 中的"命名 agent 分派"章节记录了如何将命名 agent 降级为通用分派。由于没有命名 agent 发布，该变通方案不再需要；两个章节都已删除。

### Subagent-Driven Development

- **不再每 3 个任务暂停一次** — `requesting-code-review` 中的"每批 3 个任务后审查"的节奏（最初为 `executing-plans` 设计）泄露到了 `subagent-driven-development` 中。替换为"每个任务或自然检查点"加上显式的持续执行指令。
- **SDD 集成测试现在真正运行其断言** — 三个独立的 bug 导致测试在打印任何验证结果之前静默退出：工作目录路径中未解析的 `..` 段，`set -euo pipefail` 与 `find | sort | head -1` 的交互（生产者端的 SIGPIPE 杀死了脚本），以及 `claude -p` 调用中缺失的 `--plugin-dir` 导致测试加载了已安装的插件而非工作树。全部三个已修复；六个验证测试现在真正针对实际的端到端 SDD 运行进行了验证。

### Cursor

- **Windows SessionStart 钩子** 通过 `run-hook.cmd` 路由，而不是直接调用无扩展名的 `session-start` 脚本。修复了 Windows 将文件以编辑器打开而不是运行它的问题。还从 `hooks-cursor.json` 中移除了意外的 UTF-8 BOM。

### Gemini CLI

- **Subagent 分派映射** — Gemini 的 `Task` 分派现在映射到 `@agent-name` / `@generalist`，并为独立任务记录了并行 subagent 分派。

### 技能

- **术语清理** 贯穿技能内容。

### 文档与安装

- **Factory Droid 安装说明** 已添加到 README。
- **README 中的快速开始安装链接**。(PR #1293 by @arittr)
- **Codex 插件安装指南** 已更新。(PR #1288 by @arittr)
- **Codex `wait` 映射** 在工具参考中更正为 `wait_agent`。
- **安装顺序重新整理**；Codex 安装说明已清理。
- **移除了残留的 `CHANGELOG.md`**，以 `RELEASE-NOTES.md` 作为单一来源。(PR #1163 by @shaanmajid)
- **Discord 邀请链接** 已修复；在社区部分添加了发布公告链接和详细的 Discord 描述。

### 社区

- @shaanmajid — 残留 `CHANGELOG.md` 移除 (PR #1163)
- @arittr — README 快速开始安装链接 (#1293)、Codex 插件安装指南 (#1288)、`sync-to-codex-plugin` `interface.defaultPrompt` 注入 (#1180)

## v5.0.7 (2026-03-31)

### GitHub Copilot CLI 支持

- **SessionStart 上下文注入** — Copilot CLI v1.0.11 添加了对 sessionStart 钩子输出中 `additionalContext` 的支持。session-start 钩子现在检测 `COPILOT_CLI` 环境变量并输出 SDK 标准的 `{ "additionalContext": "..." }` 格式，为 Copilot CLI 用户在会话开始时提供完整的 superpowers 引导程序。(原始修复由 @culinablaz 在 PR #910 中完成)
- **工具映射** — 添加了 `references/copilot-tools.md`，包含完整的 Claude Code 到 Copilot CLI 工具等效表
- **技能和 README 更新** — 在 `using-superpowers` 技能的平台指令和 README 安装部分中添加了 Copilot CLI

### OpenCode 修复

- **技能路径一致性** — 引导程序文本不再宣传与实际运行路径不匹配的误导性 `configDir/skills/superpowers/` 路径。Agent 应使用原生的 `skill` 工具，而不是通过路径导航到文件。测试现在使用从单一真实来源派生的统一路径。(#847, #916)
- **Bootstrap 作为用户消息** — 将 bootstrap 注入从 `experimental.chat.system.transform` 移到 `experimental.chat.messages.transform`，将其添加到第一条用户消息之前，而不是添加系统消息。避免了每轮重复系统消息造成的 token 膨胀 (#750)，并修复了与 Qwen 及其他在多条系统消息上出错的模型的兼容性 (#894)。

## v5.0.6 (2026-03-24)

### 内联自我审查取代 Subagent 审查循环

subagent 审查循环（分派新 agent 审查计划/规格）将执行时间翻倍（约 25 分钟开销），却没有可衡量地提高计划质量。跨 5 个版本的回归测试（每个版本 5 次试验）显示，无论审查循环是否运行，质量评分相同。

- **brainstorming** — 将 Spec Review Loop（subagent 分派 + 3 轮迭代上限）替换为内联 Spec Self-Review 检查清单：占位符扫描、内部一致性、范围检查、歧义检查
- **writing-plans** — 将 Plan Review Loop（subagent 分派 + 3 轮迭代上限）替换为内联 Self-Review 检查清单：规格覆盖、占位符扫描、类型一致性
- **writing-plans** — 添加了显式的"No Placeholders"章节，定义计划失败（TBD、模糊描述、未定义引用、"与任务 N 类似"）
- 自我审查在每次运行中约 30 秒内捕获 3-5 个真实 bug，而不是约 25 分钟，缺陷率与 subagent 方案相当

### Brainstorm Server

- **会话目录重构** — brainstorm server 的会话目录现在包含两个对等子目录：`content/`（提供给浏览器的 HTML 文件）和 `state/`（事件、服务器信息、pid、日志）。此前，服务器状态和用户交互数据与提供给浏览器的内容存储在同一目录，使它们可通过 HTTP 访问。`screen_dir` 和 `state_dir` 路径都包含在 server-started JSON 中。(由 吉田仁 报告)

### Bug 修复

- **Owner-PID 生命周期修复** — brainstorm server 的 owner-PID 监控有两个 bug 导致在 60 秒内误关闭：(1) 来自跨用户 PID（Tailscale SSH 等）的 EPERM 被视为"进程已死"，(2) 在 WSL 上，祖父进程 PID 解析为在第一次生命周期检查之前就退出的短暂子进程。修复方法：将 EPERM 视为"存活"，并在启动时验证 owner PID——如果它已经死了，则禁用监控，服务器依赖 30 分钟空闲超时。这也移除了 `start-server.sh` 中 Windows/MSYS2 特定的豁免，因为服务器现在通过通用方式处理。(#879)
- **writing-skills** — 纠正了 SKILL.md frontmatter 只支持"仅两个字段"的错误说法；现在说"两个必填字段"，并提供 agentskills.io 规范的链接以了解所有支持的字段 (PR #882 by @arittr)

### Codex App 兼容性

- **codex-tools** — 添加了命名 agent 分派映射，记录如何将 Claude Code 的命名 agent 类型翻译为 Codex 带 worker 角色的 `spawn_agent` (PR #647 by @arittr)
- **codex-tools** — 为 worktree 感知技能添加了环境检测和 Codex App finishing 章节 (by @arittr)
- **设计规格** — 添加了 Codex App 兼容性设计规格 (PRI-823)，涵盖只读环境检测、worktree 安全技能行为和沙箱回退模式 (by @arittr)

## v5.0.5 (2026-03-17)

### Bug 修复

- **Brainstorm server ESM 修复** — 将 `server.js` 重命名为 `server.cjs`，使 brainstorming server 在 Node.js 22+ 上正常启动，解决了根目录 `package.json` 中 `"type": "module"` 导致 `require()` 失败的问题。(PR #784 by @sarbojitrana, 修复 #774, #780, #783)
- **Brainstorm owner-PID 在 Windows 上** — 在 Windows/MSYS2 上跳过 PID 生命周期监控，因为 PID 命名空间对 Node.js 不可见，防止服务器在 60 秒后自终止。(#770, 文档来自 PR #768 by @lucasyhzlu-debug)
- **stop-server.sh 可靠性** — 在报告成功之前验证服务器进程确实已死亡。SIGTERM + 2s 等待 + SIGKILL 回退。(#723)

### 变更

- **执行交接** — 恢复用户在编写计划后在 subagent-driven 和内联执行之间的选择。推荐 subagent-driven 但不再强制。

## v5.0.4 (2026-03-16)

### 审查循环改进

通过消除不必要的审查轮次和收紧审查者关注点，大幅减少 token 使用并加速规格和计划审查。

- **单次全计划审查** — 计划审查者现在一次性审查完整计划，而不是逐块审查。移除了所有与块相关的概念（`## Chunk N:` 标题、1000 行块限制、每块分派）。
- **提高了阻塞问题的门槛** — 规格和计划审查者 prompt 现在都包含一个"校准"部分：只标记那些在实现过程中会导致实际问题的问题。措辞小问题、风格偏好和格式瑕疵不应阻止批准。
- **减少了最大审查迭代次数** — 规格和计划审查循环从 5 次减少到 3 次。如果审查者校准正确，3 轮足够了。
- **精简了审查者检查清单** — 规格审查者从 7 个类别缩减到 5 个；计划审查者从 7 个缩减到 4 个。移除了格式焦点检查（任务语法、块大小），改为关注实质内容（可构建性、规格一致性）。

### OpenCode

- **一行安装插件** — OpenCode 插件现在通过 `config` 钩子自动注册技能目录。不需要符号链接或 `skills.paths` 配置。安装只需要在 `opencode.json` 中添加一行。(PR #753)
- **添加了 `package.json`** — 以便 OpenCode 可以从 git 安装 superpowers 作为 npm 包。

### Bug 修复

- **验证服务器确实已停止** — `stop-server.sh` 现在在报告成功之前确认进程已死亡。SIGTERM + 2s 等待 + SIGKILL 回退。如果进程幸存则报告失败。(PR #751)
- **通用 agent 语言** — brainstorm companion 等待页面现在说"the agent"而不是"Claude"。

## v5.0.3 (2026-03-15)

### Cursor 支持

- **Cursor hooks** — 添加了 `hooks/hooks-cursor.json`，使用 Cursor 的驼峰命名格式（`sessionStart`、`version: 1`），并更新了 `.cursor-plugin/plugin.json` 以引用它。修复了 `session-start` 中的平台检测，优先检查 `CURSOR_PLUGIN_ROOT`（Cursor 也可能设置 `CLAUDE_PLUGIN_ROOT`）。(基于 PR #709)

### Bug 修复

- **停止在 `--resume` 时触发 SessionStart 钩子** — 启动钩子曾在恢复的会话上重新注入上下文，而这些会话的对话历史中已经有上下文。钩子现在仅在 `startup`、`clear` 和 `compact` 时触发。
- **Bash 5.3+ 钩子挂起** — 在 `hooks/session-start` 中将 heredoc (`cat <<EOF`) 替换为 `printf`。修复了在 macOS 上使用 Homebrew bash 5.3+ 时，由于 bash 在 heredoc 中进行大变量展开的回归问题导致的无限挂起。(#572, #571)
- **POSIX 安全钩子脚本** — 在 `hooks/session-start` 中将 `${BASH_SOURCE[0]:-$0}` 替换为 `$0`。修复了 Ubuntu/Debian 上 `/bin/sh` 是 dash 时的"Bad substitution"错误。(#553)
- **可移植的 shebangs** — 在所有 shell 脚本中将 `#!/bin/bash` 替换为 `#!/usr/bin/env bash`。修复了在 NixOS、FreeBSD 和使用 Homebrew bash 的 macOS 上 `/bin/bash` 过时或不存在时的执行问题。(#700)
- **Brainstorm server 在 Windows 上** — 自动检测 Windows/Git Bash（`OSTYPE=msys*`、`MSYSTEM`）并切换到前台模式，修复了由 `nohup`/`disown` 进程回收导致的静默服务器故障。(#737)
- **Codex 文档修复** — 在 Codex 文档中将已弃用的 `collab` 标志替换为 `multi_agent`。(PR #749)

## v5.0.2 (2026-03-11)

### 零依赖 Brainstorm Server

**移除了所有内置的 node_modules — server.js 现在完全自包含**

- 用零依赖的 Node.js 服务器替换了 Express/Chokidar/WebSocket 依赖，使用内置的 `http`、`fs` 和 `crypto` 模块
- 移除了约 1200 行内置的 `node_modules/`、`package.json` 和 `package-lock.json`
- 自定义 WebSocket 协议实现（RFC 6455 帧、ping/pong、正确的关闭握手）
- 原生 `fs.watch()` 文件监听替换 Chokidar
- 完整测试套件：HTTP 服务、WebSocket 协议、文件监听和集成测试

### Brainstorm Server 可靠性

- **空闲 30 分钟后自动退出** — 当没有客户端连接时服务器关闭，防止孤儿进程
- **Owner 进程跟踪** — 服务器监控父 harness PID，当拥有的会话终止时退出
- **活跃度检查** — 技能在重用现有实例之前验证服务器是否响应
- **编码修复** — 提供的 HTML 页面包含正确的 `<meta charset="utf-8">`

### Subagent 上下文隔离

- 所有委托技能（brainstorming、dispatching-parallel-agents、requesting-code-review、subagent-driven-development、writing-plans）现在都包含上下文隔离原则
- Subagent 只接收它们需要的上下文，防止上下文窗口污染

## v5.0.1 (2026-03-10)

### Agentskills 合规

**Brainstorm-server 移入技能目录**

- 根据 [agentskills.io](https://agentskills.io) 规范，将 `lib/brainstorm-server/` 移到 `skills/brainstorming/scripts/`
- 所有 `${CLAUDE_PLUGIN_ROOT}/lib/brainstorm-server/` 引用替换为相对的 `scripts/` 路径
- 技能现在跨平台完全可移植——不需要平台特定的环境变量来定位脚本
- `lib/` 目录已移除（此前是最后剩余的内容）

### 新功能

**Gemini CLI 扩展**

- 通过仓库根目录的 `gemini-extension.json` 和 `GEMINI.md` 提供原生 Gemini CLI 扩展支持
- `GEMINI.md` 在会话开始时 @import `using-superpowers` 技能和工具映射表
- Gemini CLI 工具映射参考（`skills/using-superpowers/references/gemini-tools.md`）— 将 Claude Code 工具名称（Read、Write、Edit、Bash 等）翻译为 Gemini CLI 等效项（read_file、write_file、replace 等）
- 记录 Gemini CLI 限制：无 subagent 支持，技能回退到 `executing-plans`
- 扩展根目录位于仓库根目录以实现跨平台兼容性（避免 Windows 符号链接问题）
- 安装说明已添加到 README

### 改进

**多平台 brainstorm server 启动**

- `visual-companion.md` 中包含各平台启动指令：Claude Code（默认模式）、Codex（通过 `CODEX_CI` 自动前台）、Gemini CLI（`--foreground` 与 `is_background`）及其他环境的回退方案
- 服务器现在将启动 JSON 写入 `$SCREEN_DIR/.server-info`，使 agent 即使在后台执行中 stdout 隐藏时也能找到 URL 和端口

**Brainstorm server 依赖已捆绑**

- `node_modules` 已内置到仓库中，因此 brainstorm server 在新插件安装后即可立即工作，无需在运行时使用 `npm`
- 从捆绑依赖中移除了 `fsevents`（仅限 macOS 的本机二进制文件；chokidar 在没有它时能优雅回退）
- 如果 `node_modules` 缺失，则回退到通过 `npm install` 自动安装

**OpenCode 工具映射修复**

- `TodoWrite` → `todowrite`（此前错误映射到 `update_plan`）；已根据 OpenCode 源码验证

### Bug 修复

**Windows/Linux：单引号破坏 SessionStart 钩子** (#577, #529, #644, PR #585)

- hooks.json 中 `${CLAUDE_PLUGIN_ROOT}` 周围的单引号在 Windows 上失败（cmd.exe 不将单引号识别为路径分隔符），在 Linux 上也失败（单引号阻止变量展开）
- 修复：将单引号替换为转义双引号——在 macOS bash、Windows cmd.exe、Windows Git Bash 和 Linux 上均正常工作，无论路径中是否包含空格
- 已在 Windows 11 (NT 10.0.26200.0) 上使用 Claude Code 2.1.72 和 Git for Windows 验证

**Brainstorming 规格审查循环被跳过** (#677)

- 规格审查循环（分派 spec-document-reviewer subagent，迭代直到批准）存在于"设计之后"章节省略了该步骤
- 由于 agent 遵循图表和检查清单比遵循散文更可靠，规格审查步骤被完全跳过
- 将第 7 步（规格审查循环）添加到检查清单，并将相应节点添加到 dot 图中
- 已用 `claude --plugin-dir` 和 `claude-session-driver` 测试：worker 现在正确分派审查者

**Cursor 安装命令** (PR #676)

- 修复了 README 中的 Cursor 安装命令：`/plugin-add` → `/add-plugin`（经 Cursor 2.5 发布公告确认）

**Brainstorming 中的用户审查关卡** (#565)

- 在规格完成和 writing-plans 交接之间添加了显式的用户审查步骤
- 在实现规划开始之前用户必须批准规格
- 检查清单、流程流和散文均已更新以包含新关卡

**Session-start 钩子每个平台仅发送上下文一次**

- 钩子现在检测它是在 Claude Code 还是其他平台中运行
- 对 Claude Code 发送 `hookSpecificOutput`，对其他平台发送 `additional_context`——防止重复上下文注入

**Token 分析脚本的 linting 修复**

- `tests/claude-code/analyze-token-usage.py` 中 `except:` → `except Exception:`

### 维护

**移除了死代码**

- 删除了 `lib/skills-core.js` 及其测试（`tests/opencode/test-skills-core.js`）——自 2026 年 2 月起未使用
- 从 `tests/opencode/test-plugin-loading.sh` 中移除了 skills-core 存在性检查

### 社区

- @karuturi — Claude Code 官方市场安装说明 (PR #610)
- @mvanhorn — session-start 钩子双重发送修复、OpenCode 工具映射修复
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
- 迁移：如果需要，将现有文件从 `docs/plans/` 移动到新位置

**在具备 subagent 能力的 harness 上 Subagent-driven development 强制使用**

Writing-plans 不再提供 subagent-driven 和 executing-plans 之间的选择。在支持 subagent 的 harness（Claude Code、Codex）上，subagent-driven-development 是必需的。Executing-plans 保留给没有 subagent 能力的 harness，现在会告诉用户 Superpowers 在具备 subagent 能力的平台上效果更好。

**Executing-plans 不再分批**

移除了"执行 3 个任务然后停下来审查"的模式。计划现在连续执行，仅在遇到阻塞时才停止。

**斜杠命令已弃用**

`/brainstorm`、`/write-plan` 和 `/execute-plan` 现在显示弃用通知，引导用户使用相应的技能。命令将在下一个主要版本中移除。

### 新功能

**可视化 brainstorming companion**

可选的基于浏览器的 brainstorming 会话 companion。当某个主题受益于可视化时，brainstorming 技能会提供在浏览器窗口中显示 mockup、图表、对比和其他内容，与终端对话并行。

- `lib/brainstorm-server/` — WebSocket 服务器，带有浏览器辅助库、会话管理脚本和深色/浅色主题框架模板（"Superpowers Brainstorming" 带有 GitHub 链接）
- `skills/brainstorming/visual-companion.md` — 服务器工作流、屏幕创作和反馈收集的渐进式披露指南
- Brainstorming 技能在其流程中添加了可视化 companion 决策点：在探索项目上下文后，技能评估即将提出的问题是否涉及可视化内容，并在自己的消息中提供 companion
- 每个问题决策：即使接受了，每个问题都会评估用浏览器还是终端更合适
- `tests/brainstorm-server/` 中的集成测试

**文档审查系统**

使用 subagent 分派对规格和计划文档进行自动审查循环：

- `skills/brainstorming/spec-document-reviewer-prompt.md` — 审查者检查完整性、一致性、架构和 YAGNI
- `skills/writing-plans/plan-document-reviewer-prompt.md` — 审查者检查规格对齐、任务分解、文件结构和文件大小
- Brainstorming 在编写设计文档后分派规格审查者
- Writing-plans 在每个部分之后包含基于分块的计划审查循环
- 审查循环反复进行直到批准，或在 5 次迭代后升级
- `tests/claude-code/test-document-review-system.sh` 中的端到端测试
- `docs/superpowers/` 中的设计规格和实现计划

**贯穿技能管道的架构指导**

为 brainstorming、writing-plans 和 subagent-driven-development 添加了隔离设计和文件大小感知指导：

- **Brainstorming** — 新增章节："Design for isolation and clarity"（清晰的边界、定义良好的接口、可独立测试的单元）和"Working in existing codebases"（遵循现有模式，仅做有针对性的改进）
- **Writing-plans** — 新增"File Structure"章节：在定义任务之前规划文件和职责。新增"Scope Check"后盾：捕获本应在 brainstorming 期间分解的多子系统规格
- **SDD implementer** — 新增"Code Organization"章节（遵循计划的文件结构，报告对文件膨胀的担忧）和"When You're in Over Your Head"升级指南
- **SDD code quality reviewer** — 现在检查架构、单元分解、计划一致性和文件膨胀
- **Spec/plan reviewers** — 架构和文件大小已添加到审查标准
- **范围评估** — Brainstorming 现在评估项目是否太大而不能放在单个规格中。多子系统请求被尽早标记并分解为子项目，每个都有自己的规格 → 计划 → 实现循环

**Subagent-driven development 改进**

- **模型选择** — 按任务类型选择模型能力的指导：简单任务用便宜模型，集成用标准模型，架构和审查用能力模型
- **Implementer 状态协议** — Subagent 现在报告 DONE、DONE_WITH_CONCERNS、BLOCKED 或 NEEDS_CONTEXT。控制器适当处理每种状态：用更多上下文重新分派、升级模型能力、拆分任务或升级给人类

### 改进

**指令优先级层次**

为 using-superpowers 添加了显式的优先级排序：

1. 用户的显式指令（CLAUDE.md、AGENTS.md、直接请求）——最高优先级
2. Superpowers 技能——覆盖默认系统行为
3. 默认系统提示——最低优先级

如果 CLAUDE.md 或 AGENTS.md 说"不要用 TDD"而某个技能说"始终用 TDD"，用户的指令优先。

**SUBAGENT-STOP 关卡**

为 using-superpowers 添加了 `<SUBAGENT-STOP>` 块。为特定任务分派的 Subagent 现在跳过该技能，而不是激活 1% 规则并调用完整的技能工作流。

**多平台改进**

- Codex 工具映射移至渐进式披露参考文件（`references/codex-tools.md`）
- 添加了平台适配指针，使非 Claude Code 平台可以找到工具等效项
- 计划标题现在使用"agentic workers"而不是特指"Claude"
- Collab 功能要求在 `docs/README.codex.md` 中记录

**Writing-plans 模板更新**

- 计划步骤现在使用复选框语法（`- [ ] **Step N:**`）以便跟踪进度
- 计划标题引用 subagent-driven-development 和 executing-plans，并带有平台感知路由

---

## v4.3.1 (2026-02-21)

### 新增

**Cursor 支持**

Superpowers 现在与 Cursor 的插件系统兼容。包括 `.cursor-plugin/plugin.json` 清单文件和 README 中的 Cursor 特定安装说明。SessionStart 钩子输出现在除了现有的 `hookSpecificOutput.additionalContext` 外，还包含 `additional_context` 字段，以兼容 Cursor 钩子。

### 修复

**Windows：恢复了 polyglot 包装器以实现可靠的钩子执行 (#518, #504, #491, #487, #466, #440)**

Claude Code 在 Windows 上的 `.sh` 自动检测会在钩子命令前添加 `bash`，破坏执行。修复方案：

- 将 `session-start.sh` 重命名为 `session-start`（无扩展名），使自动检测不进行干扰
- 恢复了 `run-hook.cmd` polyglot 包装器，具有多路径 bash 发现（标准 Git for Windows 路径，然后 PATH 回退）
- 如果找不到 bash，则静默退出而不是报错
- 在 Unix 上，包装器通过 `exec bash` 直接运行脚本
- 使用 POSIX 安全的 `dirname "$0"` 路径解析（在 dash/sh 上工作，不仅在 bash 上）

这修复了 Windows 上路径含空格、缺失 WSL、MSYS 上 `set -euo pipefail` 脆弱性以及反斜杠损毁导致的 SessionStart 失败。

## v4.3.0 (2026-02-12)

此修复应大幅提高 superpowers 技能合规性，并减少 Claude 无意中进入其原生计划模式的机会。

### 变更

**Brainstorming 技能现在强制执行其工作流，而不是描述它**

模型会跳过设计阶段直接跳转到实现技能（如 frontend-design），或将整个 brainstorming 流程压缩为单个文本块。该技能现在使用硬关卡、强制检查清单和 graphviz 流程流来强制执行合规：

- `<HARD-GATE>`：在展示设计并获得用户批准之前，不得使用实现技能、代码或脚手架
- 显式检查清单（6 项），必须创建为任务并按顺序完成
- Graphviz 流程流，以 `writing-plans` 为唯一有效的最终状态
- 反模式标注："这太简单了，不需要设计"——这正是模型用来跳过流程的理由
- 设计章节大小基于章节复杂性而非项目复杂性

**Using-superpowers 工作流图拦截 EnterPlanMode**

为技能流程图添加了 `EnterPlanMode` 拦截。当模型即将进入 Claude 的原生计划模式时，它检查 brainstorming 是否已经发生，并路由到 brainstorming 技能。计划模式永远不会被进入。

### 修复

**SessionStart 钩子现在同步运行**

在 hooks.json 中将 `async: true` 更改为 `async: false`。当异步时，钩子可能在模型的第一轮之前未能完成，意味着 using-superpowers 指令在第一条消息时不在上下文中。

## v4.2.0 (2026-02-05)

### 破坏性变更

**Codex：用原生技能发现替换 Bootstrap CLI**

`superpowers-codex` bootstrap CLI、Windows `.cmd` 包装器及相关 bootstrap 内容文件已被移除。Codex 现在通过 `~/.agents/skills/superpowers/` 符号链接使用原生技能发现，因此不再需要旧的 `use_skill`/`find_skills` CLI 工具。

安装现在只需 clone + symlink（在 INSTALL.md 中记录）。不需要 Node.js 依赖。旧的 `~/.codex/skills/` 路径已弃用。

### 修复

**Windows：修复了 Claude Code 2.1.x 钩子执行 (#331)**

Claude Code 2.1.x 改变了 Windows 上钩子的执行方式：现在它自动检测命令中的 `.sh` 文件并添加 `bash` 前缀。这破坏了 polyglot 包装器模式，因为 `bash "run-hook.cmd" session-start.sh` 尝试将 .cmd 文件作为 bash 脚本执行。

修复：hooks.json 现在直接调用 session-start.sh。Claude Code 2.1.x 自动处理 bash 调用。还添加了 .gitattributes 以强制 shell 脚本使用 LF 行尾（修复 Windows 检出时的 CRLF 问题）。

**Windows：SessionStart 钩子异步运行以防止终端冻结 (#404, #413, #414, #419)**

同步 SessionStart 钩子在 Windows 上阻止了 TUI 进入原始模式，冻结了所有键盘输入。异步运行钩子防止了冻结，同时仍然注入 superpowers 上下文。

**Windows：修复了 O(n^2) 的 `escape_for_json` 性能**

使用 `${input:$i:1}` 逐字符循环在 bash 中由于子字符串复制开销而成为 O(n^2)。在 Windows Git Bash 上这需要 60 多秒。替换为 bash 参数替换（`${s//old/new}`），每个模式作为单次 C 级遍历运行——在 macOS 上快 7 倍，在 Windows 上大幅更快。

**Codex：修复了 Windows/PowerShell 调用 (#285, #243)**

- Windows 不遵循 shebangs，因此直接调用无扩展名的 `superpowers-codex` 脚本会触发"打开方式"对话框。所有调用现在以 `node` 为前缀。
- 修复了 Windows 上的 `~/` 路径展开——PowerShell 在将 `~` 作为参数传递给 `node` 时不展开它。改为 `$HOME`，在 bash 和 PowerShell 中都能正确展开。

**Codex：修复了安装程序中的路径解析**

使用 `fileURLToPath()` 而不是手动解析 URL 路径名，以正确处理所有平台上包含空格和特殊字符的路径。

**Codex：修复了 writing-skills 中过时的技能路径**

将 `~/.codex/skills/` 引用（已弃用）更新为 `~/.agents/skills/` 以用于原生发现。

### 改进

**实现前现在需要 Worktree 隔离**

为 `subagent-driven-development` 和 `executing-plans` 添加了 `using-git-worktrees` 作为必需技能。实现工作流现在显式要求在开始工作之前设置隔离的 worktree，防止意外直接在 main 上工作。

**主分支保护软化为需要明确同意**

技能不再完全禁止在 main 分支上工作，而是允许在用户明确同意的情况下进行。更灵活，同时仍确保用户了解影响。

**简化安装验证**

从验证步骤中移除了 `/help` 命令检查和特定斜杠命令列表。技能主要通过描述你想做的事来调用，而不是通过运行特定命令。

**Codex：在 bootstrap 中澄清了 subagent 工具映射**

改进了 Codex 工具如何映射到 Claude Code 等效项以用于 subagent 工作流的文档。

### 测试

- 为 subagent-driven-development 添加了 worktree 需求测试
- 添加了 main 分支红色标志警告测试
- 修复了技能识别测试断言中的大小写敏感问题

---

## v4.1.1 (2026-01-23)

### 修复

**OpenCode：按官方文档标准化为 `plugins/` 目录 (#343)**

OpenCode 的官方文档使用 `~/.config/opencode/plugins/`（复数）。我们的文档此前使用 `plugin/`（单数）。虽然 OpenCode 接受两种形式，但我们已按官方约定进行了标准化以避免混淆。

变更：
- 在仓库结构中将 `.opencode/plugin/` 重命名为 `.opencode/plugins/`
- 更新了所有安装文档（INSTALL.md、README.opencode.md）跨所有平台
- 更新了测试脚本以匹配

**OpenCode：修复了符号链接指令 (#339, #342)**

- 在 `ln -s` 之前添加了显式的 `rm`（修复重新安装时"文件已存在"的错误）
- 添加了 INSTALL.md 中缺失的技能符号链接步骤
- 从已弃用的 `use_skill`/`find_skills` 更新为原生 `skill` 工具引用

---

## v4.1.0 (2026-01-23)

### 破坏性变更

**OpenCode：切换到原生技能系统**

Superpowers for OpenCode 现在使用 OpenCode 的原生 `skill` 工具，而不是自定义的 `use_skill`/`find_skills` 工具。这是一个更干净的集成，与 OpenCode 内置的技能发现配合使用。

**需要迁移：** 技能必须符号链接到 `~/.config/opencode/skills/superpowers/`（见更新后的安装文档）。

### 修复

**OpenCode：修复了会话启动时的 agent 重置 (#226)**

以前使用 `session.prompt({ noReply: true })` 的 bootstrap 注入方法导致 OpenCode 在第一条消息时将所选 agent 重置为"build"。现在使用 `experimental.chat.system.transform` 钩子，直接修改系统提示而不会产生副作用。

**OpenCode：修复了 Windows 安装 (#232)**

- 移除了对 `skills-core.js` 的依赖（消除了文件被复制而不是符号链接时损坏的相对导入）
- 为 cmd.exe、PowerShell 和 Git Bash 添加了全面的 Windows 安装文档
- 为每个平台记录了正确的 symlink vs junction 使用

**Claude Code：修复了 Claude Code 2.1.x 的 Windows 钩子执行**

Claude Code 2.1.x 改变了 Windows 上钩子的执行方式：现在它自动检测命令中的 `.sh` 文件并添加 `bash` 前缀。这破坏了 polyglot 包装器模式，因为 `bash "run-hook.cmd" session-start.sh` 尝试将 .cmd 文件作为 bash 脚本执行。

修复：hooks.json 现在直接调用 session-start.sh。Claude Code 2.1.x 自动处理 bash 调用。还添加了 .gitattributes 以强制 shell 脚本使用 LF 行尾（修复 Windows 检出时的 CRLF 问题）。

---

## v4.0.3 (2025-12-26)

### 改进

**强化 using-superpowers 技能以应对显式技能请求**

解决了一个失败模式：即使用户按名称显式请求了技能（例如"subagent-driven-development, please"），Claude 也会跳过调用技能。Claude 会认为"我知道那是什么意思"并直接开始工作，而不是加载技能。

变更：
- 将"The Rule"更新为"Invoke relevant or requested skills"而不仅是"Check for skills"——强调主动调用而非被动检查
- 添加了"BEFORE any response or action"——原始措辞只提到了"response"，但 Claude 有时会在不先回应的情况下采取行动
- 添加了 reassurance：调用错误的技能也没关系——减少犹豫
- 添加了新的红色标志："I know what that means" → 知道概念 ≠ 使用技能

**添加了显式技能请求测试**

`tests/explicit-skill-requests/` 中的新测试套件，验证 Claude 在用户按名称请求技能时正确调用它们。包含单轮和多轮测试场景。

## v4.0.2 (2025-12-23)

### 修复

**斜杠命令现在仅限用户使用**

为所有三个斜杠命令（`/brainstorm`、`/execute-plan`、`/write-plan`）添加了 `disable-model-invocation: true`。Claude 不再能通过 Skill 工具调用这些命令——它们仅限于用户手动调用。

底层技能（`superpowers:brainstorming`、`superpowers:executing-plans`、`superpowers:writing-plans`）仍然可供 Claude 自主调用。此更改防止了 Claude 调用一个只是重定向到技能的命令时产生的混淆。

## v4.0.1 (2025-12-23)

### 修复

**澄清了如何在 Claude Code 中访问技能**

修复了一个令人困惑的模式：Claude 会通过 Skill 工具调用技能，然后又尝试单独 Read 技能文件。`using-superpowers` 技能现在明确指出 Skill 工具直接加载技能内容——不需要读取文件。

- 为 `using-superpowers` 添加了"How to Access Skills"章节
- 在指令中将"read the skill"改为"invoke the skill"
- 更新了斜杠命令以使用完全限定技能名称（例如 `superpowers:brainstorming`）

**为 receiving-code-review 添加了 GitHub 线程回复指导** (h/t @ralphbean)

添加了一条关于在原始线程中回复内联审查评论而不是作为顶级 PR 评论的说明。

**为 writing-skills 添加了自动化优于文档化的指导** (h/t @EthanJStark)

添加了指导：机械性约束应该被自动化，而不是被文档化——技能留给需要判断力的决定。

## v4.0.0 (2025-12-17)

### 新功能

**Subagent-driven-development 中的两阶段代码审查**

Subagent 工作流现在在每个任务后使用两个独立的审查阶段：

1. **规格合规性审查** - 持怀疑态度的审查者验证实现是否精确匹配规格。既捕获缺失的需求，也捕获过度构建。不相信 implementer 的报告——会阅读实际代码。

2. **代码质量审查** - 仅在规格合规性通过后才运行。审查代码清洁度、测试覆盖率、可维护性。

这捕获了常见的失败模式：代码写得很好但不符合要求的内容。审查是循环的，不是一次性的：如果审查者发现问题，implementer 修复它们，然后审查者再次检查。

其他 subagent 工作流改进：
- 控制器向 worker 提供完整任务文本（而非文件引用）
- Worker 可以在工作之前和工作期间提出澄清问题
- 完成报告前的自我审查检查清单
- 计划在开始时读取一次，提取到 TodoWrite

`skills/subagent-driven-development/` 中的新 prompt 模板：
- `implementer-prompt.md` - 包含自我审查检查清单，鼓励提问
- `spec-reviewer-prompt.md` - 针对需求的持怀疑态度的验证
- `code-quality-reviewer-prompt.md` - 标准代码审查

**调试技术与工具整合**

`systematic-debugging` 现在捆绑了支持技术和工具：
- `root-cause-tracing.md` - 通过调用栈向后追溯 bug
- `defense-in-depth.md` - 在多个层添加验证
- `condition-based-waiting.md` - 用条件轮询替换任意超时
- `find-polluter.sh` - 查找哪个测试创建污染的二分查找脚本
- `condition-based-waiting-example.ts` - 来自真实调试会话的完整实现

**测试反模式参考**

`test-driven-development` 现在包含 `testing-anti-patterns.md`，涵盖：
- 测试 mock 行为而非真实行为
- 向生产类添加仅用于测试的方法
- 在不理解依赖的情况下进行 mock
- 隐藏结构假设的不完整 mock

**技能测试基础设施**

用于验证技能行为的三个新测试框架：

`tests/skill-triggering/` - 验证技能从朴素的提示中触发而无需显式命名。测试 6 个技能以确保描述本身足够。

`tests/claude-code/` - 使用 `claude -p` 进行无头测试的集成测试。通过会话转录（JSONL）分析验证技能使用。包含用于成本追踪的 `analyze-token-usage.py`。

`tests/subagent-driven-dev/` - 端到端工作流验证与两个完整测试项目：
- `go-fractals/` - 具有 Sierpinski/Mandelbrot 的 CLI 工具（10 个任务）
- `svelte-todo/` - 具有 localStorage 和 Playwright 的 CRUD 应用（12 个任务）

### 主要变更

**DOT 流程图作为可执行规格**

使用 DOT/GraphViz 流程图重写了关键技能，将其作为权威的流程定义。散文成为支持性内容。

**描述陷阱**（在 `writing-skills` 中记录）：发现当描述包含工作流摘要时，技能描述会覆盖流程图内容。Claude 遵循简短描述，而不是阅读详细的流程图。修复：描述必须仅用于触发（"Use when X"），不包含流程细节。

**Using-superpowers 中的技能优先级**

当多个技能适用时，流程技能（brainstorming、debugging）现在明确排在实现技能之前。"Build X"首先触发 brainstorming，然后是领域技能。

**Brainstorming 触发强化**

描述改为祈使句："你必须在任何创造性工作之前使用此技能——创建功能、构建组件、添加功能或修改行为。"

### 破坏性变更

**技能整合** - 六个独立技能合并：
- `root-cause-tracing`、`defense-in-depth`、`condition-based-waiting` → 捆绑在 `systematic-debugging/` 中
- `testing-skills-with-subagents` → 捆绑在 `writing-skills/` 中
- `testing-anti-patterns` → 捆绑在 `test-driven-development/` 中
- `sharing-skills` 已移除（已过时）

### 其他改进

- **render-graphs.js** - 从技能中提取 DOT 图表并渲染为 SVG 的工具
- **using-superpowers 中的 Rationalizations 表格** - 可扫描格式，包含新条目："I need more context first"、"Let me explore first"、"This feels productive"
- **docs/testing.md** - 使用 Claude Code 集成测试测试技能的指南

---

## v3.6.2 (2025-12-03)

### 修复

- **Linux 兼容性**：修复了 polyglot 钩子包装器（`run-hook.cmd`）以使用 POSIX 兼容语法
  - 在第 16 行将 bash 特定的 `${BASH_SOURCE[0]:-$0}` 替换为标准 `$0`
  - 解决了 Ubuntu/Debian 系统上 `/bin/sh` 是 dash 时的"Bad substitution"错误
  - 修复 #141

---

## v3.5.1 (2025-11-24)

### 变更

- **OpenCode Bootstrap 重构**：从 `chat.message` 钩子切换到 `session.created` 事件进行 bootstrap 注入
  - Bootstrap 现在在会话创建时通过 `session.prompt()` 注入，带有 `noReply: true`
  - 明确告知模型 using-superpowers 已加载，以防止冗余的技能加载
  - 将 bootstrap 内容生成合并到共享的 `getBootstrapContent()` 辅助函数中
  - 更简洁的单一实现方法（移除了回退模式）

---

## v3.5.0 (2025-11-23)

### 新增

- **OpenCode 支持**：为 OpenCode.ai 的原生 JavaScript 插件
  - 自定义工具：`use_skill` 和 `find_skills`
  - 消息插入模式，使技能在上下文压缩后仍然存在
  - 通过 chat.message 钩子自动注入上下文
  - 在 session.compacted 事件上自动重新注入
  - 三级技能优先级：项目 > 个人 > superpowers
  - 项目本地技能支持（`.opencode/skills/`）
  - 共享核心模块（`lib/skills-core.js`）用于与 Codex 共享代码
  - 具有适当隔离的自动化测试套件（`tests/opencode/`）
  - 平台特定文档（`docs/README.opencode.md`、`docs/README.codex.md`）

### 变更

- **重构 Codex 实现**：现在使用共享的 `lib/skills-core.js` ES 模块
  - 消除了 Codex 和 OpenCode 之间的代码重复
  - 技能发现和解析的单一真实来源
  - Codex 通过 Node.js 互操作成功加载 ES 模块

- **改进文档**：重写 README 以清晰解释问题/解决方案
  - 移除了重复章节和冲突信息
  - 添加了完整工作流描述（brainstorm → plan → execute → finish）
  - 简化了平台安装说明
  - 强调技能检查协议而非自动激活声明

---

## v3.4.1 (2025-10-31)

### 改进

- 优化 superpowers bootstrap 以消除冗余技能执行。`using-superpowers` 技能内容现在直接在会话上下文中提供，明确指导仅对其他技能使用 Skill 工具。这减少了开销，并防止了 agent 在已经有来自会话启动的内容时还手动执行 `using-superpowers` 的令人困惑的循环。

## v3.4.0 (2025-10-30)

### 改进

- 简化了 `brainstorming` 技能，回归原始的对话愿景。移除了带有正式检查清单的重量级 6 阶段流程，改用自然对话：一次问一个问题，然后以 200-300 字的章节展示设计并进行验证。保留了文档和实现交接功能。

## v3.3.1 (2025-10-28)

### 改进

- 更新了 `brainstorming` 技能，要求在提问前进行自主侦察，鼓励以推荐为驱动的决策，并防止 agent 将优先级排序委托回给人类。
- 按照 Strunk 的"Elements of Style"原则对 `brainstorming` 技能应用了写作清晰度改进（省略不必要的词，将否定形式转为肯定形式，改进平行结构）。

### Bug 修复

- 澄清了 `writing-skills` 指导，使其指向正确的 agent 特定个人技能目录（Claude Code 使用 `~/.claude/skills`，Codex 使用 `~/.codex/skills`）。

## v3.3.0 (2025-10-28)

### 新功能

**实验性 Codex 支持**
- 添加了统一的 `superpowers-codex` 脚本，包含 bootstrap/use-skill/find-skills 命令
- 跨平台 Node.js 实现（可在 Windows、macOS、Linux 上运行）
- 命名空间技能：superpowers 技能使用 `superpowers:skill-name`，个人技能使用 `skill-name`
- 当名称匹配时，个人技能覆盖 superpowers 技能
- 清晰的技能显示：显示名称/描述而不显示原始 frontmatter
- 有用的上下文：为每个技能显示支持文件目录
- Codex 的工具映射：TodoWrite→update_plan、subagents→手动回退等
- 与最小 AGENTS.md 的 Bootstrap 集成以实现自动启动
- 针对 Codex 的完整安装指南和 bootstrap 说明

**与 Claude Code 集成的主要区别：**
- 单一统一脚本而不是独立工具
- 针对 Codex 特定等效项的工具替换系统
- 简化的 subagent 处理（手动工作而非委托）
- 更新术语："Superpowers skills"而非"Core skills"

### 新增文件
- `.codex/INSTALL.md` - Codex 用户安装指南
- `.codex/superpowers-bootstrap.md` - 带有 Codex 适配的 Bootstrap 说明
- `.codex/superpowers-codex` - 包含所有功能的统一 Node.js 可执行文件

**注意：** Codex 支持是实验性的。集成提供了核心 superpowers 功能，但可能需要根据用户反馈进行改进。

## v3.2.3 (2025-10-23)

### 改进

**更新 using-superpowers 技能以使用 Skill 工具而非 Read 工具**
- 将技能调用说明从 Read 工具改为 Skill 工具
- 更新描述："using Read tool" → "using Skill tool"
- 更新第 3 步："Use the Read tool" → "Use the Skill tool to read and run"
- 更新 rationalization 列表："Read the current version" → "Run the current version"

Skill 工具是在 Claude Code 中调用技能的正确机制。此更新将 bootstrap 指令纠正为引导 agent 使用正确的工具。

### 文件变更
- 更新：`skills/using-superpowers/SKILL.md` - 将工具引用从 Read 改为 Skill

## v3.2.2 (2025-10-21)

### 改进

**强化 using-superpowers 技能以对抗 agent 的合理化行为**
- 添加了 EXTREMELY-IMPORTANT 块，其中包含关于强制性技能检查的绝对化语言
  - "If even 1% chance a skill applies, you MUST read it"
  - "You do not have a choice. You cannot rationalize your way out."
- 添加了 MANDATORY FIRST RESPONSE PROTOCOL 检查清单
  - Agent 在任何回应之前必须完成的 5 步流程
  - 明确的"responding without this = failure"后果
- 添加了 Common Rationalizations 章节，包含 8 种特定的规避模式
  - "This is just a simple question" → WRONG
  - "I can check files quickly" → WRONG
  - "Let me gather information first" → WRONG
  - 以及 agent 行为中观察到的另外 5 种常见模式

这些更改解决了 agent 尽管有明确指令仍会对技能使用进行合理化的行为。强硬的措辞和先发制人的反驳旨在使违规更难发生。

### 文件变更
- 更新：`skills/using-superpowers/SKILL.md` - 添加了三层强制执行以防止技能跳过的合理化

## v3.2.1 (2025-10-20)

### 新功能

**代码审查 agent 现在包含在插件中**
- 将 `superpowers:code-reviewer` agent 添加到插件的 `agents/` 目录
- Agent 根据计划和编码标准提供系统化的代码审查
- 此前需要用户具有个人 agent 配置
- 所有技能引用已更新为使用命名空间的 `superpowers:code-reviewer`
- 修复 #55

### 文件变更
- 新增：`agents/code-reviewer.md` - 包含审查检查清单和输出格式的 Agent 定义
- 更新：`skills/requesting-code-review/SKILL.md` - 对 `superpowers:code-reviewer` 的引用
- 更新：`skills/subagent-driven-development/SKILL.md` - 对 `superpowers:code-reviewer` 的引用

## v3.2.0 (2025-10-18)

### 新功能

**Brainstorming 工作流中的设计文档**
- 为 brainstorming 技能添加了阶段 4：设计文档
- 设计文档现在在实现之前写入 `docs/plans/YYYY-MM-DD-<topic>-design.md`
- 恢复了在技能转换过程中丢失的原始 brainstorming 命令的功能
- 文档在 worktree 设置和实现规划之前写入
- 已使用 subagent 测试以验证在时间压力下的合规性

### 破坏性变更

**技能引用命名空间标准化**
- 所有内部技能引用现在使用 `superpowers:` 命名空间前缀
- 更新格式：`superpowers:test-driven-development`（此前仅为 `test-driven-development`）
- 影响所有 REQUIRED SUB-SKILL、RECOMMENDED SUB-SKILL 和 REQUIRED BACKGROUND 引用
- 与使用 Skill 工具调用技能的方式保持一致
- 更新的文件：brainstorming、executing-plans、subagent-driven-development、systematic-debugging、testing-skills-with-subagents、writing-plans、writing-skills

### 改进

**设计与实现计划命名**
- 设计文档使用 `-design.md` 后缀以防止文件名冲突
- 实现计划继续使用现有的 `YYYY-MM-DD-<feature-name>.md` 格式
- 两者都存储在 `docs/plans/` 目录中并有清晰命名区分

## v3.1.1 (2025-10-17)

### Bug 修复

- **修复了 README 中的命令语法** (#44) - 将所有命令引用更新为使用正确的命名空间语法（`/superpowers:brainstorm` 而非 `/brainstorm`）。插件提供的命令由 Claude Code 自动添加命名空间以避免插件之间的冲突。

## v3.1.0 (2025-10-17)

### 破坏性变更

**技能名称标准化为小写**
- 所有技能 frontmatter `name:` 字段现在使用小写 kebab-case，与目录名称匹配
- 示例：`brainstorming`、`test-driven-development`、`using-git-worktrees`
- 所有技能公告和交叉引用已更新为小写格式
- 这确保了目录名称、frontmatter 和文档之间的命名一致性

### 新功能

**增强的 brainstorming 技能**
- 添加了显示阶段、活动和工具使用的快速参考表
- 添加了可复制的用于跟踪进度的工作流检查清单
- 添加了何时重新访问早期阶段的决策流程图
- 添加了带有具体示例的全面 AskUserQuestion 工具指南
- 添加了"Question Patterns"章节，解释何时使用结构化问题与开放式问题
- 将关键原则重构为可扫描的表格

**Anthropic 最佳实践集成**
- 添加了 `skills/writing-skills/anthropic-best-practices.md` - 官方 Anthropic 技能编写指南
- 在 writing-skills SKILL.md 中引用以提供全面指导
- 提供渐进式披露、工作流和评估的模式

### 改进

**技能交叉引用清晰度**
- 所有技能引用现在使用显式需求标记：
  - `**REQUIRED BACKGROUND:**` - 你必须理解的先决条件
  - `**REQUIRED SUB-SKILL:**` - 工作流中必须使用的技能
  - `**Complementary skills:**` - 可选但有用的相关技能
- 移除了旧路径格式（`skills/collaboration/X` → 仅 `X`）
- 使用分类关系更新了集成章节（必需 vs 补充）
- 使用最佳实践更新了交叉引用文档

**与 Anthropic 最佳实践对齐**
- 修复了描述语法和语态（完全第三人称）
- 添加了用于扫描的快速参考表
- 添加了 Claude 可以复制和跟踪的工作流检查清单
- 为非显而易见的决策点适当使用流程图
- 改进了可扫描的表格格式
- 所有技能都远低于 500 行建议

### Bug 修复

- **重新添加缺失的命令重定向** - 恢复了在 v3.0 迁移中意外移除的 `commands/brainstorm.md` 和 `commands/write-plan.md`
- 修复了 `defense-in-depth` 名称不匹配（曾是 `Defense-in-Depth-Validation`）
- 修复了 `receiving-code-review` 名称不匹配（曾是 `Code-Review-Reception`）
- 修复了 `commands/brainstorm.md` 中对正确技能名称的引用
- 移除了对不存在的相关技能的引用

### 文档

**writing-skills 改进**
- 使用显式需求标记更新了交叉引用指导
- 添加了对 Anthropic 官方最佳实践的引用
- 改进了显示正确技能引用格式的示例

## v3.0.1 (2025-10-16)

### 变更

我们现在使用 Anthropic 的第一方技能系统！

## v2.0.2 (2025-10-12)

### Bug 修复

- **修复了本地技能仓库领先于上游时的误报警告** - 初始化脚本在本地仓库有领先于上游的提交时错误地警告"New skills available from upstream"。逻辑现在正确区分三种 git 状态：本地落后（应更新）、本地领先（无警告）和分叉（应警告）。

## v2.0.1 (2025-10-12)

### Bug 修复

- **修复了插件上下文中的 session-start 钩子执行** (#8, PR #9) - 钩子静默失败，出现"Plugin hook error"，阻止技能上下文加载。通过以下方式修复：
  - 在 BASH_SOURCE 在 Claude Code 的执行上下文中未绑定时使用 `${BASH_SOURCE[0]:-$0}` 回退
  - 添加 `|| true` 以优雅地处理在过滤状态标志时的空 grep 结果

---

# Superpowers v2.0.0 发布说明

## 概述

Superpowers v2.0 通过一个重大的架构转变，使技能更易访问、更易维护，并更加社区驱动。

头条变更是**技能仓库分离**：所有技能、脚本和文档已从插件中移到一个专门的仓库（[obra/superpowers-skills](https://github.com/obra/superpowers-skills)）。这将 superpowers 从单体插件转变为一个轻量级的 shim，管理技能仓库的本地克隆。技能在会话启动时自动更新。用户通过标准 git 工作流 fork 并贡献改进。技能库独立于插件进行版本管理。

除了基础设施之外，此版本还添加了九个专注于问题解决、研究和架构的新技能。我们以命令式语气和更清晰的结构重写了核心的 **using-skills** 文档，使 Claude 更容易理解何时以及如何使用技能。**find-skills** 现在输出可直接粘贴到 Read 工具的路径，消除了技能发现工作流中的摩擦。

用户体验无缝操作：插件自动处理克隆、fork 和更新。贡献者发现新架构使改进和分享技能变得简单。此版本为技能作为社区资源快速发展奠定了基础。

## 破坏性变更

### 技能仓库分离

**最大的变化：** 技能不再存在于插件中。它们已移至独立的仓库 [obra/superpowers-skills](https://github.com/obra/superpowers-skills)。

**这对你意味着什么：**

- **首次安装：** 插件自动将技能克隆到 `~/.config/superpowers/skills/`
- **Fork：** 在设置过程中，你将获得 fork 技能仓库的选项（如果安装了 `gh`）
- **更新：** 技能在会话启动时自动更新（尽可能使用 fast-forward）
- **贡献：** 在分支上工作，本地提交，向上游提交 PR
- **不再有遮盖：** 旧的二级系统（个人/核心）替换为单一仓库分支工作流

**迁移：**

如果你有现有安装：
1. 你的旧 `~/.config/superpowers/.git` 将被备份到 `~/.config/superpowers/.git.bak`
2. 旧技能将被备份到 `~/.config/superpowers/skills.bak`
3. obra/superpowers-skills 的全新克隆将被创建在 `~/.config/superpowers/skills/`

### 移除的功能

- **个人 superpowers 覆盖系统** - 替换为 git 分支工作流
- **setup-personal-superpowers 钩子** - 替换为 initialize-skills.sh

## 新功能

### 技能仓库基础设施

**自动克隆与设置** (`lib/initialize-skills.sh`)
- 首次运行时克隆 obra/superpowers-skills
- 如果安装了 GitHub CLI，提供创建 fork 的选项
- 正确设置 upstream/origin 远程
- 处理从旧安装的迁移

**自动更新**
- 在每次会话启动时从跟踪远程获取
- 在可能时使用 fast-forward 自动合并
- 在需要手动同步时（分支分叉）通知
- 使用 pulling-updates-from-skills-repository 技能进行手动同步

### 新技能

**问题解决技能** (`skills/problem-solving/`)
- **collision-zone-thinking** - 将不相关的概念强制碰撞以产生突破性洞察
- **inversion-exercise** - 翻转假设以揭示隐藏的约束
- **meta-pattern-recognition** - 跨领域识别通用原则
- **scale-game** - 在极端条件下测试以揭示基本真理
- **simplification-cascades** - 找到能消除多个组件的洞察
- **when-stuck** - 分派到正确的问题解决技术

**研究技能** (`skills/research/`)
- **tracing-knowledge-lineages** - 理解思想如何随时间演变

**架构技能** (`skills/architecture/`)
- **preserving-productive-tensions** - 保持多种有效方法，而不是强制过早解决

### 技能改进

**using-skills（原 getting-started）**
- 从 getting-started 重命名为 using-skills
- 使用命令式语气完全重写（v4.0.0）
- 将关键规则放在最前面
- 为所有工作流添加了"Why"解释
- 在引用中始终包含 /SKILL.md 后缀
- 更清晰地区分了刚性规则和灵活模式

**writing-skills**
- 交叉引用指导从 using-skills 移入
- 添加了 token 效率章节（字数目标）
- 改进了 CSO（Claude Search Optimization）指导

**sharing-skills**
- 为新的分支和 PR 工作流更新（v2.0.0）
- 移除了个人/核心拆分的引用

**pulling-updates-from-skills-repository**（新增）
- 用于与上游同步的完整工作流
- 替换旧的"updating-skills"技能

### 工具改进

**find-skills**
- 现在输出带有 /SKILL.md 后缀的完整路径
- 使路径可直接用于 Read 工具
- 更新了帮助文本

**skill-run**
- 从 scripts/ 移至 skills/using-skills/
- 改进了文档

### 插件基础设施

**会话启动钩子**
- 现在从技能仓库位置加载
- 在会话启动时显示完整技能列表
- 打印技能位置信息
- 显示更新状态（已成功更新 / 落后于上游）
- 将"技能落后"警告移至输出末尾

**环境变量**
- `SUPERPOWERS_SKILLS_ROOT` 设置为 `~/.config/superpowers/skills`
- 在所有路径中一致使用

## Bug 修复

- 修复了 fork 时的重复 upstream 远程添加
- 修复了 find-skills 输出中的双重 "skills/" 前缀
- 从 session-start 中移除了过时的 setup-personal-superpowers 调用
- 修复了钩子和命令中的路径引用

## 文档

### README
- 针对新技能仓库架构进行了更新
- 指向 superpowers-skills 仓库的显眼链接
- 更新了自动更新描述
- 修复了技能名称和引用
- 更新了元技能列表

### 测试文档
- 添加了全面的测试检查清单（`docs/TESTING-CHECKLIST.md`）
- 创建了用于测试的本地市场配置
- 记录了手动测试场景

## 技术细节

### 文件变更

**新增：**
- `lib/initialize-skills.sh` - 技能仓库初始化和自动更新
- `docs/TESTING-CHECKLIST.md` - 手动测试场景
- `.claude-plugin/marketplace.json` - 本地测试配置

**移除：**
- `skills/` 目录（82 个文件） - 现在在 obra/superpowers-skills 中
- `scripts/` 目录 - 现在在 obra/superpowers-skills/skills/using-skills/ 中
- `hooks/setup-personal-superpowers.sh` - 已过时

**修改：**
- `hooks/session-start.sh` - 从 ~/.config/superpowers/skills 使用技能
- `commands/brainstorm.md` - 更新路径为 SUPERPOWERS_SKILLS_ROOT
- `commands/write-plan.md` - 更新路径为 SUPERPOWERS_SKILLS_ROOT
- `commands/execute-plan.md` - 更新路径为 SUPERPOWERS_SKILLS_ROOT
- `README.md` - 针对新架构全面重写

### 提交历史

此版本包含：
- 20+ 个用于技能仓库分离的提交
- PR #1：受 Amplifier 启发的问题解决和研究技能
- PR #2：个人 superpowers 覆盖系统（后被替换）
- 多次技能改进和文档改进

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
   - 将克隆全新的技能仓库
   - 如果你有 GitHub CLI，你将获得 fork 的选项

4. **迁移个人技能**（如果你有的话）：
   - 在你的本地技能仓库中创建一个分支
   - 从备份中复制你的个人技能
   - 提交并推送到你的 fork
   - 考虑通过 PR 贡献回社区

## 下一步计划

### 对于用户

- 探索新的问题解决技能
- 尝试基于分支的工作流进行技能改进
- 将技能贡献回社区

### 对于贡献者

- 技能仓库现位于 https://github.com/obra/superpowers-skills
- Fork → Branch → PR 工作流
- 参见 skills/meta/writing-skills/SKILL.md 了解 TDD 方法的文档

## 已知问题

目前没有。

## 致谢

- 问题解决技能受 Amplifier 模式启发
- 社区贡献和反馈
- 对技能效果的大量测试和迭代

---

**完整 Changelog：** https://github.com/BigSword123/superpowers-cn/compare/dd013f6...main
**技能仓库：** https://github.com/obra/superpowers-skills
**Issues：** https://github.com/BigSword123/superpowers-cn/issues
