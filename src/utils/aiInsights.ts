import { ParsedData } from '../types';

// 生成喂给 DeepSeek 的 System Prompt
export function generateDeepSeekPrompt(data: ParsedData, selectedBrand: string, selectedMonth: string): string {
  // 根据筛选条件，准备基础数据文本
  const records = data.records.filter(r => {
    const matchBrand = selectedBrand === '全部' || r.reportedBrand === selectedBrand;
    const matchMonth = selectedMonth === '全部' || r.month === selectedMonth;
    return matchBrand && matchMonth;
  });

  if (records.length === 0) return "数据不足，无法分析。";

  const totalInteractions = records.reduce((s, r) => s + r.interactions, 0);
  const totalCost = records.reduce((s, r) => s + r.estimatedCost, 0);
  
  // 找出最高互动笔记
  const topRecord = records.reduce((prev, current) => (prev.interactions > current.interactions) ? prev : current);

  // 拼接给 AI 的语料
  const prompt = `
你是一位拥有10年以上经验的小红书品牌营销分析专家。
当前用户正在查看的数据切片：【品牌：${selectedBrand}】 | 【月份：${selectedMonth}】
本次分析包含 ${records.length} 篇笔记。总互动量：${totalInteractions}，总花费预估：¥${totalCost}。

以下是表现最好的笔记(爆款)：
- 标题: ${topRecord.title}
- 达人: ${topRecord.influencerName} (标签: ${topRecord.tags})
- 笔记类型: ${topRecord.noteType}
- 互动量: ${topRecord.interactions}

请根据以上数据，输出一份商业咨询级的洞察报告，必须包含以下几个模块，并使用 Markdown 格式：

### 1. 达人策略 (Creator Strategy)
判断品牌更偏向 ROI效率型、曝光型、矩阵铺量型 还是 精准垂直型？给出证据。

### 2. 内容运营策略 (Content Strategy)
基于爆款笔记的标题、类型和标签，推测品牌的种草场景是什么？

### 3. 人群策略推断 (Audience)
推断目标人群（如精致白领、宝妈、学生等），并说明依据。

### 4. 机会与行动建议 (Opportunity)
给出具体可执行的下一步投放建议（例如哪类达人值得复投，哪些场景未被覆盖）。

注意：语气要专业、像咨询公司报告。不要编造数据，直接基于我给你的数据进行推理。
`;

  return prompt;
}
