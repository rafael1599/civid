import { useState } from 'react';
import ZenLayout from '@/Layouts/ZenLayout';
import { Head, Link } from '@inertiajs/react';

export default function Index({ months, total_net }) {
    const [filterType, setFilterType] = useState('EXPENSE');

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    return (
        <ZenLayout>
            <Head title="Historial" />

            <div className="min-h-screen bg-black text-white p-6 -m-4 sm:-m-0 rounded-3xl sm:rounded-none">
                {/* Note: ZenLayout has padding, so I might need negative margin or just not use ZenLayout's default container if I want full bleed black. 
                    Actually ZenLayout imposes white bg usually? No, it renders children.
                    Let's assume I can style the container.
                */}

                <div className="flex justify-between items-end mb-8 mt-4">
                    <div>
                        <h2 className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">Historial</h2>
                        <h1 className="text-3xl font-black tracking-tighter text-white">Reportes</h1>
                    </div>
                    {/* Optional Total Context */}
                    <div className="text-right">
                        {/* <p className="text-emerald-500 font-bold">{formatCurrency(total_net)}</p> */}
                    </div>
                </div>

                {/* Filter Toggle */}
                <div className="flex justify-center mb-8">
                    <div className="inline-flex rounded-full bg-neutral-900/50 p-1 backdrop-blur-sm">
                        <button
                            onClick={() => setFilterType('EXPENSE')}
                            className={`px-8 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-all ${filterType === 'EXPENSE'
                                    ? 'bg-white text-black shadow-lg'
                                    : 'text-neutral-400 hover:text-neutral-300'
                                }`}
                        >
                            Gastos
                        </button>
                        <button
                            onClick={() => setFilterType('INCOME')}
                            className={`px-8 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-all ${filterType === 'INCOME'
                                    ? 'bg-white text-black shadow-lg'
                                    : 'text-neutral-400 hover:text-neutral-300'
                                }`}
                        >
                            Ingresos
                        </button>
                    </div>
                </div>

                <div className="space-y-1">
                    {months.map((month) => (
                        <Link
                            key={month.key}
                            href={route('reports.index', { month: month.month, year: month.year, type: filterType })}
                            className="group flex items-center justify-between py-6 border-b border-white/5 hover:bg-white/5 px-2 transition-colors cursor-pointer"
                        >
                            <span className="text-lg font-medium text-neutral-300 group-hover:text-white transition-colors">
                                {month.name}
                            </span>

                            <div className="flex items-center gap-4">
                                <span className={`text-lg font-bold tracking-tight ${filterType === 'EXPENSE'
                                        ? (month.expense > 0 ? 'text-rose-400' : 'text-neutral-600')
                                        : (month.income > 0 ? 'text-emerald-400' : 'text-neutral-600')
                                    }`}>
                                    {formatCurrency(filterType === 'EXPENSE' ? month.expense : month.income)}
                                </span>
                                <svg className="w-5 h-5 text-neutral-700 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="mt-12 text-center text-neutral-800 text-xs">
                    <p>Antigravity Finance OS</p>
                </div>
            </div>
        </ZenLayout>
    );
}
