import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, Sparkles } from 'lucide-react';

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { text: "Namaste. I am Temple AI. How can I guide your spiritual journey today?", sender: 'ai' }
    ]);
    const [inputBox, setInputBox] = useState('');
    const endRef = useRef(null);

    const presetQuestions = [
        "Best temple for health?",
        "Where should I go for wealth?",
        "Any temples known for Visa issues?",
        "Best temples for marriage?",
        "History of Tirupati Balaji?"
    ];

    // Use a ref for the latest messages array to prevent stale closures in the event listener
    const messagesRef = useRef(messages);
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    useEffect(() => {
        const handleOpen = (e) => {
            setIsOpen(true);
            if (e.detail?.query) {
                handleSend(e.detail.query);
            }
        };
        window.addEventListener('openChat', handleOpen);
        return () => window.removeEventListener('openChat', handleOpen);
    }, []);

    const handleSend = (textOverride) => {
        const text = typeof textOverride === 'string' ? textOverride : inputBox;
        if (!text.trim()) return;

        // Add user message
        const newMessages = [...messagesRef.current, { text, sender: 'user' }];
        setMessages(newMessages);
        if (typeof textOverride !== 'string') setInputBox('');

        // Mock AI response
        setTimeout(() => {
            let reply = "";
            const lower = text.toLowerCase();
            if (lower.includes('health') || lower.includes('healing')) reply = "For health and healing, I highly recommend visiting Mahakaleshwar in Ujjain or Kedarnath during the summer. Lord Shiva, as the ultimate healer (Vaidyanath), brings tremendous physical and mental well-being.";
            else if (lower.includes('wealth') || lower.includes('money') || lower.includes('success')) reply = "For wealth and prosperity, Tirupati Balaji (Lord Venkateswara) is immensely powerful. Navaratri visits to Sringeri Sharadamba also attract great abundance.";
            else if (lower.includes('visa') || lower.includes('abroad')) reply = "The Chilkur Balaji Temple in Hyderabad is famously known as the 'Visa Balaji' temple. Devotees perform 11 Parikramas (circumambulations) here to fulfill global travel aspirations!";
            else if (lower.includes('marriage') || lower.includes('love')) reply = "Goddess Meenakshi in Madurai and the Kamineni temples are highly auspicious for finding life partners and marital harmony.";
            else if (lower.includes('tirupati')) reply = "Tirupati Balaji (Sri Venkateswara Temple) is situated in the majestic Seshachalam Hills of Andhra Pradesh. According to legend, Lord Vishnu manifested there to save mankind during Kali Yuga! It receives tens of millions of devotees annually.";
            else reply = `That is a beautiful inquiry. While I am still evolving, I recommend exploring our map to find temples resonating with "${text}". May your journey be blessed!`;

            setMessages(m => [...m, { text: reply, sender: 'ai' }]);
        }, 1200);
    };

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
    }, [messages, isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ y: 50, opacity: 0, scale: 0.9 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 20, opacity: 0, scale: 0.9 }}
                    transition={{ ease: "easeOut", duration: 0.3 }}
                    className="fixed bottom-6 right-6 z-[200] w-[90vw] md:w-96 h-[500px] bg-[#FAF6EE] rounded-2xl shadow-[0_12px_40px_rgba(47,36,29,0.3)] border border-[#C89B3C]/40 flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#7A1F2B] to-[#5A483E] p-4 text-white flex justify-between items-center shadow-md z-10">
                        <div className="flex items-center gap-2">
                            <Bot size={22} className="text-[#C89B3C]" />
                            <span className="font-serif font-bold text-lg">Temple AI Oracle</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:text-[#C89B3C] transition-colors"><X size={20} /></button>
                    </div>

                    {/* Messages Display */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-white/50 relative">
                        <div className="absolute inset-0 bg-[#EFE3D1]/20 pointer-events-none" />
                        {messages.map((m, i) => (
                            <div key={i} className={`flex relative z-10 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 px-4 rounded-2xl text-sm leading-relaxed shadow-sm ${m.sender === 'user' ? 'bg-gradient-to-br from-[#7A1F2B] to-[#5A483E] text-white rounded-br-none' : 'bg-white border border-[#C89B3C]/20 text-[#2F241D] rounded-bl-none font-medium'}`}>
                                    {m.text}
                                </div>
                            </div>
                        ))}

                        {messages.length === 1 && (
                            <div className="flex flex-wrap gap-2 pt-2 relative z-10">
                                {presetQuestions.map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSend(q)}
                                        className="text-xs px-3 py-1.5 bg-[#C89B3C]/10 text-[#7A1F2B] font-medium border border-[#C89B3C]/30 rounded-full hover:bg-[#C89B3C]/20 hover:text-[#5A483E] transition-colors"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div ref={endRef} className="h-2" />
                    </div>

                    {/* Input Box */}
                    <div className="p-3 bg-white border-t border-[#C89B3C]/20 flex items-center gap-2 relative z-10">
                        <input
                            type="text"
                            className="flex-1 bg-[#EFE3D1]/50 border border-transparent rounded-xl px-4 py-2 text-sm text-[#2F241D] placeholder-[#5A483E]/50 focus:outline-none focus:border-[#C89B3C]/50 transition-colors"
                            placeholder="Seek spiritual guidance..."
                            value={inputBox}
                            onChange={(e) => setInputBox(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <button onClick={handleSend} className="p-2.5 bg-gradient-to-br from-[#7A1F2B] to-[#5A483E] text-white rounded-xl hover:shadow-[0_4px_12px_rgba(122,31,43,0.3)] hover:-translate-y-0.5 transition-all">
                            <Send size={18} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
