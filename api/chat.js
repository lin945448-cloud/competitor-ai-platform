export default async function handler(req, res) {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支持 POST 请求' });
  }

  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: '缺少 Prompt' });
  }

  try {
    // 请求 DeepSeek 的官方接口
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 这里会自动读取 Vercel 环境变量中的 KEY
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat', // 使用 deepseek-chat 模型
        messages: [
          { 
            role: 'system', 
            content: '你是一位资深的小红书品牌营销分析专家。请严格基于用户提供的数据进行商业分析，输出专业、客观的洞察报告。' 
          },
          { 
            role: 'user', 
            content: prompt 
          }
        ],
        temperature: 0.7,
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API 响应错误: ${response.status}`);
    }

    const data = await response.json();
    
    // 将 AI 的回答返回给前端
    res.status(200).json({ result: data.choices[0].message.content });
    
  } catch (error) {
    console.error('AI Request Error:', error);
    res.status(500).json({ error: 'AI 思考时遇到问题，请检查网络或 API Key 设置。' });
  }
}
