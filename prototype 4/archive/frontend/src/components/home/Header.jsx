import React from 'react';

export default function Header() {
    return (
        <header className="w-full flex flex-col items-center justify-center pt-20 pb-12 text-center text-[#2F241D]">
            {/* Subtle Lotus Ornament above text */}
            <svg className="w-8 h-8 opacity-60 mb-6 text-[#C89B3C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2c0 0 2 0 4 3s2.5 6 1 8c-3.5-1-5-6-5-11z" />
                <path d="M12 2c0 0-2 0-4 3s-2.5 6-1 8c3.5-1 5-6 5-11z" />
                <path d="M15 13c3 0 6 1 7 4-1.5-2.5-4-3-7-3z" />
                <path d="M9 13c-3 0-6 1-7 4 1.5-2.5 4-3 7-3z" />
                <path d="M12 13v9" />
            </svg>

            <h1 className="font-serif text-5xl md:text-6xl font-bold tracking-tight mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>
                Temple AI
            </h1>

            <div className="flex items-center gap-4">
                <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#C89B3C] opacity-50" />
                <p className="font-sans text-lg md:text-xl text-[#7A1F2B] tracking-wide font-medium">
                    Discover India's Sacred Temples Through AI
                </p>
                <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#C89B3C] opacity-50" />
            </div>
        </header>
    );
}
