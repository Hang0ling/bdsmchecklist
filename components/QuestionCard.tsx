import React, { useState, useEffect } from 'react';
import { ChecklistItem, UserResponse, InterestLevel, RolePreference } from '../types';
import { Check, HelpCircle, X, RotateCcw, Shuffle, Ban, Heart, Zap, ArrowRight, Shield } from 'lucide-react';

interface Props {
  item: ChecklistItem;
  onAnswer: (response: UserResponse) => void;
  onUndo: () => void;
  canUndo: boolean;
}

const VIEWBOX_SIZE = 600;
const CENTER = VIEWBOX_SIZE / 2;
const RADIUS_OUTER = 280;
const RADIUS_INNER = 110;

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}

function describeArc(x: number, y: number, innerRadius: number, outerRadius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(x, y, outerRadius, endAngle);
  const end = polarToCartesian(x, y, outerRadius, startAngle);
  const startInner = polarToCartesian(x, y, innerRadius, endAngle);
  const endInner = polarToCartesian(x, y, innerRadius, startAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M", start.x, start.y,
    "A", outerRadius, outerRadius, 0, largeArcFlag, 0, end.x, end.y,
    "L", endInner.x, endInner.y,
    "A", innerRadius, innerRadius, 0, largeArcFlag, 1, startInner.x, startInner.y,
    "Z"
  ].join(" ");
}

type SectorConfig = {
  key: string;
  label: string;
  subLabel?: string;
  icon: React.ReactNode;
  role: RolePreference;
  interest?: InterestLevel;
  rating?: number;
  tried?: boolean;
  startAngle: number;
  endAngle: number;
  color: string; 
  side: 'left' | 'right' | 'center' | 'bottom';
};

// --- DATA CONFIGURATION ---
const SECTORS: SectorConfig[] = [
  // CENTER TOP: SWITCH
  {
    key: 'switch', label: 'Switch', subLabel: '双向',
    icon: <Shuffle size={28} />, role: RolePreference.Switch,
    startAngle: -15, endAngle: 15, color: '#8b5cf6', // Violet
    side: 'center'
  },
  
  // RIGHT SIDE: ACCEPT (Sub) - Blue Themed
  {
    key: 'sub-love', label: '爱死了', subLabel: '接受',
    icon: <Heart size={24} fill="currentColor" />, role: RolePreference.Submissive, interest: InterestLevel.Enthusiastic, rating: 5, tried: true,
    startAngle: 20, endAngle: 52, color: '#3b82f6', // Blue-500
    side: 'right'
  },
  {
    key: 'sub-ok', label: '还可以', subLabel: '接受',
    icon: <Check size={24} />, role: RolePreference.Submissive, interest: 2, rating: 3, tried: true,
    startAngle: 56, endAngle: 88, color: '#0ea5e9', // Sky-500
    side: 'right'
  },
  {
    key: 'sub-want', label: '想尝试', subLabel: '接受',
    icon: <HelpCircle size={24} />, role: RolePreference.Submissive, interest: InterestLevel.Interested, rating: 0, tried: false,
    startAngle: 92, endAngle: 124, color: '#f59e0b', // Amber
    side: 'right'
  },
  {
    key: 'sub-no', label: '不行', subLabel: '接受',
    icon: <X size={24} />, role: RolePreference.Submissive, interest: InterestLevel.HardLimit, rating: 0, tried: false,
    startAngle: 128, endAngle: 160, color: '#f43f5e', // Rose
    side: 'right'
  },

  // BOTTOM: SKIP
  {
    key: 'skip', label: '跳过', subLabel: 'N/A',
    icon: <Ban size={28} />, role: RolePreference.None,
    startAngle: 165, endAngle: 195, color: '#94a3b8',
    side: 'bottom'
  },

  // LEFT SIDE: PROVIDE (Dom) - Stronger colors
  {
    key: 'dom-love', label: '爽翻了', subLabel: '提供',
    icon: <Zap size={24} fill="currentColor" />, role: RolePreference.Dominant, interest: InterestLevel.Enthusiastic, rating: 5, tried: true,
    startAngle: 308, endAngle: 340, color: '#7c3aed', // Deep Violet
    side: 'left'
  },
  {
    key: 'dom-ok', label: '还可以', subLabel: '提供',
    icon: <Check size={24} />, role: RolePreference.Dominant, interest: 2, rating: 3, tried: true,
    startAngle: 272, endAngle: 304, color: '#059669', // Emerald
    side: 'left'
  },
  {
    key: 'dom-want', label: '想尝试', subLabel: '提供',
    icon: <ArrowRight size={24} />, role: RolePreference.Dominant, interest: InterestLevel.Interested, rating: 0, tried: false,
    startAngle: 236, endAngle: 268, color: '#ea580c', // Orange
    side: 'left'
  },
  {
    key: 'dom-no', label: '不行', subLabel: '提供',
    icon: <Shield size={24} />, role: RolePreference.Dominant, interest: InterestLevel.HardLimit, rating: 0, tried: false,
    startAngle: 200, endAngle: 232, color: '#dc2626', // Red
    side: 'left'
  },
];

