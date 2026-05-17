# 测试反模式

**在以下情况加载此参考：** 编写或修改测试、添加 mock、或试图向生产代码添加仅测试用的方法时。

## 概述

测试必须验证真实行为，而不是 mock 行为。Mock 是隔离的手段，不是被测试的东西。

**核心原则：** 测试代码实际做了什么，而不是 mock 做了什么。

**遵循严格的 TDD 可以防止这些反模式。**

## 铁律

```
1. 绝不测试 mock 行为
2. 绝不向生产类添加仅测试用的方法
3. 绝不在不理解依赖的情况下进行 mock
```

## 反模式 1：测试 Mock 行为

**违规示例：**
```typescript
// ❌ 错误：测试 mock 是否存在
test('渲染侧边栏', () => {
  render(<Page />);
  expect(screen.getByTestId('sidebar-mock')).toBeInTheDocument();
});
```

**为什么这是错的：**
- 你在验证 mock 能工作，而不是组件能工作
- 测试在 mock 存在时通过，不存在时失败
- 完全不能说明真实行为

**你的人类搭档的纠正：** "我们是在测试一个 mock 的行为吗？"

**修复：**
```typescript
// ✅ 正确：测试真实组件，或者不要 mock 它
test('渲染侧边栏', () => {
  render(<Page />);  // 不要 mock 侧边栏
  expect(screen.getByRole('navigation')).toBeInTheDocument();
});

// 或者，如果侧边栏必须被 mock 以进行隔离：
// 不要断言 mock - 测试 Page 在侧边栏存在时的行为
```

### 门控函数

```
在对任何 mock 元素进行断言之前：
  问："我是在测试真实组件的行为还是仅仅测试 mock 的存在？"

  如果是在测试 mock 的存在：
    停止 - 删除该断言或取消 mock 该组件

  改为测试真实行为
```

## 反模式 2：生产代码中的仅测试用方法

**违规示例：**
```typescript
// ❌ 错误：destroy() 仅在测试中使用
class Session {
  async destroy() {  // 看起来像生产 API！
    await this._workspaceManager?.destroyWorkspace(this.id);
    // ... 清理
  }
}

// 在测试中
afterEach(() => session.destroy());
```

**为什么这是错的：**
- 生产类被仅测试用代码污染
- 如果在生产环境中意外调用会很危险
- 违反 YAGNI 和关注点分离
- 混淆了对象生命周期与实体生命周期

**修复：**
```typescript
// ✅ 正确：测试工具处理测试清理
// Session 没有 destroy() - 它在生产环境中是无状态的

// 在 test-utils/ 中
export async function cleanupSession(session: Session) {
  const workspace = session.getWorkspaceInfo();
  if (workspace) {
    await workspaceManager.destroyWorkspace(workspace.id);
  }
}

// 在测试中
afterEach(() => cleanupSession(session));
```

### 门控函数

```
在向生产类添加任何方法之前：
  问："这个方法只被测试使用吗？"

  如果是：
    停止 - 不要添加它
    将其放在测试工具中

  问："这个类拥有此资源的生命周期吗？"

  如果否：
    停止 - 这个类不适合这个方法
```

## 反模式 3：不理解就进行 Mock

**违规示例：**
```typescript
// ❌ 错误：Mock 破坏了测试逻辑
test('检测到重复的服务器', () => {
  // Mock 阻止了测试依赖的配置写入！
  vi.mock('ToolCatalog', () => ({
    discoverAndCacheTools: vi.fn().mockResolvedValue(undefined)
  }));

  await addServer(config);
  await addServer(config);  // 应该抛出 — 但不会！
});
```

**为什么这是错的：**
- 被 mock 的方法有测试依赖的副作用（写入配置）
- 为了"安全"而过度 mock 破坏了实际行为
- 测试因为错误的原因通过，或者莫名其妙地失败

**修复：**
```typescript
// ✅ 正确：在正确的层级进行 mock
test('检测到重复的服务器', () => {
  // Mock 缓慢的部分，保留测试需要的行为
  vi.mock('MCPServerManager'); // 只 mock 缓慢的服务器启动

  await addServer(config);  // 配置已写入
  await addServer(config);  // 检测到重复 ✓
});
```

### 门控函数

