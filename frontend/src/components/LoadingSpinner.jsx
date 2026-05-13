import React from 'react';

function LoadingSpinner({ text = 'لوڈ ہو رہا ہے...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-[#d4a017]/20"></div>
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#d4a017] animate-spin"></div>
        <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-emerald-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
      </div>
      <p className="text-sm text-gray-400 font-urdu">{text}</p>
    </div>
  );
}

export default LoadingSpinner;
