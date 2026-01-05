import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import axios from 'axios';

export default function TransactionFlowModal({ show, onClose, type, wallets, entities }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        type: type || 'EXPENSE',
        amount: '',
        from_entity_id: '',
        to_entity_id: '',
        title: '',
        occurred_at: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        if (show) {
            reset();
            setData('type', type);
        }
    }, [show, type]);

    const submit = (e) => {
        e.preventDefault();

        if (isTransfer && data.from_entity_id === data.to_entity_id) {
            alert('No puedes transferir fondos a la misma billetera.');
            return;
        }

        post(route('life-events.store'), {
            onSuccess: () => {
                onClose();
                reset();
            },
        });
    };

    const handleTitleBlur = async () => {
        if (!data.title || isTransfer) return;

        try {
            const response = await axios.get(route('life-events.suggest-category'), {
                params: { title: data.title }
            });

            const { entity, suggested_category } = response.data;

            if (entity) {
                if (isExpense) setData('to_entity_id', entity.id);
                if (isIncome) setData('from_entity_id', entity.id);
            }
        } catch (error) {
            console.error('Error fetching suggestion:', error);
        }
    };

    if (!show) return null;

    const isTransfer = type === 'TRANSFER';
    const isIncome = type === 'INCOME';
    const isExpense = type === 'EXPENSE';

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <div className="bg-[#1c1917] text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden border border-white/5">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h2 className={`text-2xl font-black text-center mb-10 tracking-tight ${isIncome ? 'text-[#10b981]' : isExpense ? 'text-[#fb7185]' : 'text-white'}`}>
                    {type === 'TRANSFER' ? 'Transfer' :
                        type === 'INCOME' ? 'Income' : 'Expense'}
                </h2>

                <form onSubmit={submit} className="space-y-6">
                    {/* Amount Row */}
                    <div className="flex items-center gap-6 pb-6 border-b border-white/5">
                        <div className={`w-6 h-6 flex items-center justify-center ${isIncome ? 'text-[#10b981]' : isExpense ? 'text-[#fb7185]' : 'text-white/40'}`}>
                            {isIncome ? (
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                </svg>
                            ) : isExpense ? (
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                            )}
                        </div>
                        <input
                            type="number"
                            value={data.amount}
                            onChange={e => setData('amount', e.target.value)}
                            placeholder="Amount"
                            className="bg-transparent border-none focus:ring-0 text-3xl font-black p-0 w-full placeholder-white/10"
                            autoFocus
                        />
                    </div>

                    {/* Source Wallet Row (or Target Wallet if Income) */}
                    <div className="flex items-center gap-6 pb-6 border-b border-white/5">
                        <div className="w-6 h-6 text-white/40 flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                        </div>
                        <select
                            value={isIncome ? data.to_entity_id : data.from_entity_id}
                            onChange={e => setData(isIncome ? 'to_entity_id' : 'from_entity_id', e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-lg font-bold p-0 w-full text-white/80 appearance-none capitalize"
                        >
                            <option value="" className="bg-[#1c1917]">Wallet</option>
                            {wallets.map(w => (
                                <option key={w.id} value={w.id} className="bg-[#1c1917]">{w.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Destination Wallet (only for transfer) */}
                    {isTransfer && (
                        <div className="flex items-center gap-6 pb-6 border-b border-white/5 animate-in fade-in duration-300">
                            <div className="w-6 h-6 text-white/40 flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                            </div>
                            <select
                                value={data.to_entity_id}
                                onChange={e => setData('to_entity_id', e.target.value)}
                                className="bg-transparent border-none focus:ring-0 text-lg font-bold p-0 w-full text-white/80 appearance-none capitalize"
                            >
                                <option value="" className="bg-[#1c1917]">Destination Wallet</option>
                                {wallets.map(w => (
                                    <option key={w.id} value={w.id} className="bg-[#1c1917]">{w.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Category/Income Source (only for expense/income) */}
                    {!isTransfer && (
                        <div className="flex items-center gap-6 pb-6 border-b border-white/5 animate-in fade-in duration-300">
                            <div className="w-6 h-6 text-white/40 flex items-center justify-center">
                                {isIncome || isExpense ? (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                )}
                            </div>
                            <select
                                value={isIncome ? data.from_entity_id : data.to_entity_id}
                                onChange={e => setData(isIncome ? 'from_entity_id' : 'to_entity_id', e.target.value)}
                                className="bg-transparent border-none focus:ring-0 text-lg font-bold p-0 w-full text-white/80 appearance-none capitalize"
                            >
                                <option value="" className="bg-[#1c1917]">{type === 'INCOME' ? 'Category' : 'Payee'}</option>
                                {entities.map(e => (
                                    <option key={e.id} value={e.id} className="bg-[#1c1917]">{e.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Description/Title Row */}
                    <div className="flex items-center gap-6 pb-6 border-b border-white/5">
                        <div className="w-6 h-6 text-white/40 flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            value={data.title}
                            onChange={e => setData('title', e.target.value)}
                            onBlur={handleTitleBlur}
                            placeholder="Details"
                            className="bg-transparent border-none focus:ring-0 text-lg font-medium p-0 w-full placeholder-white/10"
                        />
                    </div>

                    {/* Date Row */}
                    <div className="flex items-center gap-6 pb-2">
                        <div className="w-6 h-6 text-white/40 flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <input
                            type="date"
                            value={data.occurred_at}
                            onChange={e => setData('occurred_at', e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-lg font-medium p-0 w-full text-white/80"
                        />
                    </div>

                    {/* Error Display */}
                    {Object.keys(errors).length > 0 && (
                        <div className="text-rose-400 text-xs font-bold uppercase tracking-widest mt-4">
                            {Object.values(errors)[0]}
                        </div>
                    )}

                    {/* Footer Buttons */}
                    <div className="flex items-center justify-between mt-12 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-white/40 hover:text-white font-bold transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="bg-[#f5c290] text-[#4a3420] px-10 py-4 rounded-full font-black text-lg hover:bg-[#fbd3ad] transition-all disabled:opacity-50"
                        >
                            {processing ? '...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
