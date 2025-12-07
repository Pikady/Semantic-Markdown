# 🚀 Prompt: VS Code Extension Generation Specification

**Role**: You are an expert VS Code Extension Developer and TypeScript Engineer.
**Task**: Create a complete VS Code extension named **"Semantic Markdown"**.
**Goal**: Allow users to write arbitrary XML-style tags (e.g., `<note>`, `<user>`, `<step>`) in Markdown files. These tags should be highlighted in the editor and rendered as elegant UI containers (cards) in the preview, while supporting standard Markdown content inside them.

---

## 1. Project Overview

*   **Extension Name**: `semantic-markdown`
*   **DisplayName**: Semantic Markdown
*   **Description**: Renders arbitrary XML-style tags as elegant containers in Markdown preview.
*   **Target Engine**: VS Code (`^1.70.0`)
*   **Core Technology**: `markdown-it` (VS Code's built-in Markdown engine).

## 2. Technical Architecture

### 2.1. `package.json` Configuration
*   **Activation**: `onLanguage:markdown`.
*   **Contributes**:
    *   `languages`: Markdown enhancement (configuration via `language-configuration.json`).
    *   `grammars`: Inject into `text.html.markdown` to highlight `<Tag>` syntax.
    *   `markdown.markdownItPlugins`: Register the renderer extension.
    *   `markdown.previewStyles`: Register `./media/style.css`.
    *   `keybindings`: Bind `Enter` key to custom command for smart newline handling.

### 2.2. Syntax Highlighting (`syntaxes/semantic.json`)
*   **Pattern**: Match generic XML tags `<TagName>` and `</TagName>`.
*   **Scope**: Use `entity.name.tag` so it inherits the user's color theme.
*   **Constraints**: Do not hardcode tag names. It must match *any* tag name consisting of alphanumerics, hyphens, or underscores.

### 2.3. Markdown-it Renderer (`src/extension.ts`)
*   **Mechanism**: Implement a custom **Block Rule** using `md.block.ruler`.
*   **Priority**: Insert rule *before* `html_block` to intercept these tags before standard HTML processing.
*   **Parsing Logic**:
    1.  **Trigger**: Detect lines starting with `<`.
    2.  **Validation**: Match strictly block-level tags (must be on their own line).
    3.  **Recursive Nesting (Crucial)**: Implement a **Depth Counter**.
        *   Start depth = 1.
        *   Scan forward. If match opening tag `<SameName>` -> depth++.
        *   If match closing tag `</SameName>` -> depth--.
        *   Stop when depth == 0.
    4.  **Token Generation**:
        *   Create `div_open` token with class `semantic-block`.
        *   **Title Header**: Create a child `div` token with class `semantic-header` containing the tag name. This replaces the previous pseudo-element approach for better stability.
        *   **Recursion**: Call `state.md.block.tokenize(state, startLine + 1, endLine)` to parse the *inner* content as standard Markdown (supporting lists, bold, code, etc.).
        *   Create `div_close` token.
    5.  **Indentation Handling**: Ensure the parser respects the indentation of parent blocks (e.g., if used inside a list item).

### 2.4. Styling (`media/style.css`)
*   **Theme Integration**: Use VS Code CSS variables (e.g., `var(--vscode-editor-background)`, `var(--vscode-panel-border)`).
*   **Real DOM Headers**: Style `.semantic-header` directly instead of using `::before` pseudo-elements to prevent rendering issues (e.g., disappearance on hover).
*   **Layout**: Card style with a left accent border.
*   **List Indentation**: Explicitly set `margin-left: 1em` for `ul` and `ol` inside semantic blocks to prevent bullets from overlapping with the accent border.

### 2.5. Auto-Completion & Editing Experience (New Feature)

#### 2.5.1 Auto-Close Tags
*   **Mechanism**: Listen to `onDidChangeTextDocument` events.
*   **Trigger**: When user types `>`, check if it closes an opening tag.
*   **Logic**:
    1.  Detect input of `>`.
    2.  Extract text before cursor to identify `<TagName`.
    3.  Verify it's not a self-closing tag (e.g., `<br/>`).
    4.  Verify it's not already closed immediately after.
    5.  **Action**: Automatically insert `</TagName>` and place cursor between tags: `<Tag>|</Tag>`.
*   **Configuration**:
    *   In `language-configuration.json`, **disable** native auto-closing for `<` and `>` to prevent conflict with our custom logic.

#### 2.5.2 Smart Enter Key
*   **Goal**: When pressing `Enter` between `<Tag>| </Tag>`, insert a new line **without** indentation.
*   **Implementation**:
    *   Register custom command `semantic-markdown.onEnter`.
    *   Bind `Enter` key in `package.json` with strict `when` clause (`editorTextFocus && editorLangId == markdown && !suggestionWidgetVisible && !inSnippetMode`).
*   **Logic**:
    1.  Check if cursor is strictly between `<TagName...>` and `</TagName>`.
    2.  If true, insert `\n\n` and place cursor on the empty middle line.
    3.  **Crucial**: Do NOT apply indentation (unlike HTML defaults).
    4.  If false, fallback to standard `type` command for newline.

---

## 3. Implementation Details (Code Structure)

Please generate the code following these specific requirements.

### File: `package.json`
*   Define `scopeName` as `markdown.semantic.xml`.
*   Inject grammar into `text.html.markdown`.

### File: `src/extension.ts`
*(Key Algorithm Requirement)*
```typescript
// Skeleton logic for the Block Rule
function semanticBlock(state, startLine, endLine, silent) {
    // 1. Check start char '<' (Optimization)
    // 2. Regex match opening tag: /^<([a-zA-Z0-9-_]+)(\s.*?)?>$/
    // 3. Loop lines to find matching closing tag </TagName>
    // 4. Handle Nesting:
    //    while (nextLine < endLine) {
    //       if (line matches opening tag) depth++;
    //       if (line matches closing tag) depth--;
    //       if (depth === 0) found = true; break;
    //    }
    // 5. If found:
    //    state.push('div_open', 'div', 1); // semantic-block
    //    
    //    // NEW: Render Title as Real DOM Element
    //    state.push('div_open', 'div', 1); // semantic-header
    //    state.push('inline', ...); // text content
    //    state.push('div_close', 'div', -1);
    //
    //    state.md.block.tokenize(state, startLine + 1, nextLine); // Recursive parsing
    //    state.push('div_close', 'div', -1);
    //    state.line = nextLine + 1;
    //    return true;
}
```

### File: `media/style.css`
```css
.semantic-block {
    border: 1px solid var(--vscode-panel-border);
    border-radius: 4px;
    background-color: var(--vscode-editor-background);
    margin: 1em 0;
    position: relative;
    /* overflow: hidden removed to prevent clipping */
}

/* Real DOM Title Bar */
.semantic-header {
    display: block;
    background-color: var(--vscode-sideBar-background);
    color: var(--vscode-editor-foreground);
    padding: 4px 10px 4px 16px;
    font-weight: bold;
    font-size: 0.85em;
    text-transform: uppercase;
    border-bottom: 1px solid var(--vscode-panel-border);
    border-top-left-radius: 3px;
    border-top-right-radius: 3px;
}

/* Content Padding */
.semantic-block > *:not(.semantic-header) {
    padding-left: 16px;
    padding-right: 12px;
}

/* List Indentation Fix */
.semantic-block > ul,
.semantic-block > ol {
    padding-left: 2.5em;
    margin-left: 1em;
}

/* Left Accent Line */
.semantic-block::after {
    content: "";
    position: absolute;
    top: 0; bottom: 0; left: 0;
    width: 4px;
    background-color: var(--vscode-textLink-foreground);
    z-index: 2;
}
```

---

## 4. Edge Cases & Requirements Checklist

1.  **Nesting**: Code must handle `<group><group>content</group></group>` correctly using the depth counter.
2.  **Attributes**: The Regex must allow attributes (e.g., `<user id="1">`), but the parser should use the tag name ("user") for the header text.
3.  **Indentation**: The parser must detect the indentation of the opening tag and ensure the closing tag has matching indentation (visual block logic).
4.  **Fault Tolerance**: If no closing tag is found, return `false` (let it be rendered as plain text/HTML), do NOT crash or hang.
5.  **Performance**: Do not use Regex on the entire document string. Use line-by-line scanning via the `state` object.

---

## 5. Test Examples

The generated code must correctly render this Markdown:

```markdown
# Demo

<user>
- **Name**: Alice
- **Role**: Admin
</user>

<group>
  Outer content
  <group>
     Inner content (Nested)
  </group>
</group>

- List Item:
  <note>
  Indented block inside a list.
  </note>
```

**Action**: Please generate the complete project file structure and code based on these specifications.
