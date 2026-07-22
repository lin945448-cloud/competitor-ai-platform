import React, { useState, useRef, useEffect } from 'react';
import { ParsedData, ChatMessage } from '../types';
import { generateDeepSeekPrompt } from '../utils/aiInsights';
import { Bot, Sparkles, RotateCcw } from 'lucide-react';

interface Props {
  data: ParsedData;
  selectedBrand: string;
  selectedMonth: string;
}

export const AIPanel: React.FC<Props> = ({ data, selectedBrand, selectedMonth }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleGenerateReport = async () => {
    const systemPrompt = generateDeepSeekPrompt(data, selectedBrand, selectedMonth);
    
    const userMsg: ChatMessage = { 
      role: 'user', 
      content: `请基于【${selectedBrand}】和【${selectedMonth}】的数据，生成深度商业洞察报告。`, 
      timestamp: new Date() 
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      // 真正调用 Vercel 云端接口
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: systemPrompt })
      });

      const resultData = await res.json();

      if (!res.ok) {
        throw new Error(resultData.error || '请求失败');
      }

      const aiMsg: ChatMessage = { 
        role: 'assistant', 
        content: resultData.result, 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, aiMsg]);
      
    } catch (error: any) {
      const errorMsg: ChatMessage = { 
        role: 'assistant', 
        content: `❌ 分析失败: ${error.message}\n请联系管理员检查 Vercel 的 DEEPSEEK_API_KEY 环境变量是否正确配置。`, 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => setMessages([]);
  const hasData = data.totalNotes > 0;

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex items-center justify-between mb-3 flex-shrink-0 border-b border-slate-50 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">DeepSeek AI 分析</h2>
            <p className="text-[10px] text-slate-400">正在分析: {selectedBrand} · {selectedMonth}</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <RotateCcw size={14} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scroll mb-4 space-y-4 pr-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Bot size={40} className="text-violet-200 mb-3" />
            <p className="text-sm font-bold text-slate-700 mb-1">AI 商业分析师已就绪</p>
            <p className="text-[11px] text-slate-500 mb-6 leading-relaxed max-w-[200px]">
              {hasData 
                ? '数据载入完毕，点击下方按钮生成专属洞察报告' 
                : '请先在左侧上传数据文件'}
            </p>
            <button
              onClick={handleGenerateReport}
              disabled={!hasData || isTyping}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-md active:scale-95"
            >
              <Sparkles size={16} />
              生成深度商业报告
            </button>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`max-w-[90%] rounded-2xl px-4 py-3 shadow-sm text-[13px] leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-tr-sm'
                  : 'bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-sm ai-prose' // 注意这里加了 ai-prose 类名
              }`}
            >
              {/* 这里简单渲染了文本，结合 CSS 实现美观的排版 */}
              {msg.content}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-2">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1.5 items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" />
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="text-[11px] text-slate-400 ml-2">DeepSeek 深度思考中...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
