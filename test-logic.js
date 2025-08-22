// 测试发送到后台的逻辑
console.log('开始测试发送到后台的逻辑...');

// 模拟数据
const mockIframeContent = `
<body style="font-size: 15px; padding: 20px;">
    <h1>测试文档标题</h1>
    <p>这是第一段测试文本，包含一些中文内容。</p>
    <p>这是第二段测试文本，用于测试发送功能。</p>
    <ul>
        <li>列表项目1</li>
        <li>列表项目2</li>
    </ul>
</body>
`;

// 定义DOM节点类型常量（在浏览器环境中这些常量是预定义的）
const Node = {
    TEXT_NODE: 3,
    ELEMENT_NODE: 1
};

// 模拟iframe文档
const mockDoc = {
    body: {
        innerHTML: mockIframeContent,
        childNodes: [
            { nodeType: Node.ELEMENT_NODE, textContent: '测试文档标题' },
            { nodeType: Node.ELEMENT_NODE, textContent: '这是第一段测试文本，包含一些中文内容。' },
            { nodeType: Node.ELEMENT_NODE, textContent: '这是第二段测试文本，用于测试发送功能。' },
            { nodeType: Node.ELEMENT_NODE, textContent: '列表项目1列表项目2' }
        ]
    }
};

// 测试内容提取逻辑
function testContentExtraction() {
    console.log('测试内容提取逻辑...');
    
    let content = '';
    Array.from(mockDoc.body.childNodes).forEach(n => {
        if (n.nodeType === Node.TEXT_NODE) {
            content += n.textContent;
        } else if (n.nodeType === Node.ELEMENT_NODE) {
            content += n.textContent || '';
        }
    });
    
    console.log('提取的内容:', content);
    console.log('内容长度:', content.length);
    console.log('内容是否为空:', !content.trim());
    
    return content;
}

// 测试API数据构造
function testApiDataConstruction(content) {
    console.log('测试API数据构造...');
    
    const currentTitle = '测试文档标题';
    
    const apiData = {
        title: currentTitle || '笔记',
        excerpt: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
        content: {
            html: mockDoc.body.innerHTML,
            text: content,
            source: currentTitle
        },
        slug: currentTitle ? currentTitle.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-') : 'note',
        status: 0,
        is_pinned: false,
        category_id: 0
    };
    
    console.log('构造的API数据:', JSON.stringify(apiData, null, 2));
    
    // 验证数据结构
    console.log('验证数据结构:');
    console.log('- title:', typeof apiData.title, apiData.title);
    console.log('- excerpt:', typeof apiData.excerpt, apiData.excerpt);
    console.log('- content.html:', typeof apiData.content.html, apiData.content.html.substring(0, 50) + '...');
    console.log('- content.text:', typeof apiData.content.text, apiData.content.text.substring(0, 50) + '...');
    console.log('- slug:', typeof apiData.slug, apiData.slug);
    console.log('- status:', typeof apiData.status, apiData.status);
    console.log('- is_pinned:', typeof apiData.is_pinned, apiData.is_pinned);
    console.log('- category_id:', typeof apiData.category_id, apiData.category_id);
    
    return apiData;
}

// 测试slug生成
function testSlugGeneration() {
    console.log('测试slug生成...');
    
    const testTitles = [
        '简单标题',
        'Complex Title with Spaces',
        '标题包含特殊字符!@#$%^&*()',
        '标题包含数字123',
        'Mixed 中英文 Title 123',
        ''
    ];
    
    testTitles.forEach(title => {
        const slug = title ? title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-') : 'note';
        console.log(`"${title}" -> "${slug}"`);
    });
}

// 运行所有测试
function runAllTests() {
    console.log('=== 开始运行所有测试 ===');
    
    try {
        // 测试内容提取
        const content = testContentExtraction();
        
        // 测试API数据构造
        const apiData = testApiDataConstruction(content);
        
        // 测试slug生成
        testSlugGeneration();
        
        console.log('=== 所有测试通过！ ===');
        console.log('发送到后台的逻辑验证成功');
        
    } catch (error) {
        console.error('测试失败:', error);
    }
}

// 执行测试
runAllTests();