```
在对任何方法进行 mock 之前：
  停止 - 先不要 mock

  1. 问："真实方法有什么副作用？"
  2. 问："这个测试依赖于其中任何一个副作用吗？"
  3. 问："我完全理解这个测试需要什么吗？"

  如果依赖于副作用：
    在更低层级进行 mock（实际缓慢/外部操作）
    或者使用保留必要行为的测试替身
    而不是测试所依赖的高层方法

  如果不确定测试依赖什么：
    先用真实实现运行测试
    观察实际需要发生什么
    然后在正确的层级添加最小化的 mock

  红色警报：
    - "我先 mock 这个以保安全"
    - "这个可能很慢，最好 mock 它"
    - 不理解依赖链就进行 mock
```

## 反模式 4：不完整的 Mock

**违规示例：**
```typescript
// ❌ 错误：部分 mock - 只包含你认为需要的字段
const mockResponse = {
  status: 'success',
  data: { userId: '123', name: 'Alice' }
  // 缺失：下游代码使用的 metadata
};

// 之后：当代码访问 response.metadata.requestId 时出错
```

**为什么这是错的：**
- **部分 mock 隐藏了结构假设** - 你只 mock 了你已知的字段
- **下游代码可能依赖你没有包含的字段** - 静默失败
- **测试通过但集成失败** - Mock 不完整，真实 API 完整
- **虚假的信心** - 测试不能证明任何关于真实行为的事情

**铁律：** Mock 完整的、实际存在的数据结构，而不仅仅是你当前测试使用的字段。

**修复：**
```typescript
// ✅ 正确：反映真实 API 的完整性
const mockResponse = {
  status: 'success',
  data: { userId: '123', name: 'Alice' },
  metadata: { requestId: 'req-789', timestamp: 1234567890 }
  // 真实 API 返回的所有字段
};
```

### 门控函数

```
在创建 mock 响应之前：
  检查："真实 API 响应包含哪些字段？"

  行动：
    1. 检查来自文档/示例的实际 API 响应
    2. 包含系统可能在后续使用的所有字段
    3. 验证 mock 完全匹配真实响应模式

  关键：
    如果你要创建 mock，你必须理解整个结构
    部分 mock 在代码依赖被遗漏的字段时静默失败

  如果不确定：包含所有已记录的字段
```

## 反模式 5：集成测试当作事后想法

**违规示例：**
```
✅ 实现完成
❌ 没有写测试
"准备好测试了"
```

**为什么这是错的：**
- 测试是实现的一部分，不是可选的后续步骤
- TDD 本可以避免这种情况
- 没有测试就不能声称完成

**修复：**
```
TDD 循环：
1. 写失败的测试
2. 实现使其通过
3. 重构
4. 然后才声称完成
```

## 当 Mock 变得过于复杂时

**警告信号：**
- Mock 设置比测试逻辑还长
- Mock 一切以使测试通过
- Mock 缺少真实组件有的方法
- 测试在 mock 变化时失败

**你的人类搭档的问题：** "我们这里需要用到 mock 吗？"

**考虑：** 使用真实组件的集成测试通常比复杂的 mock 更简单

## TDD 可以防止这些反模式

**为什么 TDD 有帮助：**
1. **先写测试** → 迫使你思考你实际在测试什么
2. **观察它失败** → 确认测试是在测试真实行为，而非 mock
3. **最小化实现** → 没有仅测试用的方法混入
4. **真实依赖** → 你在 mock 之前看到测试实际需要什么

**如果你在测试 mock 行为，你违反了 TDD** — 你没有先观察测试在真实代码上失败就添加了 mock。

## 快速参考

| 反模式 | 修复 |
|--------------|-----|
| 断言 mock 元素 | 测试真实组件或取消 mock |
| 生产中的仅测试用方法 | 移至测试工具 |
| 不理解就 mock | 先理解依赖，最小化 mock |
| 不完整的 mock | 完全反映真实 API |
| 测试当作事后想法 | TDD - 测试先行 |
| 过于复杂的 mock | 考虑集成测试 |

## 红色警报

- 断言检查 `*-mock` 测试 ID
- 仅在测试文件中调用的方法
- Mock 设置超过测试代码的 50%
- 移除 mock 后测试失败
- 无法解释为什么需要 mock
- 为了"安全"而 mock

## 底线

**Mock 是隔离的工具，不是测试的对象。**

如果 TDD 揭示出你在测试 mock 行为，你已经走偏了。

修复：测试真实行为，或者质疑你为什么要 mock。
