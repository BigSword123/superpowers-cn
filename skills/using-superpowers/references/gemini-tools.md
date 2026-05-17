# Gemini CLI 工具映射

技能文档使用的是 Claude Code 工具名称。当你在技能中遇到这些，请使用你平台的等效工具：

| 技能引用 | Gemini CLI 等效工具 |
|-----------------|----------------------|
| `Read`（文件读取） | `read_file` |
| `Write`（文件创建） | `write_file` |
| `Edit`（文件编辑） | `replace` |
| `Bash`（运行命令） | `run_shell_command` |
| `Grep`（搜索文件内容） | `grep_search` |
| `Glob`（按名称搜索文件） | `glob` |
| `TodoWrite`（任务跟踪） | `write_todos` |
| `Skill` 工具（调用技能） | `activate_skill` |
| `WebSearch` | `google_web_search` |
| `WebFetch` | `web_fetch` |
| `Task` 工具（派发子代理） | `@agent-name`（参见[子代理支持](#子代理支持)） |

## 子代理支持

Gemini CLI 通过 `@` 语法原生支持子代理。使用内置的 `@generalist` 智能体来派发任何任务——它可以访问所有工具并遵循你提供的提示词。

当技能要求派发一个命名智能体类型时，使用 `@generalist` 并附上技能提示模板中的完整提示词：

| 技能指令 | Gemini CLI 等效方式 |
|-------------------|----------------------|
| `Task 工具 (superpowers:implementer)` | `@generalist` 配合填充好的 `implementer-prompt.md` 模板 |
| `Task 工具 (superpowers:spec-reviewer)` | `@generalist` 配合填充好的 `spec-reviewer-prompt.md` 模板 |
| `Task 工具 (superpowers:code-reviewer)` | `@code-reviewer`（内置智能体）或 `@generalist` 配合填充好的审查提示词 |
| `Task 工具 (superpowers:code-quality-reviewer)` | `@generalist` 配合填充好的 `code-quality-reviewer-prompt.md` 模板 |
| `Task 工具 (general-purpose)` 配合内联提示词 | `@generalist` 配合你的内联提示词 |

### 提示词填充

技能提供的提示模板包含占位符，如 `{WHAT_WAS_IMPLEMENTED}` 或 `[FULL TEXT of task]`。填充所有占位符并将完整的提示词作为消息传递给 `@generalist`。提示模板本身包含了智能体的角色、审查标准和预期输出格式——`@generalist` 会遵循它。

### 并行派发

Gemini CLI 支持并行派发子代理。当技能要求你并行派发多个独立的子代理任务时，在同一个提示词中一起请求所有这些 `@generalist` 或命名子代理任务。保持依赖任务顺序执行，但不要仅仅为了保留更简单的历史记录而将独立的子代理任务串行化。

## 额外的 Gemini CLI 工具

这些工具在 Gemini CLI 中可用，但在 Claude Code 中没有等效工具：

| 工具 | 用途 |
|------|---------|
| `list_directory` | 列出文件和子目录 |
| `save_memory` | 跨会话将事实持久化到 GEMINI.md |
| `ask_user` | 向用户请求结构化输入 |
| `tracker_create_task` | 丰富的任务管理（创建、更新、列出、可视化） |
| `enter_plan_mode` / `exit_plan_mode` | 在进行更改前切换到只读研究模式 |
