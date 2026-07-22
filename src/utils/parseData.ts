import { NoteRecord, ParsedData } from '../types';

// 安全提取数字
const getNum = (val: any): number => {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  const parsed = parseFloat(val.toString().replace(/,/g, ''));
  return isNaN(parsed) ? 0 : parsed;
};

// 粉丝层级分类
const getFanTier = (followers: number): string => {
  if (followers < 30000) return '3万以下';
  if (followers < 50000) return '3-5万';
  if (followers < 100000) return '5-10万';
  if (followers < 300000) return '10-30万';
  return '30万以上';
};

export function analyzeData(rawRows: any[]): ParsedData {
  if (!rawRows || rawRows.length === 0) return getEmptyData();

  // 1. 数据清洗与映射 (自动识别 Excel 列名)
  const uniqueRecords = new Map<string, NoteRecord>();
  
  rawRows.forEach(row => {
    const noteLink = row['笔记链接'] || row['链接'] || Math.random().toString();
    
    // 如果已经存在此链接，跳过（去重）
    if (uniqueRecords.has(noteLink)) return;

    const publishTime = row['笔记发布时间'] || row['发布时间'] || '';
    const month = publishTime ? publishTime.substring(0, 7) : '未知'; // 提取 YYYY-MM
    
    uniqueRecords.set(noteLink, {
      publishTime,
      month,
      title: row['笔记标题'] || row['标题'] || '无标题',
      noteForm: row['笔记形式'] || row['形式'] || '图文',
      reportedBrand: row['报备合作品牌'] || row['品牌'] || '未报备',
      noteType: row['笔记类型'] || row['类型'] || '其他',
      noteLink,
      interactions: getNum(row['互动量']),
      likes: getNum(row['点赞']),
      comments: getNum(row['评论']),
      collects: getNum(row['收藏']),
      shares: getNum(row['分享']),
      influencerName: row['达人昵称'] || row['昵称'] || '未知达人',
      influencerId: row['达人ID'] || row['小红书号'] || Math.random().toString(),
      followers: getNum(row['粉丝数']),
      influencerType: row['达人属性'] || '未知属性', // 只按达人属性
      tags: row['达人标签(前5)'] || row['达人标签'] || '',
      estimatedCost: getNum(row['预估投放金额'] || row['投放金额']),
    });
  });

  const records = Array.from(uniqueRecords.values());
  if (records.length === 0) return getEmptyData();

  // 2. 基础统计
  const totalNotes = records.length;
  const totalInteractions = records.reduce((s, r) => s + r.interactions, 0);
  const totalCost = records.reduce((s, r) => s + r.estimatedCost, 0);
  
  // 提取唯一月份和品牌
  const months = Array.from(new Set(records.map(r => r.month))).filter(m => m !== '未知').sort();
  const brands = Array.from(new Set(records.map(r => r.reportedBrand))).filter(b => b !== '未报备').sort();

  // 3. 达人策略
  const creatorMap = new Map<string, { notes: number }>();
  let topCreator: NoteRecord | null = null;
  let maxInteraction = -1;

  const fanTiersMap = new Map<string, number>();
  const creatorTypesMap = new Map<string, number>();

  records.forEach(r => {
    // 寻找互动最高达人
    if (r.interactions > maxInteraction) {
      maxInteraction = r.interactions;
      topCreator = r;
    }

    // 统计复投
    creatorMap.set(r.influencerId, (creatorMap.get(r.influencerId) || 0) + 1);

    // 统计达人层级 (去重前还是去重后？通常按人去重统计属性更好，这里简化为按人次)
    const tier = getFanTier(r.followers);
    fanTiersMap.set(tier, (fanTiersMap.get(tier) || 0) + 1);
    
    const cType = r.influencerType;
    creatorTypesMap.set(cType, (creatorTypesMap.get(cType) || 0) + 1);
  });

  const repeatedCreators = Array.from(creatorMap.values()).filter(v => v > 1).length;
  const influencerCount = creatorMap.size;

  // 4. 预算与效率
  const totalFollowers = records.reduce((s, r) => s + r.followers, 0);
  const cpe = totalInteractions > 0 ? totalCost / totalInteractions : 0;
  const cpf = totalFollowers > 0 ? totalCost / totalFollowers : 0;
  
  const costs = records.map(r => r.estimatedCost).sort((a, b) => a - b);
  const medianCost = costs.length > 0 ? costs[Math.floor(costs.length / 2)] : 0;

  // 5. 品牌横向对比
  const brandStatsMap = new Map<string, any>();
  records.forEach(r => {
    if (r.reportedBrand === '未报备') return;
    const existing = brandStatsMap.get(r.reportedBrand) || { noteCount: 0, interactions: 0, cost: 0 };
    existing.noteCount += 1;
    existing.interactions += r.interactions;
    existing.cost += r.estimatedCost;
    brandStatsMap.set(r.reportedBrand, existing);
  });

  const brandStats = Array.from(brandStatsMap.entries()).map(([brand, stats]) => ({
    brand,
    ...stats,
    cpe: stats.interactions > 0 ? stats.cost / stats.interactions : 0
  })).sort((a, b) => b.interactions - a.interactions);

  return {
    records,
    totalNotes,
    totalInteractions,
    totalCost,
    influencerCount,
    brands,
    months,
    fanTiers: Array.from(fanTiersMap.entries()).map(([name, value]) => ({ name, value })),
    creatorTypes: Array.from(creatorTypesMap.entries()).map(([name, value]) => ({ name, value })),
    topCreator,
    repeatedCreators,
    cpe,
    cpf,
    medianCost,
    videoCount: records.filter(r => r.noteForm === '视频').length,
    imageCount: records.filter(r => r.noteForm === '图文').length,
    topNoteTypes: [], // 为保持代码简洁，后续在分析组件中详算
    brandStats
  };
}

function getEmptyData(): ParsedData {
  return {
    records: [], totalNotes: 0, totalInteractions: 0, totalCost: 0, influencerCount: 0,
    brands: [], months: [], fanTiers: [], creatorTypes: [], topCreator: null, repeatedCreators: 0,
    cpe: 0, cpf: 0, medianCost: 0, videoCount: 0, imageCount: 0, topNoteTypes: [], brandStats: []
  };
}

// 格式化工具
export function formatNumber(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w';
  return n.toString();
}
export function formatCurrency(n: number): string {
  if (n >= 10000) return '¥' + (n / 10000).toFixed(1) + 'w';
  return '¥' + n.toLocaleString();
}
