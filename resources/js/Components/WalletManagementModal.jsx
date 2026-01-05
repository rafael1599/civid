import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DebugInfo from '@/Components/DebugInfo';
import useDeleteResource from '@/Hooks/useDeleteResource';
import { useState, useEffect } from 'react';

export default function WalletManagementModal({ show, onClose, wallets }) {
    const [view, setView] = useState('list'); // 'list' or 'edit'
    const [selectedWallet, setSelectedWallet] = useState(null);

    const { data, setData, post, patch, delete: destroy, processing, errors, reset } = useForm({
        name: '',
        balance: '',
    });

    useEffect(() => {
        if (selectedWallet) {
            setData({
                name: selectedWallet.name || '',
                balance: selectedWallet.balance || 0,
            });
        } else {
            reset();
        }
    }, [selectedWallet]);

    const handleEdit = (wallet) => {
        setSelectedWallet(wallet);
        setView('edit');
    };

    const handleAdd = () => {
        setSelectedWallet(null);
        setView('edit');
    };

    const submit = (e) => {
        e.preventDefault();
        if (selectedWallet) {
            patch(route('wallets.update', { wallet: selectedWallet.id }), {
                onSuccess: () => {
                    setView('list');
                    reset();
                }
            });
        } else {
            post(route('wallets.store'), {
                onSuccess: () => {
                    setView('list');
                    reset();
                }
            });
        }
    };

    const { deleteResource } = useDeleteResource();

    const handleDelete = () => {
        deleteResource(route('wallets.destroy', { wallet: selectedWallet.id }), {
            title: `la cuenta "${selectedWallet.name}"`,
            onSuccess: () => {
                setView('list');
                reset(); // Reset form data
            }
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <div className="bg-[#1a1614] text-[#ece4de] min-h-[500px] flex flex-col">
                {/* Header */}
                <header className="p-6 flex items-center justify-between border-b border-[#2d2825]">
                    <div className="flex items-center gap-3">
                        {view === 'edit' && (
                            <button onClick={() => setView('list')} className="p-2 hover:bg-[#2d2825] rounded-full transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}
                        <h2 className="text-xl font-bold">{view === 'list' ? 'Billeteras' : (selectedWallet ? 'Editar Cuenta' : 'Nueva Cuenta')}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[#2d2825] rounded-full transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto">
                    {view === 'list' ? (
                        <div className="p-6 space-y-4">
                            {/* Total Balance Summary in Modal */}
                            <div className="mb-8">
                                <p className="text-[10px] uppercase tracking-widest text-[#8b827b] font-bold">Saldo Total Billeteras</p>
                                <h3 className="text-3xl font-black mt-1">
                                    {formatCurrency(wallets.reduce((acc, w) => acc + w.balance, 0))}
                                </h3>
                            </div>

                            {wallets.map((wallet) => (
                                <div
                                    key={wallet.id}
                                    onClick={() => handleEdit(wallet)}
                                    className="bg-[#2d2825] p-5 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-[#38322e] transition-all group active:scale-[0.98]"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-[#e67e22]/10 text-[#e67e22] rounded-full flex items-center justify-center">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg">{wallet.name}</p>
                                            <p className="text-[10px] text-[#8b827b] uppercase font-bold tracking-widest">{wallet.category}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-lg">{formatCurrency(wallet.balance)}</p>
                                        <div className="flex items-center justify-end mt-1 text-[#e67e22] opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Editar</span>
                                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={handleAdd}
                                className="w-full py-5 border-2 border-dashed border-[#2d2825] rounded-3xl text-[#8b827b] font-bold hover:border-[#e67e22] hover:text-[#e67e22] transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Agregar Nueva Cuenta
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={submit} className="p-8 space-y-8">
                            <div className="flex justify-center mb-8">
                                <div className="w-20 h-20 bg-[#e67e22] rounded-full flex items-center justify-center shadow-2xl shadow-[#e67e22]/20">
                                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m3-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <InputLabel value="Nombre de la Cuenta" className="text-[10px] uppercase font-bold tracking-widest text-[#8b827b] mb-2" />
                                    <TextInput
                                        className="w-full bg-[#2d2825] border-none text-xl font-bold rounded-2xl py-4 px-6 focus:ring-2 focus:ring-[#e67e22]"
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        placeholder="E.g. Cuenta de Ahorros BCP"
                                        required
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div>
                                    <InputLabel value="Saldo Actual" className="text-[10px] uppercase font-bold tracking-widest text-[#8b827b] mb-2" />
                                    <div className="relative">
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-[#8b827b]">$</span>
                                        <TextInput
                                            type="number"
                                            step="0.01"
                                            className="w-full bg-[#2d2825] border-none text-3xl font-black rounded-2xl py-5 pl-12 pr-6 focus:ring-2 focus:ring-[#e67e22]"
                                            value={data.balance}
                                            onChange={e => setData('balance', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <InputError message={errors.balance} />
                                    <p className="text-[10px] text-[#8b827b] mt-2 font-medium">Se creará un evento de ajuste de saldo automáticamente.</p>
                                </div>
                            </div>

                            <div className="pt-8 flex flex-col gap-3">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full py-5 bg-[#e67e22] text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl shadow-[#e67e22]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    {processing ? 'Guardando...' : 'Guardar Cuenta'}
                                </button>

                                {selectedWallet && (
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        className="w-full py-4 text-rose-500 font-bold hover:bg-rose-500/5 rounded-2xl transition-all"
                                    >
                                        Eliminar Esta Cuenta
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => setView('list')}
                                    className="w-full py-4 text-[#8b827b] font-bold"
                                >
                                    Cancelar
                                </button>
                            </div>

                            <DebugInfo data={selectedWallet || data} className="border-[#2d2825]" />
                        </form>
                    )}
                </div>
            </div>
        </Modal>
    );
}
