/*
 * sidepanel-global.js
 * 使用 Readability 提取正文后，通过 iframe 原样渲染并支持下载
 */

let _maskEl = null;
let _maskEl2 = null;
let currentTitle = 'note';
let ocrIframe = null;

function ensureLoadingStyle() {
    if (document.getElementById('loading-spinner-style')) return;
    const style = document.createElement('style');
    style.id = 'loading-spinner-style';
    style.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .loading-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(255,255,255,0.7);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }
    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 5px solid rgba(0,0,0,0.1);
      border-top-color: rgba(0,0,0,0.7);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    .loading-text {
      margin-top: 12px;
      font-size: 14px;
      color: #333;
      font-family: sans-serif;
    }
  `;
    document.head.appendChild(style);
}

// ——— 2. 显示加载动画 ———
let _loadingOverlay = null;
function showLoading() {
    ensureLoadingStyle();
    if (_loadingOverlay) return;

    _loadingOverlay = document.createElement('div');
    _loadingOverlay.className = 'loading-overlay';

    // 转圈
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    _loadingOverlay.appendChild(spinner);

    // 文本
    const text = document.createElement('div');
    text.className = 'loading-text';
    text.textContent = '解析中...';
    _loadingOverlay.appendChild(text);

    document.body.appendChild(_loadingOverlay);
}

// ——— 3. 隐藏加载动画 ———
function hideLoading() {
    if (!_loadingOverlay) return;
    _loadingOverlay.remove();
    _loadingOverlay = null;
}


function showMaskOrc(text = '操作中…') {
    if (_maskEl2) return;
    _maskEl2 = document.createElement('div');
    Object.assign(_maskEl2.style, {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.8)',
        zIndex: 9999
    });
    const msg = document.createElement('div');
    msg.textContent = text;
    Object.assign(msg.style, {
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: '18px',
        color: '#fff',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: '10px 20px',
        borderRadius: '4px'
    });
    _maskEl2.appendChild(msg);
    document.body.appendChild(_maskEl2);
}

function hideMaskOcr() {
    if (!_maskEl) return;
    _maskEl.remove();
    _maskEl = null;
}
// 显示遮罩，防止操作中断
function showMask() {
    if (_maskEl) return;
    _maskEl = document.createElement('div');
    Object.assign(_maskEl.style, {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.8)',
        zIndex: 9999
    });
    document.body.appendChild(_maskEl);
}

// 隐藏遮罩
function hideMask() {
    if (!_maskEl) return;
    _maskEl.remove();
    _maskEl = null;
}
function domChildren(node) {
    return Array.from(node.childNodes).map(domToMarkdown).join('');
}

// 简易 DOM -> Markdown
function domToMarkdown(node) {
    if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent.replace(/\s+/g, ' ');
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return '';

    const tag = node.tagName.toUpperCase();
    let md = '';

    switch (tag) {
        case 'H1': md += '\n# ' + domChildren(node) + '\n\n'; break;
        case 'H2': md += '\n## ' + domChildren(node) + '\n\n'; break;
        case 'H3': md += '\n### ' + domChildren(node) + '\n\n'; break;
        case 'H4': md += '\n#### ' + domChildren(node) + '\n\n'; break;
        case 'P':
            md += domChildren(node).trim() ? domChildren(node).trim() + '\n\n' : '';
            break;
        case 'IMG':
            const src = node.getAttribute('src') || '';
            const alt = node.getAttribute('alt') || '';
            md += `![${alt}](${src})\n\n`;
            break;
        case 'A':
            const href = node.getAttribute('href') || '';
            md += `[${domChildren(node)}](${href})`;
            break;
        case 'UL':
            Array.from(node.children).forEach(li => {
                md += '- ' + domToMarkdown(li).trim() + '\n';
            });
            md += '\n';
            break;
        case 'OL':
            Array.from(node.children).forEach((li, i) => {
                md += `${i + 1}. ${domToMarkdown(li).trim()}\n`;
            });
            md += '\n';
            break;
        case 'LI':
            md += domChildren(node);
            break;
        case 'BR':
            md += '  \n';
            break;
        default:
            // 其他标签，递归子节点
            md += domChildren(node);
    }
    return md;
}


document.addEventListener('DOMContentLoaded', () => {
    const selectBtn = document.getElementById('select');
    const totalBtn = document.getElementById('total');
    const saveBtn = document.getElementById('save');
    const menu1Btn = document.getElementById('menu1'); // 发送到后台按钮
    const iframeContainer = document.getElementById('iframe-container');
    const recognizeBtn = document.getElementById('recognize');

    recognizeBtn.addEventListener('click', () => {
        showMask();
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'start-region-picker' });
        });
    });
    // “选取”按钮（若仍有拾取功能）
    selectBtn.addEventListener('click', () => {
        showMask();
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'start-element-picker' });
        });
    });

    // “全文”按钮：触发 content.js 中 Readability 抽取
    totalBtn.addEventListener('click', () => {
        showMask();
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'extract-all-html' });
        });
    });

    // 接收来自 content.js 的消息
    chrome.runtime.onMessage.addListener(message => {
        switch (message.action) {
            case 'REGION_TEXT_LOADING':
                showLoading();
                break;
            case 'REGION_TEXT_RECOGNIZED':
                hideLoading();
                hideMaskOcr();// 确保遮罩被关闭
                const cleanText = message.payload.replace(/\s+/g, '');

                // 第一次识别：创建 iframe
                if (!ocrIframe) {
                    ocrIframe = document.createElement('iframe');
                    Object.assign(ocrIframe.style, {
                        width: '100%', height: '100%', border: 'none'
                    });
                    iframeContainer.appendChild(ocrIframe);
                    ocrIframe.addEventListener('load', () => {
                        ocrIframe.contentDocument.designMode = 'on';
                    });
                    // 如果 iframe 已经加载过（第一次写完 load 事件后），手动开启 designMode
                    if (ocrIframe.contentDocument.readyState === 'complete') {
                        ocrIframe.contentDocument.designMode = 'on';
                    }
                }

                // 后续每次都往 body 末尾追加一个 <pre> 区块
                const doc = ocrIframe.contentDocument || ocrIframe.contentWindow.document;
                doc.body.insertAdjacentHTML(
                    'beforeend',
                    `<pre style="white-space: pre-wrap; margin-bottom: 1em;font-size:15px">${cleanText}</pre>`
                );
                break;
            case 'ELEMENTS_SELECTED':
                // 如果还有“选取”功能，可在此处理
                hideMask(); // 确保遮罩被关闭
                if (!message.payload || !message.payload.trim()) {
                    console.warn('空 payload，忽略');
                    return;
                }
                const paragraphs = message.payload
                    .split('\n')
                    .map(line => `<p>${line}</p>`)
                    .join('');
                const htmlDoc = `<!doctype html><html><body style="font-size:15px">${paragraphs}</body></html>`;

                iframeContainer.innerHTML = '';
                const iframeSel = document.createElement('iframe');
                Object.assign(iframeSel.style, { width: '100%', height: '100%', border: 'none' });
                iframeSel.srcdoc = htmlDoc;

                iframeSel.addEventListener('load', () => {
                    iframeSel.contentDocument.designMode = 'on';
                    console.log('首次 iframe 加载完毕');
                });

                // 防止异步未完成，延迟注入
                setTimeout(() => {
                    iframeContainer.appendChild(iframeSel);
                }, 50);
                break;

            case 'ALL_HTML_EXTRACTED':
                // 更新标题
                currentTitle = message.title || currentTitle;
                // 清空旧 iframe
                iframeContainer.innerHTML = '';
                // 创建并注入新的 iframe
                const iframe = document.createElement('iframe');
                Object.assign(iframe.style, {
                    width: '100%',
                    height: '100%',
                    border: 'none'
                });
                iframe.srcdoc = message.html;
                iframeContainer.appendChild(iframe);

                // 使 iframe 内文档可编辑（可选）
                iframe.addEventListener('load', () => {
                    iframe.contentDocument.designMode = 'on';
                });
                break;

            case 'PICKER_ENDED':
                hideMask();
                break;
        }
    });

    // “保存”按钮：将 iframe.srcdoc 下载为 HTML 文件
    saveBtn.addEventListener('click', () => {
        console.log('[Panel] 点击了 保存 按钮');
        const iframe = iframeContainer.querySelector('iframe');
        if (!iframe) return;

        const doc = iframe.contentDocument;
        let md = '';
        // 将 body 的子节点依次转换
        Array.from(doc.body.childNodes).forEach(n => {
            md += domToMarkdown(n);
        });

        // 添加来源行
        md += `\n---\n来自: ${currentTitle}`;

        const safeName = currentTitle.replace(/[\\\/:*?"<>|]/g, '_').slice(0, 50) || 'note';
        const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${safeName}.md`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        /* ★ 新增：下载完成后清空侧边栏内容 ★ */
        iframeContainer.innerHTML = '';  // 移除现有 iframe
        ocrIframe = null;               // 重置引用，确保下次重新创建
    });

    // "发送到后台"按钮：将iframe内容发送到后端API
    menu1Btn.addEventListener('click', async () => {
        console.log('[Panel] 点击了 发送到后台 按钮');
        
        // 获取iframe中的内容
        const iframe = iframeContainer.querySelector('iframe');
        if (!iframe) {
            alert('没有可发送的内容，请先选择或识别文本');
            return;
        }

        try {
            const doc = iframe.contentDocument;
            if (!doc || !doc.body) {
                alert('无法获取内容，请重试');
                return;
            }

            // 提取文本内容
            let content = '';
            Array.from(doc.body.childNodes).forEach(n => {
                if (n.nodeType === Node.TEXT_NODE) {
                    content += n.textContent;
                } else if (n.nodeType === Node.ELEMENT_NODE) {
                    content += n.textContent || '';
                }
            });

            if (!content.trim()) {
                alert('内容为空，无法发送');
                return;
            }

            // 构造API请求数据
            const apiData = {
                title: currentTitle || '笔记',
                excerpt: content.substring(0, 200) + (content.length > 200 ? '...' : ''), // 截取前200字符作为摘要
                content: {
                    html: doc.body.innerHTML,
                    text: content,
                    source: currentTitle
                },
                slug: currentTitle ? currentTitle.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-') : 'note',
                status: 0,
                is_pinned: false,
                category_id: 0
            };

            // 显示发送中状态
            menu1Btn.textContent = '发送中...';
            menu1Btn.disabled = true;

            // 发送到后端API
            const response = await fetch('http://localhost:8000/api/documents/plugin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(apiData)
            });

            if (response.ok) {
                const result = await response.json();
                alert('发送成功！');
                console.log('API响应:', result);
                
                // 发送成功后清空内容
                iframeContainer.innerHTML = '';
                ocrIframe = null;
            } else {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

        } catch (error) {
            console.error('发送失败:', error);
            alert(`发送失败: ${error.message}`);
        } finally {
            // 恢复按钮状态
            menu1Btn.textContent = '发送到后台';
            menu1Btn.disabled = false;
        }
    });
});
