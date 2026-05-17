# Claude Code 技能测试

使用 Claude Code CLI 对 superpowers 技能进行自动化测试。

## 概述

本测试套件验证技能是否正确加载以及 Claude 是否按预期遵循它们。测试以无头模式（`claude -p`）调用 Claude Code 并验证行为。

## 要求

- 已安装 Claude Code CLI 并在 PATH 中（`claude --version` 应该能正常工作）
- 已安装本地 superpowers-cn 插件（参见主 README 中的安装说明）

## 运行测试

### 运行所有快速测试（推荐）：
```bash
./run-skill-tests.sh
```

### 运行集成测试（较慢，10-30 分钟）：
```bash
./run-skill-tests.sh --integration
```

### 运行特定测试：
```bash
./run-skill-tests.sh --test test-subagent-driven-development.sh
```

### 带详细输出运行：
```bash
./run-skill-tests.sh --verbose
```

### 设置自定义超时时间：
```bash
./run-skill-tests.sh --timeout 1800  # 集成测试 30 分钟
```

## 测试结构

### test-helpers.sh
技能测试的通用函数：
- `run_claude "prompt" [timeout]` - 使用提示词运行 Claude
- `assert_contains output pattern name` - 验证模式存在
- `assert_not_contains output pattern name` - 验证模式不存在
- `assert_count output pattern count name` - 验证精确计数
- `assert_order output pattern_a pattern_b name` - 验证顺序
- `create_test_project` - 创建临时测试目录
- `create_test_plan project_dir` - 创建示例计划文件

### 测试文件

每个测试文件：
1. 引入 `test-helpers.sh`
2. 使用特定提示词运行 Claude Code
3. 使用断言验证预期行为
4. 成功返回 0，失败返回非零值

## 测试示例

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== 测试：我的技能 ==="

# 询问 Claude 关于该技能
output=$(run_claude "my-skill 技能是做什么的？" 30)

# 验证响应
assert_contains "$output" "expected behavior" "技能描述了行为"

echo "=== 所有测试通过 ==="
```

## 当前测试

### 快速测试（默认运行）

#### test-subagent-driven-development.sh
测试技能内容和要求（约 2 分钟）：
- 技能加载和可访问性
- 工作流顺序（规范合规性在代码质量之前）
- 文档化的自我审查要求
- 文档化的计划读取效率
- 文档化的规范合规审查者怀疑态度
- 文档化的审查循环
- 文档化的任务上下文提供

### 集成测试（使用 --integration 标志）

#### test-subagent-driven-development-integration.sh
完整工作流执行测试（约 10-30 分钟）：
- 使用 Node.js 设置创建真实测试项目
- 创建包含 2 个任务的实施计划
- 使用 subagent-driven-development 执行计划
- 验证实际行为：
  - 计划在开始时读取一次（而非每个任务读取一次）
  - 完整的任务文本在子代理提示词中提供
  - 子代理在报告前进行自我审查
  - 规范合规审查在代码质量之前进行
  - 规范审查者独立阅读代码
  - 产生可工作的实现
  - 测试通过
  - 创建正确的 git 提交

**测试内容：**
- 工作流实际端到端可用
- 我们的改进确实被应用了
- 子代理正确遵循技能
- 最终代码功能正常且经过测试

#### test-requesting-code-review.sh
代码审查子代理的行为测试（约 5 分钟）：
- 构建一个带有基线提交的小型项目
- 添加第二个提交，植入两个真实 bug（SQL 注入、明文密码处理）
- 通过 requesting-code-review 技能派遣代码审查者
- 验证审查者将植入的 bug 标记为 Critical/Important 严重级别并拒绝批准

**测试内容：**
- 技能确实派遣了一个正常工作的代码审查子代理
- 审查者模板产生的审查者能捕获明显的安全 bug
- 审查者不是阿谀奉承的——它不会批准包含植入 Critical 问题的 diff

## 添加新测试

1. 创建新的测试文件：`test-<skill-name>.sh`
2. 引入 test-helpers.sh
3. 使用 `run_claude` 和断言编写测试
4. 添加到 `run-skill-tests.sh` 的测试列表
5. 设置为可执行：`chmod +x test-<skill-name>.sh`

## 超时考虑

- 默认超时：每个测试 5 分钟
- Claude Code 可能需要时间响应
- 如有需要，使用 `--timeout` 调整
- 测试应该聚焦以避免长时间运行

## 调试失败的测试

使用 `--verbose`，你将看到完整的 Claude 输出：
```bash
./run-skill-tests.sh --verbose --test test-subagent-driven-development.sh
```

非 verbose 模式下，只有失败时显示输出。

## CI/CD 集成

在 CI 中运行：
```bash
# 为 CI 环境设置显式超时时间
./run-skill-tests.sh --timeout 900

# 退出码 0 = 成功，非零 = 失败
```

## 注意事项

- 测试验证的是技能的*指令*，而非完整执行
- 完整工作流测试会非常慢
- 重点是验证关键技能要求
- 测试应该是确定性的
- 避免测试实现细节
