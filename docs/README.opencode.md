# OpenCode 版 Superpowers

在 [OpenCode.ai](https://opencode.ai) 中使用 Superpowers 的完整指南。

## 安装

将 superpowers 添加到 `opencode.json` 中的 `plugin` 数组（全局或项目级均可）：

```json
{
  "plugin": ["superpowers@git+https://github.com/BigSword123/superpowers-cn.git"]
}
```

重启 OpenCode。该插件通过 OpenCode 的插件管理器安装并注册所有技能。

通过询问以下内容进行验证："Tell me about your superpowers"

OpenCode 使用自己的插件安装机制。如果你同时使用 Claude Code、Codex 或其他 harness，请为每个工具单独安装 Superpowers。

### 从旧的符号链接安装方式迁移

如果你之前使用 `git clone` 和符号链接安装了 superpowers，请移除旧设置：

```bash
# 移除旧的符号链接
rm -f ~/.config/opencode/plugins/superpowers.js
rm -rf ~/.config/opencode/skills/superpowers

# 可选：移除克隆的仓库
rm -rf ~/.config/opencode/superpowers

# 如果你在 opencode.json 中为 superpowers 添加了 skills.paths，也请一并移除
```

然后按照上述安装步骤操作。

## 使用方法

### 查找技能

使用 OpenCode 原生的 `skill` 工具列出所有可用技能：

```
use skill tool to list skills
```

### 加载技能

```
use skill tool to load superpowers/brainstorming
```

### 个人技能

在 `~/.config/opencode/skills/` 中创建你自己的技能：

```bash
mkdir -p ~/.config/opencode/skills/my-skill
```

创建 `~/.config/opencode/skills/my-skill/SKILL.md`：

```markdown
---
name: my-skill
description: 当 [条件] 时使用 - [功能描述]
---

# 我的技能

[在此处填写你的技能内容]
```

### 项目级技能

在项目的 `.opencode/skills/` 目录中创建特定于项目的技能。

**技能优先级：** 项目技能 > 个人技能 > Superpowers 技能

## 更新

OpenCode 通过 git 支持的包规格安装 Superpowers。某些 OpenCode 和 Bun 版本会将已解析的 git 依赖锁定在 lockfile 或缓存中，因此重启后可能不会获取最新的 Superpowers 提交。如果更新未生效，请清除 OpenCode 的包缓存或重新安装插件。

要锁定特定版本，请使用分支或标签：

```json
{
  "plugin": ["superpowers@git+https://github.com/BigSword123/superpowers-cn.git#v5.0.3"]
}
```

## 工作原理

该插件做了两件事：

1. **注入引导上下文**：通过 `experimental.chat.system.transform` 钩子，在每个对话中添加 superpowers 的感知能力。
2. **注册技能目录**：通过 `config` 钩子，使 OpenCode 能够发现所有 superpowers 技能，无需符号链接或手动配置。

### 工具映射

为 Claude Code 编写的技能会自动适配到 OpenCode：

- `TodoWrite` → `todowrite`
- `Task` 与子智能体 → OpenCode 的 `@mention` 系统
- `Skill` 工具 → OpenCode 原生的 `skill` 工具
- 文件操作 → OpenCode 原生工具

## 故障排除

### 插件未加载

1. 检查 OpenCode 日志：`opencode run --print-logs "hello" 2>&1 | grep -i superpowers`
2. 确认 `opencode.json` 中的插件配置行正确无误
3. 确保你运行的是较新版本的 OpenCode

### Windows 安装问题

某些 Windows 版本的 OpenCode 存在上游安装程序问题，涉及 git 支持的插件规格，包括 `git+https` URL 的缓存路径以及 Bun 在普通终端中能找到 `git.exe` 但在此处无法找到的情况。如果 OpenCode 无法安装插件，请尝试使用系统 npm 安装，并让 OpenCode 指向本地包：

```powershell
npm install superpowers@git+https://github.com/BigSword123/superpowers-cn.git --prefix "$HOME\.config\opencode"
```

然后在 `opencode.json` 中使用已安装的包路径：

```json
{
  "plugin": ["~/.config/opencode/node_modules/superpowers"]
}
```

### 找不到技能

1. 使用 OpenCode 的 `skill` 工具列出可用技能
2. 检查插件是否正在加载（见上文）
3. 每个技能都需要一个带有有效 YAML frontmatter 的 `SKILL.md` 文件

### 引导内容未出现

1. 检查 OpenCode 版本是否支持 `experimental.chat.system.transform` 钩子
2. 更改配置后重启 OpenCode

## 获取帮助

- 报告问题：https://github.com/BigSword123/superpowers-cn/issues
- 主文档：https://github.com/BigSword123/superpowers-cn
- OpenCode 文档：https://opencode.ai/docs/
