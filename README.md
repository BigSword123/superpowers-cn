# Superpowers

Superpowers 是一套完整的、为你的编程 agent 设计的软件开发方法论，构建在一组可组合的技能和一些初始指令之上，确保你的 agent 会使用它们。

## 快速开始

赋予你的 agent 超能力：[Claude Code](#claude-code)、[Codex CLI](#codex-cli)、[Codex App](#codex-app)、[Factory Droid](#factory-droid)、[Gemini CLI](#gemini-cli)、[OpenCode](#opencode)、[Cursor](#cursor)、[GitHub Copilot CLI](#github-copilot-cli)。

## 它是如何工作的

从你启动编程 agent 的那一刻起，它就开始了。当它看到你要构建什么东西时，它*不会*直接跳进去写代码。相反，它会后退一步，先问清楚你真正想做的是什么。

一旦它从对话中梳理出一份规格说明，它会将内容分成足够短的小块展示给你，保证你能够阅读和消化。

在你确认设计之后，你的 agent 会制定一份实现计划，这份计划清晰到连一个热情但品味差、没有判断力、不了解项目上下文且讨厌测试的初级工程师都能遵循。它强调真正的 RED-GREEN-REFACTOR TDD、YAGNI（你不会需要它）和 DRY 原则。

接下来，当你说"开始"之后，它会启动一个*subagent-driven-development*流程，让 agent 逐一完成每个工程任务，检查和审查它们的工作，然后继续推进。Claude 能够自主工作数小时而不偏离你们共同制定的计划，这并不罕见。

还有很多其他功能，但这就是系统的核心。而且由于技能会自动触发，你不需要做任何特别的事情。你的编程 agent 直接拥有了 Superpowers。


## 赞助

如果 Superpowers 帮你做了能赚钱的事情，并且你愿意的话，我非常感激你能考虑[赞助我的开源工作](https://github.com/sponsors/obra)。

谢谢！

- Jesse


## 安装

安装方式因 harness 而异。如果你使用多个 harness，请分别安装 Superpowers。

### Claude Code

Superpowers 可通过[官方 Claude 插件市场](https://claude.com/plugins/superpowers)获取。

#### 官方市场

- 从 Anthropic 的官方市场安装插件：

  ```bash
  /plugin install superpowers@claude-plugins-official
  ```

#### Superpowers 市场

Superpowers 市场为 Claude Code 提供 Superpowers 和其他一些相关插件。

- 注册市场：

  ```bash
  /plugin marketplace add obra/superpowers-marketplace
  ```

- 从此市场安装插件：

  ```bash
  /plugin install superpowers@superpowers-marketplace
  ```

### Codex CLI

Superpowers 可通过[官方 Codex 插件市场](https://github.com/openai/plugins)获取。

- 打开插件搜索界面：

  ```bash
  /plugins
  ```

- 搜索 Superpowers：

  ```bash
  superpowers
  ```

- 选择 `Install Plugin`。

### Codex App

Superpowers 可通过[官方 Codex 插件市场](https://github.com/openai/plugins)获取。

- 在 Codex 应用中，点击侧边栏中的 Plugins。
- 你应该能在 Coding 部分看到 `Superpowers`。
- 点击 Superpowers 旁边的 `+` 并按照提示操作。

### Factory Droid

- 注册市场：

  ```bash
  droid plugin marketplace add https://github.com/obra/superpowers
  ```

- 安装插件：

  ```bash
  droid plugin install superpowers@superpowers
  ```

### Gemini CLI

- 安装扩展：

  ```bash
  gemini extensions install https://github.com/obra/superpowers
  ```

- 后续更新：

  ```bash
  gemini extensions update superpowers
  ```

### OpenCode

OpenCode 使用自己的插件安装方式；即使你已经在其他 harness 中使用 Superpowers，也需要单独安装。

- 告诉 OpenCode：

  ```
  Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.opencode/INSTALL.md
  ```

- 详细文档：[docs/README.opencode.md](docs/README.opencode.md)

### Cursor

- 在 Cursor Agent 聊天中，从市场安装：

  ```text
  /add-plugin superpowers
  ```

- 或在插件市场中搜索 "superpowers"。

### GitHub Copilot CLI

- 注册市场：

  ```bash
  copilot plugin marketplace add obra/superpowers-marketplace
  ```

- 安装插件：

  ```bash
  copilot plugin install superpowers@superpowers-marketplace
  ```

## 基本工作流

1. **brainstorming** - 在编写代码前激活。通过提问提炼粗略想法，探索替代方案，分节展示设计以进行验证。保存设计文档。

2. **using-git-worktrees** - 在设计获批后激活。在新分支上创建隔离的工作空间，运行项目设置，验证干净的测试基线。

3. **writing-plans** - 在拥有获批设计后激活。将工作拆分为小而精的任务（每个 2-5 分钟）。每个任务都有确切的文件路径、完整的代码和验证步骤。

4. **subagent-driven-development** 或 **executing-plans** - 在拥有计划后激活。为每个任务分派全新的 subagent，进行两阶段审查（规格合规性，然后是代码质量），或分批执行并设置人工检查点。

5. **test-driven-development** - 在实现过程中激活。强制遵循 RED-GREEN-REFACTOR：编写失败的测试，看到它失败，编写最少的代码，看到它通过，提交。删除在测试之前写的代码。

6. **requesting-code-review** - 在任务之间激活。对照计划进行审查，按严重程度报告问题。严重问题会阻止进展。

7. **finishing-a-development-branch** - 当任务完成后激活。验证测试，提供选项（merge/PR/保留/丢弃），清理 worktree。

**Agent 在执行任何任务之前都会检查相关技能。** 这是强制性工作流，不是建议。

## 包含的内容

### 技能库

**测试**
- **test-driven-development** - RED-GREEN-REFACTOR 循环（包含测试反模式参考）

**调试**
- **systematic-debugging** - 四阶段根因分析流程（包含 root-cause-tracing、defense-in-depth、condition-based-waiting 技术）
- **verification-before-completion** - 确保问题确实已修复

**协作**
- **brainstorming** - 苏格拉底式设计提炼
- **writing-plans** - 详细的实现计划
- **executing-plans** - 分批执行并设置检查点
- **dispatching-parallel-agents** - 并发的 subagent 工作流
- **requesting-code-review** - 审查前检查清单
- **receiving-code-review** - 回应审查反馈
- **using-git-worktrees** - 并行开发分支
- **finishing-a-development-branch** - Merge/PR 决策工作流
- **subagent-driven-development** - 快速迭代与两阶段审查（规格合规性，然后是代码质量）

**元技能**
- **writing-skills** - 遵循最佳实践创建新技能（包含测试方法论）
- **using-superpowers** - 技能系统介绍

## 哲学

- **测试驱动开发** - 始终先写测试
- **系统化优于临时** - 流程优于猜测
- **降低复杂性** - 简单性是首要目标
- **证据优于声明** - 在声明成功之前先验证

阅读[原始发布公告](https://blog.fsck.com/2025/10/09/superpowers/)。

## 贡献

以下是 Superpowers 的一般贡献流程。请注意，我们通常不接受新技能的贡献，并且任何对技能的更新都必须在我们支持的所有编程 agent 上都能正常工作。

1. Fork 本仓库
2. 切换到 'dev' 分支
3. 为你的工作创建分支
4. 遵循 `writing-skills` 技能来创建和测试新的和修改后的技能
5. 提交 PR，确保填写 pull request 模板。

完整指南见 `skills/writing-skills/SKILL.md`。

## 更新

Superpowers 的更新在一定程度上取决于具体的编程 agent，但通常是自动的。

## 许可证

MIT 许可证 - 详见 LICENSE 文件

## 社区

Superpowers 由 [Jesse Vincent](https://blog.fsck.com) 和 [Prime Radiant](https://primeradiant.com) 的其他成员共同构建。

- **Discord**：[加入我们](https://discord.gg/35wsABTejz) 获取社区支持、提问和分享你使用 Superpowers 构建的项目
- **Issues**：https://github.com/BigSword123/superpowers-cn/issues
- **发布公告**：[注册](https://primeradiant.com/superpowers/) 以获取新版本通知

---

> **关于本仓库**：本项目是 [obra/superpowers](https://github.com/obra/superpowers) 的中文翻译版，由 BigSword123 维护。原项目归属于 [Jesse Vincent](https://blog.fsck.com) 和 [Prime Radiant](https://primeradiant.com)。如需安装使用，请参考上方安装说明（指向原项目）。如需反馈中文翻译相关问题，请在 [Issues](https://github.com/BigSword123/superpowers-cn/issues) 中提出。
