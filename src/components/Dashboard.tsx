import React, { useMemo } from 'react';
import { ParsedData } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, FileText, Zap, DollarSign, Award } from 'lucide-react';

interface Props {
  data: ParsedData;
  selectedBrand: string;
  selectedMonth: string;
}

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export const Dashboard: React.FC<Props> = ({ data, selectedBrand, selectedMonth }) => {
  // 1. 根据筛选条件动态过滤数据
  const filteredRecords = useMemo(() => {
    return data.records.filter(r => {
      const matchBrand = selectedBrand === '全部' || r.reportedBrand === selectedBrand;
      const matchMonth = selectedMonth === '全部' || r.month === selectedMonth;
      return matchBrand && matchMonth;
    });
  }, [data.records, selectedBrand, selectedMonth]);

  // 2. 实时计算过滤后的指标
  const stats = useMemo(() => {
    const notes = filteredRecords.length;
    const interactions = filteredRecords.reduce((s, r) => s + r.interactions, 0);
    const cost = filteredRecords.reduce((s, r) => s + r.estimatedCost, 0);
    
    // 计算粉丝层级
    const fanTiersMap = new Map<string, number>();
    const creatorTypesMap = new Map<string, number>();
    let topCreator = null;
    let maxInter = -1;

    filteredRecords.forEach(r => {
      if (r.interactions > maxInter) { maxInter = r.interactions; topCreator = r; }
      
      const tier = r.followers < 30000 ? '3万以下' : r.followers < 50000 ? '3-5万' : r.followers < 100000 ? '5-10万' : r.followers < 300000 ? '10-30万' : '30万以上';
      fanTiersMap.set(tier, (fanTiersMap.get(tier) || 0) + 1);
      creatorTypesMap.set(r.influencerType, (creatorTypesMap.get(r.influencerType) || 0) + 1);
    });

    return {
      notes, interactions, cost, topCreator,
      cpe: interactions > 0 ? (cost / interactions).toFixed(2) : '0.00',
      fanTiers: Array.from(fanTiersMap.entries()).map(([name, value]) => ({ name, value })),
      creatorTypes: Array.from(creatorTypesMap.entries()).map(([name, value]) => ({ name, value }))
    };
  }, [filteredRecords]);

  if (data.totalNotes === 0) {
    return <div className="h-full flex items-center justify-center text-slate-400 text-sm">请先上传数据文件</div>;
  }

  return (
    <div className="h-full overflow-y-auto pr-2 custom-scroll space-y-5">
      
      {/* 核心指标卡片 */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard icon={<FileText />} title="笔记总数" value={stats.notes} color="text-blue-500" bg="bg-blue-50" />
        <StatCard icon={<Zap />} title="总互动量" value={formatNum(stats.interactions)} color="text-indigo-500" bg="bg-indigo-50" />
        <StatCard icon={<DollarSign />} title="总预估花费" value={`¥${formatNum(stats.cost)}`} color="text-emerald-500" bg="bg-emerald-50" />
        <StatCard icon={<Users />} title="单互动成本(CPE)" value={`¥${stats.cpe}`} color="text-amber-500" bg="bg-amber-50" />
      </div>

      {/* 爆款达人展示 */}
      {stats.topCreator && (
        <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-xl p-4 border border-violet-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Award size={16} className="text-violet-600" />
              <span className="text-xs font-bold text-violet-800">最高互动达人 (爆款)</span>
            </div>
            <p className="text-sm font-bold text-slate-800">{stats.topCreator.influencerName} <span className="text-xs text-slate-500 font-normal ml-2">({stats.topCreator.influencerType} · 粉丝: {formatNum(stats.topCreator.followers)})</span></p>
            <p className="text-xs text-slate-600 mt-1 truncate max-w-md">笔记: {stats.topCreator.title}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-black text-indigo-600">{formatNum(stats.topCreator.interactions)}</p>
            <p className="text-[10px] text-slate-500">互动量</p>
          </div>
        </div>
      )}

      {/* 图表区：策略分析 */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* 粉丝层级分布 */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <h3 className="text-xs font-bold text-slate-700 mb-3">粉丝层级分布 (Creator Strategy)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.fanTiers} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={60} label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {stats.fanTiers.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 达人属性分布 */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <h3 className="text-xs font-bold text-slate-700 mb-3">达人属性分布</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.creatorTypes} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="value" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 品牌对比图表 (只有在选择"全部"品牌时才显示) */}
      {selectedBrand === '全部' && data.brandStats.length > 0 && (
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <h3 className="text-xs font-bold text-slate-700 mb-3">多品牌横向对比 (总互动量)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.brandStats}>
                <XAxis dataKey="brand" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis hide />
                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="interactions" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

function StatCard({ icon, title, value, color, bg }: any) {
  return (
    <div className={`${bg} rounded-xl p-3 border border-slate-100/50 shadow-sm`}>
      <div className={`w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow-sm mb-2 ${color}`}>
        {React.cloneElement(icon, { size: 14 })}
      </div>
      <p className="text-[11px] text-slate-500 mb-0.5">{title}</p>
      <p className={`text-lg font-black ${color.replace('text-', 'text-').replace('500', '700')}`}>{value}</p>
    </div>
  );
}

function formatNum(n: number) {
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w';
  return n.toLocaleString();
}