const QuestionCard: React.FC<Props> = ({ item, onAnswer, onUndo, canUndo }) => {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [clickedKey, setClickedKey] = useState<string | null>(null);
  
  useEffect(() => {
    // Reset state when question changes
    setClickedKey(null);
    setHoveredKey(null);
  }, [item.id]);

  const handleSelection = (sector: SectorConfig) => {
    setClickedKey(sector.key); 

    const response: UserResponse = {
      role: sector.role,
      interest: sector.interest !== undefined ? sector.interest : InterestLevel.NoInterest,
      rating: sector.rating !== undefined ? sector.rating : 0,
      tried: sector.tried !== undefined ? sector.tried : false,
    };

    if (sector.role === RolePreference.Switch) {
       response.interest = InterestLevel.Enthusiastic;
       response.tried = true;
       response.rating = 5;
    }
    if (sector.role === RolePreference.None) {
      response.interest = InterestLevel.NoInterest;
      response.tried = false;
    }

    setTimeout(() => {
      onAnswer(response);
    }, 250);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      
      {/* SVG Container */}
      <div className="relative w-[340px] h-[340px] md:w-[600px] md:h-[600px] select-none">
        
        {/* White Glass Ring Background */}
        <div className="absolute inset-[10%] rounded-full bg-white/40 backdrop-blur-md shadow-xl -z-10 transition-transform duration-300 ease-out" 
             style={{ transform: clickedKey ? 'scale(0.95) opacity(0)' : 'scale(1)' }}
        />

        <svg 
          viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`} 
          className="w-full h-full overflow-visible drop-shadow-lg"
          style={{ willChange: 'transform' }}
        >
          {SECTORS.map((sector) => {
            const path = describeArc(CENTER, CENTER, RADIUS_INNER + 4, RADIUS_OUTER, sector.startAngle, sector.endAngle);
            const midAngle = (sector.startAngle + sector.endAngle) / 2;
            const textPos = polarToCartesian(CENTER, CENTER, (RADIUS_INNER + RADIUS_OUTER) / 2, midAngle);
            
            const isHovered = hoveredKey === sector.key;
            const isClicked = clickedKey === sector.key;
            const isOtherClicked = clickedKey !== null && !isClicked;

            // Visual Transform Logic
            let transform = 'scale(1)';
            let opacity = 1;

            if (isOtherClicked) {
              opacity = 0.3; 
            } else if (isClicked) {
              transform = 'scale(0.95)';
              opacity = 0;
            } else if (isHovered) {
              transform = 'scale(1.15)';
            }

            return (
              <g key={sector.key}>
                {/* 
                  LAYER 1: VISUAL CONTENT 
                  Pointer events none to avoid flickering when scaling under cursor 
                */}
                <g 
                  className="pointer-events-none transition-all duration-300 ease-out"
                  style={{
                    transformOrigin: `${CENTER}px ${CENTER}px`,
                    transform: transform,
                    opacity: opacity,
                  }}
                >
                  <path 
                    d={path}
                    fill={isHovered || isClicked ? sector.color : 'rgba(255, 255, 255, 0.8)'}
                    fillOpacity={isHovered || isClicked ? 0.9 : 0.5}
                    stroke={isHovered ? sector.color : "#cbd5e1"}
                    strokeWidth={isHovered ? 2 : 1}
                  />

                  <foreignObject 
                    x={textPos.x - 40} 
                    y={textPos.y - 30} 
                    width="80" 
                    height="60" 
                    className="pointer-events-none"
                  >
                    <div className={`flex flex-col items-center justify-center h-full text-center`}>
                      <div 
                        className="mb-1 transition-colors duration-200" 
                        style={{ color: isHovered || isClicked ? '#fff' : '#64748b' }}
                      >
                        {sector.icon}
                      </div>
                      <span 
                        className="text-[14px] font-bold leading-none transition-colors duration-200"
                        style={{ color: isHovered || isClicked ? '#fff' : '#1e293b' }}
                      >
                        {sector.label}
                      </span>
                      {sector.subLabel && (
                        <span className="text-[10px] uppercase tracking-wide opacity-50 font-bold mt-0.5" style={{ color: isHovered ? '#fff' : '#64748b' }}>
                          {sector.subLabel}
                        </span>
                      )}
                    </div>
                  </foreignObject>
                </g>

                {/* 
                  LAYER 2: HIT AREA (Transparent)
                  Static size, handles events. Prevents flicker.
                */}
                <path 
                  d={path}
                  fill="transparent"
                  className="cursor-pointer"
                  onClick={() => !clickedKey && handleSelection(sector)}
                  onMouseEnter={() => !clickedKey && setHoveredKey(sector.key)}
                  onMouseLeave={() => setHoveredKey(null)}
                />
              </g>
            );
          })}
        </svg>

        {/* --- CENTRAL CARD --- */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] h-[180px] md:w-[220px] md:h-[220px] flex items-center justify-center z-20 pointer-events-none">
          <div 
            className={`
              w-full h-full rounded-full 
              bg-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-slate-100
              flex flex-col items-center justify-center p-6 text-center 
              transition-opacity duration-200 ease-out
            `}
            style={{
              opacity: clickedKey ? 0 : 1,
            }}
          >
            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-3 border border-slate-200 px-2 py-0.5 rounded-full">
              {item.category}
            </div>
            
            <h3 className="text-xl md:text-2xl font-black text-slate-800 leading-tight">
              {item.label}
            </h3>
            
            <div className="mt-4 flex space-x-1 opacity-20">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
            </div>
          </div>
        </div>

        {/* Side Labels */}
        <div className="absolute top-1/2 -translate-y-1/2 -left-[10%] md:-left-[20%] w-[100px] text-right pointer-events-none z-0 opacity-10">
           <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter">提供</h1>
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 -right-[10%] md:-right-[20%] w-[100px] text-left pointer-events-none z-0 opacity-10">
           <h1 className="text-6xl md:text-8xl font-black text-blue-900 tracking-tighter">接受</h1>
        </div>

      </div>

      {/* UNDO */}
      {canUndo && (
        <button 
          onClick={onUndo}
          className="absolute bottom-8 left-8 p-4 text-slate-400 hover:text-slate-800 bg-white shadow-lg hover:shadow-xl rounded-full transition-all border border-slate-100 z-50"
          title="Undo"
        >
          <RotateCcw size={20} />
        </button>
      )}
    </div>
  );
};

export default QuestionCard;