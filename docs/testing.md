# 测试 Superpowers 技能

本文档介绍如何测试 Superpowers 技能，特别是复杂技能（如 `subagent-driven-development`）的集成测试。

## 概述

测试涉及子智能体、工作流和复杂交互的技能，需要在 headless 模式下运行实际的 Claude Code 会话，并通过会话记录来验证其行为。

## 测试结构

```
tests/
├── claude-code/
│   ├── test-helpers.sh                    # 共享测试工具
│   ├── test-subagent-driven-development-integration.sh
│   ├── analyze-token-usage.py             # Token 分析工具
│   └── run-skill-tests.sh                 # 测试运行器（如果存在）
```

## 运行测试

### 集成测试

集成测试使用实际技能执行真实的 Claude Code 会话：

```bash
# 运行 subagent-driven-development 集成测试
cd tests/claude-code
./test-subagent-driven-development-integration.sh
```

**注意：** 集成测试可能需要 10-30 分钟，因为它们会使用多个子智能体执行真实的实现计划。

### 要求

- 必须从 **superpowers 插件目录**运行（不能从临时目录运行）
- 必须已安装 Claude Code 并可通过 `claude` 命令调用
- 必须启用本地开发 marketplace：在 `~/.claude/settings.json` 中设置 `"superpowers@superpowers-dev": true`

## 集成测试：subagent-driven-development

### 测试内容

该集成测试验证 `subagent-driven-development` 技能是否正确地：

1. **计划加载**：在开始时读取一次计划
2. **完整任务文本**：向子智能体提供完整的任务描述（不让它们自行读取文件）
3. **自我审查**：确保子智能体在报告前进行自我审查
4. **审查顺序**：在代码质量审查之前先运行规格合规性审查
5. **审查循环**：发现问题时使用审查循环
6. **独立验证**：规格审查者独立阅读代码，不信任实现者的报告

### 工作原理

1. **设置**：创建一个带有最小实现计划的临时 Node.js 项目
2. **执行**：在 headless 模式下使用该技能运行 Claude Code
3. **验证**：解析会话记录（`.jsonl` 文件）以验证：
   - Skill 工具已被调用
   - 子智能体已被派发（Task 工具）
   - TodoWrite 被用于跟踪
   - 实现文件已被创建
   - 测试通过
   - Git 提交显示出正确的工作流
4. **Token 分析**：按子智能体显示 token 用量明细

### 测试输出

```
========================================
 集成测试：subagent-driven-development
========================================

测试项目：/tmp/tmp.xyz123

=== 验证测试 ===

测试 1：Skill 工具已调用...
  [通过] subagent-driven-development 技能已被调用

测试 2：子智能体已派发...
  [通过] 已派发 7 个子智能体

测试 3：任务跟踪...
  [通过] TodoWrite 使用了 5 次

测试 6：实现验证...
  [通过] src/math.js 已创建
  [通过] add 函数存在
  [通过] multiply 函数存在
  [通过] test/math.test.js 已创建
  [通过] 测试通过

测试 7：Git 提交历史...
  [通过] 已创建多个提交（共 3 个）

测试 8：未添加额外功能...
  [通过] 未添加额外功能

=========================================
 Token 用量分析
=========================================

用量明细：
----------------------------------------------------------------------------------------------------
智能体            描述                                    消息数     输入     输出      缓存     费用
----------------------------------------------------------------------------------------------------
main            主会话（协调者）                              34         27   3,996  1,213,703 $   4.09
3380c209        实现任务 1：创建 Add 函数                      1          2     787     24,989 $   0.09
34b00fde        实现任务 2：创建 Multiply 函数                  1          4     644     25,114 $   0.09
3801a732        审查实现是否与规格匹配...                       1          5     703     25,742 $   0.09
4c142934        进行最终代码审查...                             1          6     854     25,319 $   0.09
5f017a42        代码审查者。审查任务 2...                       1          6     504     22,949 $   0.08
a6b7fbe4        代码审查者。审查任务 1...                       1          6     515     22,534 $   0.08
f15837c0        审查实现是否与规格匹配...                       1          6     416     22,485 $   0.07
----------------------------------------------------------------------------------------------------

总计：
  总消息数：            41
  输入 token：          62
  输出 token：          8,419
  缓存创建 token：      132,742
  缓存读取 token：      1,382,835

  总输入（含缓存）：    1,515,639
  总 token：           1,524,058

  估算费用：$4.67
  （按输入/输出每百万 token $3/$15 计算）

========================================
 测试摘要
========================================

状态：已通过
```

## Token 分析工具

### 使用方法

分析任意 Claude Code 会话的 token 用量：

```bash
python3 tests/claude-code/analyze-token-usage.py ~/.claude/projects/<project-dir>/<session-id>.jsonl
```

### 查找会话文件

会话记录存储在 `~/.claude/projects/` 中，工作目录路径会被编码：

