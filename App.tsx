import React, { useState } from 'react';
import { CHECKLIST_DATA } from './constants';
import { AppState, UserResponse, RolePreference, InterestLevel } from './types';
import QuestionCard from './components/QuestionCard';
import ProgressBar from './components/ProgressBar';
import { generatePDF } from './utils/pdfGenerator';
import { ChevronRight, Download, Loader2, RefreshCw, X } from 'lucide-react';

const getInitialResponses = () => {
  const responses: Record<string, UserResponse> = {};
  CHECKLIST_DATA.forEach(item => {
    responses[item.id] = {
      tried: false,
      rating: 0,
      interest: null,
      role: null
    };
  });
  return responses;
};

// Extracted outside to prevent re-renders losing focus
const IntroModal = ({ 
  userName, 
  partnerName, 
  setUserName, 
  setPartnerName, 
  onStart,
  count
}: {
  userName: string;
  partnerName: string;
  setUserName: (val: string) => void;
  setPartnerName: (val: string) => void;
  onStart: () => void;
  count: number;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/10 backdrop-blur-sm animate-in fade-in duration-300">
    <div className="bg-white/90 backdrop-blur-xl border border-white/50 p-8 rounded-3xl shadow-2xl max-w-sm w-full space-y-6 relative">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          BDSM Check List
        </h1>
        <p className="text-slate-500 text-sm font-medium tracking-wide">
          Before we begin
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Your Name / 昵称</label>
          <input 
            type="text" 
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            placeholder="Optional"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Partner / 伴侣</label>
          <input 
            type="text" 
            value={partnerName}
            onChange={(e) => setPartnerName(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            placeholder="Optional"
          />
        </div>
      </div>

      <button 
        onClick={onStart}
        className="w-full bg-slate-900 hover:bg-black text-white py-3.5 rounded-xl transition-all flex items-center justify-center space-x-2 group shadow-lg hover:shadow-xl hover:-translate-y-0.5"
      >
        <span className="tracking-widest uppercase text-xs font-bold">Start</span>
        <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
      </button>

      <div className="text-center">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{count} Questions</span>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  
  const [state, setState] = useState<AppState>({
    responses: getInitialResponses(),
    userName: '',
    partnerName: '',
    date: new Date().toISOString().split('T')[0],
  });

  const isFinished = currentIndex >= CHECKLIST_DATA.length;

  const handleResponse = (response: UserResponse) => {
    const currentItem = CHECKLIST_DATA[currentIndex];
    
    // Save response
    setState(prev => ({
      ...prev,
      responses: {
        ...prev.responses,
        [currentItem.id]: response
      }
    }));

    // Advance - Wait for animation
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
    }, 250); 
  };

  const handleUndo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await new Promise(resolve => setTimeout(resolve, 100)); 
      await generatePDF(state);
    } catch (error) {
      console.error("Export failed", error);
      alert("PDF 生成失败，请检查网络连接 (需要下载中文字体)。\nExport failed.");
    } finally {
      setIsExporting(false);
    }
  };

  // Completion Screen
  if (isFinished) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 relative z-10">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-violet-600 text-white rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/30 animate-pulse">
            <RefreshCw size={40} />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900">Assessment Complete</h2>
            <p className="text-slate-500">Your preferences have been recorded.</p>
          </div>

          <div className="bg-white/80 backdrop-blur-md border border-white/50 p-8 rounded-3xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)]">
             <button
               onClick={handleExport}
               disabled={isExporting}
               className="w-full flex items-center justify-center space-x-2 bg-slate-900 text-white px-8 py-4 rounded-xl shadow-lg hover:scale-105 transition-all disabled:opacity-70 disabled:cursor-wait font-bold hover:shadow-2xl"
             >
               {isExporting ? <Loader2 size={18} className="animate-spin"/> : <Download size={18} />}
               <span className="uppercase tracking-widest text-sm">{isExporting ? 'Generating PDF...' : 'Download Report'}</span>
             </button>
          </div>

          <button 
            onClick={() => setCurrentIndex(0)}
            className="text-slate-400 text-xs uppercase tracking-widest hover:text-slate-800 transition-colors font-bold"
          >
            Review / Start Over
          </button>
        </div>
      </div>
    );
  }

  const currentItem = CHECKLIST_DATA[currentIndex];
  const progress = currentIndex; 

  return (
    <div className="min-h-screen font-sans overflow-hidden flex flex-col relative z-10">
      
      {/* Intro Modal Overlay */}
      {!started && (
        <IntroModal 
          userName={state.userName}
          partnerName={state.partnerName}
          setUserName={(val) => setState(prev => ({ ...prev, userName: val }))}
          setPartnerName={(val) => setState(prev => ({ ...prev, partnerName: val }))}
          onStart={() => setStarted(true)}
          count={CHECKLIST_DATA.length}
        />
      )}

      {/* Main App Background / UI */}
      <div className={`transition-all duration-700 w-full h-full flex flex-col flex-1 ${!started ? 'blur-md opacity-60 scale-95 grayscale' : 'blur-0 opacity-100 scale-100'}`}>
        <ProgressBar current={progress} total={CHECKLIST_DATA.length} />
        
        {/* Header Info */}
        <div className="absolute top-8 left-0 w-full text-center z-10 pointer-events-none">
          <span className="bg-white/50 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold text-slate-500 border border-white/50 shadow-sm">
            {currentIndex + 1} / {CHECKLIST_DATA.length}
          </span>
        </div>

        <main className="flex-1 flex flex-col items-center justify-center relative w-full max-w-5xl mx-auto px-4">
          <QuestionCard
            key={currentItem.id} 
            item={currentItem}
            onAnswer={started ? handleResponse : () => {}} // Disable clicks when blurred
            onUndo={handleUndo}
            canUndo={currentIndex > 0 && started}
          />
        </main>

        <div className="absolute bottom-4 w-full text-center pb-safe text-[10px] text-slate-300 pointer-events-none font-bold tracking-widest uppercase">
          BDSM check list
        </div>
      </div>
    </div>
  );
};

export default App;