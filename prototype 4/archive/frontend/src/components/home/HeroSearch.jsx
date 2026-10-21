import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Search, Bot } from 'lucide-react';

const SUGGESTIONS = [
    { icon: '🕉', label: 'Shiva' },
    { icon: '🪔', label: 'Vishnu' },
    { icon: '🌸', label: 'Lakshmi' },
    { icon: '📿', label: 'Murugan' },
    { icon: '🙏', label: 'Hanuman' },
    { icon: '❤️', label: 'Marriage' },
    { icon: '🏥', label: 'Health' },
    { icon: '✈️', label: 'Visa' },
    { icon: '🏠', label: 'House' },
    { icon: '💼', label: 'Career' },
    { icon: '🎓', label: 'Education' },
    { icon: '💰', label: 'Wealth' }
];

const PLACEHOLDERS = [
    "Find temples for health...",
    "I want blessings for career...",
    "Show Shiva temples in Tamil Nadu...",
    "Temples famous for marriage...",
    "I want a temple for education...",
    "Show Vishnu temples near Karnataka..."
];

export default function HeroSearch() {
    const [query, setQuery] = useState("");
    const [placeholderIdx, setPlaceholderIdx] = useState(0);
    const [isListening, setIsListening] = useState(false);

    const [aiResponse, setAiResponse] = useState(null);
    const [isTyping, setIsTyping] = useState(false);

    // Rotate placeholders every 4 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIdx((prev) => (prev + 1) % PLACEHOLDERS.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const performSearch = (text) => {
        if (!text) return;
        setAiResponse(null);
        setIsTyping(true);
        setTimeout(() => {
            let reply = "";
            const lower = text.toLowerCase();
            if (lower.includes('health') || lower.includes('healing')) reply = "For health and healing, I highly recommend visiting Mahakaleshwar in Ujjain or Kedarnath during the summer. Lord Shiva, as the ultimate healer (Vaidyanath), brings tremendous physical and mental well-being.";
            else if (lower.includes('wealth') || lower.includes('money') || lower.includes('success')) reply = "For wealth and prosperity, Tirupati Balaji (Lord Venkateswara) is immensely powerful. Navaratri visits to Sringeri Sharadamba also attract great abundance.";
            else if (lower.includes('visa') || lower.includes('abroad')) reply = "The Chilkur Balaji Temple in Hyderabad is famously known as the 'Visa Balaji' temple. Devotees perform 11 Parikramas (circumambulations) here to fulfill global travel aspirations!";
            else if (lower.includes('marriage') || lower.includes('love')) reply = "Goddess Meenakshi in Madurai and the Kamineni temples are highly auspicious for finding life partners and marital harmony.";
            else if (lower.includes('tirupati')) reply = "Tirupati Balaji (Sri Venkateswara Temple) is situated in the majestic Seshachalam Hills of Andhra Pradesh. According to legend, Lord Vishnu manifested there to save mankind during Kali Yuga! It receives tens of millions of devotees annually.";
            else reply = `That is a beautiful inquiry. While I am still evolving, I recommend exploring our map to find temples resonating with "${text}". May your journey be blessed!`;

            setAiResponse(reply);
            setIsTyping(false);
        }, 1200);
    };

    const handleChipClick = (label) => {
        setQuery(`Temples for ${label}`);
        performSearch(`Which temple is best for ${label}?`);
    };

    return (
        <section className="w-full max-w-4xl mx-auto px-6 flex flex-col items-center z-20 relative mb-24">
            {/* Search Bar Container */}
            <div
                className="w-full relative flex items-center bg-[#FAF6EE] border border-[#C89B3C]/30 rounded-full px-6 py-4 shadow-[0_8px_32px_rgba(47,36,29,0.15)] transition-all duration-700 ease-out hover:shadow-[0_12px_48px_rgba(47,36,29,0.2)] hover:border-[#C89B3C]/60 hover:-translate-y-1"
            >
                <Search className="w-6 h-6 text-[#8A7A71] mr-4" />

                <div className="flex-1 relative h-8 overflow-hidden">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            if (isListening) setIsListening(false);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && query.trim()) {
                                performSearch(query.trim());
                            }
                        }}
                        className="w-full h-full bg-transparent border-none outline-none font-sans text-xl text-[#2F241D] placeholder-transparent relative z-10"
                    />
                    {/* Animated Placeholder under the input */}
                    <AnimatePresence mode="wait">
                        {!query && (
                            <motion.div
                                key={placeholderIdx}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -20, opacity: 0 }}
                                transition={{ duration: 0.6, ease: "easeInOut" }}
                                className="absolute inset-0 flex items-center text-[#8A7A71] text-xl pointer-events-none"
                            >
                                {PLACEHOLDERS[placeholderIdx]}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* AI Listening Button */}
                <button
                    onClick={() => setIsListening(!isListening)}
                    className={`relative flex items-center justify-center w-12 h-12 rounded-full border ${isListening ? 'border-[#D97706] bg-[#D97706]/10' : 'border-[#C89B3C]/30 bg-transparent'} transition-colors duration-500 group ml-4`}
                >
                    {isListening && (
                        <motion.div
                            className="absolute inset-0 rounded-full border-2 border-[#D97706]"
                            animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0, 0.8] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        />
                    )}
                    <Sparkles className={`w-6 h-6 transition-colors duration-500 ${isListening ? 'text-[#D97706]' : 'text-[#C89B3C] group-hover:text-[#D97706]'}`} />
                </button>
            </div>

            {/* Inline AI Response */}
            <AnimatePresence>
                {(isTyping || aiResponse) && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className="w-full bg-[#EFE3D1]/80 backdrop-blur-md rounded-2xl border border-[#C89B3C]/40 p-6 flex flex-col md:flex-row items-start gap-4 shadow-[0_8px_32px_rgba(47,36,29,0.1)] overflow-hidden relative z-10"
                    >
                        <Bot className="w-7 h-7 text-[#D97706] flex-shrink-0 mt-1" />
                        <div className="flex-1 text-[#2F241D] text-lg font-medium leading-relaxed">
                            {isTyping ? (
                                <span className="animate-pulse text-[#8A7A71]">Consulting the oracle...</span>
                            ) : (
                                <span>{aiResponse}</span>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Suggestion Chips */}
            <div className="w-full mt-8 flex flex-wrap justify-center gap-3">
                {SUGGESTIONS.map((chip, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleChipClick(chip.label)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full border border-[rgba(200,155,60,0.2)] bg-[#FAF6EE]/80 text-[#5A483E] font-medium text-sm transition-all duration-300 hover:border-[#C89B3C] hover:bg-[#C89B3C]/10 hover:-translate-y-[2px] shadow-[0_2px_8px_rgba(47,36,29,0.05)]"
                    >
                        <span>{chip.icon}</span>
                        <span>{chip.label}</span>
                    </button>
                ))}
            </div>
        </section>
    );
}
