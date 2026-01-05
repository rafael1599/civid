import ZenLayout from '@/Layouts/ZenLayout';
import { Head, Link } from '@inertiajs/react';

export default function Show({ month, year, type, stats, breakdown, transactions }) {
    const isIncome = type === 'INCOME';

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const monthName = new Date(year, month - 1).toLocaleString('es-ES', { month: 'long' });

    return (
        <ZenLayout>
            <Head title={`${monthName} ${year}`} />

            <div className="min-h-screen bg-black text-white p-6 -m-4 sm:-m-0 rounded-3xl sm:rounded-none">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href={route('reports.index')} className="p-2 -ml-2 text-neutral-400 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <div>
                        <h2 className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">{year}</h2>
                        <h1 className="text-2xl font-black capitalize tracking-tight text-white">{monthName}</h1>
                    </div>
                </div>

                {/* Big Stats */}
                <div className="mb-12 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">
                        Total {isIncome ? 'Ingresado' : 'Gastado'}
                    </p>
                    <h1 className="text-5xl font-black tracking-tighter text-white">
                        {formatCurrency(stats.total)}
                    </h1>
                </div>

                {/* Categories List (Clean) */}
                <div className="mb-8">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 mb-4 px-2">Desglose por Categoría</h3>
                    <div className="bg-neutral-900 rounded-3xl overflow-hidden">
                        {breakdown.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-4 border-b border-neutral-800 last:border-0 hover:bg-neutral-800/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="text-xl">{item.icon}</div>
                                    <span className="font-bold text-neutral-200 text-sm">{item.name}</span>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-white text-sm">{formatCurrency(item.amount)}</p>
                                    <div className="w-12 h-1 bg-neutral-800 rounded-full mt-1 ml-auto overflow-hidden">
                                        <div
                                            className={`h-full ${isIncome ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                            style={{ width: `${item.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Transactions List */}
                <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 mb-4 px-2">Transacciones</h3>
                    <div className="space-y-1">
                        {transactions.map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs text-neutral-400">
                                        {tx.date.split(' ')[0]}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-bold text-neutral-200 truncate w-32 sm:w-auto">{tx.title}</p>
                                        <p className="text-[10px] text-neutral-500 uppercase">{tx.category}</p>
                                    </div>
                                </div>
                                <span className={`text-sm font-bold ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {formatCurrency(tx.amount)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </ZenLayout>
    );
}