```bash
# 示例：针对 /Users/yourname/Documents/GitHub/superpowers/superpowers
SESSION_DIR="$HOME/.claude/projects/-Users-yourname-Documents-GitHub-superpowers-superpowers"

# 查找最近的会话
ls -lt "$SESSION_DIR"/*.jsonl | head -5
```

### 显示内容

- **主会话用量**：协调者（你或主 Claude 实例）的 token 用量
- **各子智能体明细**：每次 Task 调用包含：
  - 智能体 ID
  - 描述（从提示词中提取）
  - 消息数量
  - 输入/输出 token
  - 缓存使用情况
  - 估算费用
- **总计**：整体 token 用量和费用估算

### 理解输出

- **缓存读取量高**：说明 prompt caching 正在生效——这是好事
- **主会话输入 token 高**：符合预期——协调者拥有完整上下文
- **各子智能体费用相近**：符合预期——每个子智能体获得相似复杂度的任务
- **每个任务的费用**：根据任务不同，每个子智能体通常在 $0.05-$0.15 之间

## 故障排除

### 技能未加载

**问题**：运行 headless 测试时找不到技能

**解决方案**：
1. 确保你从 superpowers 目录运行：`cd /path/to/superpowers && tests/...`
2. 检查 `~/.claude/settings.json` 中 `enabledPlugins` 是否包含 `"superpowers@superpowers-dev": true`
3. 确认技能存在于 `skills/` 目录中

### 权限错误

**问题**：Claude 被阻止写入文件或访问目录

**解决方案**：
1. 使用 `--permission-mode bypassPermissions` 标志
2. 使用 `--add-dir /path/to/temp/dir` 授予对测试目录的访问权限
3. 检查测试目录的文件权限

### 测试超时

**问题**：测试耗时过长并超时

**解决方案**：
1. 增加超时时间：`timeout 1800 claude ...`（30 分钟）
2. 检查技能逻辑中是否存在无限循环
3. 审查子智能体任务的复杂度

### 找不到会话文件

**问题**：测试运行后找不到会话记录

**解决方案**：
1. 检查 `~/.claude/projects/` 中正确的项目目录
2. 使用 `find ~/.claude/projects -name "*.jsonl" -mmin -60` 查找最近的会话
3. 确认测试确实已运行（检查测试输出中是否有错误）

## 编写新的集成测试

### 模板

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

# 创建测试项目
TEST_PROJECT=$(create_test_project)
trap "cleanup_test_project $TEST_PROJECT" EXIT

# 设置测试文件...
cd "$TEST_PROJECT"

# 使用技能运行 Claude
PROMPT="你的测试提示词"
cd "$SCRIPT_DIR/../.." && timeout 1800 claude -p "$PROMPT" \
  --allowed-tools=all \
  --add-dir "$TEST_PROJECT" \
  --permission-mode bypassPermissions \
  2>&1 | tee output.txt

# 查找并分析会话
WORKING_DIR_ESCAPED=$(echo "$SCRIPT_DIR/../.." | sed 's/\\//-/g' | sed 's/^-//')
SESSION_DIR="$HOME/.claude/projects/$WORKING_DIR_ESCAPED"
SESSION_FILE=$(find "$SESSION_DIR" -name "*.jsonl" -type f -mmin -60 | sort -r | head -1)

# 通过解析会话记录来验证行为
if grep -q '"name":"Skill".*"skill":"your-skill-name"' "$SESSION_FILE"; then
    echo "[通过] 技能已被调用"
fi

# 显示 token 分析
python3 "$SCRIPT_DIR/analyze-token-usage.py" "$SESSION_FILE"
```

### 最佳实践

1. **始终清理**：使用 trap 清理临时目录
2. **解析记录**：不要 grep 面向用户的输出——而是解析 `.jsonl` 会话文件
3. **授予权限**：使用 `--permission-mode bypassPermissions` 和 `--add-dir`
4. **从插件目录运行**：技能只有从 superpowers 目录运行时才会加载
5. **显示 token 用量**：始终包含 token 分析以了解费用
6. **测试真实行为**：验证实际创建的文件、通过的测试、完成的提交

## 会话记录格式

会话记录是 JSONL（JSON Lines）文件，每行是一个 JSON 对象，表示一条消息或工具结果。

### 关键字段

```json
{
  "type": "assistant",
  "message": {
    "content": [...],
    "usage": {
      "input_tokens": 27,
      "output_tokens": 3996,
      "cache_read_input_tokens": 1213703
    }
  }
}
```

### 工具结果

```json
{
  "type": "user",
  "toolUseResult": {
    "agentId": "3380c209",
    "usage": {
      "input_tokens": 2,
      "output_tokens": 787,
      "cache_read_input_tokens": 24989
    },
    "prompt": "你正在实现任务 1...",
    "content": [{"type": "text", "text": "..."}]
  }
}
```

`agentId` 字段关联到子智能体会话，`usage` 字段包含该特定子智能体调用的 token 用量。
