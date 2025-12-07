# Semantic Markdown (语义化 Markdown)

> **专为 AI 上下文工程（Context Engineering）打造的写作利器。**

[English Documentation](README.md)

在构建复杂的 AI 上下文（尤其是针对 Anthropic Claude 等模型）时，使用 XML 标签来组织背景、指令和示例已被证明是非常有效的。正如阳志平在《AI产品研发训练营》中所述，**具有语义闭合的 XML 语法能有效帮助 AI 理解复杂语义**。

然而，在标准的 Markdown 编辑器中，大量的 XML 标签会让文档变得杂乱且难以阅读。**Semantic Markdown** 旨在解决这个问题，它在 Markdown 的基础之上拓展了 XML 功能，为你提供优雅、简洁的上下文（Context）构建与阅读体验。

## 🌟 为什么需要这个插件？

### 1. 结构化你的上下文 (Context)
AI 上下文本质上是给模型阅读的代码。通过 `<role>`, `<context>`, `<task>` 等标签，你可以清晰地界定信息的边界。本插件让这些结构在视觉上更加一目了然。

### 2. 优雅的预览体验
不再面对枯燥的 XML 代码。本插件将 XML 标签渲染为现代化的 UI 卡片（Container），支持深色/浅色主题适配，让你的上下文文档像产品文档一样易读。

### 3. 流畅的写作流
- **自动闭合**：输入 `<role` 后敲击 `>`，自动补全 `</role>`，不再担心标签未闭合导致的 AI 理解偏差。
- **智能排版**：在标签间回车自动处理缩进和空行，保持文档整洁。
- **混合排版**：在 XML 标签内部继续使用标准的 Markdown 语法（列表、加粗、代码块等）。

## 💡 场景示例

### 编写 Claude 风格的 System Context

```markdown
<system_context>
  <role>
  你是一位资深的软件架构师，擅长用通俗易懂的语言解释复杂的技术概念。
  </role>

  <task>
  请根据用户提供的代码片段，分析其潜在的性能瓶颈，并给出优化建议。
  </task>

  <constraints>
  - 必须引用具体的代码行号。
  - 建议必须包含 TypeScript 类型定义。
  - 避免使用过于学术化的术语。
  </constraints>

  <output_format>
  请以 Markdown 表格的形式输出分析结果。
  </output_format>
</system_context>
```

### 定义 AI 技能 (Skills)

```markdown
<skill>
  <description>
  根据用户需求编写 Python 脚本。
  </description>
  
  <parameters>
    <parameter>
    脚本的功能需求描述。
    </parameter>
  </parameters>
</skill>
```

## ✨ 核心特性

- **任意标签支持**：不局限于预设标签，支持 `<user>`, `<assistant>`, `<thought>`, `<example>` 等任意自定义语义标签。
- **深度嵌套渲染**：完美支持复杂的嵌套结构（如 `<examples>` 中包含多个 `<example>`）。
- **原生编辑器体验**：无缝集成 VS Code / Cursor / Trae 的语法高亮和主题系统。

## 📦 安装与使用

适用于所有基于 VS Code 的编辑器（VS Code, Cursor, Trae, Zed 等）。

1. 在扩展商店搜索 **"Semantic Markdown"** 并安装。
2. 打开任意 `.md` 文件，开始使用 XML 标签包裹你的内容。

---

**让上下文构建回归语义，让 AI 更好地理解你的意图。**
