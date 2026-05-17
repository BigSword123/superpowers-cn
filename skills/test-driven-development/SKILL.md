---
name: test-driven-development
description: 在实现任何功能或 bug 修复时、在编写实现代码之前使用
---

# 测试驱动开发（TDD）

## 概述

先写测试。看着它失败。编写最小化的代码使其通过。

**核心原则：** 如果你没有看到测试失败，你就不知道它测试的是否是正确的东西。

**违反规则的字面规定就是违反规则的精神。**

## 何时使用

**始终使用：**
- 新功能
- Bug 修复
- 重构
- 行为更改

**例外（需征得你的 人类搭档 同意）：**
- 一次性原型
- 生成的代码
- 配置文件

在想"就这一次跳过 TDD"？停下。那是合理化借口。

## 铁律

```
没有先写失败的测试，不得编写生产代码
```

在测试之前写了代码？删除它。重新开始。

**没有任何例外：**
- 不要保留它作为"参考"
- 不要在写测试时"调整"它
- 不要看它
- 删除意味着删除

从测试开始全新实现。就这样。

## RED-GREEN-REFACTOR（红-绿-重构）

```dot
digraph tdd_cycle {
    rankdir=LR;
    red [label="RED\n编写失败的测试", shape=box, style=filled, fillcolor="#ffcccc"];
    verify_red [label="验证失败\n正确失败", shape=diamond];
    green [label="GREEN\n最小化代码", shape=box, style=filled, fillcolor="#ccffcc"];
    verify_green [label="验证通过\n全部通过", shape=diamond];
    refactor [label="REFACTOR\n清理", shape=box, style=filled, fillcolor="#ccccff"];
    next [label="下一个", shape=ellipse];

    red -> verify_red;
    verify_red -> green [label="是"];
    verify_red -> red [label="错误\n的失败"];
    green -> verify_green;
    verify_green -> refactor [label="是"];
    verify_green -> green [label="否"];
    refactor -> verify_green [label="保持\n通过"];
    verify_green -> next;
    next -> red;
}
```

### RED - 编写失败的测试

写一个最小化的测试来展示应该发生什么。

<Good>
```typescript
test('retries failed operations 3 times', async () => {
  let attempts = 0;
  const operation = () => {
    attempts++;
    if (attempts < 3) throw new Error('fail');
    return 'success';
  };

  const result = await retryOperation(operation);

  expect(result).toBe('success');
  expect(attempts).toBe(3);
});
```
清晰的名称，测试真实行为，只测一件事
</Good>

<Bad>
```typescript
test('retry works', async () => {
  const mock = jest.fn()
    .mockRejectedValueOnce(new Error())
    .mockRejectedValueOnce(new Error())
    .mockResolvedValueOnce('success');
  await retryOperation(mock);
  expect(mock).toHaveBeenCalledTimes(3);
});
```
模糊的名称，测试 mock 而不是代码
</Bad>

**要求：**
- 一个行为
- 清晰的名称
- 真实代码（除非不可避免，否则不使用 mock）

### 验证 RED - 看着它失败

**强制的。绝不要跳过。**

```bash
npm test path/to/test.test.ts
```

确认：
- 测试失败（不是错误）
- 失败消息是预期的
- 失败是因为功能缺失（不是拼写错误）

**测试通过了？** 你测试的是已有行为。修正测试。

**测试报错了？** 修正错误，重新运行直到它正确失败。

### GREEN - 最小化代码

编写最简单的代码使测试通过。

<Good>
```typescript
async function retryOperation<T>(fn: () => Promise<T>): Promise<T> {
  for (let i = 0; i < 3; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === 2) throw e;
    }
  }
  throw new Error('unreachable');
}
```
刚好足够通过
</Good>

<Bad>
```typescript
async function retryOperation<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    backoff?: 'linear' | 'exponential';
    onRetry?: (attempt: number) => void;
  }
): Promise<T> {
  // YAGNI
}
```
过度设计
</Bad>

不要添加功能、重构其他代码或超出测试范围地"改进"。

### 验证 GREEN - 看着它通过

**强制的。**

```bash
npm test path/to/test.test.ts
```

确认：
- 测试通过
- 其他测试仍然通过
- 输出干净（无错误、无警告）

**测试失败？** 修正代码，不是测试。

**其他测试失败？** 立即修正。

### REFACTOR - 清理

只在变绿之后：
- 消除重复
- 改进命名
- 提取辅助函数

保持测试通过。不要添加行为。

### 重复

为下一个功能编写下一个失败的测试。

## 好的测试

| 品质 | 好 | 坏 |
|---------|------|-----|
| **最小化** | 只测一件事。名称中有"和"？拆分它。 | `test('validates email and domain and whitespace')` |
| **清晰** | 名称描述行为 | `test('test1')` |
| **展示意图** | 演示期望的 API | 掩盖代码应该做什么 |

## 为什么顺序很重要

**"我会在写完代码后写测试来验证它是否有效"**

在代码之后写的测试立即通过。立即通过证明不了任何东西：
- 可能测试了错误的东西
- 可能测试的是实现，而不是行为
- 可能遗漏了你忘记的边缘情况
- 你从未看到它捕获 bug

测试优先迫使你看到测试失败，证明它确实测试了某些东西。

**"我已经手动测试了所有边缘情况"**

