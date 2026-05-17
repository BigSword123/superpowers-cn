---
name: requesting-code-review
description: 当完成任务、实现主要功能或合并前使用，以验证工作是否符合要求
---

# 请求代码审查

调度一个代码审查子智能体，在问题扩展之前捕获它们。审查者获得精确构建的评估上下文——绝非你当前会话的历史。这使审查者专注于工作产物，而非你的思考过程，同时为你保留上下文以继续工作。

**核心原则：** 早审查，常审查。

## 何时请求审查

**强制：**
- 在子智能体驱动开发的每个任务之后
- 完成主要功能之后
- 合并到 main 之前

**可选但有价值：**
- 卡住时（新鲜视角）
- 重构前（基线检查）
- 修复复杂 bug 后

## 如何请求

**1. 获取 git SHA：**
```bash
BASE_SHA=$(git rev-parse HEAD~1)  # 或 origin/main
HEAD_SHA=$(git rev-parse HEAD)
```

**2. 调度代码审查子智能体：**

使用 Task 工具，类型为 `general-purpose`，填写 `code-reviewer.md` 模板

**占位符：**
- `{DESCRIPTION}` - 你构建了什么的简要总结
- `{PLAN_OR_REQUIREMENTS}` - 它应该做什么
- `{BASE_SHA}` - 起始提交
- `{HEAD_SHA}` - 结束提交

**3. 根据反馈采取行动：**
- 立即修复 Critical 问题
- 在继续之前修复 Important 问题
- 记录 Minor 问题以备后续处理
- 如果审查者错了，则据理反对（并给出推理）

## 示例

```
[刚完成任务 2：添加验证函数]

你：让我在继续之前请求代码审查。

BASE_SHA=$(git log --oneline | grep "Task 1" | head -1 | awk '{print $1}')
HEAD_SHA=$(git rev-parse HEAD)

[调度代码审查子智能体]
  DESCRIPTION: 添加了 verifyIndex() 和 repairIndex()，包含 4 种问题类型
  PLAN_OR_REQUIREMENTS: docs/superpowers/plans/deployment-plan.md 中的任务 2
  BASE_SHA: a7981ec
  HEAD_SHA: 3df7661

[子智能体返回]:
  优点: 清晰的架构，真实的测试
  问题:
    Important: 缺少进度指示器
    Minor: 报告间隔的魔术数字（100）
  评估: 可以继续

你: [修复进度指示器]
[继续到任务 3]
```

## 与工作流集成

**子智能体驱动开发：**
- 在 每个 任务之后审查
- 在问题累积之前捕获
- 在转到下一个任务之前修复

**执行计划：**
- 每个任务后或在自然检查点审查
- 获取反馈、应用、继续

**特殊开发：**
- 合并前审查
- 卡住时审查

## 红色警示

**绝不要：**
- 因为"很简单"而跳过审查
- 忽略 Critical 问题
- 在未修复 Important 问题的情况下继续
- 与有效的技术反馈争论

**如果审查者错了：**
- 用技术推理据理反对
- 显示证明它正常工作的代码/测试
- 请求澄清

模板参见：requesting-code-review/code-reviewer.md
