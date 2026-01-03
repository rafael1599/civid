import ZenLayout from '@/Layouts/ZenLayout';
import { Head, usePage } from '@inertiajs/react';
import TransactionEditModal from '@/Components/TransactionEditModal';
import QuickFixModal from '@/Components/QuickFixModal';
import WalletManagementModal from '@/Components/WalletManagementModal';
import { useState } from 'react';

export default function Dashboard({ total_balance, history, wallets, entities, active_entities, this_month, historical_flow, forecast }) {
    const { url } = usePage();
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isQuickFixOpen, setIsQuickFixOpen] = useState(false);
    const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

    const handleEditEvent = (event) => {
        setSelectedEvent(event);
        setIsEditModalOpen(true);
    };

    const handleQuickFix = (e, event) => {
        e.stopPropagation();
        setSelectedEvent(event);
        setIsQuickFixOpen(true);
    };

    const isEventIncomplete = (event) => {
        if (!event.amount || event.amount === 0) return true;
        // In the context of Dashboard history/ticker, entity_id should be a FINANCE entity (wallet)
        if (!event.entity_id) return true;
        if (!event.occurred_at) return true;

        const title = event.title?.toLowerCase() || '';
        const entityName = event.entity?.name?.toLowerCase() || event.entity_name?.toLowerCase() || '';

        if (title.includes('desconocido') || title.includes('transacción omnibox')) return true;
        if (entityName.includes('billetera principal') && title.includes('transacción omnibox')) return true;

        return false;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <ZenLayout>
            <Head title="Pulse" />

            <TransactionEditModal
                show={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                event={selectedEvent}
                entities={wallets || []}
            />

            <QuickFixModal
                show={isQuickFixOpen}
                onClose={() => setIsQuickFixOpen(false)}
                event={selectedEvent}
                entities={wallets || []}
            />

            <WalletManagementModal
                show={isWalletModalOpen}
                onClose={() => setIsWalletModalOpen(false)}
                wallets={wallets || []}
            />

            {/* Mundo A: The Pulse */}
            <div className="space-y-12 pb-24">

                {/* 1. Net Worth Header */}
                <section className="text-center py-8">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Net Worth</h2>
                    <h1 className="text-5xl font-black text-gray-900 tracking-tighter">
                        {formatCurrency(total_balance)}
                    </h1>
                    <div className="mt-4 flex items-center justify-center gap-4 text-sm font-medium">
                        <span className="text-emerald-600">+{formatCurrency(this_month.income)}</span>
                        <span className="text-gray-300">|</span>
                        <span className="text-rose-600">-{formatCurrency(this_month.expenses)}</span>
                    </div>

                    <div className="mt-8">
                        <button
                            onClick={() => setIsWalletModalOpen(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-50 text-gray-900 text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-gray-100 transition-all border border-gray-100 shadow-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            Administrar Cuentas
                        </button>
                    </div>
                </section>

                {/* 2. Bars Chart (Minimalist) */}
                <section>
                    <div className="flex items-end justify-between h-32 gap-2 px-2">
                        {historical_flow.map((item, i) => {
                            const max = Math.max(...historical_flow.map(f => f.expenses));
                            const height = (item.expenses / max) * 100;
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                    <div
                                        className="w-full bg-gray-100 rounded-t-sm transition-all group-hover:bg-indigo-200"
                                        style={{ height: `${height}%` }}
                                    ></div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">{item.month}</span>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* 3. Upcoming Ticker (Horizontal) */}
                {forecast.upcoming_bills.length > 0 && (
                    <section>
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-4 px-1">Próximos Compromisos</h3>
                        <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
                            {forecast.upcoming_bills.map((bill) => (
                                <div
                                    key={bill.id}
                                    onClick={() => handleEditEvent(bill)}
                                    className="relative min-w-[160px] bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between cursor-pointer hover:shadow-md transition-shadow group"
                                >
                                    {isEventIncomplete(bill) && (
                                        <button
                                            onClick={(e) => handleQuickFix(e, bill)}
                                            className="absolute top-2 right-2 w-6 h-6 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center hover:bg-rose-100 transition-colors z-10"
                                        >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M8.445 14.832A1 1 0 0010 14v-2.798l1.274 1.274a1 1 0 101.414-1.414L10 8.328l-1.274 1.274a1 1 0 001.414 1.414L10 9.732V12a1 1 0 102 0V8.328l-1.274 1.274z" clipRule="evenodd" />
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    )}
                                    <div>
                                        <p className="text-xs font-bold text-gray-900 truncate">{bill.entity_name}</p>
                                        <p className="text-[10px] text-gray-400 mt-1">{bill.occurred_at}</p>
                                    </div>
                                    <p className={`text-sm font-black mt-3 ${bill.days_left <= 3 ? 'text-rose-600' : 'text-gray-900'}`}>
                                        {formatCurrency(bill.amount)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 4. Clean Feed */}
                <section>
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-4 px-1">Actividad Reciente</h3>
                    <div className="space-y-1">
                        {history.map((event) => (
                            <div
                                key={event.id}
                                onClick={() => handleEditEvent(event)}
                                className="group flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-50/50 hover:border-gray-100 transition-colors cursor-pointer active:scale-[0.98]"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${event.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-600'
                                        }`}>
                                        {event.type === 'INCOME' ? '↓' : '↑'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{event.entity?.name || event.title}</p>
                                        <p className="text-[10px] text-gray-400 uppercase font-medium">{event.occurred_at}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {isEventIncomplete(event) && (
                                        <button
                                            onClick={(e) => handleQuickFix(e, event)}
                                            className="p-2 bg-rose-50 text-rose-500 rounded-full hover:bg-rose-100 transition-colors"
                                            title="Completar información"
                                        >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    )}
                                    <p className={`text-sm font-black ${event.type === 'INCOME' ? 'text-emerald-600' : 'text-gray-900'
                                        }`}>
                                        {event.type === 'INCOME' ? '+' : '-'}{formatCurrency(Math.abs(event.amount))}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </ZenLayout>
    );
}
