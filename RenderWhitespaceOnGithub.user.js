/**
The MIT License (MIT)

Copyright (c) 2017 Gleb Mazovetskiy

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
**/
// ==UserScript==
// @id              RenderWhitespace
// @name            Render Whitespace on GitHub
// @description     Renders spaces as · and tabs as → in all the code on GitHub.
// @namespace       https://github.com/glebm
// @version         1.3.3
// @author          Gleb Mazovetskiy <glex.spb@gmail.com>
// @domain          github.com
// @domain          gist.github.com
// @match           https://gist.github.com/*
// @match           https://github.com/*
// @homepageUrl     https://gist.github.com/5b6c4517322193fbc51090dc3b57a44a
// @run-at          document-end
// @contributionURL https://etherchain.org/account/0x962644db6d8735446c1af84a2c1f16143f780184
// ==/UserScript==


// Settings
var SPACE = '·';
var TAB = '→';
var WHITESPACE_OPACITY = 0.4;
var COPYABLE_WHITESPACE_INDICATORS = false;

// Other constants
var WS_CLASS = 'glebm-ws';
var ROOT_SELECTOR = 'table[data-tab-size]';
var NODE_FILTER = {
    acceptNode(node) {
        let parent = node.parentNode;
        if (parent.classList.contains(WS_CLASS)) return NodeFilter.FILTER_SKIP;
        while (parent.nodeName != 'TABLE') {
            if (parent.classList.contains('blob-code-inner')) {
                return !(parent.firstChild === node && node.nodeValue === ' ') ?
                    NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
            }
            parent = parent.parentNode;
        }
        return NodeFilter.FILTER_SKIP;
    }
};

function main() {
    const styleNode = document.createElement('style');
    styleNode.textContent = COPYABLE_WHITESPACE_INDICATORS ?
        `.${WS_CLASS} { opacity: ${WHITESPACE_OPACITY}; }` :
        `.${WS_CLASS}::before {
  opacity: ${WHITESPACE_OPACITY};
  position: absolute;
  text-indent: 0;
}` + /* In a diff: */
        `.blob-code > .blob-code-inner .${WS_CLASS}::before {
  line-height: 2;
}`;
    document.head.appendChild(styleNode);

    const registeredFragments = new WeakSet();
    const showWhitespaceOnNextTick = () => setTimeout(showWhitespace, 0);
    const initDOM = () => {
        showWhitespace();
        // https://github.com/github/include-fragment-element
        for (const node of document.querySelectorAll('include-fragment')) {
            if (registeredFragments.has(node)) continue;
            registeredFragments.add(node);
            node.addEventListener('loadend', showWhitespaceOnNextTick);
        }
    };
    document.addEventListener('pjax:success', initDOM);
    initDOM();
}

function showWhitespace() {
    for (const root of document.querySelectorAll(ROOT_SELECTOR)) {
        const tab = TAB.padEnd(+root.dataset.tabSize);
        const treeWalker =
            document.createTreeWalker(root, NodeFilter.SHOW_TEXT, NODE_FILTER);
        const nodes = [];
        while (treeWalker.nextNode()) nodes.push(treeWalker.currentNode);

        const isDiff = root.classList.contains('diff-table');
        for (const node of nodes) replaceWhitespace(node, tab, SPACE, isDiff);
    }
}

function replaceWhitespace(node, tab, space, isDiff) {
    let originalText = node.nodeValue;
    const parent = node.parentNode;
    const ignoreFirstSpace = isDiff &&
        originalText.charAt(0) === ' ' &&
        parent.classList.contains('blob-code-inner') &&
        parent.firstChild === node;
    if (ignoreFirstSpace) {
        if (originalText === ' ') return;
        originalText = originalText.slice(1);
        parent.insertBefore(document.createTextNode(' '), node);
    }
    const tabParts = originalText.split('\t');
    const tabSpaceParts = tabParts.map(s => s.split(' '));
    if (!ignoreFirstSpace && tabSpaceParts.length === 1 &&
        tabSpaceParts[0].length === 1) return;
    const insert = (newNode) => {
        parent.insertBefore(newNode, node);
    };
    insertParts(tabSpaceParts,
        spaceParts => spaceParts.length === 1 && spaceParts[0] === '',
        n => insert(createWhitespaceNode('t', '\t', tab, n)),
        spaceParts =>
            insertParts(spaceParts,
                text => text === '',
                n => insert(createWhitespaceNode('s', ' ', space, n)),
                text => insert(document.createTextNode(text))));
    parent.removeChild(node);
}


var WS_ADDED_STYLES = new Set();
function createWhitespaceNode(type, originalText, text, n) {
    const node = document.createElement('span');
    node.classList.add(WS_CLASS);
    if (COPYABLE_WHITESPACE_INDICATORS) {
        node.textContent = text.repeat(n);
    } else {
        const className = `${type}-${n}`;
        if (!WS_ADDED_STYLES.has(className)) {
            const styleNode = document.createElement('style');
            styleNode.textContent =
                `.${WS_CLASS}-${className}::before { content: '${text.repeat(n)}'; }`;
            document.head.appendChild(styleNode);
            WS_ADDED_STYLES.add(className);
        }
        node.classList.add(`${WS_CLASS}-${className}`);
        node.textContent = originalText.repeat(n);
    }
    return node;
}

function insertParts(parts, isConsecutiveFn, addInterFn, addPartFn) {
    const n = parts.length;
    parts.reduce((consecutive, part, i) => {
        const isConsecutive = isConsecutiveFn(part);
        if (isConsecutive && i !== n - 1) return consecutive + 1;
        if (consecutive > 0) addInterFn(consecutive);
        if (!isConsecutive) addPartFn(part);
        return 1;
    }, 0);
}

main();
