import React from 'react';

export default function ViewToggle({ viewMode, setViewMode }) {
    return (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-white/80 backdrop-blur-xl border border-gray-100 p-1 rounded-full shadow-2xl flex gap-1">
            <button
                onClick={() => setViewMode('PULSE')}
                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'PULSE' ? 'bg-black text-white' : 'text-gray-400 hover:text-gray-600'}`}
            >
                Pulse
            </button>
            <button
                onClick={() => setViewMode('ECOSYSTEM')}
                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'ECOSYSTEM' ? 'bg-black text-white' : 'text-gray-400 hover:text-gray-600'}`}
            >
                Ecosistema
            </button>
        </div>
    );
}
