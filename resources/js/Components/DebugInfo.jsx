import React, { useState } from 'react';

export default function DebugInfo({ data, className = '' }) {
    const [isOpen, setIsOpen] = useState(false);

    if (!data) return null;

    return (
        <div className={`mt-12 pt-6 border-t border-gray-100 ${className}`}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="text-[9px] font-black uppercase tracking-widest text-gray-300 hover:text-gray-500 transition-colors"
            >
                [ DEBUG INFO ]
            </button>
            {isOpen && (
                <div className="mt-4 p-4 bg-gray-900 rounded-2xl overflow-x-auto text-left">
                    <pre className="text-[10px] text-emerald-400 font-mono">
                        {JSON.stringify(data, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}
