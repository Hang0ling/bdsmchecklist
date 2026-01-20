import React from 'react';

interface Props {
  current: number;
  total: number;
}

const ProgressBar: React.FC<Props> = ({ current, total }) => {
  const percentage = Math.min(100, Math.round((current / total) * 100));

  return (
    <div className="fixed top-0 left-0 w-full z-50">
      <div className="h-1 w-full bg-white/10">
        <div 
          className="h-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.5)] transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;