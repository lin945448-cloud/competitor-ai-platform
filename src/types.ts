export interface NoteRecord {
  publishTime: string;          // 笔记发布时间
  month: string;                // 提取的月份 (YYYY-MM)
  title: string;                // 笔记标题
  noteForm: string;             // 视频/图文
  reportedBrand: string;        // 报备合作品牌
  noteType: string;             // 笔记类型
  noteLink: string;             // 笔记链接 (用于去重)
  interactions: number;         // 互动量
  likes: number;                // 点赞
  comments: number;             // 评论
  collects: number;             // 收藏
  shares: number;               // 分享
  influencerName: string;       // 达人昵称
  influencerId: string;         // 达人ID
  followers: number;            // 粉丝数
  influencerType: string;       // 达人属性 (初级、腰部等)
  tags: string;                 // 达人标签
  estimatedCost: number;        // 预估投放金额
}

export interface ParsedData {
  records: NoteRecord[];
  
  // 基础统计
  totalNotes: number;
  totalInteractions: number;
  totalCost: number;
  influencerCount: number;
  
  // 筛选维度
  brands: string[];
  months: string[];
  
  // 达人策略 (Creator Strategy)
  fanTiers: { name: string; value: number }[]; // 粉丝层级 (0-3w, 3-5w等)
  creatorTypes: { name: string; value: number }[]; // 达人属性层级 (腰部, 尾部等)
  topCreator: NoteRecord | null; // 互动量最高的达人
  repeatedCreators: number; // 复投达人数
  
  // 预算与效率 (Budget & Efficiency)
  cpe: number; // 单互动成本
  cpf: number; // 单粉成本
  medianCost: number; // 中位数报价
  
  // 内容策略
  videoCount: number;
  imageCount: number;
  topNoteTypes: { type: string; count: number; avgInteractions: number }[];
  
  // 品牌横向对比 (按品牌分组的统计)
  brandStats: {
    brand: string;
    noteCount: number;
    interactions: number;
    cost: number;
    cpe: number;
  }[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
