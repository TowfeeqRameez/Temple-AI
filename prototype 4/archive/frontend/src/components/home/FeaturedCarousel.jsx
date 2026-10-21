import React from 'react';
import './FeaturedCarousel.css';
import { templeDatabase } from '../../data/templeDatabase';

const FEATURED_TEMPLES = [
    { name: 'Meenakshi Temple', state: 'Tamil Nadu', deity: 'Goddess Meenakshi', spec: 'House/Health' },
    { name: 'Tirupati Balaji', state: 'Andhra Pradesh', deity: 'Lord Venkateswara', spec: 'Visa/Wealth' },
    { name: 'Somnath Temple', state: 'Gujarat', deity: 'Lord Shiva', spec: 'Wealth/Visa' },
    { name: 'Kashi Vishwanath', state: 'Uttar Pradesh', deity: 'Lord Shiva', spec: 'Visa/Wealth' },
    { name: 'Mahakaleshwar', state: 'Madhya Pradesh', deity: 'Lord Shiva', spec: 'Health' },
    { name: 'Jagannath Puri', state: 'Odisha', deity: 'Lord Jagannath', spec: 'Wealth' },
    { name: 'Badrinath', state: 'Uttarakhand', deity: 'Lord Vishnu', spec: 'Wealth/Edu' },
    { name: 'Kedarnath', state: 'Uttarakhand', deity: 'Lord Shiva', spec: 'Health' },
    { name: 'Sringeri Sharadamba', state: 'Karnataka', deity: 'Goddess Saraswati', spec: 'Edu/House' },
    { name: 'Golden Temple', state: 'Punjab', deity: 'Guru Granth Sahib', spec: 'Health/House' }
];

export default function FeaturedCarousel() {
    // Duplicate array for infinite scroll
    const duplicatedTemples = [...FEATURED_TEMPLES, ...FEATURED_TEMPLES, ...FEATURED_TEMPLES];

    return (
        <section className="w-full py-16 bg-[#FAF6EE]/80 relative z-20">
            <div className="text-center mb-10">
                <h2 className="font-serif text-3xl md:text-4xl text-[#7A1F2B] font-bold mb-2">Featured Temples</h2>
                <p className="text-[#5A483E] text-lg">Explore magnificent architecture and rich history</p>
            </div>

            <div className="carousel-container overflow-hidden w-full relative group py-8">
                <div className="carousel-track flex items-center gap-8 px-4">
                    {duplicatedTemples.map((temple, idx) => (
                        <div
                            key={idx}
                            className="carousel-card flex-shrink-0 w-72 h-[340px] bg-[#EFE3D1] border border-[#C89B3C]/30 rounded-xl flex flex-col items-center justify-center p-6 shadow-[0_6px_12px_rgba(47,36,29,0.15)] transition-all duration-500 ease-out cursor-pointer hover:-translate-y-2 hover:shadow-[0_12px_24px_rgba(47,36,29,0.25)] hover:border-[#C89B3C]/80 relative overflow-hidden"
                        >
                            {/* Real Image loaded from the Temple Database */}
                            <div className="w-40 h-40 rounded-full mb-4 flex items-center justify-center shadow-[inset_0_4px_12px_rgba(0,0,0,0.15)] group-hover:scale-105 transition-transform duration-500 overflow-hidden border-2 border-[#C89B3C]/40">
                                <img
                                    src={templeDatabase[temple.name]?.images?.[0] || ''}
                                    alt={temple.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            <h3 className="font-serif text-xl font-bold text-[#2F241D] text-center mb-1">{temple.name}</h3>
                            <p className="text-sm text-[#7A1F2B] font-medium mb-1">{temple.state}</p>
                            <p className="text-xs text-[#5A483E] italic">{temple.deity}</p>

                            <div className="mt-auto pt-4 absolute bottom-4">
                                <button
                                    onClick={() => window.dispatchEvent(new CustomEvent('openDeepModal', { detail: temple }))}
                                    className="text-xs px-4 py-1.5 rounded border border-[#C89B3C] text-[#C89B3C] font-semibold transition-all hover:bg-[#C89B3C] hover:text-[#FAF6EE]"
                                >
                                    Explore Details
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Subtle Edge Gradients to blend scroll */}
                <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#FAF6EE] to-transparent pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#FAF6EE] to-transparent pointer-events-none" />
            </div>
        </section>
    );
}
