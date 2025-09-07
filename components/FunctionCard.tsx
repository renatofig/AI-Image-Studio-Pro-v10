import React from 'react';

interface FunctionCardProps {
  icon: string;
  name: string;
  isActive: boolean;
  onClick: () => void;
  title?: string;
}

const FunctionCard: React.FC<FunctionCardProps> = ({ icon, name, isActive, onClick, title }) => {
  return (
    <div
      className={`function-card flex flex-col items-center justify-center p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
        isActive
          ? 'bg-banana-500 border-banana-400 text-slate-900 font-bold'
          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-600'
      }`}
      onClick={onClick}
      title={title}
    >
      <div className="text-2xl">{icon}</div>
      <div className="text-sm font-medium mt-1 text-center">{name}</div>
    </div>
  );
};

export default FunctionCard;
