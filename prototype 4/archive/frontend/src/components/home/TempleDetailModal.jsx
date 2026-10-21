import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, MapPin, Landmark, BookOpen, Star } from 'lucide-react';
import { templeDatabase } from '../../data/templeDatabase';

export default function TempleDetailModal() {
    const [selectedTemple, setSelectedTemple] = useState(null);

    useEffect(() => {
        const handleOpen = (e) => setSelectedTemple(e.detail);
        window.addEventListener('openDeepModal', handleOpen);
        return () => window.removeEventListener('openDeepModal', handleOpen);
    }, []);

    if (!selectedTemple) return null;

    const data = templeDatabase[selectedTemple.name] || {
        images: ["https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Indian_temple_architecture.jpg/1024px-Indian_temple_architecture.jpg"],
        timings: "Check local listings",
        auspicious: "Check calendars for festival dates.",
        architecture: "Intricate traditional construction",
        history: "Detailed archival data for this temple is currently being retrieved by our researchers."
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 bg-[#2F241D]/60 backdrop-blur-md"
            >
                <div className="absolute inset-0" onClick={() => setSelectedTemple(null)} />
                <motion.div
                    initial={{ y: 50, opacity: 0, scale: 0.95 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="relative w-full max-w-5xl h-[85vh] bg-[#FAF6EE] rounded-2xl shadow-[0_24px_64px_rgba(47,36,29,0.5)] overflow-hidden flex flex-col md:flex-row border border-[#C89B3C]/50"
                >
                    <button
                        onClick={() => setSelectedTemple(null)}
                        className="absolute top-4 right-4 z-50 p-2 bg-[#FAF6EE]/80 backdrop-blur-sm rounded-full text-[#7A1F2B] hover:bg-[#C89B3C] hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>

                    {/* Left: Image Hero */}
                    <div className="md:w-1/2 h-64 md:h-full relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#FAF6EE] via-[#FAF6EE]/20 to-transparent z-10 pointer-events-none" />
                        <img
                            src={data.images[0]}
                            alt={selectedTemple.name}
                            className="w-full h-full object-cover transition-transform duration-1000 ease-out hover:scale-110"
                        />
                    </div>

                    {/* Right: Deep Content */}
                    <div className="md:w-1/2 p-8 md:p-12 h-full overflow-y-auto z-20">
                        <h2 className="font-serif text-4xl md:text-5xl font-bold text-[#7A1F2B] mb-2">{selectedTemple.name}</h2>
                        <p className="text-xl text-[#C89B3C] font-semibold mb-6 flex items-center gap-2">
                            <MapPin size={20} />
                            {selectedTemple.state}
                        </p>

                        <div className="space-y-8 mt-8">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1 bg-[#EFE3D1]/50 p-5 rounded-xl border border-[#C89B3C]/20 shadow-sm">
                                    <h3 className="flex items-center gap-2 text-lg font-bold text-[#5A483E] mb-2">
                                        <Clock className="text-[#C89B3C] w-5 h-5" /> Timings
                                    </h3>
                                    <p className="text-[#2F241D] leading-relaxed text-sm">{data.timings}</p>
                                </div>

                                <div className="flex-1 bg-[#EFE3D1]/50 p-5 rounded-xl border border-[#C89B3C]/20 shadow-sm">
                                    <h3 className="flex items-center gap-2 text-lg font-bold text-[#5A483E] mb-2">
                                        <Star className="text-[#D97706] w-5 h-5" /> Auspicious Days
                                    </h3>
                                    <p className="text-[#2F241D] leading-relaxed text-sm">{data.auspicious}</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="flex items-center gap-2 text-xl font-bold text-[#7A1F2B] mb-3">
                                    <Landmark className="text-[#C89B3C]" /> Architecture
                                </h3>
                                <p className="text-[#5A483E] leading-relaxed text-lg">{data.architecture}</p>
                            </div>

                            <div>
                                <h3 className="flex items-center gap-2 text-xl font-bold text-[#7A1F2B] mb-3">
                                    <BookOpen className="text-[#C89B3C]" /> History
                                </h3>
                                <p className="text-[#5A483E] leading-relaxed text-lg">{data.history}</p>
                            </div>
                        </div>

                        {/* Added details from map pin or carousel */}
                        {selectedTemple.speciality && (
                            <div className="mt-10 flex flex-wrap gap-2">
                                {Array.isArray(selectedTemple.speciality) ? selectedTemple.speciality.map((spec, i) => (
                                    <span key={i} className="px-4 py-1.5 bg-[#C89B3C]/10 text-[#C89B3C] rounded-full text-sm font-medium border border-[#C89B3C]/30">
                                        {spec}
                                    </span>
                                )) : (
                                    <span className="px-4 py-1.5 bg-[#C89B3C]/10 text-[#C89B3C] rounded-full text-sm font-medium border border-[#C89B3C]/30">
                                        {selectedTemple.spec}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
