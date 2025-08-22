/*
 * content.js
 * 功能：
 *  - 元素拾取（start-element-picker）
 *  - 使用 Readability 提取主内容（extract-all-html）
 */

//事件处理监听
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'start-element-picker') {
        startElementPicker();
    }

    if (message.action === 'start-region-picker') {
        startRegionPicker();
    }

    if (message.action === 'extract-all-html') {
        startAllHtmlSelected();
    }
});




//文字识别的逻辑
function startRegionPicker() {
    if (window.__regionPickerActive) return;
    window.__regionPickerActive = true;
    // 1. 创建全屏遮罩 & 选框元素
    const mask = document.createElement('div');
    Object.assign(mask.style, {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        cursor: 'crosshair', zIndex: 9999999
    });
    document.body.append(mask);

    const box = document.createElement('div');
    Object.assign(box.style, {
        position: 'absolute', border: '2px dashed #007bff', zIndex: 10000000
    });
    document.body.append(box);

    let startX, startY, currBox;

    function onMouseDown(e) {
        startX = e.pageX; startY = e.pageY;
        Object.assign(box.style, {
            left: `${startX}px`, top: `${startY}px`,
            width: '0px', height: '0px', display: 'block'
        });
        document.addEventListener('mousemove', onMouseMove, true);
        document.addEventListener('mouseup', onMouseUp, true);
    }
    function onMouseMove(e) {
        const x = Math.min(e.pageX, startX), y = Math.min(e.pageY, startY);
        const w = Math.abs(e.pageX - startX), h = Math.abs(e.pageY - startY);
        Object.assign(box.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
    }
    async function onMouseUp(e) {
        document.removeEventListener('mousemove', onMouseMove, true);
        document.removeEventListener('mouseup', onMouseUp, true);

        // 弹出确认对话框
        const ok = window.confirm('是否确认选中区域的内容？');
        if (!ok) {
            // 取消：移除所有遮罩层并重置状态
            overlays.forEach(o => o.remove());
            cleanup();
            return;
        }
        // 2. 用 html2canvas 截取框选区域
        const rect = box.getBoundingClientRect();
        // 手动移除，确保截图无任何遮挡
        mask.remove();
        box.remove();
        chrome.runtime.sendMessage({
            action: 'REGION_TEXT_LOADING',

        });
        try {
            const canvas = await html2canvas(document.body, {
                ignoreElements: el => el === mask || el === box,
                x: rect.left + window.scrollX,
                y: rect.top + window.scrollY,
                width: rect.width,
                height: rect.height,
            });
            // 3. 调用 Tesseract OCR
            const { data: { text } } = await Tesseract.recognize(canvas, 'chi_sim+eng');
            // 4. 回传给侧边栏
            chrome.runtime.sendMessage({
                action: 'REGION_TEXT_RECOGNIZED',
                payload: text.trim()
            });
        } catch (err) {
            console.error('OCR 失败：', err);
        } finally {
            cleanup();
        }
    }
    function cleanup() {
        mask.remove();
        box.remove();
        window.__regionPickerActive = false;
    }

    mask.addEventListener('mousedown', onMouseDown, true);
}

//元素选取的逻辑
function startElementPicker() {
    if (window.__elementPickerActive) return;
    window.__elementPickerActive = true;

    // 创建高亮框
    const box = document.createElement('div');
    Object.assign(box.style, {
        position: 'absolute',
        border: '2px solid #007bff',
        backgroundColor: 'rgba(0,123,255,0.2)',
        zIndex: 999999,
        pointerEvents: 'none'
    });
    document.body.appendChild(box);

    // 创建 dialog + 确认按钮
    const dialog = document.createElement('div');
    Object.assign(dialog.style, {
        position: 'fixed',
        top: '20%',
        left: '50%',
        transform: 'translate(-50%,-50%)',
        padding: '8px 12px',
        background: 'rgba(0,0,0,0.8)',
        borderRadius: '8px',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        zIndex: 1000000,
        pointerEvents: 'auto'
    });
    const infoText = document.createElement('span');
    infoText.textContent = '单击选中，再点一次取消；Esc 退出；Enter 确认';
    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = '确定';
    Object.assign(confirmBtn.style, {
        padding: '4px 10px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        display: 'none'
    });
    dialog.append(infoText, confirmBtn);
    document.body.appendChild(dialog);

    const selected = new Set();

    function onMove(e) {
        const el = document.elementFromPoint(e.clientX, e.clientY);
        if (!el || el === box || el === dialog || el === confirmBtn) return;
        const r = el.getBoundingClientRect();
        Object.assign(box.style, {
            top: `${r.top + window.scrollY}px`,
            left: `${r.left + window.scrollX}px`,
            width: `${r.width}px`,
            height: `${r.height}px`,
            display: 'block'
        });
    }

    function onClick(e) {
        if (e.target === confirmBtn) return;
        e.preventDefault(); e.stopPropagation();
        const el = document.elementFromPoint(e.clientX, e.clientY);
        if (!el || el === box || el === dialog) return;

        if (selected.has(el)) {
            selected.delete(el);
            el.style.outline = 'none';
        } else {
            selected.add(el);
            el.style.outline = '2px dashed #007bff';
        }
        confirmBtn.style.display = selected.size > 0 ? 'inline-block' : 'none';
    }

    function onKeydown(e) {
        if (e.key === 'Escape') {
            cleanup();
            chrome.runtime.sendMessage({ action: 'PICKER_ENDED' });
        } else if (e.key === 'Enter' && selected.size > 0) {
            onConfirmClick();
        }
    }

    function onConfirmClick() {
        const texts = Array.from(selected)
            .map(el => el.textContent.replace(/\s+/g, ' ').trim())
            .join('\n');
        chrome.runtime.sendMessage({ action: 'ELEMENTS_SELECTED', payload: texts });
        chrome.runtime.sendMessage({ action: 'PICKER_ENDED' });
        cleanup();
    }

    function cleanup() {
        selected.forEach(el => el.style.outline = 'none');
        box.remove();
        dialog.remove();
        document.removeEventListener('mousemove', onMove, true);
        document.removeEventListener('click', onClick, true);
        document.removeEventListener('keydown', onKeydown, true);
        confirmBtn.removeEventListener('click', onConfirmClick);
        window.__elementPickerActive = false;
    }

    document.addEventListener('mousemove', onMove, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKeydown, true);
    confirmBtn.addEventListener('click', onConfirmClick);
}
//全文提取逻辑
function startAllHtmlSelected() {
    // 1. 克隆文档，避免修改原页
    const docClone = document.cloneNode(true);
    const reader = new Readability(docClone);
    const article = reader.parse();

    if (article) {
        // 构造简易 HTML，内联样式保持可读性
        const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin:20px; font-size:16px; line-height:1.6; }
    img  { max-width:100%; height:auto; display:block; margin:10px 0; }
  </style>
</head>
<body>
  <h1>${article.title}</h1>
  ${article.content}
</body>
</html>`.trim();

        chrome.runtime.sendMessage({
            action: 'ALL_HTML_EXTRACTED',
            html: html,
            title: article.title
        });
    } else {
        console.warn('Readability 未能提取正文');
        // 可回退至全文 innerHTML ...
    }
    chrome.runtime.sendMessage({ action: 'PICKER_ENDED' });
}
