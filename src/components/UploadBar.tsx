import React, { useRef, useState, useCallback } from 'react';
import { Upload, CheckCircle, AlertCircle, X, FileSpreadsheet, Layers } from 'lucide-react';
import * as XLSX from 'xlsx';
import { ParsedData } from '../types';
import { analyzeData } from '../utils/parseData';

interface Props {
  onDataLoaded: (data: ParsedData) => void;
  currentData: ParsedData;
}

type UploadState = 'idle' | 'dragging' | 'processing' | 'success' | 'error';

export const UploadBar: React.FC<Props> = ({ onDataLoaded, currentData }) => {
  const [state, setState] = useState<UploadState>('idle');
  const [uploadInfo, setUploadInfo] = useState({ fileCount: 0, text: '' });
  const [errorMsg, setErrorMsg] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理多个文件
  const processFiles = useCallback(async (files: FileList | File[]) => {
    if (files.length === 0) return;
    setState('processing');
    setUploadInfo({ fileCount: files.length, text: `正在读取 ${files.length} 个文件...` });
    setErrorMsg('');

    try {
      let allRecords: any[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const data = await file.arrayBuffer();
        
        // 使用 xlsx 库解析 Excel 或 CSV
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // 将表格转为 JSON 数组
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        allRecords = [...allRecords, ...jsonData];
      }

      if (allRecords.length === 0) {
        throw new Error('未读取到任何有效数据，请检查表格内容');
      }

      // 注意：这步暂时调用旧的 analyzeData，下一批我们会升级 parseData.ts
      const analyzed = analyzeData(allRecords as any); 
      onDataLoaded(analyzed);
      setState('success');
      setUploadInfo({ fileCount: files.length, text: `成功合并解析 ${files.length} 个文件` });
      
    } catch (e: any) {
      setErrorMsg(e.message || '文件解析失败，请确保是正确的 Excel/CSV 文件');
      setState('error');
    }
  }, [onDataLoaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState('idle');
    if (e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setState('dragging');
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
  };

  const reset = () => {
    setState('idle');
    setUploadInfo({ fileCount: 0, text: '' });
    setErrorMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div
      className={`relative flex items-center gap-4 px-6 py-4 rounded-2xl border-2 transition-all duration-300 ${
        state === 'dragging'
          ? 'border-indigo-400 bg-indigo-50/50 scale-[1.01] shadow-lg shadow-indigo-100'
          : state === 'success'
          ? 'border-emerald-200 bg-emerald-50/30'
          : state === 'error'
          ? 'border-red-200 bg-red-50/30'
          : 'border-dashed border-slate-200 bg-white/60 hover:border-indigo-200 hover:bg-indigo-50/20'
      } backdrop-blur-xl`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={() => state === 'dragging' && setState('idle')}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple // 支持多文件选择
        accept=".csv,.xls,.xlsx"
        className="hidden"
        onChange={handleFileInput}
      />

      {/* 左侧图标 */}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-all ${
        state === 'success' ? 'bg-gradient-to-br from-emerald-400 to-teal-500' : 
        state === 'error' ? 'bg-gradient-to-br from-red-400 to-rose-500' : 
        'bg-gradient-to-br from-indigo-500 to-violet-600'
      }`}>
        {state === 'success' ? <CheckCircle size={24} className="text-white" /> : 
         state === 'error' ? <AlertCircle size={24} className="text-white" /> : 
         state === 'processing' ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 
         <Upload size={24} className="text-white" />}
      </div>

      {/* 中间文字 */}
      <div className="flex-1 min-w-0">
        {state === 'idle' && (
          <div>
            <p className="text-[15px] font-bold text-slate-700">拖放或点击上传 Excel / CSV 数据文件</p>
            <p className="text-xs text-slate-400 mt-0.5">支持同时选中多个表格，AI将自动合并、去重并进行多品牌对比分析</p>
          </div>
        )}
        {state === 'dragging' && <p className="text-[15px] font-bold text-indigo-600 animate-pulse">松开鼠标即可开始合并解析...</p>}
        {state === 'processing' && (
          <div>
            <p className="text-[15px] font-bold text-slate-700">正在执行本地安全解析...</p>
            <p className="text-xs text-slate-400 mt-0.5">{uploadInfo.text}</p>
          </div>
        )}
        {state === 'success' && (
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[15px] font-bold text-slate-700">数据载入就绪！</p>
              <span className="text-[11px] font-medium bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Layers size={10} /> {uploadInfo.text}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              本次共分析 <strong className="text-indigo-600">{currentData.totalNotes}</strong> 篇笔记 · 
              涉及 <strong className="text-violet-600">{currentData.influencerCount}</strong> 位达人
            </p>
          </div>
        )}
        {state === 'error' && (
          <div>
            <p className="text-[15px] font-bold text-red-600">解析中断</p>
            <p className="text-xs text-red-500 mt-0.5">{errorMsg}</p>
          </div>
        )}
      </div>

      {/* 右侧按钮 */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {state !== 'processing' && (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-sm text-white bg-slate-800 hover:bg-slate-900 px-5 py-2.5 rounded-xl transition-all shadow-md font-medium"
            >
              <FileSpreadsheet size={16} />
              选择表格
            </button>
            {state !== 'idle' && (
              <button onClick={reset} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
                <X size={18} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
