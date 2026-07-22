import React, { useState } from 'react';
import { ParsedData } from './types';
import { UploadBar } from './components/UploadBar';
import { Dashboard } from './components/Dashboard';
import { AIPanel } from './components/AIPanel';
import { Activity, TrendingUp, Zap, Filter } from 'lucide-react';

const emptyData: ParsedData = {
  records: [], totalNotes: 0, totalInteractions: 0, totalCost: 0, influencerCount: 0,
  brands: [], months: [], fanTiers: [], creatorTypes: [], topCreator: null, repeatedCreators: 0,
  cpe: 0, cpf: 0, medianCost: 0, videoCount: 0, imageCount: 0, topNoteTypes: [], brandStats: []
};

export default function App() {
  const [data, setData] = useState<ParsedData>(emptyData);
  
  // 新增：全局筛选状态
  const [selectedBrand, setSelectedBrand] = useState<string>('全部');
  const [selectedMonth, setSelectedMonth] = useState<string>('全部');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" style={{ height: '100vh', overflow: 'hidden' }}>
      {/* 顶部 Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 flex-shrink-0 px-6 py-3 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
            <Activity size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 leading-tight">
              竞品达人合作分析平台
            </h1>
            <p className="text-xs text-slate-400">Competitor Influencer Intelligence · AI-Powered</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {data.totalNotes > 0 && (
            <div className="flex items-center gap-4 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
              <MetaItem icon={<TrendingUp size={12} />} label="总互动" value={formatCompact(data.totalInteractions)} color="text-indigo-600" />
              <div className="w-px h-4 bg-slate-200" />
              <MetaItem icon={<Zap size={12} />} label="笔记数" value={data.totalNotes.toString()} color="text-emerald-600" />
              <div className="w-px h-4 bg-slate-200" />
              <MetaItem icon={<Activity size={12} />} label="达人数" value={data.influencerCount.toString()} color="text-violet-600" />
            </div>
          )}
        </div>
      </header>

      {/* 上传区 */}
      <div className="flex-shrink-0 px-6 py-3">
        <UploadBar onDataLoaded={setData} currentData={data} />
      </div>

      {/* 主体内容（左右分栏） */}
      <div className="flex-1 flex gap-5 px-6 pb-5 overflow-hidden min-h-0">
        
        {/* 左侧：数据看板 */}
        <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100" style={{ width: '55%' }}>
          
          {/* 看板头部 & 筛选器 */}
          <div className="flex items-center justify-between p-4 border-b border-slate-50 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-indigo-500 to-violet-500 rounded-full" />
              <h2 className="text-[15px] font-bold text-slate-700">数据洞察看板</h2>
            </div>
            
            {/* 品牌 & 月份筛选器 */}
            {data.totalNotes > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5">
                  <Filter size={14} className="text-slate-400" />
                  
                  {/* 品牌下拉框 */}
                  <select 
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="bg-transparent text-xs font-medium text-slate-600 outline-none cursor-pointer"
                  >
                    <option value="全部">全部品牌横比</option>
                    {data.brands.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  
                  <div className="w-px h-3 bg-slate-300 mx-1" />
                  
                  {/* 月份下拉框 */}
                  <select 
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-transparent text-xs font-medium text-slate-600 outline-none cursor-pointer"
                  >
                    <option value="全部">全部月份</option>
                    {data.months.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* 看板内容区 */}
          <div className="flex-1 overflow-hidden p-4">
            {/* 注意：把筛选条件传给 Dashboard */}
            <Dashboard data={data} selectedBrand={selectedBrand} selectedMonth={selectedMonth} />
          </div>
        </div>

        {/* 右侧：AI 洞察 */}
        <div className="flex flex-col min-w-0 bg-white rounded-2xl shadow-sm border border-slate-100" style={{ flex: 1 }}>
          <div className="flex items-center p-4 border-b border-slate-50 flex-shrink-0">
            <div className="w-1 h-5 bg-gradient-to-b from-violet-500 to-pink-500 rounded-full mr-2" />
            <h2 className="text-[15px] font-bold text-slate-700">DeepSeek 战略洞察</h2>
            <div className="ml-auto flex items-center gap-1.5 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-100">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
              <span className="text-[11px] font-medium text-violet-600">AI 就绪</span>
            </div>
          </div>
          <div className="flex-1 overflow-hidden p-4">
            {/* AI 面板也会接收筛选条件，以便回答更精准 */}
            <AIPanel data={data} selectedBrand={selectedBrand} selectedMonth={selectedMonth} />
          </div>
        </div>
      </div>
    </div>
  );
}

// 辅助组件
function MetaItem({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={color}>{icon}</span>
      <div>
        <p className="text-sm font-bold text-slate-700 leading-none">{value}</p>
        <p className="text-[10px] text-slate-400 leading-none mt-1">{label}</p>
      </div>
    </div>
  );
}

function formatCompact(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n.toString();
}
