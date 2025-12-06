import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Semantic Markdown is active');
    return {
        extendMarkdownIt(md: any) {
            md.block.ruler.before('html_block', 'semantic_block', (state: any, startLine: number, endLine: number, silent: boolean) => {
                return semanticBlock(state, startLine, endLine, silent);
            });
            return md;
        }
    };
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
