import React from 'react';

export default function SectionDivider() {
    return (
        <div className="w-full flex items-center justify-center py-12 relative z-20">
            <div className="w-1/4 h-[1px] bg-gradient-to-r from-transparent to-[#C89B3C]/50"></div>

            <div className="px-6 text-[#C89B3C] animate-pulse">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" strokeDasharray="4 2" />
                    <path d="M12 6v12M6 12h12" />
                </svg>
            </div>

            <div className="w-1/4 h-[1px] bg-gradient-to-l from-transparent to-[#C89B3C]/50"></div>
        </div>
    );
}
