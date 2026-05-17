---
name: using-git-worktrees
description: 当开始需要与当前工作区隔离的功能开发时使用，或在执行实施计划之前——通过原生工具或 git worktree 回退方案确保隔离工作区的存在
---

# 使用 Git Worktrees

## 概览

确保工作在隔离的工作区中进行。优先使用 EnterWorktree 原生工具。仅在没有原生工具可用时才回退到手动 git worktree。

**核心原则：** 先检测已有的隔离。然后使用原生工具。然后回退到 git。绝不要与 Claude Code 对抗。

**开始时声明：** "我正在使用 using-git-worktrees 技能来设置隔离的工作区。"

## 步骤 0：检测已有隔离

**在创建任何东西之前，检查你是否已经在一个隔离的工作区中。**

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
BRANCH=$(git branch --show-current)
```

**子模块防护：** `GIT_DIR != GIT_COMMON` 在 git 子模块内部也为真。在得出"已在 worktree 中"的结论之前，验证你不在子模块中：

```bash
# 如果返回路径，你在子模块中而非 worktree——视为普通仓库
git rev-parse --show-superproject-working-tree 2>/dev/null
```

**如果 `GIT_DIR != GIT_COMMON`（且不在子模块中）：** 你已在一个链接的 worktree 中。跳到步骤 3（项目设置）。不要创建另一个 worktree。

根据分支状态报告：
- 在分支上："已在隔离的工作区中，位于 `<path>`，分支 `<name>`。"
- Detached HEAD："已在隔离的工作区中，位于 `<path>`（detached HEAD，外部管理）。完成时需要创建分支。"

**如果 `GIT_DIR == GIT_COMMON`（或在子模块中）：** 你在一个普通仓库检出中。

用户是否已在指令中表明了 worktree 偏好？如果没有，在创建 worktree 之前请求同意：

> "你想要我设置一个隔离的 worktree 吗？它可以保护你当前的分支免受更改影响。"

尊重任何已有的、声明过的偏好而无需询问。如果用户拒绝同意，在当前目录就地工作并跳到步骤 3。

## 步骤 1：创建隔离的工作区

使用 EnterWorktree 工具创建隔离的 worktree。如果 EnterWorktree 不可用，使用下方的 git worktree 回退方案。

EnterWorktree 自动处理目录放置、分支创建和清理。使用 `git worktree add` 而非 EnterWorktree 会创建无法看见或管理的幻影状态。

### Git Worktree 回退方案

**仅当 EnterWorktree 不可用时使用此方案。** 使用 git 手动创建 worktree。

#### 目录选择

遵循此优先级顺序。明确的用户偏好始终优于观察到的文件系统状态。

1. **检查你的指令中是否有声明的 worktree 目录偏好。** 如果用户已指定，直接使用而无需询问。

2. **检查是否有已有的项目级 worktree 目录：**
   ```bash
   ls -d .worktrees 2>/dev/null     # 首选（隐藏目录）
   ls -d worktrees 2>/dev/null      # 备选
   ```
   如果找到了，使用它。如果两者都存在，`.worktrees` 优先。

3. **检查是否有已有的全局目录：**
   ```bash
   project=$(basename "$(git rev-parse --show-toplevel)")
   ls -d ~/.config/superpowers/worktrees/$project 2>/dev/null
   ```
   如果找到了，使用它（与旧版全局路径向后兼容）。

4. **如果没有其他指引可用**，默认使用项目根目录下的 `.worktrees/`。

#### 安全检查（仅项目级目录）

**在创建 worktree 之前必须验证目录已被忽略：**

```bash
git check-ignore -q .worktrees 2>/dev/null || git check-ignore -q worktrees 2>/dev/null
```

**如果未被忽略：** 添加到 .gitignore，提交更改，然后继续。

**为什么关键：** 防止意外将 worktree 内容提交到仓库。

全局目录（`~/.config/superpowers/worktrees/`）不需要验证。

#### 创建 Worktree

```bash
project=$(basename "$(git rev-parse --show-toplevel)")

