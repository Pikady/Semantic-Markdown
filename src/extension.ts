import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Semantic Markdown is active');

    // Register Auto Close Tag listener
    const autoCloseDisposable = vscode.workspace.onDidChangeTextDocument(event => {
        insertAutoCloseTag(event);
    });

    context.subscriptions.push(autoCloseDisposable);

    // Context Key Logic
    const updateContext = () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'markdown') {
            vscode.commands.executeCommand('setContext', 'semantic-markdown:betweenTags', false);
            return;
        }

        const selection = editor.selection;
        if (!selection.isEmpty) {
            vscode.commands.executeCommand('setContext', 'semantic-markdown:betweenTags', false);
            return;
        }

        const position = selection.active;
        const lineText = editor.document.lineAt(position.line).text;
        const textBefore = lineText.substring(0, position.character);
        const textAfter = lineText.substring(position.character);

        const beforeMatch = textBefore.match(/<([a-zA-Z0-9-_]+)(?:\s+[^>]*)?>$/);
        const afterMatch = textAfter.match(/^<\/([a-zA-Z0-9-_]+)>/);

        const isBetweenTags = !!(beforeMatch && afterMatch && beforeMatch[1] === afterMatch[1]);
        vscode.commands.executeCommand('setContext', 'semantic-markdown:betweenTags', isBetweenTags);
    };

    context.subscriptions.push(
        vscode.window.onDidChangeTextEditorSelection(updateContext),
        vscode.window.onDidChangeActiveTextEditor(updateContext),
        vscode.workspace.onDidChangeTextDocument(e => {
            if (vscode.window.activeTextEditor && e.document === vscode.window.activeTextEditor.document) {
                updateContext();
            }
        })
    );

    // Register Enter Key Command
    const onEnterDisposable = vscode.commands.registerCommand('semantic-markdown.onEnter', () => {
        onEnterKey();
    });
    context.subscriptions.push(onEnterDisposable);

    return {
        extendMarkdownIt(md: any) {
            md.block.ruler.before('html_block', 'semantic_block', (state: any, startLine: number, endLine: number, silent: boolean) => {
                return semanticBlock(state, startLine, endLine, silent);
            });
            return md;
        }
    };
}

// Auto Close Tag Logic
function insertAutoCloseTag(event: vscode.TextDocumentChangeEvent): void {
    if (event.contentChanges.length === 0) { return; }
    const textChange = event.contentChanges[0];
    if (textChange.text !== '>') { return; }

    const editor = vscode.window.activeTextEditor;
    if (!editor) { return; }

    const document = editor.document;
    if (document.languageId !== 'markdown') { return; }

    // Use the change range to determine the position, not the current selection
    // (Selection might not be updated yet)
    const range = textChange.range;
    const position = range.start.translate(0, 1); // The position after the inserted '>'
    const lineText = document.lineAt(position.line).text;
    const textBeforeCursor = lineText.substring(0, position.character);

    // The document is already updated, so textBeforeCursor ends with '>'
    if (!textBeforeCursor.endsWith('>')) { return; }

    // Strip the last '>' to analyze the tag content
    const textContent = textBeforeCursor.slice(0, -1);

    // Ignore self-closing tags (e.g. <br/>)
    if (textContent.endsWith('/')) { return; }

    // Regex to match opening tag, allowing attributes: <TagName ...
    const tagMatch = textContent.match(/<([a-zA-Z0-9-_]+)(?:\s+[^>]*)?$/);

    if (tagMatch) {
        const tagName = tagMatch[1];
        
        // Check if it's a self-closing tag or already closed immediately
        const textAfterCursor = lineText.substring(position.character);
        if (textAfterCursor.startsWith(`</${tagName}>`)) {
            return;
        }

        // Avoid double closing if user is just typing inside an existing tag
        // Simple check: do we see a closing > right before? We just typed it.
        
        editor.insertSnippet(
            new vscode.SnippetString(`$0</${tagName}>`),
            new vscode.Selection(position, position)
        );
    }
}

