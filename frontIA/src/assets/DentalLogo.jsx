import React from 'react';

export default function DentalLogo({ className = 'w-10 h-10' }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Outer circular medical ring */}
        <circle cx="50" cy="50" r="44" stroke="#319795" strokeWidth="4" strokeLinecap="round" strokeDasharray="235 30" />
        <circle cx="50" cy="50" r="37" stroke="#4FD1C5" strokeWidth="2" strokeOpacity="0.6" />
        
        {/* Tooth shape */}
        <path
          d="M32 36 C32 23, 43 20, 50 25 C57 20, 68 23, 68 36 C68 47, 65 60, 60 76 C57 83, 53 83, 52 74 C51 68, 49 68, 48 74 C47 83, 43 83, 40 76 C35 60, 32 47, 32 36 Z"
          fill="#FFFFFF"
          stroke="#2C7A7B"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* Tooth crest curve */}
        <path
          d="M39 32 C42 29, 46 29, 48 31"
          stroke="#81E6D9"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M50 36 V46"
          stroke="#B2F5EA"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
