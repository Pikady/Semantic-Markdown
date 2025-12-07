# Semantic Markdown

> **The ultimate writing tool for AI Context Engineering.**

[中文文档](README_zh-CN.md)

When crafting complex AI contexts (especially for models like Anthropic Claude), using XML tags to organize context, instructions, and examples has proven to be highly effective. **Semantically closed XML tags effectively help AI models understand complex semantics.**

However, in standard Markdown editors, extensive use of XML tags can make documents cluttered and hard to read. **Semantic Markdown** solves this by extending Markdown with native XML support, providing an elegant and concise experience for writing and previewing AI contexts.

## 🌟 Why Semantic Markdown?

### 1. Structure Your Context
AI context is essentially code for models to read. Using tags like `<role>`, `<context>`, and `<task>` allows you to clearly define information boundaries. This extension makes these structures visually distinct.

### 2. Elegant Preview Experience
Say goodbye to raw XML clutter. This extension renders XML tags as modern UI containers (Cards), adapting to both light and dark themes. It turns your context documents into readable, professional documentation.

### 3. Seamless Writing Flow
- **Auto-Close Tags**: Type `<role` and press `>`, and it automatically inserts `</role>`, preventing unclosed tags that could confuse the AI.
- **Smart Formatting**: Pressing `Enter` between tags automatically handles indentation and newlines, keeping your document clean.
- **Mixed Content**: Continue using standard Markdown syntax (lists, bold, code blocks) inside your XML tags.

## 💡 Usage Examples

### Writing a Claude-Style System Context

```markdown
<system_context>
  <role>
  You are a senior software architect who excels at explaining complex technical concepts in simple terms.
  </role>

  <task>
  Analyze the provided code snippets for potential performance bottlenecks and suggest optimizations.
  </task>

  <constraints>
  - Must reference specific line numbers.
  - Suggestions must include TypeScript type definitions.
  - Avoid overly academic jargon.
  </constraints>

  <output_format>
  Please output the analysis results in a Markdown table.
  </output_format>
</system_context>
```

### Defining AI Skills

```markdown
<skill>
  <description>
  Writes a Python script based on user requirements.
  </description>
  
  <parameters>
    <parameter>
    Description of the script's functionality.
    </parameter>
  </parameters>
</skill>
```

## ✨ Key Features

- **Arbitrary Tag Support**: Not limited to presets—supports any custom semantic tag like `<user>`, `<assistant>`, `<thought>`, `<example>`, etc.
- **Deep Nesting**: Perfectly renders complex nested structures (e.g., multiple `<example>` tags inside `<examples>`).
- **Native Editor Experience**: Seamlessly integrates with VS Code / Cursor / Trae syntax highlighting and theming.

## 📦 Installation

Compatible with all VS Code-based editors (VS Code, Cursor, Trae, Zed, etc.).

1. Search for **"Semantic Markdown"** in the Extensions Marketplace and install.
2. Open any `.md` file and start wrapping your content with XML tags.

---

**Bring semantics back to Context Engineering and help AI better understand your intent.**
