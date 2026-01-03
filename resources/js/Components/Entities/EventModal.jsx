import React, { useEffect } from 'react';
import Modal from '@/Components/Modal';
import { useForm } from '@inertiajs/react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

export default function EventModal({ show, onClose, event, entityId }) {
    const isEditing = !!event;

    const { data, setData, post, patch, processing, errors, reset } = useForm({
        title: '',
        amount: '',
        occurred_at: new Date().toISOString().split('T')[0],
        type: 'EXPENSE',
        status: 'COMPLETED',
        entity_id: entityId
    });

    useEffect(() => {
        if (event) {
            setData({
                title: event.title,
                amount: Math.abs(event.amount),
                occurred_at: event.occurred_at.split('T')[0],
                type: event.type,
                status: event.status,
                entity_id: entityId
            });
        } else {
            reset();
            setData('entity_id', entityId);
        }
    }, [event, show]);

    const submit = (e) => {
        e.preventDefault();

        // Ensure amount is negative for expenses/payments if positive was entered
        let finalAmount = parseFloat(data.amount);
        if (['EXPENSE', 'PAYMENT', 'SERVICE'].includes(data.type) && finalAmount > 0) {
            finalAmount = -finalAmount;
        }

        const payload = { ...data, amount: finalAmount };

        if (isEditing) {
            patch(route('life-events.update', event.id), {
                data: payload,
                onSuccess: () => {
                    reset();
                    onClose();
                },
                preserveScroll: true
            });
        } else {
            post(route('life-events.store'), {
                data: payload,
                onSuccess: () => {
                    reset();
                    onClose();
                },
                preserveScroll: true
            });
        }
    };

    return (
        <Modal show={show} onClose={onClose}>
            <form onSubmit={submit} className="p-6">
                <h2 className="text-lg font-medium text-gray-900">
                    {isEditing ? 'Editar Evento' : 'Nuevo Evento Manual'}
                </h2>

                <div className="mt-6">
                    <InputLabel htmlFor="title" value="Título" />
                    <TextInput
                        id="title"
                        className="mt-1 block w-full"
                        value={data.title}
                        onChange={(e) => setData('title', e.target.value)}
                        required
                        isFocused
                        placeholder="Ej. Cambio de Aceite"
                    />
                    <InputError message={errors.title} className="mt-2" />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                        <InputLabel htmlFor="amount" value="Monto" />
                        <TextInput
                            id="amount"
                            type="number"
                            step="0.01"
                            className="mt-1 block w-full"
                            value={data.amount}
                            onChange={(e) => setData('amount', e.target.value)}
                            required
                            placeholder="0.00"
                        />
                        <InputError message={errors.amount} className="mt-2" />
                    </div>
                    <div>
                        <InputLabel htmlFor="occurred_at" value="Fecha" />
                        <TextInput
                            id="occurred_at"
                            type="date"
                            className="mt-1 block w-full"
                            value={data.occurred_at}
                            onChange={(e) => setData('occurred_at', e.target.value)}
                            required
                        />
                        <InputError message={errors.occurred_at} className="mt-2" />
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                        <InputLabel htmlFor="type" value="Tipo" />
                        <select
                            id="type"
                            className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                            value={data.type}
                            onChange={(e) => setData('type', e.target.value)}
                        >
                            <option value="EXPENSE">Gasto (Expense)</option>
                            <option value="PAYMENT">Pago (Payment)</option>
                            <option value="SERVICE">Servicio (Service)</option>
                            <option value="INCOME">Ingreso (Income)</option>
                            <option value="MILESTONE">Hito (Milestone)</option>
                            <option value="CALIBRATION">Calibración</option>
                        </select>
                        <InputError message={errors.type} className="mt-2" />
                    </div>
                    <div>
                        <InputLabel htmlFor="status" value="Estado" />
                        <select
                            id="status"
                            className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                            value={data.status}
                            onChange={(e) => setData('status', e.target.value)}
                        >
                            <option value="COMPLETED">Completado</option>
                            <option value="SCHEDULED">Programado</option>
                            <option value="PAID">Pagado</option>
                        </select>
                        <InputError message={errors.status} className="mt-2" />
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <SecondaryButton onClick={onClose} disabled={processing}>
                        Cancelar
                    </SecondaryButton>

                    <PrimaryButton className="ms-3" disabled={processing}>
                        {isEditing ? 'Guardar Cambios' : 'Crear Evento'}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