手动测试是臨时的。你以为你测试了一切，但是：
- 没有你测试了什么的记录
- 代码更改时无法重新运行
- 在压力下容易忘记情况
- "我试的时候它正常" ≠ 全面的

自动化测试是系统化的。它们每次都以相同的方式运行。

**"删除 X 小时的工作是浪费"**

沉没成本谬误。时间已经过去了。你现在的选择是：
- 删除并用 TDD 重写（再花 X 小时，高信心）
- 保留并在之后加测试（30 分钟，低信心，很可能有 bug）

"浪费"的是保留你无法信任的代码。没有真正测试的工作代码是技术债务。

**"TDD 太教条了，务实意味着灵活调整"**

TDD 就是务实的：
- 在提交前找到 bug（比之后调试更快）
- 防止回归（测试立即捕获破坏）
- 文档化行为（测试展示了如何使用代码）
- 使重构成为可能（自由更改，测试捕获破坏）

"务实的"捷径 = 在生产环境中调试 = 更慢。

**"事后测试能达到同样的目标——这是精神而不是仪式"**

不是的。事后测试回答"这做了什么？"测试优先回答"这应该做什么？"

事后测试会受到你的实现的偏见。你测试的是你构建的东西，而不是要求的东西。你验证的是记住的边缘情况，而不是发现的边缘情况。

测试优先在实现之前强制进行边缘情况发现。事后测试验证你是否记住了所有东西（你没有）。

事后 30 分钟的测试 ≠ TDD。你获得了覆盖率，但丢掉了测试有效的证明。

## 常见的合理化借口

| 借口 | 现实 |
|--------|---------|
| "太简单了不需要测试" | 简单的代码也会出错。写测试只需 30 秒。 |
| "我之后再测试" | 立即通过的测试证明不了任何东西。 |
| "事后测试能达到同样目标" | 事后测试 = "这做了什么？" 测试优先 = "这应该做什么？" |
| "已经手动测试了" | 臨时的 ≠ 系统化的。没有记录，无法重新运行。 |
| "删除 X 小时是浪费" | 沉没成本谬误。保留未验证的代码是技术债务。 |
| "保留作为参考，先写测试" | 你会调整它。那就是事后测试。删除意味着删除。 |
| "需要先探索一下" | 可以。扔掉探索的内容，从 TDD 开始。 |
| "难以测试 = 设计不清晰" | 倾听测试。难以测试 = 难以使用。 |
| "TDD 会拖慢我" | TDD 比调试快。务实 = 测试优先。 |
| "手动测试更快" | 手动不能证明边缘情况。你每次更改都要重新测试。 |
| "现有代码没有测试" | 你正在改进它。为现有代码添加测试。 |

## 红旗 - 停止并重新开始

- 测试之前写代码
- 实现之后测试
- 测试立即通过
- 不能解释为什么测试失败
- "稍后"添加测试
- 合理化"就这一次"
- "我已经手动测试过了"
- "事后测试能达到相同目的"
- "这是精神而不是仪式"
- "保留作为参考"或"调整现有代码"
- "已经花了 X 小时，删除是浪费"
- "TDD 太教条了，我保持务实"
- "这次不同因为…"

**所有这些都意味着：删除代码。用 TDD 重新开始。**

## 示例：Bug 修复

**Bug：** 空 email 被接受

**RED**
```typescript
test('rejects empty email', async () => {
  const result = await submitForm({ email: '' });
  expect(result.error).toBe('Email required');
});
```

**验证 RED**
```bash
$ npm test
FAIL: expected 'Email required', got undefined
```

**GREEN**
```typescript
function submitForm(data: FormData) {
  if (!data.email?.trim()) {
    return { error: 'Email required' };
  }
  // ...
}
```

**验证 GREEN**
```bash
$ npm test
PASS
```

**REFACTOR**
如果需要，为多个字段提取验证逻辑。

## 验证检查清单

在标记工作完成之前：

- [ ] 每个新的函数/方法都有测试
- [ ] 在实现之前看着每个测试失败
- [ ] 每个测试因预期原因失败（功能缺失，不是拼写错误）
- [ ] 为每个测试编写了最小化代码使其通过
- [ ] 所有测试通过
- [ ] 输出干净（无错误、无警告）
- [ ] 测试使用真实代码（仅在不可避免时使用 mock）
- [ ] 覆盖了边缘情况和错误

不能勾选全部？你跳过了 TDD。重新开始。

## 当卡住时

| 问题 | 解决方案 |
|---------|----------|
| 不知道如何测试 | 写出你期望的 API。先写断言。问你的 人类搭档。 |
| 测试太复杂 | 设计太复杂。简化接口。 |
| 必须 mock 一切 | 代码耦合过紧。使用依赖注入。 |
| 测试设置规模庞大 | 提取辅助函数。仍然复杂？简化设计。 |

## 调试集成

Bug 被发现了？编写复现它的失败测试。遵循 TDD 循环。测试证明修复并防止回归。

永远不要在没有测试的情况下修复 bug。

## 测试反模式

当添加 mock 或测试工具时，阅读 @testing-anti-patterns.md 以避免常见陷阱：
- 测试 mock 行为而不是真实行为
- 向生产类添加仅用于测试的方法
- 在不理解依赖的情况下进行 mock

## 最终规则

```
生产代码 → 测试存在且先失败过
否则 → 不是 TDD
```

没有你的 人类搭档 允许，不得例外。
