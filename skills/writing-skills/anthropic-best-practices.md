# 技能编写最佳实践

> 学习如何编写有效的技能，让 Claude 能够发现并成功使用。

好的技能是简洁的、结构良好的，并经过真实使用测试。本指南提供实用的编写决策，帮助你编写 Claude 能够有效发现和使用的技能。

关于技能工作原理的概念背景，请参见[技能概述](/en/docs/agents-and-tools/agent-skills/overview)。

## 核心原则

### 简洁是关键

[上下文窗口](https://platform.claude.com/docs/en/build-with-claude/context-windows)是公共资源。你的技能与 Claude 需要知道的所有其他内容共享上下文窗口，包括：

* 系统提示
* 对话历史
* 其他技能的元数据
* 你的实际请求

并非你技能中的每个 token 都有即时成本。在启动时，只有所有技能的元数据（名称和描述）被预加载。Claude 仅在技能变得相关时读取 SKILL.md，并且仅在需要时读取其他文件。然而，在 SKILL.md 中保持简洁仍然重要：一旦 Claude 加载它，每个 token 都与对话历史和其他上下文竞争。

**默认假设**：Claude 已经非常聪明

只添加 Claude 尚未具备的上下文。对每条信息进行质疑：

* "Claude 真的需要这个解释吗？"
* "我能假设 Claude 知道这个吗？"
* "这一段值得它的 token 成本吗？"

**好的示例：简洁**（约 50 tokens）：

````markdown  theme={null}
## 提取 PDF 文本

使用 pdfplumber 进行文本提取：

```python
import pdfplumber

with pdfplumber.open("file.pdf") as pdf:
    text = pdf.pages[0].extract_text()
```
````

**坏的示例：过于冗长**（约 150 tokens）：

```markdown  theme={null}
## 提取 PDF 文本

PDF（Portable Document Format）文件是一种常见的文件格式，包含
文本、图片和其他内容。要从 PDF 中提取文本，你需要使用
一个库。有许多库可用于 PDF 处理，但我们
推荐 pdfplumber，因为它易于使用并能处理大多数情况。
首先，你需要使用 pip 安装它。然后你可以使用下面的代码...
```

简洁版本假设 Claude 知道 PDF 是什么以及库如何工作。

### 设置适当的自由度

将具体程度与任务的脆弱性和可变性相匹配。

**高自由度**（基于文本的指令）：

在以下情况使用：

* 多种方案都有效
* 决策依赖于上下文
* 启发式方法指导方案

示例：

```markdown  theme={null}
## 代码审查流程

1. 分析代码结构和组织
2. 检查潜在的 bug 或边缘情况
3. 建议改进可读性和可维护性
4. 验证是否遵循项目约定
```

**中等自由度**（带参数的伪代码或脚本）：

在以下情况使用：

* 存在首选模式
* 某些变化是可接受的
* 配置影响行为

示例：

````markdown  theme={null}
## 生成报告

使用此模板并根据需要自定义：

```python
def generate_report(data, format="markdown", include_charts=True):
    # 处理数据
    # 以指定格式生成输出
    # 可选择包含可视化
```
````

**低自由度**（具体脚本，少量或无参数）：

在以下情况使用：

* 操作脆弱且容易出错
* 一致性至关重要
* 必须遵循特定顺序

示例：

````markdown  theme={null}
## 数据库迁移

严格按照此脚本运行：

```bash
python scripts/migrate.py --verify --backup
```

不要修改命令或添加额外标志。
````

**类比**：将 Claude 想象成一个探索路径的机器人：

* **两侧是悬崖的窄桥**：只有一条安全的前进路线。提供具体的护栏和精确的指令（低自由度）。示例：必须按精确顺序执行的数据库迁移。
* **没有危险的开放田野**：许多路径通向成功。给出大致方向并信任 Claude 找到最佳路线（高自由度）。示例：上下文决定最佳方案的代码审查。

### 用你计划使用的所有模型进行测试

技能作为模型的附加项，因此有效性取决于底层模型。用你计划使用技能的所有模型进行测试。

**按模型的测试考量**：

* **Claude Haiku**（快速、经济）：技能是否提供了足够的指导？
* **Claude Sonnet**（平衡）：技能是否清晰高效？
* **Claude Opus**（强大的推理能力）：技能是否避免了过度解释？

对 Opus 完美的内容可能需要为 Haiku 提供更多细节。如果你计划跨多个模型使用你的技能，目标是指令在所有模型上都能良好运行。

## 技能结构

<Note>
  **YAML Frontmatter**：SKILL.md frontmatter 需要两个字段：

  * `name` - 技能的人类可读名称（最多 64 个字符）
  * `description` - 技能做什么以及何时使用它的单行描述（最多 1024 个字符）

  有关完整的技能结构详情，请参见[技能概述](/en/docs/agents-and-tools/agent-skills/overview#skill-structure)。
</Note>

### 命名约定

使用一致的命名模式使技能更易于引用和讨论。我们推荐使用**动名词形式**（动词 + -ing）作为技能名称，因为这清楚地描述了技能提供的活动或能力。

**好的命名示例（动名词形式）**：

* "Processing PDFs"
* "Analyzing spreadsheets"
* "Managing databases"
* "Testing code"
* "Writing documentation"

**可接受的替代方案**：

* 名词短语："PDF Processing"、"Spreadsheet Analysis"
* 面向动作："Process PDFs"、"Analyze Spreadsheets"

**避免**：

* 模糊的名称："Helper"、"Utils"、"Tools"
* 过于通用："Documents"、"Data"、"Files"
* 技能集合内的不一致模式

一致的命名使其更容易：

* 在文档和对话中引用技能
* 一眼了解技能做什么
* 组织和搜索多个技能
* 维护专业、连贯的技能库

### 编写有效的描述

`description` 字段使技能可被发现，应该包含技能做什么和何时使用它。

<Warning>
  **始终使用第三人称**。描述被注入到系统提示中，不一致的视角可能导致发现（discovery）问题。

  * **好：** "Processes Excel files and generates reports"
  * **避免：** "I can help you process Excel files"
  * **避免：** "You can use this to process Excel files"
</Warning>

**具体并包含关键术语**。包含技能做什么和使用的具体触发条件/上下文。

每个技能只有一个描述字段。描述对技能选择至关重要：Claude 用它从可能的 100+ 个可用技能中选择正确的技能。你的描述必须提供足够的细节，让 Claude 知道何时选择此技能，而 SKILL.md 的其余部分提供实现细节。

有效的示例：

**PDF Processing 技能：**

```yaml  theme={null}
description: Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.
```

**Excel Analysis 技能：**

```yaml  theme={null}
description: Analyze Excel spreadsheets, create pivot tables, generate charts. Use when analyzing Excel files, spreadsheets, tabular data, or .xlsx files.
```

**Git Commit Helper 技能：**

```yaml  theme={null}
description: Generate descriptive commit messages by analyzing git diffs. Use when the user asks for help writing commit messages or reviewing staged changes.
```

避免像这样的模糊描述：

```yaml  theme={null}
description: Helps with documents
```

```yaml  theme={null}
description: Processes data
```

```yaml  theme={null}
description: Does stuff with files
```

### 渐进式披露模式

SKILL.md 作为概览，根据需要将 Claude 指向详细材料，就像入职指南中的目录一样。有关渐进式披露如何工作的解释，请参见概述中的[技能如何工作](/en/docs/agents-and-tools/agent-skills/overview#how-skills-work)。

**实用指导：**

* 将 SKILL.md 正文保持在 500 行以下以获得最佳性能
* 接近此限制时将内容拆分为单独的文件
* 使用以下模式有效组织指令、代码和资源

#### 视觉概览：从简单到复杂

基本技能从仅包含元数据和指令的 SKILL.md 文件开始：

<img src="https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-simple-file.png?fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=87782ff239b297d9a9e8e1b72ed72db9" alt="显示 YAML frontmatter 和 markdown 正文的简单 SKILL.md 文件" data-og-width="2048" width="2048" data-og-height="1153" height="1153" data-path="images/agent-skills-simple-file.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-simple-file.png?w=280&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=c61cc33b6f5855809907f7fda94cd80e 280w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-simple-file.png?w=560&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=90d2c0c1c76b36e8d485f49e0810dbfd 560w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-simple-file.png?w=840&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=ad17d231ac7b0bea7e5b4d58fb4aeabb 840w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-simple-file.png?w=1100&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=f5d0a7a3c668435bb0aee9a3a8f8c329 1100w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-simple-file.png?w=1650&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=0e927c1af9de5799cfe557d12249f6e6 1650w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-simple-file.png?w=2500&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=46bbb1a51dd4c8202a470ac8c80a893d 2500w" />

随着技能的增长，你可以捆绑额外的内容，Claude 仅在需要时加载：

<img src="https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-bundling-content.png?fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=a5e0aa41e3d53985a7e3e43668a33ea3" alt="捆绑额外的参考文件，如 reference.md 和 forms.md。" data-og-width="2048" width="2048" data-og-height="1327" height="1327" data-path="images/agent-skills-bundling-content.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-bundling-content.png?w=280&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=f8a0e73783e99b4a643d79eac86b70a2 280w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-bundling-content.png?w=560&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=dc510a2a9d3f14359416b706f067904a 560w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-bundling-content.png?w=840&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=82cd6286c966303f7dd914c28170e385 840w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-bundling-content.png?w=1100&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=56f3be36c77e4fe4b523df209a6824c6 1100w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-bundling-content.png?w=1650&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=d22b5161b2075656417d56f41a74f3dd 1650w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-bundling-content.png?w=2500&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=3dd4bdd6850ffcc96c6c45fcb0acd6eb 2500w" />

完整的技能目录结构可能如下所示：

```
pdf/
├── SKILL.md              # 主要指令（触发时加载）
├── FORMS.md              # 表单填写指南（按需加载）
├── reference.md          # API 参考（按需加载）
├── examples.md           # 使用示例（按需加载）
└── scripts/
    ├── analyze_form.py   # 工具脚本（执行，不加载）
    ├── fill_form.py      # 表单填写脚本
    └── validate.py       # 验证脚本
```

#### 模式 1：带引用的高层指南

````markdown  theme={null}
---
name: PDF Processing
description: Extracts text and tables from PDF files, fills forms, and merges documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.
---

# PDF Processing

## 快速开始

使用 pdfplumber 提取文本：
```python
import pdfplumber
with pdfplumber.open("file.pdf") as pdf:
    text = pdf.pages[0].extract_text()
```

## 高级功能

**表单填写**：完整指南见 [FORMS.md](FORMS.md)
**API 参考**：所有方法见 [REFERENCE.md](REFERENCE.md)
**示例**：常见模式见 [EXAMPLES.md](EXAMPLES.md)
````

Claude 仅在需要时加载 FORMS.md、REFERENCE.md 或 EXAMPLES.md。

#### 模式 2：按领域组织

对于有多个领域的技能，按领域组织内容以避免加载无关上下文。当用户询问销售指标时，Claude 只需要阅读销售相关的模式，而不需要财务或营销数据。这保持了 token 使用量低和上下文专注。

```
bigquery-skill/
├── SKILL.md（概览和导航）
└── reference/
    ├── finance.md（收入、计费指标）
    ├── sales.md（商机、管道）
    ├── product.md（API 使用、功能）
    └── marketing.md（活动、归因）
```

````markdown SKILL.md theme={null}
# BigQuery 数据分析

## 可用数据集

**财务**：收入、ARR、计费 → 见 [reference/finance.md](reference/finance.md)
**销售**：商机、管道、账户 → 见 [reference/sales.md](reference/sales.md)
**产品**：API 使用、功能、采用 → 见 [reference/product.md](reference/product.md)
**营销**：活动、归因、电子邮件 → 见 [reference/marketing.md](reference/marketing.md)

## 快速搜索

使用 grep 查找特定指标：

```bash
grep -i "revenue" reference/finance.md
grep -i "pipeline" reference/sales.md
grep -i "api usage" reference/product.md
```
````

#### 模式 3：条件化详情

展示基本内容，链接到高级内容：

```markdown  theme={null}
# DOCX 处理

## 创建文档

使用 docx-js 创建新文档。见 [DOCX-JS.md](DOCX-JS.md)。

## 编辑文档

对于简单编辑，直接修改 XML。

**对于跟踪修订**：见 [REDLINING.md](REDLINING.md)
**对于 OOXML 详情**：见 [OOXML.md](OOXML.md)
```

Claude 仅在用户需要这些功能时阅读 REDLINING.md 或 OOXML.md。

### 避免深度嵌套引用

Claude 在引用文件从其他被引用文件链接时可能会部分读取文件。遇到嵌套引用时，Claude 可能使用像 `head -100` 这样的命令预览内容，而不是读取整个文件，导致信息不完整。

**保持引用从 SKILL.md 最多一层深度**。所有引用文件应直接从 SKILL.md 链接，以确保 Claude 在需要时读取完整文件。

**坏的示例：太深**：

```markdown  theme={null}
# SKILL.md
见 [advanced.md](advanced.md)...

# advanced.md
见 [details.md](details.md)...

# details.md
这里是实际信息...
```

**好的示例：一层深度**：

```markdown  theme={null}
# SKILL.md

**基本用法**：[SKILL.md 中的说明]
**高级功能**：见 [advanced.md](advanced.md)
**API 参考**：见 [reference.md](reference.md)
**示例**：见 [examples.md](examples.md)
```

### 为较长的参考文件设置目录

对于超过 100 行的参考文件，在顶部包含一个目录。这确保 Claude 即使在部分读取预览时也能看到可用信息的完整范围。

**示例**：

```markdown  theme={null}
# API 参考

## 目录
- 认证和设置
- 核心方法（创建、读取、更新、删除）
- 高级功能（批处理操作、webhook）
- 错误处理模式
- 代码示例

## 认证和设置
...

## 核心方法
...
```

Claude 然后可以根据需要读取完整文件或跳转到特定部分。

有关此基于文件系统的架构如何实现渐进式披露的详情，请参见下文高级部分中的[运行时环境](#runtime-environment)章节。

## 工作流和反馈循环

### 为复杂任务使用工作流

将复杂操作分解为清晰、顺序的步骤。对于特别复杂的工作流，提供一个清单，让 Claude 可以复制到其响应中并在进展过程中勾选。

**示例 1：研究综合工作流**（用于无代码的技能）：

````markdown  theme={null}
## 研究综合工作流

复制此清单并跟踪你的进度：

```
研究进度：
- [ ] 步骤 1：阅读所有源文档
- [ ] 步骤 2：识别关键主题
- [ ] 步骤 3：交叉引用声明
- [ ] 步骤 4：创建结构化摘要
- [ ] 步骤 5：验证引用
```

**步骤 1：阅读所有源文档**

审查 `sources/` 目录中的每个文档。记录主要论点和支持证据。

**步骤 2：识别关键主题**

寻找跨来源的模式。什么主题反复出现？来源在哪方面一致或不一致？

**步骤 3：交叉引用声明**

对于每个主要声明，验证其出现在源材料中。注意哪个来源支持每个观点。

**步骤 4：创建结构化摘要**

按主题组织发现。包括：
- 主要声明
- 来自来源的支持证据
- 冲突观点（如有）

**步骤 5：验证引用**

检查每个声明是否引用了正确的源文件。如果引用不完整，返回步骤 3。
````

此示例展示了工作流如何应用于不需要代码的分析任务。清单模式适用于任何复杂的多步骤过程。

**示例 2：PDF 表单填写工作流**（用于有代码的技能）：

````markdown  theme={null}
## PDF 表单填写工作流

复制此清单并在完成每个项目时勾选：

```
任务进度：
- [ ] 步骤 1：分析表单（运行 analyze_form.py）
- [ ] 步骤 2：创建字段映射（编辑 fields.json）
- [ ] 步骤 3：验证映射（运行 validate_fields.py）
- [ ] 步骤 4：填写表单（运行 fill_form.py）
- [ ] 步骤 5：验证输出（运行 verify_output.py）
```

**步骤 1：分析表单**

运行：`python scripts/analyze_form.py input.pdf`

这将提取表单字段及其位置，保存到 `fields.json`。

**步骤 2：创建字段映射**

编辑 `fields.json` 为每个字段添加值。

**步骤 3：验证映射**

运行：`python scripts/validate_fields.py fields.json`

在继续之前修复任何验证错误。

**步骤 4：填写表单**

运行：`python scripts/fill_form.py input.pdf fields.json output.pdf`

**步骤 5：验证输出**

运行：`python scripts/verify_output.py output.pdf`

如果验证失败，返回步骤 2。
````

清晰的步骤可防止 Claude 跳过关键验证。清单帮助 Claude 和你自己在多步骤工作流中跟踪进度。

### 实现反馈循环

**常见模式**：运行验证器 → 修复错误 → 重复

此模式大大提高了输出质量。

**示例 1：风格指南合规**（用于无代码的技能）：

```markdown  theme={null}
## 内容审查流程

1. 按照 STYLE_GUIDE.md 中的指南起草你的内容
2. 对照清单进行审查：
   - 检查术语一致性
   - 验证示例遵循标准格式
   - 确认所有必要的章节都存在
3. 如果发现问题：
   - 记录每个问题及具体章节引用
   - 修订内容
   - 再次审查清单
4. 只有在所有要求都满足后才继续
5. 最终确定并保存文档
```

这展示了使用参考文档而非脚本的验证循环模式。"验证器"是 STYLE\_GUIDE.md，Claude 通过阅读和比较来执行检查。

**示例 2：文档编辑过程**（用于有代码的技能）：

```markdown  theme={null}
## 文档编辑过程

1. 对 `word/document.xml` 进行你的编辑
2. **立即验证**：`python ooxml/scripts/validate.py unpacked_dir/`
3. 如果验证失败：
   - 仔细审查错误消息
   - 修复 XML 中的问题
   - 再次运行验证
4. **仅在验证通过后才继续**
5. 重新构建：`python ooxml/scripts/pack.py unpacked_dir/ output.docx`
6. 测试输出文档
```

验证循环可以及早捕获错误。

## 内容指南

### 避免时间敏感信息

不要包含会过时的信息：

**坏的示例：时间敏感**（会变得错误）：

```markdown  theme={null}
如果你在 2025 年 8 月之前做这个，使用旧 API。
在 2025 年 8 月之后，使用新 API。
```

**好的示例**（使用"旧模式"章节）：

```markdown  theme={null}
## 当前方法

使用 v2 API 端点：`api.example.com/v2/messages`

## 旧模式

<details>
<summary>旧版 v1 API（已于 2025-08 弃用）</summary>

v1 API 使用：`api.example.com/v1/messages`

此端点已不再受支持。
</details>
```

旧模式章节提供历史上下文，而不混乱主要内容。

### 使用一致的术语

选择一个术语并在整个技能中始终使用它：

**好 - 一致**：

* 始终使用 "API endpoint"
* 始终使用 "field"
* 始终使用 "extract"

**坏 - 不一致**：

* 混合使用 "API endpoint"、"URL"、"API route"、"path"
* 混合使用 "field"、"box"、"element"、"control"
* 混合使用 "extract"、"pull"、"get"、"retrieve"

一致性帮助 Claude 理解并遵循指令。

## 常见模式

### 模板模式

为输出格式提供模板。将严格程度与你的需求匹配。

**对于严格要求**（如 API 响应或数据格式）：

````markdown  theme={null}
## 报告结构

始终使用此精确模板结构：

```markdown
# [分析标题]

## 执行摘要
[一段关于关键发现的概述]

## 关键发现
- 发现 1 及支持数据
- 发现 2 及支持数据
- 发现 3 及支持数据

## 建议
1. 具体可执行的建议
2. 具体可执行的建议
```
````

**对于灵活指导**（当适应有用时）：

````markdown  theme={null}
## 报告结构

以下是一个合理的默认格式，但根据分析使用你的最佳判断：

```markdown
# [分析标题]

## 执行摘要
[概述]

## 关键发现
[根据你的发现调整章节]

## 建议
[根据具体上下文定制]
```

根据需要为特定的分析类型调整章节。
````

### 示例模式

对于输出质量依赖于看到示例的技能，提供输入/输出对，就像常规提示一样：

````markdown  theme={null}
## 提交消息格式

按照以下示例生成提交消息：

**示例 1：**
输入：添加了使用 JWT 令牌的用户认证
输出：
```
feat(auth): implement JWT-based authentication

Add login endpoint and token validation middleware
```

**示例 2：**
输入：修复了报告中日期显示不正确的 bug
输出：
```
fix(reports): correct date formatting in timezone conversion

Use UTC timestamps consistently across report generation
```

**示例 3：**
输入：更新了依赖并重构了错误处理
输出：
```
chore: update dependencies and refactor error handling

- Upgrade lodash to 4.17.21
- Standardize error response format across endpoints
```

遵循此风格：type(scope): 简要描述，然后是详细说明。
````

示例比单独的说明更能帮助 Claude 理解期望的风格和细节程度。

### 条件化工作流模式

引导 Claude 通过决策点：

```markdown  theme={null}
## 文档修改工作流

1. 确定修改类型：

   **创建新内容？** → 遵循下方的"创建工作流"
   **编辑现有内容？** → 遵循下方的"编辑工作流"

2. 创建工作流：
   - 使用 docx-js 库
   - 从零开始构建文档
   - 导出为 .docx 格式

3. 编辑工作流：
   - 解包现有文档
   - 直接修改 XML
   - 每次更改后验证
   - 完成后重新打包
```

<Tip>
  如果工作流变得很大或复杂有很多步骤，考虑将它们推入单独的文件，并告诉 Claude 根据当前任务读取对应的文件。
</Tip>

## 评估和迭代

### 先构建评估

**在编写大量文档之前创建评估。** 这确保你的技能解决真实问题，而不是记录想象的问题。

**评估驱动的开发：**

1. **识别差距**：在没有技能的情况下对代表性任务运行 Claude。记录具体的失败或缺失的上下文
2. **创建评估**：构建三个测试这些差距的场景
3. **建立基准**：测量 Claude 在没有技能时的表现
4. **编写最小化指令**：创建刚好足够的内容来解决差距并通过评估
5. **迭代**：执行评估，与基准比较，并优化

这种方法确保你解决实际问题，而不是预测可能永远不会出现的需求。

**评估结构**：

```json  theme={null}
{
  "skills": ["pdf-processing"],
  "query": "Extract all text from this PDF file and save it to output.txt",
  "files": ["test-files/document.pdf"],
  "expected_behavior": [
    "Successfully reads the PDF file using an appropriate PDF processing library or command-line tool",
    "Extracts text content from all pages in the document without missing any pages",
    "Saves the extracted text to a file named output.txt in a clear, readable format"
  ]
}
```

<Note>
  此示例演示了带有简单测试准则的数据驱动评估。我们目前不提供内置的运行这些评估的方式。用户可以创建自己的评估系统。评估是衡量技能有效性的真相来源。
</Note>

### 与 Claude 迭代开发技能

最有效的技能开发过程涉及 Claude 本身。与一个 Claude 实例（"Claude A"）合作创建将被其他实例（"Claude B"）使用的技能。Claude A 帮助你设计和优化指令，而 Claude B 在真实任务中测试它们。这之所以有效，是因为 Claude 模型既理解如何编写有效的智能体指令，也理解智能体需要什么信息。

**创建新技能：**

1. **在没有技能的情况下完成任务**：使用正常提示与 Claude A 解决一个问题。在工作过程中，你自然会提供上下文、解释偏好并分享过程性知识。注意你反复提供的信息。

2. **识别可重用的模式**：完成任务后，识别你提供的哪些上下文对类似的未来任务有用。

   **示例**：如果你完成了一个 BigQuery 分析，你可能提供了表名、字段定义、过滤规则（如"始终排除测试账户"）和常见查询模式。

3. **让 Claude A 创建技能**："创建一个能捕捉我们刚才使用的 BigQuery 分析模式的技能。包括表模式、命名约定和关于过滤测试账户的规则。"

   <Tip>
     Claude 模型原生理解技能格式和结构。你不需要特殊的系统提示或"writing skills"技能来让 Claude 帮助创建技能。只需让 Claude 创建一个技能，它就会生成结构正确的 SKILL.md 内容，包括适当的 frontmatter 和正文内容。
   </Tip>

4. **审查简洁性**：检查 Claude A 没有添加不必要的解释。要求："删除关于 win rate 含义的解释 — Claude 已经知道那个。"

5. **改进信息架构**：要求 Claude A 更有效地组织内容。例如："将其组织成表模式在单独的参考文件中。我们以后可能会添加更多表。"

6. **在类似任务上测试**：在相关用例上与 Claude B（一个加载了技能的新实例）使用该技能。观察 Claude B 是否找到正确的信息、正确应用规则并成功处理任务。

7. **基于观察迭代**：如果 Claude B 遇到困难或遗漏了什么，带着具体情况返回 Claude A："当 Claude 使用这个技能时，它忘记了对 Q4 按日期过滤。我们应该添加一节关于日期过滤模式的内容吗？"

**迭代现有技能：**

在改进技能时，同样的层次模式继续适用。你在以下角色之间交替：

* **与 Claude A 一起工作**（帮助优化技能的专家）
* **与 Claude B 一起测试**（使用技能执行实际工作的智能体）
* **观察 Claude B 的行为**并将洞察带回给 Claude A

1. **在真实工作流中使用技能**：给 Claude B（加载了技能）实际任务，不是测试场景

2. **观察 Claude B 的行为**：注意它在哪里挣扎、成功或做出意外的选择

   **示例观察**："当我要求 Claude B 提供区域销售报告时，它写了查询但忘记了过滤掉测试账户，即使技能提到了这条规则。"

3. **返回 Claude A 寻求改进**：分享当前的 SKILL.md 并描述你观察到的。问："我注意到 Claude B 在我要求区域报告时忘记过滤测试账户。技能提到了过滤，但可能不够突出？"

4. **审查 Claude A 的建议**：Claude A 可能建议重新组织以使规则更突出，使用更强的语言如"MUST filter"而不是"always filter"，或重构工作流部分。

5. **应用并测试更改**：用 Claude A 的改进更新技能，然后在类似请求上再次用 Claude B 测试

6. **基于使用重复**：随着你遇到新场景，继续这个观察-优化-测试循环。每次迭代基于真实智能体行为而不是假设来改进技能。

**收集团队反馈：**

1. 与团队成员分享技能并观察他们的使用
2. 询问：技能在预期时激活了吗？指令清晰吗？缺少什么？
3. 整合反馈以解决你自己使用模式中的盲点

**为什么这种方法有效**：Claude A 理解智能体需求，你提供领域专业知识，Claude B 通过真实使用揭示差距，迭代优化基于观察到的行为而非假设改进技能。

### 观察 Claude 如何导航技能

在迭代技能时，注意 Claude 在实践中如何实际使用它们。关注：

* **意外的探索路径**：Claude 读取文件的顺序是否是你未预料到的？这可能表明你的结构不如你想象的直观
* **遗漏的连接**：Claude 是否未能跟随对重要文件的引用？你的链接可能需要更明确或更突出
* **对某些章节的过度依赖**：如果 Claude 反复读取同一个文件，考虑该内容是否应该放在主 SKILL.md 中
* **被忽略的内容**：如果 Claude 从不访问某个捆绑文件，它可能是不必要的，或者在主指令中没有得到充分的引导

基于这些观察而非假设进行迭代。技能元数据中的 'name' 和 'description' 特别关键。Claude 在决定是否触发技能以响应当前任务时使用它们。确保它们清楚地描述技能做什么以及何时应该使用它。

## 要避免的反模式

### 避免 Windows 风格的路径

始终在文件路径中使用正斜杠，即使在 Windows 上：

* ✓ **好**：`scripts/helper.py`、`reference/guide.md`
* ✗ **避免**：`scripts\helper.py`、`reference\guide.md`

Unix 风格的路径在所有平台上都有效，而 Windows 风格的路径在 Unix 系统上会导致错误。

### 避免提供太多选项

除非必要，不要呈现多种方案：

````markdown  theme={null}
**坏的示例：太多选择**（令人困惑）：
"你可以使用 pypdf，或 pdfplumber，或 PyMuPDF，或 pdf2image，或..."

**好的示例：提供默认方案**（有退出路径）：
"使用 pdfplumber 进行文本提取：
```python
import pdfplumber
```

对于需要 OCR 的扫描 PDF，改用 pdf2image 配合 pytesseract。"
````

## 高级：带可执行代码的技能

以下章节侧重于包含可执行脚本的技能。如果你的技能只使用 markdown 指令，跳到[有效技能检查清单](#checklist-for-effective-skills)。

### 解决问题，不要推卸

在为技能编写脚本时，处理错误条件而不是将问题推给 Claude。

**好的示例：显式处理错误**：

```python  theme={null}
def process_file(path):
    """处理文件，如果不存在则创建。"""
    try:
        with open(path) as f:
            return f.read()
    except FileNotFoundError:
        # 创建带有默认内容的文件，而不是失败
        print(f"文件 {path} 未找到，创建默认文件")
        with open(path, 'w') as f:
            f.write('')
        return ''
    except PermissionError:
        # 提供替代方案而不是失败
        print(f"无法访问 {path}，使用默认值")
        return ''
```

**坏的示例：将问题推给 Claude**：

```python  theme={null}
def process_file(path):
    # 直接失败，让 Claude 想办法
    return open(path).read()
```

配置参数也应该有充分理由并记录文档，以避免"巫术常量"（Ousterhout 定律）。如果你不知道正确的值，Claude 如何确定它？

**好的示例：自我文档化**：

```python  theme={null}
# HTTP 请求通常在 30 秒内完成
# 更长的超时时间考虑到慢速连接
REQUEST_TIMEOUT = 30

# 三次重试在可靠性和速度之间取得平衡
# 大多数间歇性故障在第二次重试时解决
MAX_RETRIES = 3
```

**坏的示例：魔法数字**：

```python  theme={null}
TIMEOUT = 47  # 为什么是 47？
RETRIES = 5   # 为什么是 5？
```

### 提供工具脚本

即使 Claude 可以写脚本，预制脚本也有优势：

**工具脚本的好处**：

* 比生成的代码更可靠
* 节省 tokens（无需将代码包含在上下文中）
* 节省时间（无需代码生成）
* 确保跨使用时的一致性

<img src="https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-executable-scripts.png?fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=4bbc45f2c2e0bee9f2f0d5da669bad00" alt="在指令文件旁捆绑可执行脚本" data-og-width="2048" width="2048" data-og-height="1154" height="1154" data-path="images/agent-skills-executable-scripts.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-executable-scripts.png?w=280&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=9a04e6535a8467bfeea492e517de389f 280w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-executable-scripts.png?w=560&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=e49333ad90141af17c0d7651cca7216b 560w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-executable-scripts.png?w=840&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=954265a5df52223d6572b6214168c428 840w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-executable-scripts.png?w=1100&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=2ff7a2d8f2a83ee8af132b29f10150fd 1100w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-executable-scripts.png?w=1650&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=48ab96245e04077f4d15e9170e081cfb 1650w, https://mintcdn.com/anthropic-claude-docs/4Bny2bjzuGBK7o00/images/agent-skills-executable-scripts.png?w=2500&fit=max&auto=format&n=4Bny2bjzuGBK7o00&q=85&s=0301a6c8b3ee879497cc5b5483177c90 2500w" />

上图显示了可执行脚本如何与指令文件协同工作。指令文件（forms.md）引用脚本，Claude 可以执行它而不将其内容加载到上下文中。

**重要区别**：在你的指令中明确说明 Claude 应该：

* **执行脚本**（最常见）："运行 `analyze_form.py` 来提取字段"
* **作为参考阅读**（用于复杂逻辑）："查看 `analyze_form.py` 了解字段提取算法"

对于大多数工具脚本，执行更好，因为它更可靠和高效。有关脚本执行如何工作的详细信息，请参见下文[运行时环境](#runtime-environment)章节。

**示例**：

````markdown  theme={null}
## 工具脚本

**analyze_form.py**：从 PDF 中提取所有表单字段

```bash
python scripts/analyze_form.py input.pdf > fields.json
```

输出格式：
```json
{
  "field_name": {"type": "text", "x": 100, "y": 200},
  "signature": {"type": "sig", "x": 150, "y": 500}
}
```

**validate_boxes.py**：检查重叠的边界框

```bash
python scripts/validate_boxes.py fields.json
# 返回："OK" 或列出冲突
```

**fill_form.py**：将字段值应用到 PDF

```bash
python scripts/fill_form.py input.pdf fields.json output.pdf
```
````

### 使用视觉分析

当输入可以渲染为图像时，让 Claude 分析它们：

````markdown  theme={null}
## 表单布局分析

1. 将 PDF 转换为图像：
   ```bash
   python scripts/pdf_to_images.py form.pdf
   ```

2. 分析每个页面图像以识别表单字段
3. Claude 可以视觉性地看到字段位置和类型
````

<Note>
  在此示例中，你需要编写 `pdf_to_images.py` 脚本。
</Note>

Claude 的视觉能力有助于理解布局和结构。

### 创建可验证的中间输出

当 Claude 执行复杂的、开放式的任务时，它可能出错。"计划-验证-执行"模式通过让 Claude 首先以结构化格式创建计划，然后用脚本验证该计划，最后再执行，从而及早捕获错误。

**示例**：想象让 Claude 根据电子表格更新 PDF 中的 50 个表单字段。没有验证，Claude 可能会引用不存在的字段、创建冲突的值、遗漏必填字段，或不正确地应用更新。

**解决方案**：使用上面展示的工作流模式（PDF 表单填写），但添加一个在应用更改前被验证的中间 `changes.json` 文件。工作流变为：分析 → **创建计划文件** → **验证计划** → 执行 → 验证。

**为什么此模式有效：**

* **及早捕获错误**：验证在更改应用之前发现问题
* **机器可验证**：脚本提供客观验证
* **可逆的计划**：Claude 可以在不接触原始文件的情况下迭代计划
* **清晰的调试**：错误消息指向具体问题

**何时使用**：批量操作、破坏性更改、复杂的验证规则、高风险操作。

**实现提示**：使验证脚本冗长，带有具体的错误消息，如"字段 'signature\_date' 未找到。可用字段：customer\_name、order\_total、signature\_date\_signed"以帮助 Claude 修复问题。

### 打包依赖

技能在代码执行环境中运行，具有平台特定的限制：

* **claude.ai**：可以从 npm 和 PyPI 安装包，从 GitHub 仓库拉取
* **Anthropic API**：没有网络访问，没有运行时包安装

在你的 SKILL.md 中列出所需的包，并验证它们在[代码执行工具文档](/en/docs/agents-and-tools/tool-use/code-execution-tool)中是否可用。

### 运行时环境

技能在具有文件系统访问、bash 命令和代码执行能力的代码执行环境中运行。有关此架构的概念解释，请参见概述中的[技能架构](/en/docs/agents-and-tools/agent-skills/overview#the-skills-architecture)。

**这如何影响你的编写：**

**Claude 如何访问技能：**

1. **元数据预加载**：在启动时，所有技能 YAML frontmatter 中的名称和描述被加载到系统提示中
2. **文件按需读取**：Claude 在需要时使用 bash Read 工具从文件系统访问 SKILL.md 和其他文件
3. **脚本高效执行**：工具脚本可以通过 bash 执行，而无需将其完整内容加载到上下文中。只有脚本的输出消耗 tokens
4. **大文件无上下文惩罚**：参考文件、数据或文档在实际被读取之前不消耗上下文 tokens

* **文件路径很重要**：Claude 像浏览文件系统一样导航你的技能目录。使用正斜杠（`reference/guide.md`），不要用反斜杠
* **描述性命名文件**：使用指示内容的名称：`form_validation_rules.md`，而不是 `doc2.md`
* **为发现性而组织**：按领域或功能结构化目录
  * 好：`reference/finance.md`、`reference/sales.md`
  * 坏：`docs/file1.md`、`docs/file2.md`
* **捆绑全面的资源**：包括完整的 API 文档、大量示例、大数据集；在被访问之前没有上下文惩罚
* **优先使用脚本进行确定性操作**：编写 `validate_form.py` 而不是让 Claude 生成验证代码
* **明确执行意图**：
  * "运行 `analyze_form.py` 来提取字段"（执行）
  * "查看 `analyze_form.py` 了解提取算法"（作为参考阅读）
* **测试文件访问模式**：通过真实请求测试验证 Claude 能否导航你的目录结构

**示例：**

```
bigquery-skill/
├── SKILL.md（概览，指向引用文件）
└── reference/
    ├── finance.md（收入指标）
    ├── sales.md（管道数据）
    └── product.md（使用分析）
```

当用户询问关于收入的问题时，Claude 读取 SKILL.md，看到对 `reference/finance.md` 的引用，并调用 bash 只读取该文件。sales.md 和 product.md 文件保留在文件系统上，在需要之前消耗零上下文 tokens。这种基于文件系统的模型使得渐进式披露成为可能。Claude 可以导航并有选择地加载每个任务所需的精确内容。

有关技术架构的完整详情，请参见技能概述中的[技能如何工作](/en/docs/agents-and-tools/agent-skills/overview#how-skills-work)。

### MCP 工具引用

如果你的技能使用 MCP（Model Context Protocol）工具，始终使用完全限定的工具名称以避免"未找到工具"的错误。

**格式**：`ServerName:tool_name`

**示例**：

```markdown  theme={null}
使用 BigQuery:bigquery_schema 工具检索表模式。
使用 GitHub:create_issue 工具创建 issues。
```

其中：

* `BigQuery` 和 `GitHub` 是 MCP 服务器名称
* `bigquery_schema` 和 `create_issue` 是这些服务器中的工具名称

没有服务器前缀，Claude 可能无法定位工具，尤其是在多个 MCP 服务器可用时。

### 避免假设工具已安装

不要假设包已可用：

````markdown  theme={null}
**坏的示例：假设已安装**：
"使用 pdf 库处理文件。"

**好的示例：明确依赖关系**：
"安装所需包：`pip install pypdf`

然后使用它：
```python
from pypdf import PdfReader
reader = PdfReader("file.pdf")
```"
````

## 技术说明

### YAML frontmatter 要求

SKILL.md frontmatter 需要 `name`（最多 64 个字符）和 `description`（最多 1024 个字符）字段。有关完整的结构详情，请参见[技能概述](/en/docs/agents-and-tools/agent-skills/overview#skill-structure)。

### Token 预算

将 SKILL.md 正文保持在 500 行以下以获得最佳性能。如果你的内容超过此限制，请使用前面描述的渐进式披露模式将其拆分为单独的文件。有关架构详情，请参见[技能概述](/en/docs/agents-and-tools/agent-skills/overview#how-skills-work)。

## 有效技能检查清单

在分享技能之前，验证：

### 核心质量

* [ ] 描述具体，包含关键术语
* [ ] 描述包含技能做什么和何时使用
* [ ] SKILL.md 正文在 500 行以下
* [ ] 额外详情在单独文件中（如需要）
* [ ] 无时间敏感信息（或放在"旧模式"章节）
* [ ] 全文术语一致
* [ ] 示例是具体的，不是抽象的
* [ ] 文件引用最多一层深度
* [ ] 适当使用渐进式披露
* [ ] 工作流有清晰的步骤

### 代码和脚本

* [ ] 脚本解决问题而不是将问题推给 Claude
* [ ] 错误处理是显式且有用的
* [ ] 没有"巫术常量"（所有值都有理有据）
* [ ] 所需包在指令中列出并验证可用
* [ ] 脚本有清晰的文档
* [ ] 没有 Windows 风格的路径（全部使用正斜杠）
* [ ] 关键操作有验证/确认步骤
* [ ] 质量关键任务包含反馈循环

### 测试

* [ ] 至少创建了三个评估
* [ ] 用 Haiku、Sonnet 和 Opus 进行了测试
* [ ] 用真实使用场景进行了测试
* [ ] 团队反馈已整合（如适用）

## 后续步骤

<CardGroup cols={2}>
  <Card title="Get started with Agent Skills" icon="rocket" href="/en/docs/agents-and-tools/agent-skills/quickstart">
    创建你的第一个技能
  </Card>

  <Card title="Use Skills in Claude Code" icon="terminal" href="/en/docs/claude-code/skills">
    在 Claude Code 中创建和管理技能
  </Card>

  <Card title="Use Skills with the API" icon="code" href="/en/api/skills-guide">
    以编程方式上传和使用技能
  </Card>
</CardGroup>
