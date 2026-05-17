# Codex 工具映射

技能文档使用的是 Claude Code 工具名称。当你在技能中遇到这些，请使用你平台的等效工具：

| 技能引用 | Codex 等效工具 |
|-----------------|------------------|
| `Task` 工具（派发子代理） | `spawn_agent`（参见[子代理派发需要多代理支持](#子代理派发需要多代理支持)） |
| 多个 `Task` 调用（并行） | 多个 `spawn_agent` 调用 |
| Task 返回结果 | `wait_agent` |
| Task 自动完成 | `close_agent` 释放槽位 |
| `TodoWrite`（任务跟踪） | `update_plan` |
| `Skill` 工具（调用技能） | 技能原生加载——直接遵循指令即可 |
| `Read`、`Write`、`Edit`（文件操作） | 使用你的原生文件工具 |
| `Bash`（运行命令） | 使用你的原生 shell 工具 |

## 子代理派发需要多代理支持

添加到你的 Codex 配置（`~/.codex/config.toml`）：

```toml
[features]
multi_agent = true
```

这将启用 `spawn_agent`、`wait_agent` 和 `close_agent`，用于 `dispatching-parallel-agents` 和 `subagent-driven-development` 等技能。

遗留说明：`rust-v0.115.0` 之前的 Codex 构建版本将子代理等待功能暴露为 `wait`。当前 Codex 使用 `wait_agent` 来等待子代理。`wait` 名称现在属于代码模式的 `exec/wait`，用于通过 `cell_id` 恢复一个挂起的 exec 单元；它不是子代理结果工具。

## 环境检测

创建 worktree 或完成分支的技能应在继续之前使用只读 git 命令检测其环境：

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
BRANCH=$(git branch --show-current)
```

- `GIT_DIR != GIT_COMMON` → 已在一个关联的 worktree 中（跳过创建）
- `BRANCH` 为空 → 分离 HEAD（无法在沙箱中进行分支/推送/PR）

参见 `using-git-worktrees` 第 0 步和 `finishing-a-development-branch` 第 1 步，了解每个技能如何使用这些信号。

## Codex App 收尾

当沙箱阻止分支/推送操作时（在外部管理的 worktree 中处于分离 HEAD 状态），智能体会提交所有工作并告知用户使用 App 的原生控件：

- **"Create branch"** — 命名分支，然后通过 App UI 提交/推送/PR
- **"Hand off to local"** — 将工作转移到用户的本地检出

智能体仍然可以运行测试、暂存文件，并输出建议的分支名称、提交信息和 PR 描述供用户复制使用。
