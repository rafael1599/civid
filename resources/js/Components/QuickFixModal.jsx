import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useEffect } from 'react';

export default function QuickFixModal({ show, onClose, event, entities }) {
    const { data, setData, patch, processing, errors, reset, transform } = useForm({
        amount: '',
        entity_id: '',
        occurred_at: '',
        title: '',
    });

    useEffect(() => {
        if (event) {
            setData({
                amount: Math.abs(event.amount) || '',
                entity_id: event.entity_id || '',
                occurred_at: event.occurred_at ? event.occurred_at.split('T')[0] : '',
                title: event.title || '',
            });
        }
    }, [event]);

    const isMissing = (field) => {
        if (field === 'amount') return !event?.amount || event?.amount === 0;
        if (field === 'entity_id') return !event?.entity_id;
        if (field === 'occurred_at') return !event?.occurred_at;
        if (field === 'title') return !event?.title || event?.title.includes('Desconocido');
        return false;
    };

    const submit = (e) => {
        e.preventDefault();

        const finalAmount = event.type === 'EXPENSE' ? -Math.abs(data.amount) : Math.abs(data.amount);

        transform((data) => ({
            ...data,
            amount: finalAmount,
        }));

        patch(route('life-events.update', { life_event: event.id }), {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    if (!event) return null;

    const missingFieldsCount = [isMissing('amount'), isMissing('entity_id'), isMissing('occurred_at'), isMissing('title')].filter(Boolean).length;

    return (
        <Modal show={show} onClose={onClose} maxWidth="sm">
            <form onSubmit={submit} className="p-6">
                <header className="mb-6">
                    <h2 className="text-sm font-black text-rose-600 uppercase tracking-widest">Atención Requerida</h2>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">Faltan {missingFieldsCount} campos por completar</p>
                </header>

                <div className="space-y-6">
                    {isMissing('amount') && (
                        <div>
                            <InputLabel value="Monto" className="text-[10px] uppercase tracking-widest text-gray-400" />
                            <TextInput
                                type="number"
                                step="0.01"
                                className="w-full text-2xl font-black border-none bg-gray-50 rounded-2xl py-3 focus:ring-rose-500"
                                value={data.amount}
                                onChange={(e) => setData('amount', e.target.value)}
                                required
                                isFocused
                            />
                            <InputError message={errors.amount} />
                        </div>
                    )}

                    {isMissing('entity_id') && (
                        <div>
                            <InputLabel value="Billetera" className="text-[10px] uppercase tracking-widest text-gray-400" />
                            <select
                                className="mt-1 block w-full rounded-2xl border-none bg-gray-50 text-sm font-bold p-4 focus:ring-rose-500"
                                value={data.entity_id}
                                onChange={(e) => setData('entity_id', e.target.value)}
                                required
                            >
                                <option value="">Seleccionar...</option>
                                {entities.map((entity) => (
                                    <option key={entity.id} value={entity.id}>{entity.name}</option>
                                ))}
                            </select>
                            <InputError message={errors.entity_id} />
                        </div>
                    )}

                    {isMissing('occurred_at') && (
                        <div>
                            <InputLabel value="Fecha" className="text-[10px] uppercase tracking-widest text-gray-400" />
                            <TextInput
                                type="date"
                                className="mt-1 block w-full rounded-2xl border-none bg-gray-50 text-sm font-bold p-4 focus:ring-rose-500"
                                value={data.occurred_at}
                                onChange={(e) => setData('occurred_at', e.target.value)}
                                required
                            />
                            <InputError message={errors.occurred_at} />
                        </div>
                    )}

                    {isMissing('title') && (
                        <div>
                            <InputLabel value="Descripción" className="text-[10px] uppercase tracking-widest text-gray-400" />
                            <TextInput
                                type="text"
                                className="mt-1 block w-full rounded-2xl border-none bg-gray-50 text-sm font-bold p-4 focus:ring-rose-500"
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                placeholder="E.g. Pago de suscripción"
                                required
                            />
                            <InputError message={errors.title} />
                        </div>
                    )}
                </div>

                <div className="mt-8 flex gap-2">
                    <button type="submit" disabled={processing} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all">
                        {processing ? 'Corrigiendo...' : 'Completar Ahora'}
                    </button>
                    <button type="button" onClick={onClose} className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 hover:text-gray-600 transition-colors">
                        Omitir
                    </button>
                </div>
            </form>
        </Modal>
    );
}
