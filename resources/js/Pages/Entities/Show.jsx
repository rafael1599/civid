import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import RiskBanner from '@/Components/Entities/RiskBanner';
import AssetHealthWidget from '@/Components/Entities/AssetHealthWidget';
import ActivityTimeline from '@/Components/Entities/ActivityTimeline';
import DocumentVault from '@/Components/Entities/DocumentVault';
import EcosystemList from '@/Components/Entities/EcosystemList';
import FinancialStats from '@/Components/Entities/FinancialStats';
import EventModal from '@/Components/Entities/EventModal';

export default function Show({ auth, entity, alert_status, next_urgent_event, health }) {
    const isAsset = entity.category === 'ASSET';
    const [isEditing, setIsEditing] = useState(false);

    // Event Management State
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);

    const { data, setData, patch, processing, errors, reset } = useForm({
        name: entity.name,
        category: entity.category,
        status: entity.status
    });

    const handleSave = () => {
        patch(route('entities.update', entity.id), {
            onSuccess: () => setIsEditing(false),
            preserveScroll: true
        });
    };

    const handleCancel = () => {
        reset();
        setIsEditing(false);
    };

    const handleMarkAsPaid = (eventId, amount) => {
        if (confirm(`¿Confirmas que pagaste $${Math.abs(amount).toLocaleString()} hoy?`)) {
            router.post(route('events.mark-as-paid', eventId), {}, {
                preserveScroll: true
            });
        }
    };

    const handleDelete = () => {
        if (confirm(`¿Estás seguro de que deseas eliminar "${entity.name}"? Esta acción no se puede deshacer.`)) {
            router.delete(route('entities.destroy', entity.id));
        }
    };

    // Event Handlers
    const handleCreateEvent = () => {
        setEditingEvent(null);
        setIsEventModalOpen(true);
    };

    const handleEditEvent = (event) => {
        setEditingEvent(event);
        setIsEventModalOpen(true);
    };

    const handleDeleteEvent = (eventId) => {
        if (confirm('¿Eliminar este evento permanentemente?')) {
            router.delete(route('life-events.destroy', eventId), {
                preserveScroll: true
            });
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center px-4 md:px-0">
                    <div className="flex items-center gap-3 w-full">
                        <Link href={route('dashboard')} className="text-gray-400 hover:text-indigo-600 bg-white p-2 rounded-xl border border-gray-100 shadow-sm transition-all active:scale-95 flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </Link>

                        <div className="flex-1 min-w-0">
                            {isEditing ? (
                                <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        className="text-xl md:text-2xl font-black leading-tight text-gray-900 tracking-tight w-full bg-transparent border-0 border-b-2 border-indigo-200 focus:ring-0 focus:border-indigo-500 p-0 transition-all"
                                        placeholder="Nombre del activo"
                                        autoFocus
                                    />
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={data.category}
                                            onChange={e => setData('category', e.target.value)}
                                            className="text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest bg-indigo-50 text-indigo-600 border-0 focus:ring-2 focus:ring-indigo-500 p-0"
                                        >
                                            <option value="ASSET">ASSET</option>
                                            <option value="LIABILITY">LIABILITY</option>
                                            <option value="INCOME">INCOME</option>
                                            <option value="EXPENSE">EXPENSE</option>
                                            <option value="FINANCE">FINANCE</option>
                                            <option value="SERVICE">SERVICE</option>
                                        </select>
                                        <select
                                            value={data.status}
                                            onChange={e => setData('status', e.target.value)}
                                            className="text-[10px] text-gray-400 font-bold uppercase tracking-widest bg-transparent border-0 focus:ring-2 focus:ring-gray-300 p-0"
                                        >
                                            <option value="ACTIVE">ACTIVE</option>
                                            <option value="ARCHIVED">ARCHIVED</option>
                                            <option value="COMPLETED">COMPLETED</option>
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <h2 className="text-xl md:text-2xl font-black leading-tight text-gray-900 tracking-tight truncate">
                                        {entity.name}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${isAsset ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                                            {entity.category}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">• {entity.status}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={handleDelete}
                                        disabled={processing}
                                        className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all active:scale-95"
                                        title="Eliminar entidad"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                    <div className="w-px h-6 bg-gray-100 mx-1"></div>
                                    <button
                                        onClick={handleCancel}
                                        disabled={processing}
                                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={processing}
                                        className={`p-2 rounded-xl border border-indigo-100 shadow-sm transition-all active:scale-95 ${processing ? 'bg-gray-50' : 'bg-indigo-600 text-white'}`}
                                    >
                                        {processing ? (
                                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-2 text-gray-400 hover:text-indigo-600 bg-white rounded-xl border border-gray-100 shadow-sm transition-all active:scale-95"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={entity.name} />

            <div className="py-6 md:py-12 bg-gray-50/50 min-h-screen">
                <div className="mx-auto max-max-w-7xl sm:px-6 lg:px-8 space-y-6 md:space-y-8">

                    {alert_status !== 'SAFE' && (
                        <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 mx-4 md:mx-0">
                            <RiskBanner
                                alertStatus={alert_status}
                                nextUrgentEvent={next_urgent_event}
                                onMarkAsPaid={handleMarkAsPaid}
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 px-4 md:px-0">
                        <div className="lg:col-span-2 space-y-6 md:space-y-8">

                            {isAsset ? (
                                <div className="bg-white overflow-hidden shadow-sm rounded-3xl border border-gray-100">
                                    <div className="p-6 md:p-8">
                                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                            Especificaciones Técnicas
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                            {entity.metadata && Object.entries(entity.metadata)
                                                .filter(([k]) => !['image_url', 'last_manual_odometer', 'last_manual_odometer_at', 'daily_avg_usage'].includes(k))
                                                .map(([key, value]) => (
                                                    <div key={key} className="space-y-1">
                                                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{key.replace('_', ' ')}</p>
                                                        <p className="font-bold text-gray-900 truncate">{String(value)}</p>
                                                    </div>
                                                ))}
                                        </div>
                                        <AssetHealthWidget health={health} />
                                    </div>
                                </div>
                            ) : (
                                <FinancialStats entity={entity} />
                            )}

                            <DocumentVault documents={entity.documents} entity_id={entity.id} />

                            <ActivityTimeline
                                events={entity.life_events}
                                onEdit={handleEditEvent}
                                onDelete={handleDeleteEvent}
                            />

                            <div className="mt-4 flex justify-center">
                                <button
                                    onClick={handleCreateEvent}
                                    className="inline-flex items-center px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all active:scale-95 shadow-sm border border-indigo-100"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Añadir Evento Manual
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6 md:space-y-8">
                            <EcosystemList children={entity.children} isAsset={isAsset} />
                        </div>
                    </div>

                </div>
            </div>

            <EventModal
                show={isEventModalOpen}
                onClose={() => setIsEventModalOpen(false)}
                event={editingEvent}
                entityId={entity.id}
            />
        </AuthenticatedLayout>
    );
}
