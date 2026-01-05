import { useForm } from '@inertiajs/react';
import axios from 'axios';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DebugInfo from '@/Components/DebugInfo';
import { useEffect, useState } from 'react';

export default function TransactionEditModal({ show, onClose, event, entities, onDelete }) {
    const [localEntities, setLocalEntities] = useState(entities || []);
    const [isCreatingWallet, setIsCreatingWallet] = useState(false);
    const [newWalletName, setNewWalletName] = useState('');

    useEffect(() => {
        setLocalEntities(entities || []);
    }, [entities]);

    const { data, setData, patch, processing, errors, reset, transform } = useForm({
        id: '',
        title: '',
        amount: '',
        entity_id: '',
        occurred_at: '',
        description: '',
    });

    useEffect(() => {
        if (event) {
            setData({
                id: event.id,
                title: event.title || '',
                amount: Math.abs(event.amount),
                entity_id: event.entity_id || '',
                occurred_at: event.occurred_at ? event.occurred_at.split('T')[0] : '',
                description: event.description || '',
            });
        }
    }, [event]);

    const submit = async (e) => {
        e.preventDefault();

        let finalEntityId = data.entity_id;

        // If creating a new wallet
        if (isCreatingWallet && newWalletName) {
            try {
                const response = await axios.post(route('wallets.store'), {
                    name: newWalletName,
                    balance: 0
                });

                if (response.data && response.data.wallet) {
                    finalEntityId = response.data.wallet.id;
                    // Add to local list so it feels responsive
                    setLocalEntities([...localEntities, response.data.wallet]);
                }
            } catch (error) {
                console.error("Error creating wallet:", error);
                // Ideally show error to user
                return;
            }
        }

        // Ensure amount sign matches original event type
        const finalAmount = event.type === 'EXPENSE' || (event.type === 'PAYMENT' && event.amount < 0)
            ? -Math.abs(data.amount)
            : Math.abs(data.amount);

        transform((data) => ({
            ...data,
            amount: finalAmount,
            entity_id: finalEntityId,
        }));

        patch(route('life-events.update', { life_event: event.id }), {
            onSuccess: () => {
                reset();
                onClose();
                setIsCreatingWallet(false);
                setNewWalletName('');
            },
        });
    };

    const handleDelete = () => {
        onDelete(event);
        onClose();
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <form onSubmit={submit} className="p-6">
                <header className="mb-6 flex justify-between items-center">
                    <h2 className="text-lg font-black text-gray-900 uppercase tracking-tighter">Editar Transacción</h2>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${event?.type === 'INCOME' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {event?.type}
                    </span>
                </header>

                <div className="space-y-4">
                    {/* Amount (Big) */}
                    <div>
                        <InputLabel value="Monto" className="text-[10px] uppercase tracking-widest text-gray-400" />
                        <div className="relative mt-1">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-300">$</span>
                            <TextInput
                                type="number"
                                step="0.01"
                                className="w-full text-3xl font-black pl-10 border-none focus:ring-0 bg-gray-50 rounded-2xl py-4"
                                value={data.amount}
                                onChange={(e) => setData('amount', e.target.value)}
                                required
                                isFocused
                            />
                        </div>
                        <InputError message={errors.amount} className="mt-2" />
                    </div>

                    {/* Entity (Wallet/Payee) */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <InputLabel value="Billetera" className="text-[10px] uppercase tracking-widest text-gray-400" />
                            {!isCreatingWallet && localEntities.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setIsCreatingWallet(true)}
                                    className="text-[10px] text-indigo-500 font-bold hover:underline"
                                >
                                    + Crear Nueva
                                </button>
                            )}
                            {isCreatingWallet && localEntities.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setIsCreatingWallet(false)}
                                    className="text-[10px] text-gray-400 font-bold hover:underline"
                                >
                                    Cancelar
                                </button>
                            )}
                        </div>

                        {(isCreatingWallet || localEntities.length === 0) ? (
                            <TextInput
                                type="text"
                                className="mt-1 block w-full rounded-2xl border-gray-100 bg-gray-50 text-sm font-medium focus:border-indigo-500 focus:ring-indigo-500"
                                placeholder="Nombre de nueva billetera..."
                                value={newWalletName}
                                onChange={(e) => {
                                    setNewWalletName(e.target.value);
                                    setIsCreatingWallet(true); // Force true if editing
                                }}
                            />
                        ) : (
                            <select
                                className="mt-1 block w-full rounded-2xl border-gray-100 bg-gray-50 text-sm font-medium focus:border-indigo-500 focus:ring-indigo-500"
                                value={data.entity_id}
                                onChange={(e) => {
                                    if (e.target.value === 'NEW') {
                                        setIsCreatingWallet(true);
                                    } else {
                                        setData('entity_id', e.target.value);
                                    }
                                }}
                            >
                                <option value="">Seleccionar...</option>
                                {localEntities.map((entity) => (
                                    <option key={entity.id} value={entity.id}>
                                        {entity.name}
                                    </option>
                                ))}
                                <option value="NEW" className="font-bold text-indigo-600">+ Crear Nueva Billetera...</option>
                            </select>
                        )}
                        <InputError message={errors.entity_id} className="mt-2" />
                    </div>

                    {/* Date */}
                    <div>
                        <InputLabel value="Fecha" className="text-[10px] uppercase tracking-widest text-gray-400" />
                        <TextInput
                            type="date"
                            className="mt-1 block w-full rounded-2xl border-gray-100 bg-gray-50 text-sm font-medium"
                            value={data.occurred_at}
                            onChange={(e) => setData('occurred_at', e.target.value)}
                            required
                        />
                        <InputError message={errors.occurred_at} className="mt-2" />
                    </div>

                    {/* Description */}
                    <div>
                        <InputLabel value="Descripción / Concepto" className="text-[10px] uppercase tracking-widest text-gray-400" />
                        <TextInput
                            type="text"
                            className="mt-1 block w-full rounded-2xl border-gray-100 bg-gray-50 text-sm font-medium"
                            value={data.title} // Mapping 'description' in user's mind to 'title' in DB for many events
                            onChange={(e) => setData('title', e.target.value)}
                            placeholder="E.g. Compra de supermercado"
                        />
                        <InputError message={errors.title} className="mt-2" />
                    </div>
                </div>

                <div className="mt-8 flex flex-col gap-3">
                    <div className="flex gap-3">
                        <SecondaryButton onClick={onClose} className="flex-1 justify-center py-4 rounded-2xl border-none bg-gray-100 hover:bg-gray-200">
                            Cancelar
                        </SecondaryButton>
                        <PrimaryButton className="flex-1 justify-center py-4 rounded-2xl bg-black hover:bg-gray-800 shadow-xl shadow-black/10" disabled={processing}>
                            {processing ? 'Guardando...' : 'Actualizar'}
                        </PrimaryButton>
                    </div>

                    <button
                        type="button"
                        onClick={handleDelete}
                        className="w-full py-4 text-rose-500 font-bold text-sm uppercase tracking-widest hover:bg-rose-50 rounded-2xl transition-colors"
                    >
                        Eliminar Transacción
                    </button>
                </div>

                {/* Debug Section (Only for Dev) */}
                <DebugInfo data={event} />
            </form>
        </Modal>
    );
}
