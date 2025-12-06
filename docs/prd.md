
---

# 项目需求文档：Semantic Markdown (VS Code  Extension)

## 1. 项目概述

**项目名称**：Semantic Markdown
**核心目标**：增强 VS Code 对 Markdown 文档中“任意 XML 风格语义标签”的支持。
**应用场景**：用户在编写产品文档或技术文档时，习惯使用自定义 XML 标签（如 `<user>`, `<warning>`, `<step>`）来包裹内容。
**核心功能**：
1.  **编辑器高亮**：在编辑区域对这些标签进行语法高亮。
2.  **预览渲染**：在 Markdown 预览区将这些标签转换为优雅的 UI 容器（卡片），且**支持标签内部继续渲染 Markdown 语法**（如列表、粗体、代码块）。
3.  **通用性**：不预设标签列表，支持用户输入的任意标签名（Dynamic Tagging）。

---

## 2. 技术架构与规范

*   **开发框架**：VS Code Extension API
*   **Markdown 引擎**：`markdown-it` (VS Code 内置引擎)
*   **核心解析策略**：使用 **Block Ruler (块级规则)** 而非简单的正则替换。这是为了保证性能、上下文感知（避免误伤代码块中的标签）以及支持嵌套 Markdown 渲染。
*   **样式策略**：使用 CSS 变量 (`var(--vscode-...)`) 适配 VS Code 的亮色/暗色主题；使用 `attr(data-tag)` 实现动态标题。

---

## 3. 详细实现步骤

### 步骤 1：配置文件 (`package.json`)

需要在 `contributes` 中声明语言增强、语法注入和样式文件。

*   **Grammars**：注入到 `text.html.markdown` 作用域。
*   **Markdown**：启用 `markdown.markdownItPlugins` 并配置样式。

### 步骤 2：语法高亮 (`syntaxes/semantic-xml.json`)

**目标**：让编辑器识别 `<Tag>` 和 `</Tag>`。
**规则**：
*   匹配 `<` + `标签名` + `>`。
*   标签名允许字母、数字、下划线、中划线。
*   不要限定具体标签名，匹配通用模式。
*   Scope 建议使用 `entity.name.tag` 以获得默认主题颜色支持。

### 步骤 3：核心渲染逻辑 (`src/extension.ts`)

这是项目的核心。请编写一个 `markdown-it` 插件。

**算法逻辑 (Block Rule)**：
1.  **注册规则**：使用 `md.block.ruler.before('html_block', 'semantic_xml', ...)`，优先级高于普通 HTML 块。
2.  **起始检查**：
    *   检查当前行首字符是否为 `<` (性能优化)。
    *   检查当前行是否匹配开始标签正则 `^<([a-zA-Z0-9-_]+)(\s.*?)?>$`。
    *   如果匹配，提取 `tagName`。
3.  **寻找闭合**：
    *   从下一行开始循环，向下查找匹配的结束标签 `^</tagName>$`。
    *   如果找不到闭合标签，返回 `false`（放弃处理，交给后续规则）。
4.  **生成 Token**：
    *   如果找到闭合，消耗掉这些行。
    *   Push **Open Token**: `div`，带属性 `class="semantic-block"`, `data-tag="tagName"`。
    *   **关键步骤**：调用 `state.md.block.tokenize(state, startLine + 1, nextLine)`。这步操作是**递归解析**，确保标签内部的内容（如列表、引用）被渲染为 HTML，而不是纯文本。
    *   Push **Close Token**: `div`。
5.  **返回**：`true`。

### 步骤 4：样式设计 (`media/style.css`)

**目标**：将 `<div class="semantic-block" data-tag="...">` 渲染为卡片。

**CSS 规范**：
*   **容器**：带边框、圆角、阴影。背景色使用 `var(--vscode-editor-background)`。
*   **动态标题**：使用伪元素 `::before` 和 `content: attr(data-tag)`。
    *   标题背景色：使用 `var(--vscode-sideBar-background)` 或类似浅色/深色适配色。
    *   标题文字：转大写 (`text-transform: uppercase`)，加粗。
*   **装饰**：左侧添加一条彩色竖线（例如使用 `var(--vscode-textLink-foreground)`）。
*   **间距**：确保内部内容 (`.semantic-block > *`) 有合适的 padding。

---

## 4. 代码结构参考 (Prompt for AI)

请根据以上逻辑，生成完整的项目代码结构：

### File: src/extension.ts (核心解析器)

```typescript
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    return {
        extendMarkdownIt(md: any) {
            // 在这里实现 Block Ruler 逻辑
            // 务必包含 state.md.block.tokenize 以支持内部 Markdown 渲染
            // 务必进行上下文检查（如缩进检查）以避免破坏代码块
            return md.use(semanticPlugin); 
        }
    };
}

function semanticPlugin(md: any) {
    // 具体的 parser 实现...
}
```

### File: media/style.css (样式)

```css
.semantic-block {
    /* 容器样式 */
    position: relative;
    border: 1px solid var(--vscode-panel-border);
    border-radius: 4px;
    margin: 1em 0;
}

.semantic-block::before {
    /* 动态标题栏 */
    content: attr(data-tag);
    display: block;
    font-weight: bold;
    text-transform: uppercase;
    /* ...其他样式 */
}
```

---

## 5. 测试用例 (用于验证)

生成的插件应能完美处理以下 Markdown 内容：

```markdown
# 测试文档

普通文本...

<user>
- **Name**: John Doe
- **Role**: Admin
</user>

<warning>
> 这是一个警告块。
> 内部包含引用语法。
</warning>

```

**预期结果**：
1.  `<user>` 和 `<warning>` 在编辑器中变色高亮。
2.  在预览中，`<user>` 显示为带有 "USER" 标题的卡片，内部的列表项正常渲染（黑点、粗体）。
3.  `<warning>` 显示为带有 "WARNING" 标题的卡片，内部显示为引用样式。

---

**指令结束**：请依据此文档生成完整的 VS Code 插件项目代码。