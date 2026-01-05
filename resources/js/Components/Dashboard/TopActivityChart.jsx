import React from 'react';

export default function TopActivityChart({ top_activity, topActivityType, setTopActivityType, formatCurrency }) {
    return (
        <section className="bg-white p-6 rounded-[2.5rem] border border-gray-50/50">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Top Actividad</h2>
                {/* Custom Switch Toggle */}
                <div className="flex p-1 bg-gray-50 rounded-full border border-gray-100">
                    <button
                        onClick={() => setTopActivityType('EXPENSES')}
                        className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${topActivityType === 'EXPENSES' ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'text-gray-400'}`}
                    >
                        Gastos
                    </button>
                    <button
                        onClick={() => setTopActivityType('INCOME')}
                        className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${topActivityType === 'INCOME' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'text-gray-400'}`}
                    >
                        Ingresos
                    </button>
                </div>
            </div>

            <div className="flex gap-4 items-end h-40">
                {(topActivityType === 'EXPENSES' ? top_activity.expenses : top_activity.income).map((item) => {
                    const data = topActivityType === 'EXPENSES' ? top_activity.expenses : top_activity.income;
                    const max = Math.max(...data.map(d => d.value)) || 1;
                    const height = (item.value / max) * 100;
                    const isExpenses = topActivityType === 'EXPENSES';

                    return (
                        <div key={item.id} className="flex-1 flex flex-col items-center gap-3 group h-full">
                            <div className="flex-1 w-full bg-gray-50 rounded-2xl relative overflow-hidden flex flex-col justify-end">
                                <div
                                    className={`w-full rounded-2xl transition-all duration-700 ease-out relative group-hover:brightness-110 ${isExpenses ? 'bg-gradient-to-t from-rose-500 to-rose-400' : 'bg-gradient-to-t from-emerald-500 to-emerald-400'}`}
                                    style={{ height: `${height}%` }}
                                >
                                    <div className="absolute top-2 inset-x-0 text-center">
                                        <span className="text-[8px] font-black text-white/80">{Math.round(item.value)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="w-full text-center">
                                <p className="text-[9px] font-black text-gray-800 uppercase truncate leading-tight w-full px-1">
                                    {item.name}
                                </p>
                            </div>
                        </div>
                    );
                })}
                {((topActivityType === 'EXPENSES' ? top_activity.expenses : top_activity.income).length === 0) && (
                    <div className="flex-1 flex items-center justify-center h-full text-gray-300 italic text-[10px] uppercase font-bold text-center">
                        Sin actividad este mes
                    </div>
                )}
            </div>
        </section>
    );
}
