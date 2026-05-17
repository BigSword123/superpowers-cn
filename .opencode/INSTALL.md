# 安装 Superpowers 中文版到 OpenCode

## 前置条件

- 已安装 [OpenCode.ai](https://opencode.ai)

## 安装

将 superpowers-cn 添加到你的 `opencode.json` 的 `plugin` 数组中（全局或项目级别）：

```json
{
  "plugin": ["superpowers-cn@git+https://github.com/BigSword123/superpowers-cn.git"]
}
```

重启 OpenCode。插件将通过 OpenCode 的插件管理器安装并注册所有技能。

验证：询问 "Tell me about your superpowers"

OpenCode 使用自己的插件安装方式。如果你同时使用 Claude Code、Codex 或其他工具，请分别安装 Superpowers。

## 从旧的 symlink 安装方式迁移

如果你之前使用 `git clone` 和 symlink 安装了 superpowers，请移除旧设置：

```bash
# 移除旧 symlink
rm -f ~/.config/opencode/plugins/superpowers.js
rm -rf ~/.config/opencode/skills/superpowers

# 可选：移除克隆的仓库
rm -rf ~/.config/opencode/superpowers

# 如果为 superpowers 添加了 skills.paths，从 opencode.json 移除
```

然后按照上面的安装步骤操作。

## 使用

使用 OpenCode 的原生 `skill` 工具：

```
use skill tool to list skills
use skill tool to load superpowers-cn/brainstorming
```

## 更新

OpenCode 通过 git 支持的包规范安装 Superpowers。某些 OpenCode 和 Bun 版本会将解析后的 git 依赖固定在 lockfile 或缓存中，因此重启可能不会获取到最新的 Superpowers 提交。如果更新未生效，请清除 OpenCode 的包缓存或重新安装插件。

要固定特定版本：

```json
{
  "plugin": ["superpowers-cn@git+https://github.com/BigSword123/superpowers-cn.git#v5.1.0"]
}
```

## 故障排除

### 插件未加载

1. 检查日志：`opencode run --print-logs "hello" 2>&1 | grep -i superpowers`
2. 验证 `opencode.json` 中的插件配置行
3. 确保运行的是最新版本的 OpenCode

### Windows 安装问题

某些 Windows OpenCode 构建版本在 git 支持的插件规范方面存在上游安装问题，包括 `git+https` URL 的缓存路径以及 Bun 找不到 `git.exe` 的问题（即使在普通终端中可以正常使用）。如果 OpenCode 无法安装插件，请尝试使用系统 npm 安装并将 OpenCode 指向本地包：

```powershell
npm install superpowers-cn@git+https://github.com/BigSword123/superpowers-cn.git --prefix "$HOME\.config\opencode"
```

然后在 `opencode.json` 中使用已安装的包路径：

```json
{
  "plugin": ["~/.config/opencode/node_modules/superpowers-cn"]
}
```

### 找不到技能

1. 使用 `skill` 工具列出已发现的技能
2. 检查插件是否正在加载（见上文）

### 工具映射

当技能引用 Claude Code 工具时：
- `TodoWrite` → `todowrite`
- `Task` 配合子代理 → `@mention` 语法
- `Skill` 工具 → OpenCode 原生 `skill` 工具
- 文件操作 → 你的原生工具

## 获取帮助

- 反馈问题：https://github.com/BigSword123/superpowers-cn/issues
- 完整文档：https://github.com/BigSword123/superpowers-cn/blob/main/docs/README.opencode.md