// On Enter Key Logic
function onEnterKey() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.commands.executeCommand('type', { source: 'keyboard', text: '\n' });
        return;
    }

    const selection = editor.selection;
    // Only handle if single cursor and selection is empty
    if (!selection.isEmpty) {
        vscode.commands.executeCommand('type', { source: 'keyboard', text: '\n' });
        return;
    }

    const document = editor.document;
    const position = selection.active;
    const lineText = document.lineAt(position.line).text;
    
    const textBefore = lineText.substring(0, position.character);
    const textAfter = lineText.substring(position.character);

    // Check pattern: <Tag ...> | </Tag>
    // 1. Before: Ends with <TagName ...>
    // 2. After: Starts with </TagName>
    // Note: We need to extract TagName from both sides to ensure they match
    
    const beforeMatch = textBefore.match(/<([a-zA-Z0-9-_]+)(?:\s+[^>]*)?>$/);
    const afterMatch = textAfter.match(/^<\/([a-zA-Z0-9-_]+)>/);

    if (beforeMatch && afterMatch && beforeMatch[1] === afterMatch[1]) {
        // We are between matching tags!
        // Insert: \n + cursor + \n
        // And importantly: NO indentation logic here, just raw newlines
        editor.insertSnippet(new vscode.SnippetString('\n$0\n'));
    }
    // Fallback is NOT needed because the command is only enabled via context key when the condition is true.
}

function semanticBlock(state: any, startLine: number, endLine: number, silent: boolean): boolean {
    const startPos = state.bMarks[startLine] + state.tShift[startLine];
    const maxPos = state.eMarks[startLine];
    const lineText = state.src.slice(startPos, maxPos);

    // 1. Optimization: Check start char '<'
    if (lineText.charCodeAt(0) !== 60) { return false; }

    // 2. Regex match opening tag: /^<([a-zA-Z0-9-_]+)(\s.*?)?>$/
    const openTagRegex = /^<([a-zA-Z0-9-_]+)(\s.*?)?>$/;
    const match = lineText.match(openTagRegex);
    
    if (!match) { return false; }

    const tagName = match[1];
    const closeTagStr = `</${tagName}>`;

    // 3. Loop lines to find matching closing tag </TagName>
    let nextLine = startLine + 1;
    let depth = 1;
    let found = false;

    while (nextLine < endLine) {
        const nextStart = state.bMarks[nextLine] + state.tShift[nextLine];
        const nextMax = state.eMarks[nextLine];
        const nextLineText = state.src.slice(nextStart, nextMax);

        // Check nesting
        const nextOpenMatch = nextLineText.match(openTagRegex);
        if (nextOpenMatch && nextOpenMatch[1] === tagName) {
            depth++;
        }

        // Check closing
        if (nextLineText.trim() === closeTagStr) {
            depth--;
            if (depth === 0) {
                found = true;
                break;
            }
        }

        nextLine++;
    }

    // 4. Fault Tolerance
    if (!found) { return false; }

    if (silent) { return true; }

    // 5. Token Generation
    const tokenOpen = state.push('div_open', 'div', 1);
    tokenOpen.attrs = [['class', 'semantic-block']];
    tokenOpen.map = [startLine, nextLine + 1];

    // 5.1. Title Header Generation (Real DOM element instead of pseudo-element)
    const tokenHeaderOpen = state.push('div_open', 'div', 1);
    tokenHeaderOpen.attrs = [['class', 'semantic-header']];

    const tokenInline = state.push('inline', '', 0);
    tokenInline.content = tagName;
    tokenInline.children = [];

    const tokenHeaderClose = state.push('div_close', 'div', -1);

    // Recursive parsing
    state.md.block.tokenize(state, startLine + 1, nextLine);

    const tokenClose = state.push('div_close', 'div', -1);
    
    state.line = nextLine + 1;
    return true;
}

export function deactivate() {}
