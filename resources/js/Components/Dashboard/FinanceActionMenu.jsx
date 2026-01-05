import React, { useState } from 'react';

export default function FinanceActionMenu({ onAction }) {
    const [isOpen, setIsOpen] = useState(false);

    const actions = [
        { id: 'TRANSFER', label: 'Transferencia', color: 'bg-orange-100 text-orange-600', icon: '⇄' },
        { id: 'INCOME', label: 'Ingreso', color: 'bg-emerald-100 text-emerald-600', icon: '↓' },
        { id: 'EXPENSE', label: 'Egreso', color: 'bg-rose-100 text-rose-600', icon: '↑' },
    ];

    return (
        <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3">
            {/* Menu Options */}
            {isOpen && (
                <div className="flex flex-col gap-2 mb-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {actions.map((action) => (
                        <button
                            key={action.id}
                            onClick={() => {
                                onAction(action.id);
                                setIsOpen(false);
                            }}
                            className="flex items-center gap-3 px-4 py-2 bg-white rounded-2xl shadow-xl border border-gray-100 hover:bg-gray-50 transition-all group"
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-gray-900">
                                {action.label}
                            </span>
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold ${action.color}`}>
                                {action.icon}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Main Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-500 ${isOpen ? 'bg-gray-900 rotate-45' : 'bg-black hover:scale-105 active:scale-95'}`}
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
            </button>
        </div>
    );
}
