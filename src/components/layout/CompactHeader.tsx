
"use client";
import type React from 'react';

const CompactHeader: React.FC = () => {
  return (
    <div className="flex justify-center items-center p-4">
      <svg 
        width="130" 
        height="35" 
        viewBox="0 0 260 70" 
        xmlns="http://www.w3.org/2000/svg" 
        fill="hsl(var(--foreground))" 
        aria-label="Hey Hi Code Logo"
      >
        <style>
          {`.logo-text { font-family: 'Inter', sans-serif; font-weight: bold; letter-spacing: -0.5px; }`}
        </style>
        <text x="10" y="55" className="logo-text" style={{ fontSize: '50px' }}>&lt;</text>
        <text x="45" y="55" className="logo-text" style={{ fontSize: '50px' }}>/</text>
        <text x="90" y="42" className="logo-text" style={{ fontSize: '42px' }}>hey</text>
        <text x="125" y="70" className="logo-text" style={{ fontSize: '34px' }}>hi</text>
        <text x="200" y="55" className="logo-text" style={{ fontSize: '50px' }}>&gt;</text>
      </svg>
    </div>
  );
};
export default CompactHeader;
