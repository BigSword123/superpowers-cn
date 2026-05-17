# Superpowers 中文版

> **声明**：本项目仅供学习测试使用，是 [obra/superpowers](https://github.com/obra/superpowers) 的中文翻译版，仅支持 Claude Code 平台，不保证与原项目同步更新。

Superpowers 是一套完整的、为你的 Claude Code 智能体设计的软件开发方法论，构建在一组可组合的技能和一些初始指令之上，确保你的 agent 会使用它们。

## 快速开始

赋予你的 Claude Code 智能体超能力，安装后即可使用。

## 它是如何工作的

从你启动 Claude Code 的那一刻起，它就开始了。当它看到你要构建什么东西时，它*不会*直接跳进去写代码。相反，它会后退一步，先问清楚你真正想做的是什么。

一旦它从对话中梳理出一份规格说明，它会将内容分成足够短的小块展示给你，保证你能够阅读和消化。

在你确认设计之后，你的 agent 会制定一份实现计划，这份计划清晰到连一个热情但品味差、没有判断力、不了解项目上下文且讨厌测试的初级工程师都能遵循。它强调真正的 RED-GREEN-REFACTOR TDD、YAGNI（你不会需要它）和 DRY 原则。

接下来，当你说"开始"之后，它会启动一个*subagent-driven-development*流程，让 agent 逐一完成每个工程任务，检查和审查它们的工作，然后继续推进。Claude 能够自主工作数小时而不偏离你们共同制定的计划，这并不罕见。

还有很多其他功能，但这就是系统的核心。而且由于技能会自动触发，你不需要做任何特别的事情。你的 Claude Code 直接拥有了 Superpowers。

## 安装

### 从 GitHub 安装

```bash
# 在 Claude Code 中执行
/plugin marketplace add BigSword123/superpowers-cn
/plugin install superpowers-cn@superpowers-cn
```

### 本地安装

```bash
git clone https://github.com/BigSword123/superpowers-cn.git
cd superpowers-cn
# 在 Claude Code 中注册本地市场后安装
/plugin marketplace add ./superpowers-cn
/plugin install superpowers-cn@superpowers-cn-dev
```

## 基本工作流

1. **brainstorming** - 在编写代码前激活。通过提问提炼粗略想法，探索替代方案，分节展示设计以进行验证。保存设计文档。

2. **using-git-worktrees** - 在设计获批后激活。在新分支上创建隔离的工作空间，运行项目设置，验证干净的测试基线。

3. **writing-plans** - 在拥有获批设计后激活。将工作拆分为小而精的任务（每个 2-5 分钟）。每个任务都有确切的文件路径、完整的代码和验证步骤。

4. **subagent-driven-development** 或 **executing-plans** - 在拥有计划后激活。为每个任务分派全新的 subagent，进行两阶段审查（规格合规性，然后是代码质量），或分批执行并设置人工检查点。

5. **test-driven-development** - 在实现过程中激活。强制遵循 RED-GREEN-REFACTOR：编写失败的测试，看到它失败，编写最少的代码，看到它通过，提交。删除在测试之前写的代码。

6. **requesting-code-review** - 在任务之间激活。对照计划进行审查，按严重程度报告问题。严重问题会阻止进展。

7. **finishing-a-development-branch** - 当任务完成后激活。验证测试，提供选项（merge/PR/保留/丢弃），清理 worktree。

**智能体在执行任何任务之前都会检查相关技能。** 这是强制性工作流，不是建议。

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

## 许可证

MIT 许可证 - 详见 LICENSE 文件

---

> **关于本仓库**：本项目是 [obra/superpowers](https://github.com/obra/superpowers) 的中文翻译版，由 BigSword123 维护，仅支持 Claude Code。原项目归属于 [Jesse Vincent](https://blog.fsck.com)。
