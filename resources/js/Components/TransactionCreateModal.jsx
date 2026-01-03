import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useEffect } from 'react';

export default function TransactionCreateModal({ show, onClose, entities, defaultType = 'EXPENSE', defaultStatus = 'SCHEDULED' }) {
    const { data, setData, post, processing, errors, reset, transform } = useForm({
        title: '',
        amount: '',
        entity_id: '',
        occurred_at: new Date().toISOString().split('T')[0],
        description: '',
        type: defaultType,
        status: defaultStatus,
    });

    useEffect(() => {
        if (show) {
            reset();
            setData({
                ...data,
                type: defaultType,
                status: defaultStatus,
                occurred_at: new Date().toISOString().split('T')[0],
            });
        }
    }, [show]);

    const submit = (e) => {
        e.preventDefault();

        // Ensure amount sign reflects type
        const finalAmount = data.type === 'EXPENSE' || data.type === 'PAYMENT' || data.type === 'SERVICE'
            ? -Math.abs(data.amount)
            : Math.abs(data.amount);

        transform((data) => ({
            ...data,
            amount: finalAmount,
        }));

        post(route('life-events.store'), {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <form onSubmit={submit} className="p-6">
                <header className="mb-6 flex justify-between items-center">
                    <h2 className="text-lg font-black text-gray-900 uppercase tracking-tighter">Nuevo Compromiso</h2>
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

                    {/* Type Toggle */}
                    <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl">
                        <button
                            type="button"
                            onClick={() => setData('type', 'EXPENSE')}
                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${data.type === 'EXPENSE' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
                        >
                            GASTO
                        </button>
                        <button
                            type="button"
                            onClick={() => setData('type', 'INCOME')}
                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${data.type === 'INCOME' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'}`}
                        >
                            INGRESO
                        </button>
                    </div>

                    {/* Entity (Wallet/Payee) */}
                    <div>
                        <InputLabel value="Entidad / Destino" className="text-[10px] uppercase tracking-widest text-gray-400" />
                        <select
                            className="mt-1 block w-full rounded-2xl border-gray-100 bg-gray-50 text-sm font-medium focus:border-indigo-500 focus:ring-indigo-500"
                            value={data.entity_id}
                            onChange={(e) => setData('entity_id', e.target.value)}
                        >
                            <option value="">Seleccionar...</option>
                            {entities.map((entity) => (
                                <option key={entity.id} value={entity.id}>
                                    {entity.name} ({entity.category})
                                </option>
                            ))}
                        </select>
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
                        <InputLabel value="Título" className="text-[10px] uppercase tracking-widest text-gray-400" />
                        <TextInput
                            type="text"
                            className="mt-1 block w-full rounded-2xl border-gray-100 bg-gray-50 text-sm font-medium"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            placeholder="E.g. Pago de Renta"
                            required
                        />
                        <InputError message={errors.title} className="mt-2" />
                    </div>
                </div>

                <div className="mt-8 flex gap-3">
                    <SecondaryButton onClick={onClose} className="flex-1 justify-center py-4 rounded-2xl border-none bg-gray-100 hover:bg-gray-200">
                        Cancelar
                    </SecondaryButton>
                    <PrimaryButton className="flex-1 justify-center py-4 rounded-2xl bg-black hover:bg-gray-800 shadow-xl shadow-black/10" disabled={processing}>
                        {processing ? 'Creando...' : 'Crear'}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
