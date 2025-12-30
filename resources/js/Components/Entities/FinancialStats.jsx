import React from 'react';

export default function FinancialStats({ entity }) {
    if (!entity.metadata) return null;

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-900 to-indigo-950 p-8 rounded-[2rem] shadow-xl text-white relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-xs font-black text-indigo-300 uppercase tracking-[0.2em] mb-2 text-center md:text-left">Saldo Pendiente</p>
                    <h3 className="text-4xl md:text-5xl font-black text-center md:text-left tracking-tighter">
                        ${(entity.metadata.balance || 0).toLocaleString()}
                    </h3>
                    <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                        <div className="text-center md:text-left">
                            <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Cuenta</p>
                            <p className="font-mono text-sm opacity-80">{entity.metadata.account_number || 'N/A'}</p>
                        </div>
                        <div className="text-center md:text-right">
                            <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Próx. Pago</p>
                            <p className="font-bold text-sm text-amber-400">{entity.metadata.payment || 'N/A'}</p>
                        </div>
                    </div>
                </div>
                {/* Decorative background circle */}
                <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
            </div>

            {/* Smart Recurrence: Freedom Date & Progress */}
            {entity.metadata.remaining_payments !== undefined && (
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${parseInt(entity.metadata.remaining_payments) === 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Progreso de Deuda</p>
                            <p className="text-xl font-black text-gray-900">
                                {parseInt(entity.metadata.remaining_payments) === 0
                                    ? '¡Deuda Saldada!'
                                    : `${entity.metadata.remaining_payments} Pagos Restantes`}
                            </p>
                        </div>
                    </div>

                    {parseInt(entity.metadata.remaining_payments) > 0 && (
                        <div className="bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100 flex items-center gap-3">
                            <span className="text-xl">🎉</span>
                            <div>
                                <p className="text-[9px] text-emerald-600 font-black uppercase tracking-widest">Libertad Financiera Estimada</p>
                                <p className="text-sm font-bold text-emerald-700 capitalize">
                                    {new Date(new Date().setMonth(new Date().getMonth() + parseInt(entity.metadata.remaining_payments))).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Financial Health & Amortization */}
            {entity.metadata.original_principal && (
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Salud Financiera de la Deuda
                        </h3>
                        {entity.metadata.savings_accumulated > 0 && (
                            <span className="bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">
                                ${Math.round(entity.metadata.savings_accumulated).toLocaleString()} Ahorrados
                            </span>
                        )}
                    </div>

                    <div className="space-y-4">
                        {/* Progress Bar */}
                        <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
                            <div
                                className="bg-indigo-600 h-full transition-all duration-1000"
                                style={{ width: `${Math.round(((entity.metadata.original_principal - (entity.metadata.remaining_principal || 0)) / entity.metadata.original_principal) * 100)}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                            <div className="text-indigo-600">Pagado: ${Math.round(entity.metadata.original_principal - (entity.metadata.remaining_principal || 0)).toLocaleString()}</div>
                            <div className="text-gray-400 text-center">Deuda: ${Math.round(entity.metadata.remaining_principal || 0).toLocaleString()}</div>
                            <div className="text-gray-300 text-right">Crédito: ${Math.round(entity.metadata.original_principal).toLocaleString()}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-50">
                        <div className="space-y-1">
                            <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Intereses Pagados</p>
                            <p className="text-lg font-bold text-rose-500">${(entity.metadata.interest_paid_to_date || 0).toLocaleString()}</p>
                        </div>
                        <div className="space-y-1 text-right">
                            <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Ahorro Estimado</p>
                            <p className="text-lg font-bold text-emerald-500">${(entity.metadata.savings_accumulated || 0).toLocaleString()}</p>
                        </div>
                    </div>

                    <button className="w-full py-4 bg-amber-50 text-amber-600 text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl border-2 border-dashed border-amber-200 hover:bg-amber-100 hover:border-amber-300 transition-all flex items-center justify-center gap-2 group">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Registrar Abono a Capital
                    </button>
                </div>
            )}
        </div>
    );
}
