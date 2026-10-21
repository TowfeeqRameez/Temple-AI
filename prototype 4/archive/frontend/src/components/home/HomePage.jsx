import React, { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Header from './Header';
import HeroSearch from './HeroSearch';
import FeaturedCarousel from './FeaturedCarousel';
import SectionDivider from './SectionDivider';
import InteractiveMap from '../InteractiveMap/InteractiveMap';
import TempleDetailModal from './TempleDetailModal';
import ChatWidget from './ChatWidget';
import { MessageSquareText } from 'lucide-react';

export default function HomePage() {
    const [themeClass, setThemeClass] = useState('theme-noon');
    const containerRef = useRef(null);

    // Parallax Scroll Variables
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const y1 = useTransform(scrollYProgress, [0, 1], [0, 450]);
    const y2 = useTransform(scrollYProgress, [0, 1], [0, -350]);
    const rotate1 = useTransform(scrollYProgress, [0, 1], [0, 45]);
    const rotate2 = useTransform(scrollYProgress, [0, 1], [0, -60]);
    const opacityFade = useTransform(scrollYProgress, [0, 0.5, 1], [0.12, 0.05, 0.12]);

    // Evaluate Time of Day theme
    useEffect(() => {
        const hours = new Date().getHours();
        if (hours >= 5 && hours < 10) setThemeClass('theme-dawn');
        else if (hours >= 10 && hours < 16) setThemeClass('theme-noon');
        else if (hours >= 16 && hours < 19) setThemeClass('theme-evening');
        else setThemeClass('theme-night');
        document.documentElement.setAttribute('data-theme', themeClass);
    }, []);

    return (
        <div ref={containerRef} className={`w-full min-h-screen bg-[#FAF6EE] relative overflow-x-hidden ${themeClass}`}>

            {/* ── Dynamic Creative Background Colors (Glow Effects) ── */}
            <div className="absolute top-0 left-[-15%] w-[800px] h-[800px] bg-[#D97706]/10 rounded-full blur-[140px] pointer-events-none mix-blend-multiply z-0" />
            <div className="absolute top-[35%] right-[-15%] w-[700px] h-[700px] bg-[#7A1F2B]/10 rounded-full blur-[120px] pointer-events-none mix-blend-multiply z-0" />
            <div className="absolute bottom-[10%] left-[10%] w-[900px] h-[900px] bg-[#C89B3C]/10 rounded-full blur-[160px] pointer-events-none mix-blend-multiply z-0" />

            {/* ── Scroll-Triggered Parallax Mandalas ── */}
            <motion.div
                style={{ y: y1, rotate: rotate1, opacity: opacityFade }}
                className="absolute -top-32 -right-96 w-[1200px] h-[1200px] text-[#C89B3C] pointer-events-none z-0 mix-blend-color-burn"
            >
                <svg viewBox="0 0 100 100" fill="currentColor">
                    <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" fill="none" />
                    <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4" fill="none" />
                    <path d="M50 5 L55 20 L75 25 L60 35 L70 50 L60 65 L75 75 L55 80 L50 95 L45 80 L25 75 L40 65 L30 50 L40 35 L25 25 L45 20 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    <path d="M50 15 L52 25 L65 30 L55 38 L65 50 L55 62 L65 70 L52 75 L50 85 L48 75 L35 70 L45 62 L35 50 L45 38 L35 30 L48 25 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="1" fill="none" />
                </svg>
            </motion.div>

            <motion.div
                style={{ y: y2, rotate: rotate2, opacity: opacityFade }}
                className="absolute bottom-[20%] -left-80 w-[1000px] h-[1000px] text-[#7A1F2B] pointer-events-none z-0 mix-blend-color-burn"
            >
                <svg viewBox="0 0 100 100" fill="currentColor">
                    <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 1" fill="none" />
                    <path d="M50 2 L50 98 M2 50 L98 50 M16 16 L84 84 M16 84 L84 16" stroke="currentColor" strokeWidth="0.5" />
                    <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="2" strokeDasharray="4 6" fill="none" />
                    <path d="M50 12 Q75 12 88 50 Q75 88 50 88 Q25 88 12 50 Q25 12 50 12 Z" fill="none" stroke="currentColor" strokeWidth="1" />
                    <circle cx="50" cy="50" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    <circle cx="50" cy="50" r="5" stroke="currentColor" strokeWidth="1" fill="none" />
                </svg>
            </motion.div>

            {/* ── Fractal texture grain ── */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply z-10"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cfilter id='a'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23a)' opacity='0.04'/%3E%3C/svg%3E\")" }}
            />

            <div className="relative z-20">
                <Header />

                <HeroSearch />

                <SectionDivider />

                {/* ── Map Section ── */}
                <section className="w-full relative flex flex-col items-center pb-12">
                    <div className="text-center mb-0 mt-8 relative z-30 pointer-events-none">
                        <h2 className="font-serif text-3xl md:text-4xl text-[#7A1F2B] font-bold">Explore Temples Across India</h2>
                        <p className="text-[#5A483E] text-lg mt-2">Click on any state to discover its divine heritage.</p>
                    </div>

                    <div className="w-full mt-4">
                        <InteractiveMap />
                    </div>
                </section>

                <SectionDivider />

                <FeaturedCarousel />

                <SectionDivider />

                {/* ── Chat Footer ── */}
                <footer className="w-full flex flex-col items-center justify-center p-12 text-[#2F241D] bg-[#EFE3D1]/80 border-t border-[#C89B3C]/30 relative mix-blend-normal backdrop-blur-md">
                    <div className="flex items-center gap-3 mb-6">
                        <MessageSquareText className="text-[#D97706] w-8 h-8" />
                        <h3 className="font-serif text-2xl font-bold">Temple AI Conversation</h3>
                    </div>
                    <p className="max-w-xl text-center text-[#5A483E]">
                        I am your personal AI guide. Ask me detailed questions about any temple's architecture, historical significance, or visiting instructions.
                    </p>
                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent('openChat'))}
                        className="w-full md:w-auto mt-8 px-8 py-4 bg-gradient-to-r from-[#D97706] to-[#C89B3C] text-[#FAF6EE] font-bold rounded-xl shadow-[0_8px_20px_rgba(200,155,60,0.3)] hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(200,155,60,0.4)] transition-all flex items-center justify-center gap-3"
                    >
                        Start Chat
                        <span className="animate-pulse">✨</span>
                    </button>
                </footer>
            </div>

            {/* Global Modals overlaying the page */}
            <TempleDetailModal />
            <ChatWidget />
        </div>
    );
}
