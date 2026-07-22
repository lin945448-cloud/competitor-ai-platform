import React, { useState, useRef, useEffect } from 'react';
import { ParsedData, ChatMessage } from '../types';
import { generateDeepSeekPrompt } from '../utils/aiInsights';
import { Send, Bot, Sparkles, RotateCcw } from 'lucide-react';

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

  const handleGenerateReport = () => {
    // 1. 生成给 AI 的 Prompt
    const systemPrompt = generateDeepSeekPrompt(data, selectedBrand, selectedMonth);
    
    // 2. 先在聊天框里显示用户的指令
    const userMsg: ChatMessage = { role: 'user', content: `请基于【${selectedBrand}】和【${selectedMonth}】的数据，生成深度商业洞察报告。`, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    // 3. TODO: 这里我们将在下一步接入真正的 DeepSeek API
    // 暂时用 setTimeout 模拟，不要着急，下一批我们马上接通！
    setTimeout(() => {
      const aiMsg: ChatMessage = { 
        role: 'assistant', 
        content: `（准备就绪）系统已生成以下底层分析指令，准备发送给 DeepSeek：\n\n\`\`\`text\n${systemPrompt}\n\`\`\`\n\n*注：API接入将在下一步完成！*`, 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1000);
  };

  const clearChat = () => setMessages([]);
  const hasData = data.totalNotes > 0;

  return (
    <div className="h-full flex flex-col relative">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-pink-600 flex items-center justify-center shadow-sm">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">DeepSeek 智能分析</h2>
            <p className="text-[10px] text-slate-400">当前视角: {selectedBrand} · {selectedMonth}</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <RotateCcw size={14} />
          </button>
        )}
      </div>

      {/* 聊天内容区 */}
      <div className="flex-1 overflow-y-auto custom-scroll mb-4 space-y-4 pr-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Bot size={40} className="text-violet-200 mb-3" />
            <p className="text-sm font-bold text-slate-700 mb-1">AI 商业分析师已就绪</p>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              {hasData 
                ? `已载入 ${data.totalNotes} 篇笔记数据。\n点击下方按钮，基于当前筛选条件生成深度洞察。` 
                : '请先在左侧上传数据文件。'}
            </p>
            
            <button
              onClick={handleGenerateReport}
              disabled={!hasData}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-md"
            >
              <Sparkles size={16} />
              生成深度商业报告
            </button>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm text-sm ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-tr-sm'
                  : 'bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-sm whitespace-pre-wrap'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-2">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" />
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