# 根据选定的位置确定路径
# 项目级：path="$LOCATION/$BRANCH_NAME"
# 全局：path="~/.config/superpowers/worktrees/$project/$BRANCH_NAME"

git worktree add "$path" -b "$BRANCH_NAME"
cd "$path"
```

**沙箱回退：** 如果 `git worktree add` 因权限错误（沙箱拒绝）而失败，告诉用户沙箱阻止了 worktree 创建，你改为在当前目录中工作。然后就地运行设置和基线测试。

## 步骤 3：项目设置

自动检测并运行适当的设置：

```bash
# Node.js
if [ -f package.json ]; then npm install; fi

# Rust
if [ -f Cargo.toml ]; then cargo build; fi

# Python
if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
if [ -f pyproject.toml ]; then poetry install; fi

# Go
if [ -f go.mod ]; then go mod download; fi
```

## 步骤 4：验证干净基线

运行测试以确保工作区从一个干净的状态起步：

```bash
# 使用适合项目的命令
npm test / cargo test / pytest / go test ./...
```

**如果测试失败：** 报告失败，询问是继续还是排查。

**如果测试通过：** 报告就绪。

### 报告

```
Worktree 就绪，位于 <full-path>
测试通过（<N> 个测试，0 个失败）
准备实施 <feature-name>
```

## 快速参考

| 情况 | 操作 |
|-----------|--------|
| 已在链接的 worktree 中 | 跳过创建（步骤 0） |
| 在子模块中 | 当作普通仓库（步骤 0 防护） |
| EnterWorktree 可用 | 使用它（步骤 1） |
| 无 EnterWorktree | Git worktree 回退方案（步骤 1） |
| `.worktrees/` 存在 | 使用它（验证已忽略） |
| `worktrees/` 存在 | 使用它（验证已忽略） |
| 两者都存在 | 使用 `.worktrees/` |
| 两者都不存在 | 检查指令文件，然后默认 `.worktrees/` |
| 全局路径存在 | 使用它（向后兼容） |
| 目录未被忽略 | 添加到 .gitignore + 提交 |
| 创建时权限错误 | 沙箱回退，就地工作 |
| 基线测试失败 | 报告失败 + 询问 |
| 无 package.json/Cargo.toml | 跳过依赖安装 |

## 常见错误

### 与 Claude Code 对抗

- **问题：** 当 Claude Code 已提供隔离时使用 `git worktree add`
- **修复：** 步骤 0 检测已有隔离。优先使用 EnterWorktree。

### 跳过检测

- **问题：** 在已有 worktree 内部创建嵌套 worktree
- **修复：** 在创建任何东西之前始终运行步骤 0

### 跳过忽略验证

- **问题：** Worktree 内容被跟踪，污染 git 状态
- **修复：** 在创建项目级 worktree 之前始终使用 `git check-ignore`

### 假设目录位置

- **问题：** 产生不一致，违反项目约定
- **修复：** 遵循优先级：已有 > 全局旧版 > 指令文件 > 默认

### 在测试失败时继续

- **问题：** 无法区分新 bug 和已有问题
- **修复：** 报告失败，获取明确的继续许可

## 红色警示

**绝不要：**
- 当步骤 0 检测到已有隔离时创建 worktree
- 当 EnterWorktree 可用时使用 `git worktree add`。这是头号错误——如果你有 EnterWorktree，就使用它。
- 跳过 EnterWorktree 直接使用 git 命令
- 在未验证已忽略的情况下创建 worktree（项目级）
- 跳过基线测试验证
- 在未询问的情况下以失败测试继续

**始终要：**
- 先运行步骤 0 检测
- 优先使用 EnterWorktree 而非 git 回退方案
- 遵循目录优先级：已有 > 全局旧版 > 指令文件 > 默认
- 验证项目级目录已忽略
- 自动检测并运行项目设置
- 验证干净测试基线
