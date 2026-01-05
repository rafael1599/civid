import React, { useState } from 'react';
import { Link } from '@inertiajs/react';

export default function NetWorthHeader({ total_balance, this_month, forecast, onWalletClick, upcomingBills, handleEditEvent, handleQuickFix, handleMarkAsPaid, isEventIncomplete, formatDate }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <section className="text-center py-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Capital Actual</h2>
            <h1 className="text-5xl font-black text-gray-900 tracking-tighter hover:text-gray-700 transition-colors cursor-pointer">
                <Link href={route('reports.index')}>
                    {formatCurrency(total_balance)}
                </Link>
            </h1>
            <div className="mt-4 flex items-center justify-center gap-4 text-sm font-medium">
                <span className="text-emerald-600">+{formatCurrency(this_month.income)}</span>
                <span className="text-gray-300">|</span>
                <span className="text-rose-600">-{formatCurrency(this_month.expenses)}</span>
            </div>

            <div className="mt-8 mb-12">
                <button
                    onClick={onWalletClick}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-50 text-gray-900 text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-gray-100 transition-all border border-gray-100 shadow-sm"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Administrar Cuentas
                </button>
            </div>

            {/* Expense Radar Card */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="max-w-sm mx-auto bg-black rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-gray-200 group cursor-pointer transition-all duration-300"
            >
                <div className="relative z-10 text-left">
                    <div className="flex justify-between items-start">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-6">Radar de Gastos (30d)</h3>
                        {/* Chevron Indicator */}
                        <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                            <svg className="w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>

                    <p className="text-3xl font-black tracking-tight mb-2">
                        Necesitas {formatCurrency(forecast.projected_amount)}
                    </p>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">
                        Para cubrir los próximos compromisos proyectados.
                    </p>

                    {/* Integrated Upcoming Bills - Expandable Section */}
                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[500px] opacity-100 mt-8 pt-8 border-t border-white/10' : 'max-h-0 opacity-0'}`}>
                        <h4 className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-4">Próximos Compromisos</h4>
                        <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-2 scrollbar-hide" onClick={(e) => e.stopPropagation()}>
                            {upcomingBills && upcomingBills.map((bill) => (
                                <div
                                    key={bill.id}
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent toggling when clicking an item
                                        handleEditEvent(bill);
                                    }}
                                    className="relative bg-white/5 hover:bg-white/10 p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-colors group/item"
                                >
                                    {isEventIncomplete(bill) && (
                                        <div className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                                    )}

                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-white/60">
                                            {formatDate(bill.occurred_at).split(' ')[0].substring(0, 3)}
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-xs font-bold text-white truncate w-[120px]">{bill.entity_name}</p>
                                            <p className="text-[9px] text-white/40 uppercase tracking-wider">{bill.days_left} días restantes</p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-sm font-bold text-white">{formatCurrency(bill.amount)}</p>
                                        <button
                                            onClick={(e) => handleMarkAsPaid(e, bill)}
                                            className="mt-1 text-[8px] font-black uppercase tracking-widest text-emerald-400 opacity-0 group-hover/item:opacity-100 transition-opacity"
                                        >
                                            Pagar
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {(!upcomingBills || upcomingBills.length === 0) && (
                                <p className="text-[10px] text-white/20 italic">No hay compromisos próximos.</p>
                            )}
                        </div>
                    </div>
                </div>
                {/* Decorative Radar Ring */}
                <div className="absolute -right-10 -bottom-10 w-40 h-40 border-[20px] border-white/5 rounded-full group-hover:scale-110 transition-transform duration-1000" />
                <div className="absolute right-4 top-4">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                </div>
            </div>
        </section>
    );
}
